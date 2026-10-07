const mongoose = require('mongoose');

const standardSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true, // e.g. "1st Standard", "2nd Standard", ..., "12th Standard"
    },
    code: {
      type: Number,
      required: true,
      unique: true, // 1 to 12
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Standard', standardSchema);
