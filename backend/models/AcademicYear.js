const mongoose = require('mongoose');

const academicYearSchema = new mongoose.Schema(
  {
    year: {
      type: String,
      required: true,
      unique: true,
      trim: true, // e.g. "2026-27"
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    isCurrent: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AcademicYear', academicYearSchema);
