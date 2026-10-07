const express = require('express');
const Attendance = require('../models/Attendance');
const Marks = require('../models/Marks');
const User = require('../models/User');
const Class = require('../models/Class');
const SubjectTeacherAssignment = require('../models/SubjectTeacherAssignment');
const StudentProfile = require('../models/StudentProfile');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRoles('teacher', 'admin'));

// 1. Get Class Teacher's assigned class & enrolled students
router.get('/my-class', async (req, res) => {
  try {
    const assignedClass = await Class.findOne({ classTeacherId: req.user.id })
      .populate('standardId', 'name code')
      .populate('divisionId', 'name code');

    if (!assignedClass) {
      return res.json({ assigned: false, message: 'No Class Teacher assignment found' });
    }

    // Fetch enrolled students from StudentProfile or gradeClass
    const profiles = await StudentProfile.find({ classId: assignedClass._id }).populate('userId', 'name email customId attendancePercentage pendingFees');
    const studentsFromProfiles = profiles.map((p) => p.userId).filter(Boolean);

    // Fallback search by gradeClass string if profile list is small
    const allStudents = await User.find({ role: 'student', gradeClass: assignedClass.name }).select('-password');
    
    // Combine and deduplicate
    const map = new Map();
    [...studentsFromProfiles, ...allStudents].forEach((s) => map.set(s._id.toString(), s));
    const studentsList = Array.from(map.values());

    res.json({
      assigned: true,
      classInfo: assignedClass,
      totalStudents: studentsList.length,
      students: studentsList,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching assigned class', error: error.message });
  }
});

// 2. Get list of students for this teacher's assigned class (falls back to all students)
router.get('/students', async (req, res) => {
  try {
    const AcademicYear = require('../models/AcademicYear');

    // Try to find this teacher's assigned class
    const assignedClass = await Class.findOne({ classTeacherId: req.user.id });

    if (assignedClass) {
      // Get students from StudentProfile linked to this class
      const profiles = await StudentProfile.find({ classId: assignedClass._id })
        .populate('userId', 'name email customId gradeClass attendancePercentage pendingFees role');
      const profileStudents = profiles.map((p) => p.userId).filter((u) => u && u.role === 'student');

      // Also check by gradeClass string for backward compatibility
      const gradeClassStudents = await User.find({ role: 'student', gradeClass: assignedClass.name }).select('-password');

      // Combine and deduplicate
      const map = new Map();
      [...profileStudents, ...gradeClassStudents].forEach((s) => s && map.set(s._id.toString(), s));
      const students = Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));

      return res.json(students);
    }

    // Fallback: return all students
    const students = await User.find({ role: 'student' }).select('-password').sort({ name: 1 });
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching students', error: error.message });
  }
});

// 3. Mark Attendance & Auto-update Student overall %
router.post('/attendance', async (req, res) => {
  try {
    const { studentId, date, subject, status } = req.body;
    if (!studentId || !date || !subject || !status) {
      return res.status(400).json({ message: 'studentId, date, subject, and status are required' });
    }

    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ message: 'Student not found' });
    }

    const record = new Attendance({
      studentId,
      studentName: student.name,
      date,
      subject,
      status,
    });
    await record.save();

    // Recalculate student overall attendance %
    const allRecords = await Attendance.find({ studentId });
    const total = allRecords.length;
    const presentCount = allRecords.filter((r) => r.status === 'Present').length;
    const newPercentage = total > 0 ? parseFloat(((presentCount / total) * 100).toFixed(1)) : 100;

    student.attendancePercentage = newPercentage;
    await student.save();

    res.status(201).json({
      message: `Attendance recorded! Updated overall attendance to ${newPercentage}%`,
      record,
      updatedPercentage: newPercentage,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error marking attendance', error: error.message });
  }
});

// 3b. Bulk Mark Attendance for entire class roster
router.post('/attendance/bulk', async (req, res) => {
  try {
    const { date, subject, attendanceList } = req.body;
    // attendanceList = [{ studentId, status }]
    if (!date || !subject || !Array.isArray(attendanceList) || attendanceList.length === 0) {
      return res.status(400).json({ message: 'date, subject, and attendanceList are required' });
    }

    const results = [];
    for (const entry of attendanceList) {
      const { studentId, status } = entry;
      if (!studentId || !status) continue;

      const student = await User.findById(studentId);
      if (!student || student.role !== 'student') continue;

      // Check if attendance already exists for this student+date+subject
      const existing = await Attendance.findOne({ studentId, date, subject });
      if (existing) {
        existing.status = status;
        await existing.save();
      } else {
        const record = new Attendance({ studentId, studentName: student.name, date, subject, status });
        await record.save();
      }

      // Recalculate attendance %
      const allRecords = await Attendance.find({ studentId });
      const total = allRecords.length;
      const presentCount = allRecords.filter((r) => r.status === 'Present').length;
      const newPercentage = total > 0 ? parseFloat(((presentCount / total) * 100).toFixed(1)) : 100;
      student.attendancePercentage = newPercentage;
      await student.save();

      results.push({ studentId, name: student.name, status, updatedPercentage: newPercentage });
    }

    res.status(201).json({
      message: `Bulk attendance recorded for ${results.length} students.`,
      results,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error recording bulk attendance', error: error.message });
  }
});


// 4. Get Attendance Records Log
router.get('/attendance', async (req, res) => {
  try {
    const records = await Attendance.find().sort({ createdAt: -1 }).limit(100);
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching attendance records', error: error.message });
  }
});

// 5. Upload Student Marks
router.post('/marks', async (req, res) => {
  try {
    const { studentId, subject, examName, marksObtained, totalMarks } = req.body;
    if (!studentId || !subject || !examName || marksObtained === undefined) {
      return res.status(400).json({ message: 'studentId, subject, examName, and marksObtained are required' });
    }

    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ message: 'Student not found' });
    }

    const markRecord = new Marks({
      studentId,
      studentName: student.name,
      subject,
      examName,
      marksObtained: Number(marksObtained),
      totalMarks: Number(totalMarks) || 100,
    });
    await markRecord.save();

    res.status(201).json({ message: 'Marks uploaded successfully', markRecord });
  } catch (error) {
    res.status(500).json({ message: 'Error saving marks', error: error.message });
  }
});

// 6. Get Marks Records Log
router.get('/marks', async (req, res) => {
  try {
    const marks = await Marks.find().sort({ createdAt: -1 }).limit(100);
    res.json(marks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching marks records', error: error.message });
  }
});

module.exports = router;