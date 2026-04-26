const mongoose = require('mongoose');

const NCOSchema = new mongoose.Schema({
name: { type: String, required: true },
  rank: { type: String, required: true },
  militaryId: { type: String, default: '' },
  specialization: { type: String, default: '' },
  unit: { type: String, default: '' },
  attendanceStatus: { 
    type: String, 
    enum: ['present', 'leave', 'sick', 'absent', 'absent_unauthorized', 'prison', 'student', 'other'],
    default: 'present'
  },
  currentLocation: { type: String, default: 'headquarters' },
  rotationEndDate: { type: Date, default: null },
  currentCourseId: { type: String, default: null }, // ✅ جديد
  type: { type: String, default: 'officers' }
}, { timestamps: true });

module.exports = mongoose.model('NCO', NCOSchema);