const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const TrainingCourse = require('../models/TrainingCourse');
const Officer = require('../models/Officer');
const NCO = require('../models/NCO');
const Recruit = require('../models/Recruit');
const { createNotification, createBulkNotifications, sendRealtimeNotification } = require('../services/notificationService');
const User = require('../models/User');

const isMockMode = () => process.env.USE_MOCK_DB === 'true';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Helper functions
const getTrainingSupervisors = async () => {
  return await User.find({ role: 'trainingSupervisor' }).select('_id');
};

const getAdminUsers = async () => {
  return await User.find({ role: 'admin' }).select('_id');
};

const getTraineeUserIds = (course) => {
  return course.trainees.map(t => t.userId).filter(id => id);
};

// GET all courses
router.get('/', auth, async (req, res) => {
  const { page = 1, limit = 10, search = '', status = '', startDate = '', endDate = '' } = req.query;

  if (isMockMode()) {
    let courses = global.mockDB?.courses || [];
    if (search) courses = courses.filter(c => c.courseName.includes(search) || c.courseNumber.includes(search));
    if (status) courses = courses.filter(c => c.status === status);
    if (startDate) courses = courses.filter(c => new Date(c.startDate) >= new Date(startDate));
    if (endDate) courses = courses.filter(c => new Date(c.endDate) <= new Date(endDate));
    const start = (page - 1) * limit;
    const paginated = courses.slice(start, start + limit);
    return res.json({
      data: paginated,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(courses.length / limit),
        total: courses.length,
        limit: parseInt(limit)
      }
    });
  }

  try {
    const query = {};
    if (search) {
      query.$or = [
        { courseName: { $regex: search, $options: 'i' } },
        { courseNumber: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) query.status = status;
    if (startDate) query.startDate = { $gte: new Date(startDate) };
    if (endDate) query.endDate = { $lte: new Date(endDate) };

    const courses = await TrainingCourse.find(query)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await TrainingCourse.countDocuments(query);

    res.json({
      data: courses,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ message: 'خطأ في تحميل الدورات' });
  }
});

// GET single course
router.get('/:id', auth, async (req, res) => {
  if (isMockMode()) {
    const course = global.mockDB?.courses?.find(c => c.id === req.params.id);
    if (!course) return res.status(404).json({ message: 'Not found' });
    return res.json(course);
  }

  try {
    const course = await TrainingCourse.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'الدورة غير موجودة' });
    res.json(course);
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
});

// POST create course
router.post('/', auth, async (req, res) => {
  const { courseName, courseNumber, startDate, endDate, adminSupervisor, militarySupervisor, location, trainees } = req.body;
  if (!courseName || !courseNumber) {
    return res.status(400).json({ message: 'اسم الدورة ورقمها مطلوبان' });
  }

  if (isMockMode()) {
    const newCourse = {
      id: Date.now().toString(),
      courseName,
      courseNumber,
      startDate,
      endDate,
      adminSupervisor: adminSupervisor || '',
      militarySupervisor: militarySupervisor || '',
      location: location || 'الرئاسة',
      status: 'قادمة',
      trainees: trainees || [],
      files: []
    };
    if (!global.mockDB.courses) global.mockDB.courses = [];
    global.mockDB.courses.push(newCourse);
    return res.status(201).json(newCourse);
  }

  try {
    const existing = await TrainingCourse.findOne({ courseNumber });
    if (existing) {
      return res.status(400).json({ message: 'رقم الدورة موجود مسبقاً' });
    }
    const newCourse = new TrainingCourse({
      courseName,
      courseNumber,
      startDate,
      endDate,
      adminSupervisor: adminSupervisor || '',
      militarySupervisor: militarySupervisor || '',
      location: location || 'الرئاسة',
      status: 'قادمة',
      trainees: trainees || [],
      files: []
    });
    const saved = await newCourse.save();
    console.log('✅ Course saved to MongoDB:', saved._id);
    res.status(201).json(saved);
  } catch (error) {
    console.error('Error saving course:', error);
    res.status(500).json({ message: 'فشل إنشاء الدورة' });
  }
});

