const mongoose = require('mongoose');

const EquipmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  model: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['قتالية', 'استطلاعية', 'انتحارية', 'تدريبية'],
    default: 'قتالية'
  },
  serialNumber: { type: String, required: true, unique: true },
  status: { 
    type: String, 
    enum: ['جاهزة', 'موزعة', 'في الصيانة', 'خارج الخدمة'],
    default: 'جاهزة'
  },
  location: { type: String, default: 'headquarters' },
  notes: { type: String, default: '' },
  faultDescription: { type: String, default: '' },
  repairNotes: { type: String, default: '' },
  retireReason: { type: String, default: '' },
  fromPlatform: { type: String, default: '' },
  receivedDate: { type: Date, default: null },
  repairedDate: { type: Date, default: null },
  retiredDate: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Equipment', EquipmentSchema);