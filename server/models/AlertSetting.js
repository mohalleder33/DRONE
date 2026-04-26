const mongoose = require('mongoose');

const AlertSettingSchema = new mongoose.Schema({
  type: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  enabled: { type: Boolean, default: true },
  threshold: { type: Number, default: 7 }
}, { timestamps: true });

module.exports = mongoose.model('AlertSetting', AlertSettingSchema);