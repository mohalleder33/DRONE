const Officer = require('../models/Officer');
const NCO = require('../models/NCO');
const Recruit = require('../models/Recruit');
const Equipment = require('../models/Equipment');
const Ammunition = require('../models/Ammunition');
const Platform = require('../models/Platform');
const TrainingCourse = require('../models/TrainingCourse');
const Log = require('../models/Log');

// دوال مساعدة للإحصائيات
const getPersonnelCountByLocation = async (location) => {
  const officers = await Officer.countDocuments({ currentLocation: location });
  const ncos = await NCO.countDocuments({ currentLocation: location });
  const recruits = await Recruit.countDocuments({ currentLocation: location });
  return officers + ncos + recruits;
};

const getPersonnelDistributionByLocation = async (location) => {
  const officers = await Officer.countDocuments({ 
    currentLocation: location, 
    attendanceStatus: { $nin: ['present', 'distributed', 'student'] } 
  });
  const ncos = await NCO.countDocuments({ 
    currentLocation: location, 
    attendanceStatus: { $nin: ['present', 'distributed', 'student'] } 
  });
  const recruits = await Recruit.countDocuments({ 
    currentLocation: location, 
    attendanceStatus: { $nin: ['present', 'distributed', 'student'] } 
  });
  return officers + ncos + recruits;
};

const getPersonnelPresentByLocation = async (location) => {
  const officers = await Officer.countDocuments({ 
    currentLocation: location, 
    attendanceStatus: { $in: ['present', 'distributed', 'student'] } 
  });
  const ncos = await NCO.countDocuments({ 
    currentLocation: location, 
    attendanceStatus: { $in: ['present', 'distributed', 'student'] } 
  });
  const recruits = await Recruit.countDocuments({ 
    currentLocation: location, 
    attendanceStatus: { $in: ['present', 'distributed', 'student'] } 
  });
  return officers + ncos + recruits;
};

module.exports = {
  getPersonnelCountByLocation,
  getPersonnelDistributionByLocation,
  getPersonnelPresentByLocation
};