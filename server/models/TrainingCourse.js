const mongoose = require('mongoose');

const TraineeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  rank: { type: String, required: true },
  militaryId: { type: String, default: '' },
  grade: { type: Number, default: 0 },
  ranking: { type: Number, default: 0 },
  attendance: { 
    type: String, 
    enum: ['حاضر', 'غائب', 'بعذر'],
    default: 'حاضر'
  }
});

const FileSchema = new mongoose.Schema({
  id: { type: String, required: true },
  filename: { type: String, required: true },
  url: { type: String, required: true }
});

const TrainingCourseSchema = new mongoose.Schema({
  courseName: { type: String, required: true },
  courseNumber: { type: String, required: true, unique: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  adminSupervisor: { type: String, default: '' },
  militarySupervisor: { type: String, default: '' },
  location: { type: String, default: 'الرئاسة' },
  status: { 
    type: String, 
    enum: ['قادمة', 'جارية', 'منتهية', 'ملغاة'],
    default: 'قادمة'
  },
  trainees: [TraineeSchema],
  files: [FileSchema]
}, { timestamps: true });

module.exports = mongoose.model('TrainingCourse', TrainingCourseSchema);