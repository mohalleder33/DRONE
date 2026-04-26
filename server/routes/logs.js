const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

router.get('/', auth, (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'commander') return res.status(403).json({ message: 'Forbidden' });
  let logs = global.mockDB?.logs || [];
  const { action, entityType, search, startDate, endDate, page = 1, limit = 50 } = req.query;
  if (action) logs = logs.filter(l => l.action === action);
  if (entityType) logs = logs.filter(l => l.entityType === entityType);
  if (search) logs = logs.filter(l => JSON.stringify(l.details).includes(search));
  if (startDate) logs = logs.filter(l => new Date(l.createdAt) >= new Date(startDate));
  if (endDate) logs = logs.filter(l => new Date(l.createdAt) <= new Date(endDate));
  const start = (page-1)*limit;
  const paginated = logs.slice(start, start+limit);
  res.json({ data: paginated, pagination: { page: parseInt(page), pages: Math.ceil(logs.length/limit), total: logs.length, limit: parseInt(limit) } });
});

module.exports = router;