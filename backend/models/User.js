const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    customId: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'teacher', 'student'],
      required: true,
    },
    // Role-specific optional fields
    department: { type: String, default: 'General' }, // For Teachers
    gradeClass: { type: String, default: 'Class 10-A' }, // For Students
    attendancePercentage: { type: Number, default: 92.5 }, // Student mock data
    pendingFees: { type: Number, default: 0 }, // Student mock data
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);