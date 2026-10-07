const express = require('express');
const Attendance = require('../models/Attendance');
const Marks = require('../models/Marks');
const User = require('../models/User');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRoles('student', 'admin'));

// 1. Get logged-in student's profile info
router.get('/profile', async (req, res) => {
  try {
    const student = await User.findById(req.user.id).select('-password');
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
});

// 2. Get logged-in student's attendance history & percentage
router.get('/my-attendance', async (req, res) => {
  try {
    const records = await Attendance.find({ studentId: req.user.id }).sort({ date: -1 });
    const total = records.length;
    const presentCount = records.filter((r) => r.status === 'Present').length;
    const percentage = total > 0 ? parseFloat(((presentCount / total) * 100).toFixed(1)) : 100;

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

// 3. Get logged-in student's report card & marks
router.get('/my-marks', async (req, res) => {
  try {
    const marks = await Marks.find({ studentId: req.user.id }).sort({ createdAt: -1 });
    res.json(marks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching marks', error: error.message });
  }
});

// 4. Pay pending fees simulation
router.post('/pay-fee', async (req, res) => {
  try {
    const { amount } = req.body;
    const payAmount = Number(amount);

    if (!payAmount || payAmount <= 0) {
      return res.status(400).json({ message: 'Please enter a valid payment amount greater than $0' });
    }

    const student = await User.findById(req.user.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (student.pendingFees <= 0) {
      return res.status(400).json({ message: 'No pending fees to pay!' });
    }

    const previousFee = student.pendingFees;
    const newPendingFee = Math.max(0, previousFee - payAmount);
    const actualPaid = previousFee - newPendingFee;

    student.pendingFees = newPendingFee;
    await student.save();

    res.json({
      message: `🎉 Payment of $${actualPaid} processed successfully!`,
      amountPaid: actualPaid,
      remainingFees: newPendingFee,
      transactionId: `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      user: student,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error processing fee payment', error: error.message });
  }
});

module.exports = router;