// PUT update course
router.put('/:id', auth, async (req, res) => {
  const { id } = req.params;

  if (isMockMode()) {
    const courses = global.mockDB?.courses || [];
    const index = courses.findIndex(c => c.id === id);
    if (index === -1) return res.status(404).json({ message: 'Not found' });
    courses[index] = { ...courses[index], ...req.body };
    return res.json(courses[index]);
  }

  try {
    const updated = await TrainingCourse.findByIdAndUpdate(
      id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: 'الدورة غير موجودة' });
    res.json(updated);
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ message: 'فشل التحديث' });
  }
});

// DELETE course
router.delete('/:id', auth, async (req, res) => {
  const { id } = req.params;

  if (isMockMode()) {
    global.mockDB.courses = global.mockDB?.courses?.filter(c => c.id !== id) || [];
    return res.json({ message: 'Deleted' });
  }

  try {
    const deleted = await TrainingCourse.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'الدورة غير موجودة' });
    res.json({ message: 'تم الحذف' });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ message: 'فشل الحذف' });
  }
});

// PATCH course status
router.patch('/:id/status', auth, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const io = req.app.get('io');

  if (isMockMode()) {
    const courses = global.mockDB?.courses || [];
    const index = courses.findIndex(c => c.id === id);
    if (index === -1) return res.status(404).json({ message: 'Not found' });
    const oldStatus = courses[index].status;
    courses[index].status = status;
    return res.json({ message: 'Status updated' });
  }

  try {
    const course = await TrainingCourse.findById(id);
    if (!course) return res.status(404).json({ message: 'الدورة غير موجودة' });
    const oldStatus = course.status;
    course.status = status;
    await course.save();

    // إشعارات تغيير الحالة
    const supervisors = await getTrainingSupervisors();
    const supervisorIds = supervisors.map(s => s._id);
    const adminUsers = await getAdminUsers();
    const adminIds = adminUsers.map(u => u._id);
    const traineeUserIds = getTraineeUserIds(course);

    await createBulkNotifications(
      [...supervisorIds, ...adminIds],
      `📚 تغيير حالة الدورة: ${course.courseName}`,
      `تم تغيير حالة الدورة ${course.courseName} من ${oldStatus} إلى ${status}`,
      'courseEnrollment',
      { courseId: course._id, courseName: course.courseName, oldStatus, newStatus: status }
    );

    if (traineeUserIds.length > 0) {
      await createBulkNotifications(
        traineeUserIds,
        `📚 تغيير حالة دورة مسجل فيها: ${course.courseName}`,
        `تم تغيير حالة الدورة ${course.courseName} إلى ${status}`,
        'courseEnrollment',
        { courseId: course._id, courseName: course.courseName, newStatus: status }
      );
    }

    if (io) {
      const notification = { title: `تغيير حالة دورة: ${course.courseName}`, message: `تم تغيير حالة الدورة إلى ${status}`, read: false, createdAt: new Date() };
      [...supervisorIds, ...adminIds, ...traineeUserIds].forEach(id => sendRealtimeNotification(io, id, notification));
    }

    res.json({ message: 'تم تحديث الحالة', status });
  } catch (error) {
    console.error('Error updating course status:', error);
    res.status(500).json({ message: 'فشل تحديث الحالة' });
  }
});

