const mongoose = require('mongoose');

const studentProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    admissionNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    rollNo: {
      type: Number,
      required: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
    },
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: true,
    },
    dob: {
      type: String,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      default: 'Male',
    },
    parentName: {
      type: String,
      default: '',
    },
    parentPhone: {
      type: String,
      default: '',
    },
    parentEmail: {
      type: String,
      default: '',
    },
    address: {
      type: String,
      default: '',
    },
    emergencyContact: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Active', 'Graduated', 'Transferred', 'Inactive'],
      default: 'Active',
    },
  },
  { timestamps: true }
);

studentProfileSchema.index({ classId: 1, rollNo: 1, academicYearId: 1 }, { unique: true });

module.exports = mongoose.model('StudentProfile', studentProfileSchema);
