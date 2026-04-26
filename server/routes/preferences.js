const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const getPrefs = (userId) => global.mockDB?.userPreferences?.[userId] || { sound: true, assignment: true, return: true, rotationAlert: true, courseEnrollment: true, attendanceChange: true, platformAlert: true, lowStock: true, workshop: true };
const savePrefs = (userId, prefs) => { if (!global.mockDB.userPreferences) global.mockDB.userPreferences = {}; global.mockDB.userPreferences[userId] = prefs; };

router.get('/notifications', auth, (req, res) => {
  const prefs = getPrefs(req.user.id);
  res.json(prefs);
});
router.put('/notifications', auth, (req, res) => {
  savePrefs(req.user.id, req.body);
  res.json(req.body);
});

module.exports = router;