// POST add trainee from database
router.post('/:id/add-trainee', auth, async (req, res) => {
  const { id } = req.params;
  const { personnelId, type } = req.body;
  const io = req.app.get('io');

  if (isMockMode()) {
    let personnel = null;
    if (type === 'officers') personnel = global.mockDB?.officers?.find(p => p.id === personnelId);
    if (type === 'ncos') personnel = global.mockDB?.ncos?.find(p => p.id === personnelId);
    if (type === 'recruits') personnel = global.mockDB?.recruits?.find(p => p.id === personnelId);
    if (!personnel) return res.status(404).json({ message: 'Personnel not found' });
    if (personnel.attendanceStatus !== 'present' || personnel.currentCourseId) {
      return res.status(400).json({ message: 'هذا الكادر غير متاح للتسجيل في الدورة' });
    }
    personnel.attendanceStatus = 'student';
    personnel.currentCourseId = id;

    const courses = global.mockDB?.courses || [];
    const index = courses.findIndex(c => c.id === id);
    if (index === -1) return res.status(404).json({ message: 'Course not found' });
    const newTrainee = {
      id: personnel.id,
      name: personnel.name,
      rank: personnel.rank,
      militaryId: personnel.militaryId,
      grade: 0,
      ranking: courses[index].trainees.length + 1,
      attendance: 'حاضر'
    };
    courses[index].trainees.push(newTrainee);
    return res.status(201).json(newTrainee);
  }

  try {
    let Model;
    if (type === 'officers') Model = Officer;
    else if (type === 'ncos') Model = NCO;
    else Model = Recruit;

    const personnel = await Model.findById(personnelId);
    if (!personnel) return res.status(404).json({ message: 'الكادر غير موجود' });
    if (personnel.attendanceStatus !== 'present' || personnel.currentCourseId) {
      return res.status(400).json({ message: 'هذا الكادر غير متاح للتسجيل حالياً' });
    }

    const course = await TrainingCourse.findById(id);
    if (!course) return res.status(404).json({ message: 'الدورة غير موجودة' });

    personnel.attendanceStatus = 'student';
    personnel.currentCourseId = id;
    personnel.currentLocation = 'headquarters';
    await personnel.save();

    const newTrainee = {
      id: personnel._id.toString(),
      name: personnel.name,
      rank: personnel.rank,
      militaryId: personnel.militaryId || '',
      grade: 0,
      ranking: course.trainees.length + 1,
      attendance: 'حاضر',
      userId: personnel.userId
    };
    course.trainees.push(newTrainee);
    await course.save();

    // إشعارات
    const supervisors = await getTrainingSupervisors();
    const supervisorIds = supervisors.map(s => s._id);
    const adminUsers = await getAdminUsers();
    const adminIds = adminUsers.map(u => u._id);

    await createBulkNotifications(
      [...supervisorIds, ...adminIds],
      `📚 إضافة دارس جديد: ${personnel.name}`,
      `تم إضافة ${personnel.name} (${personnel.rank}) إلى دورة ${course.courseName}`,
      'courseEnrollment',
      { courseId: course._id, courseName: course.courseName, traineeId: personnel._id, traineeName: personnel.name }
    );

    if (personnel.userId) {
      await createNotification(
        personnel.userId,
        `📚 تم تسجيلك في دورة: ${course.courseName}`,
        `تمت إضافتك إلى دورة ${course.courseName} التي تبدأ في ${new Date(course.startDate).toLocaleDateString()}`,
        'courseEnrollment',
        { courseId: course._id, courseName: course.courseName, startDate: course.startDate, endDate: course.endDate }
      );
    }

    if (io) {
      const notification = { title: `إضافة دارس: ${personnel.name}`, message: `تم إضافة ${personnel.name} إلى دورة ${course.courseName}`, read: false, createdAt: new Date() };
      [...supervisorIds, ...adminIds].forEach(id => sendRealtimeNotification(io, id, notification));
      if (personnel.userId) sendRealtimeNotification(io, personnel.userId, notification);
    }

    res.status(201).json(newTrainee);
  } catch (error) {
    console.error('Error adding trainee:', error);
    res.status(500).json({ message: 'فشل إضافة الدارس' });
  }
});

