const express = require('express');
const Attendance = require('../models/Attendance');
const Marks = require('../models/Marks');
const User = require('../models/User');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRoles('teacher', 'admin'));

// 1. Get list of all students for teacher
router.get('/students', async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('-password');
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching students', error: error.message });
  }
});

// 2. Mark Attendance
router.post('/attendance', async (req, res) => {
  try {
    const { studentId, studentName, date, subject, status } = req.body;
    const record = new Attendance({ studentId, studentName, date, subject, status });
    await record.save();
    res.status(201).json({ message: 'Attendance recorded successfully', record });
  } catch (error) {
    res.status(500).json({ message: 'Error marking attendance', error: error.message });
  }
});

// 3. Upload Student Marks
router.post('/marks', async (req, res) => {
  try {
    const { studentId, studentName, subject, examName, marksObtained, totalMarks } = req.body;
    const markRecord = new Marks({
      studentId,
      studentName,
      subject,
      examName,
      marksObtained,
      totalMarks,
    });
    await markRecord.save();
    res.status(201).json({ message: 'Marks uploaded successfully', markRecord });
  } catch (error) {
    res.status(500).json({ message: 'Error saving marks', error: error.message });
  }
});

module.exports = router;