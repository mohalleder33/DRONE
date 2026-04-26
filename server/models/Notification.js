const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['assignment', 'return', 'rotationAlert', 'courseEnrollment', 'attendanceChange', 'platformAlert', 'lowStock', 'workshop', 'system'],
    default: 'system'
  },
  read: { type: Boolean, default: false },
  metadata: { type: Object, default: {} },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// فهرس لتحسين الأداء
NotificationSchema.index({ user: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);