// POST add manual trainee
router.post('/:id/add-manual-trainee', auth, async (req, res) => {
  const { id } = req.params;
  const { name, rank, militaryId, specialization, unit, type } = req.body;
  const io = req.app.get('io');

  if (!name || !rank || !type) {
    return res.status(400).json({ message: 'الاسم والرتبة والنوع مطلوبة' });
  }

  if (isMockMode()) {
    const newPersonnel = {
      id: Date.now().toString(),
      name,
      rank,
      militaryId: militaryId || '',
      specialization: specialization || '',
      unit: unit || '',
      attendanceStatus: 'present',
      currentLocation: 'headquarters',
      type
    };
    if (type === 'officers') global.mockDB.officers.push(newPersonnel);
    else if (type === 'ncos') global.mockDB.ncos.push(newPersonnel);
    else global.mockDB.recruits.push(newPersonnel);

    const courses = global.mockDB?.courses || [];
    const index = courses.findIndex(c => c.id === id);
    if (index === -1) return res.status(404).json({ message: 'Course not found' });
    const newTrainee = {
      id: newPersonnel.id,
      name,
      rank,
      militaryId: militaryId || '',
      grade: 0,
      ranking: courses[index].trainees.length + 1,
      attendance: 'حاضر'
    };
    courses[index].trainees.push(newTrainee);
    return res.status(201).json(newTrainee);
  }

  try {
    let Model;
    if (type === 'officers') Model = Officer;
    else if (type === 'ncos') Model = NCO;
    else Model = Recruit;

    const newPersonnel = new Model({
      name,
      rank,
      militaryId: militaryId || '',
      specialization: specialization || '',
      unit: unit || '',
      attendanceStatus: 'present',
      currentLocation: 'headquarters',
      type
    });
    const saved = await newPersonnel.save();

    const course = await TrainingCourse.findById(id);
    if (!course) return res.status(404).json({ message: 'الدورة غير موجودة' });

    const newTrainee = {
      id: saved._id.toString(),
      name: saved.name,
      rank: saved.rank,
      militaryId: saved.militaryId || '',
      grade: 0,
      ranking: course.trainees.length + 1,
      attendance: 'حاضر'
    };
    course.trainees.push(newTrainee);
    await course.save();

    // إشعارات
    const supervisors = await getTrainingSupervisors();
    const supervisorIds = supervisors.map(s => s._id);
    const adminUsers = await getAdminUsers();
    const adminIds = adminUsers.map(u => u._id);

    await createBulkNotifications(
      [...supervisorIds, ...adminIds],
      `📚 إضافة دارس جديد (يدوي): ${name}`,
      `تم إضافة ${name} (${rank}) إلى دورة ${course.courseName}`,
      'courseEnrollment',
      { courseId: course._id, courseName: course.courseName, traineeId: saved._id, traineeName: name }
    );

    if (io) {
      const notification = { title: `إضافة دارس: ${name}`, message: `تم إضافة ${name} إلى دورة ${course.courseName}`, read: false, createdAt: new Date() };
      [...supervisorIds, ...adminIds].forEach(id => sendRealtimeNotification(io, id, notification));
    }

    res.status(201).json(newTrainee);
  } catch (error) {
    console.error('Error adding manual trainee:', error);
    res.status(500).json({ message: 'فشل إضافة الدارس' });
  }
});

// DELETE trainee
router.delete('/:id/trainee/:traineeId', auth, async (req, res) => {
  const { id, traineeId } = req.params;
  const io = req.app.get('io');

  if (isMockMode()) {
    const courses = global.mockDB?.courses || [];
    const index = courses.findIndex(c => c.id === id);
    if (index === -1) return res.status(404).json({ message: 'Course not found' });
    const trainee = courses[index].trainees.find(t => t.id === traineeId);
    if (!trainee) return res.status(404).json({ message: 'Trainee not found' });
    let personnel = null;
    if (global.mockDB?.officers) personnel = global.mockDB.officers.find(p => p.id === trainee.id);
    if (!personnel && global.mockDB?.ncos) personnel = global.mockDB.ncos.find(p => p.id === trainee.id);
    if (!personnel && global.mockDB?.recruits) personnel = global.mockDB.recruits.find(p => p.id === trainee.id);
    if (personnel) {
      personnel.attendanceStatus = 'present';
      personnel.currentCourseId = null;
    }
    courses[index].trainees = courses[index].trainees.filter(t => t.id !== traineeId);
    return res.json({ message: 'Trainee removed' });
  }

  try {
    const course = await TrainingCourse.findById(id);
    if (!course) return res.status(404).json({ message: 'الدورة غير موجودة' });
    const trainee = course.trainees.find(t => t.id === traineeId);
    if (!trainee) return res.status(404).json({ message: 'الدارس غير موجود' });

    const OfficerModel = require('../models/Officer');
    const NCOModel = require('../models/NCO');
    const RecruitModel = require('../models/Recruit');

    let personnel = await OfficerModel.findById(trainee.id);
    if (!personnel) personnel = await NCOModel.findById(trainee.id);
    if (!personnel) personnel = await RecruitModel.findById(trainee.id);

    if (personnel) {
      personnel.attendanceStatus = 'present';
      personnel.currentCourseId = null;
      await personnel.save();
    }

    course.trainees = course.trainees.filter(t => t.id !== traineeId);
    await course.save();

    // إشعارات
    const supervisors = await getTrainingSupervisors();
    const supervisorIds = supervisors.map(s => s._id);
    const adminUsers = await getAdminUsers();
    const adminIds = adminUsers.map(u => u._id);

    await createBulkNotifications(
      [...supervisorIds, ...adminIds],
      `📚 إزالة دارس: ${trainee.name}`,
      `تمت إزالة ${trainee.name} (${trainee.rank}) من دورة ${course.courseName}`,
      'courseEnrollment',
      { courseId: course._id, courseName: course.courseName, traineeId, traineeName: trainee.name }
    );

    if (io) {
      const notification = { title: `إزالة دارس: ${trainee.name}`, message: `تمت إزالة ${trainee.name} من دورة ${course.courseName}`, read: false, createdAt: new Date() };
      [...supervisorIds, ...adminIds].forEach(id => sendRealtimeNotification(io, id, notification));
    }

    res.json({ message: 'تم إزالة الدارس' });
  } catch (error) {
    console.error('Error removing trainee:', error);
    res.status(500).json({ message: 'فشل الإزالة' });
  }
});

