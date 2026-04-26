const mongoose = require('mongoose');

const AmmunitionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  caliber: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['متفجرة', 'حارقة', 'خارقة', 'تدريبية'],
    default: 'متفجرة'
  },
  compatibleEquipment: { type: String, default: '' },
  total: { type: Number, default: 0 },
  headquarters: { type: Number, default: 0 },
  platforms: { type: Number, default: 0 },
  minThreshold: { type: Number, default: 100 },
  distribution: {
    headquarters: { type: Number, default: 0 },
    platforms: { type: Map, of: Number, default: {} }
  }
}, { timestamps: true });

module.exports = mongoose.model('Ammunition', AmmunitionSchema);