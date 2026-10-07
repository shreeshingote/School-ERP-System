const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true, // e.g. "Mathematics", "Science", "English", "Computer"
    },
    code: {
      type: String,
      trim: true,
    },
    standardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Standard',
      required: true,
    },
    description: String,
  },
  { timestamps: true }
);

subjectSchema.index({ name: 1, standardId: 1 }, { unique: true });

module.exports = mongoose.model('Subject', subjectSchema);
