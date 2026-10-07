const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body; // Can be email OR customId (STU1001 / EMP1001)

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Please enter ID/Email and Password' });
    }

    // Search by email OR customId
    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase().trim() },
        { customId: identifier.toUpperCase().trim() },
      ],
    });

    if (!user) {
      return res.status(404).json({ message: 'User account not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid password credentials' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, customId: user.customId },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        customId: user.customId,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        gradeClass: user.gradeClass,
        attendancePercentage: user.attendancePercentage,
        pendingFees: user.pendingFees,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
});

module.exports = router;