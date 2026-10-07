const mongoose = require('mongoose');

const divisionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true, // e.g. "Division A", "Division B", "Division C"
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true, // "A", "B", "C"
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Division', divisionSchema);
