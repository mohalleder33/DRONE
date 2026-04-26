const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['low_ammunition', 'rotation_end', 'workshop_duration', 'service_completion', 'course_expired', 'course_upcoming', 'inactive_equipment', 'disabled_platform', 'capacity_exceeded'],
    required: true 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  severity: { 
    type: String, 
    enum: ['info', 'warning', 'critical'],
    default: 'warning'
  },
  targetUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  targetPlatformId: { type: String, default: null },
  targetCourseId: { type: mongoose.Schema.Types.ObjectId, ref: 'TrainingCourse', default: null },
  isResolved: { type: Boolean, default: false },
  resolvedAt: { type: Date, default: null },
  metadata: { type: Object, default: {} },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

AlertSchema.index({ createdAt: -1, isResolved: 1 });

module.exports = mongoose.model('Alert', AlertSchema);