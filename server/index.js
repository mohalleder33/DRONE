require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./config/db');
const { initializeMockData } = require('./config/mockData');
const { initAlertScheduler } = require('./services/alertScheduler');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// ✅ إضافة Socket.io إلى الـ app للوصول إليه في routes
app.set('io', io);

// ✅ إضافة مسار للتحقق من صحة التوكن (للاتصال بـ Socket.io)
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

// ✅ عند اتصال عميل جديد، انضم إلى غرفته الخاصة
io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.userId);
  
  if (socket.userId) {
    socket.join(`user_${socket.userId}`);
    console.log(`✅ User ${socket.userId} joined room user_${socket.userId}`);
  }
  
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.userId);
  });
});

// ✅ التحقق من وضع البيانات الوهمية
const useMock = process.env.USE_MOCK_DB === 'true';

if (useMock) {
  console.log('📦 Mock mode enabled - using in-memory data');
  global.mockDB = initializeMockData();
  console.log('📦 Mock data initialized');
} else {
  console.log('🍃 Real database mode - connecting to MongoDB');
  connectDB().catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    console.log('⚠️ Falling back to mock data');
    global.mockDB = initializeMockData();
  });
}

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/officers', require('./routes/officers'));
app.use('/api/ncos', require('./routes/ncos'));
app.use('/api/recruits', require('./routes/recruits'));
app.use('/api/equipment', require('./routes/equipment'));
app.use('/api/ammunition', require('./routes/ammunition'));
app.use('/api/platforms', require('./routes/platforms'));
app.use('/api/training-courses', require('./routes/courses'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/logs', require('./routes/logs'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/user/preferences', require('./routes/preferences'));
app.use('/api/alerts/settings', require('./routes/alerts'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/headquarters', require('./routes/headquarters'));
app.use('/api/personnel', require('./routes/personnel'));

// ✅ تهيئة جدولة التنبيهات
initAlertScheduler(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📋 Mode: ${useMock ? 'MOCK DATA' : 'MongoDB'}`);
  console.log(`🔔 Notifications and alerts system initialized`);
});