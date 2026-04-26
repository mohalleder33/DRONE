const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const getSettings = () => global.mockDB?.settings || { defaultTargetServiceDays: 30, alertThreshold: 7, criticalStockThreshold: 50, criticalEquipmentThreshold: 5, systemName: 'وحدة الطيران المسير' };
const saveSettings = (settings) => { if (global.mockDB) global.mockDB.settings = settings; };

router.get('/', auth, (req, res) => {
  res.json(getSettings());
});
router.put('/', auth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  const { key, value } = req.body;
  const settings = getSettings();
  settings[key] = value;
  saveSettings(settings);
  res.json(settings);
});
router.post('/reset', auth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  const defaultSettings = { defaultTargetServiceDays: 30, alertThreshold: 7, criticalStockThreshold: 50, criticalEquipmentThreshold: 5, systemName: 'وحدة الطيران المسير' };
  saveSettings(defaultSettings);
  res.json({ message: 'Settings reset' });
});
router.post('/apply-critical-threshold', auth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  const settings = getSettings();
  const critical = settings.criticalStockThreshold;
  if (global.mockDB?.ammunition) {
    global.mockDB.ammunition.forEach(a => a.minThreshold = critical);
  }
  res.json({ message: 'Applied' });
});

module.exports = router;