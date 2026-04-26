const mongoose = require('mongoose');

const PlatformSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  location: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['active', 'inactive'],
    default: 'active'
  },
  maxPersonnel: { type: Number, default: null },
  maxEquipment: { type: Number, default: null },
  personnelStats: {
    power: { type: Number, default: 0 },
    distribution: { type: Number, default: 0 },
    present: { type: Number, default: 0 }
  }
}, { timestamps: true });

module.exports = mongoose.model('Platform', PlatformSchema);