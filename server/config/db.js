const mongoose = require('mongoose');

const connectDB = async () => {
  // إذا كنا في وضع Mock Data، لا نحاول الاتصال
  if (process.env.USE_MOCK_DB === 'true') {
    console.log('⚠️ Mock mode enabled - skipping MongoDB connection');
    return null;
  }
  
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected successfully');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    throw err;
  }
};

module.exports = connectDB;