// PUT update trainee grade/ranking
router.put('/:id/trainee/:traineeId', auth, async (req, res) => {
  const { id, traineeId } = req.params;
  const { grade, ranking } = req.body;

  if (isMockMode()) {
    const courses = global.mockDB?.courses || [];
    const index = courses.findIndex(c => c.id === id);
    if (index === -1) return res.status(404).json({ message: 'Course not found' });
    const trainee = courses[index].trainees.find(t => t.id === traineeId);
    if (!trainee) return res.status(404).json({ message: 'Trainee not found' });
    if (grade !== undefined) trainee.grade = grade;
    if (ranking !== undefined) trainee.ranking = ranking;
    return res.json(trainee);
  }

  try {
    const course = await TrainingCourse.findById(id);
    if (!course) return res.status(404).json({ message: 'الدورة غير موجودة' });
    const trainee = course.trainees.find(t => t.id === traineeId);
    if (!trainee) return res.status(404).json({ message: 'الدارس غير موجود' });
    if (grade !== undefined) trainee.grade = grade;
    if (ranking !== undefined) trainee.ranking = ranking;
    await course.save();
    res.json(trainee);
  } catch (error) {
    console.error('Error updating trainee:', error);
    res.status(500).json({ message: 'فشل التحديث' });
  }
});

// PATCH update attendance
router.patch('/:id/trainee/:traineeId/attendance', auth, async (req, res) => {
  const { id, traineeId } = req.params;
  const { attendance } = req.body;

  if (isMockMode()) {
    const courses = global.mockDB?.courses || [];
    const index = courses.findIndex(c => c.id === id);
    if (index === -1) return res.status(404).json({ message: 'Course not found' });
    const trainee = courses[index].trainees.find(t => t.id === traineeId);
    if (!trainee) return res.status(404).json({ message: 'Trainee not found' });
    trainee.attendance = attendance;
    return res.json(trainee);
  }

  try {
    const course = await TrainingCourse.findById(id);
    if (!course) return res.status(404).json({ message: 'الدورة غير موجودة' });
    const trainee = course.trainees.find(t => t.id === traineeId);
    if (!trainee) return res.status(404).json({ message: 'الدارس غير موجود' });
    trainee.attendance = attendance;
    await course.save();
    res.json(trainee);
  } catch (error) {
    console.error('Error updating attendance:', error);
    res.status(500).json({ message: 'فشل تحديث الحضور' });
  }
});

