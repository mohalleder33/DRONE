const mongoose = require('mongoose');

const UserPreferenceSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  sound: { type: Boolean, default: true },
  assignment: { type: Boolean, default: true },
  return: { type: Boolean, default: true },
  rotationAlert: { type: Boolean, default: true },
  courseEnrollment: { type: Boolean, default: true },
  attendanceChange: { type: Boolean, default: true },
  platformAlert: { type: Boolean, default: true },
  lowStock: { type: Boolean, default: true },
  workshop: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('UserPreference', UserPreferenceSchema);