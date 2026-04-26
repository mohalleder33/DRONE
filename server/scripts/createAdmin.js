const path = require('path');
// تحميل متغيرات البيئة من المسار الصحيح
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// تعريف نموذج المستخدم المبسط
const UserSchema = new mongoose.Schema({
  name: String,
  username: String,
  email: String,
  password: String,
  role: String,
  rank: String,
  militaryId: String
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

const createAdmin = async () => {
  try {
    // التحقق من وجود MONGO_URI
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined in .env file');
    }
    
    console.log('📡 Connecting to MongoDB...');
    console.log('🔗 MONGO_URI:', process.env.MONGO_URI);
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // حذف المستخدم القديم إذا وجد (اختياري)
    await User.deleteOne({ email: 'admin@sys.com' });

    // تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash('123456', 10);

    // إنشاء المستخدم الجديد
    const admin = new User({
      name: 'مدير النظام',
      username: 'admin',
      email: 'admin@sys.com',
      password: hashedPassword,
      role: 'admin',
      rank: 'عميد',
      militaryId: 'ADMIN01'
    });

    await admin.save();
    console.log('✅ Admin user created successfully');
    console.log('📧 Email: admin@sys.com');
    console.log('🔑 Password: 123456');
    
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

createAdmin();