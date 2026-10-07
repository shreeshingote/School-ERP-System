const mongoose = require('mongoose');

const classSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true, // e.g. "5th-C"
    },
    standardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Standard',
      required: true,
    },
    divisionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Division',
      required: true,
    },
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: true,
    },
    classTeacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    capacity: {
      type: Number,
      default: 40,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

classSchema.index({ standardId: 1, divisionId: 1, academicYearId: 1 }, { unique: true });

module.exports = mongoose.model('Class', classSchema);