// POST copy course
router.post('/:id/copy', auth, async (req, res) => {
  const { id } = req.params;
  const { courseNumber, startDate, endDate } = req.body;

  if (isMockMode()) {
    const original = global.mockDB?.courses?.find(c => c.id === id);
    if (!original) return res.status(404).json({ message: 'Course not found' });
    const newCourse = {
      ...original,
      id: Date.now().toString(),
      courseNumber: courseNumber || original.courseNumber + '_copy',
      startDate: startDate || original.startDate,
      endDate: endDate || original.endDate,
      status: 'قادمة',
      trainees: []
    };
    global.mockDB.courses.push(newCourse);
    return res.status(201).json(newCourse);
  }

  try {
    const original = await TrainingCourse.findById(id);
    if (!original) return res.status(404).json({ message: 'الدورة غير موجودة' });
    const newCourse = new TrainingCourse({
      ...original.toObject(),
      _id: undefined,
      courseNumber: courseNumber || original.courseNumber + '_copy',
      startDate: startDate || original.startDate,
      endDate: endDate || original.endDate,
      status: 'قادمة',
      trainees: [],
      files: []
    });
    const saved = await newCourse.save();
    res.status(201).json(saved);
  } catch (error) {
    console.error('Error copying course:', error);
    res.status(500).json({ message: 'فشل نسخ الدورة' });
  }
});

// POST send notification to trainees
router.post('/:id/notify', auth, async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;
  const io = req.app.get('io');

  if (isMockMode()) {
    const course = global.mockDB?.courses?.find(c => c.id === id);
    if (course && io) {
      course.trainees.forEach(t => {
        io.emit('new_notification', {
          title: `إشعار دورة ${course.courseName}`,
          message: message,
          read: false,
          createdAt: new Date()
        });
      });
    }
    return res.json({ message: 'Notification sent' });
  }

  try {
    const course = await TrainingCourse.findById(id);
    if (!course) return res.status(404).json({ message: 'الدورة غير موجودة' });

    const traineeUserIds = getTraineeUserIds(course);
    if (traineeUserIds.length > 0) {
      await createBulkNotifications(
        traineeUserIds,
        `📢 إشعار من دورة ${course.courseName}`,
        message,
        'courseEnrollment',
        { courseId: course._id, courseName: course.courseName }
      );
    }

    if (io) {
      const notification = { title: `إشعار دورة ${course.courseName}`, message: message, read: false, createdAt: new Date() };
      traineeUserIds.forEach(id => sendRealtimeNotification(io, id, notification));
    }

    res.json({ message: 'تم إرسال الإشعار' });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ message: 'فشل إرسال الإشعار' });
  }
});

// GET course files
router.get('/:id/files', auth, async (req, res) => {
  if (isMockMode()) {
    const course = global.mockDB?.courses?.find(c => c.id === req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    return res.json(course.files || []);
  }

  try {
    const course = await TrainingCourse.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'الدورة غير موجودة' });
    res.json(course.files || []);
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ message: 'خطأ في تحميل الملفات' });
  }
});

// POST upload course file
router.post('/:id/files', auth, upload.single('file'), async (req, res) => {
  const { id } = req.params;
  const file = req.file;
  if (!file) return res.status(400).json({ message: 'No file uploaded' });

  const fileRecord = {
    id: Date.now().toString(),
    filename: file.originalname,
    url: `/uploads/${file.filename}`
  };

  if (isMockMode()) {
    const courses = global.mockDB?.courses || [];
    const index = courses.findIndex(c => c.id === id);
    if (index === -1) return res.status(404).json({ message: 'Course not found' });
    if (!courses[index].files) courses[index].files = [];
    courses[index].files.push(fileRecord);
    return res.status(201).json(fileRecord);
  }

  try {
    const course = await TrainingCourse.findById(id);
    if (!course) return res.status(404).json({ message: 'الدورة غير موجودة' });
    if (!course.files) course.files = [];
    course.files.push(fileRecord);
    await course.save();
    res.status(201).json(fileRecord);
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ message: 'فشل رفع الملف' });
  }
});

// DELETE course file
router.delete('/:id/files/:fileId', auth, async (req, res) => {
  const { id, fileId } = req.params;

  if (isMockMode()) {
    const courses = global.mockDB?.courses || [];
    const index = courses.findIndex(c => c.id === id);
    if (index === -1) return res.status(404).json({ message: 'Course not found' });
    courses[index].files = courses[index].files.filter(f => f.id !== fileId);
    return res.json({ message: 'File deleted' });
  }

  try {
    const course = await TrainingCourse.findById(id);
    if (!course) return res.status(404).json({ message: 'الدورة غير موجودة' });
    course.files = course.files.filter(f => f.id !== fileId);
    await course.save();
    res.json({ message: 'تم حذف الملف' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ message: 'فشل حذف الملف' });
  }
});

module.exports = router;