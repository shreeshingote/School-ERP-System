const express = require('express');
const Attendance = require('../models/Attendance');
const Marks = require('../models/Marks');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRoles('student', 'admin'));

// 1. Get logged-in student's attendance history & percentage
router.get('/my-attendance', async (req, res) => {
  try {
    const records = await Attendance.find({ studentId: req.user.id });
    const total = records.length;
    const presentCount = records.filter((r) => r.status === 'Present').length;
    const percentage = total > 0 ? ((presentCount / total) * 100).toFixed(1) : 100;

    res.json({
      totalClasses: total,
      presentClasses: presentCount,
      percentage: Number(percentage),
      records,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching attendance', error: error.message });
  }
});

// 2. Get logged-in student's report card & marks
router.get('/my-marks', async (req, res) => {
  try {
    const marks = await Marks.find({ studentId: req.user.id });
    res.json(marks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching marks', error: error.message });
  }
});

module.exports = router;