const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Marks = require('../models/Marks');
const AcademicYear = require('../models/AcademicYear');
const Standard = require('../models/Standard');
const Division = require('../models/Division');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const SubjectTeacherAssignment = require('../models/SubjectTeacherAssignment');
const StudentProfile = require('../models/StudentProfile');

const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Protect all admin routes
router.use(authenticateToken);
router.use(authorizeRoles('admin'));

// Helper to auto-generate IDs (STU1001, STU1002... / EMP1001, EMP1002...)
const generateCustomId = async (role) => {
  const prefix = role === 'teacher' ? 'EMP' : 'STU';
  const lastUser = await User.findOne({
    role,
    customId: { $regex: new RegExp(`^${prefix}\\d+`) },
  }).sort({ createdAt: -1 });

  if (!lastUser || !lastUser.customId) {
    return `${prefix}1001`;
  }

  const numberPart = lastUser.customId.replace(prefix, '');
  const nextNum = parseInt(numberPart, 10) + 1;
  return `${prefix}${nextNum}`;
};

// GET /api/admin/stats - Overview Metrics
router.get('/stats', async (req, res) => {
  try {
    const studentCount = await User.countDocuments({ role: 'student' });
    const teacherCount = await User.countDocuments({ role: 'teacher' });
    const adminCount = await User.countDocuments({ role: 'admin' });
    const classCount = await Class.countDocuments();
    const attendanceLogsCount = await Attendance.countDocuments();
    const marksLogsCount = await Marks.countDocuments();

    const students = await User.find({ role: 'student' }).select('pendingFees');
    const totalPendingFees = students.reduce((acc, s) => acc + (s.pendingFees || 0), 0);

    res.json({
      studentCount,
      teacherCount,
      adminCount,
      classCount,
      attendanceLogsCount,
      marksLogsCount,
      totalPendingFees,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stats', error: error.message });
  }
});

// GET /api/admin/classes - Fetch 36 Classes with Class Teachers and Student counts
router.get('/classes', async (req, res) => {
  try {
    const currentYear = await AcademicYear.findOne({ isCurrent: true });
    const classes = await Class.find({ academicYearId: currentYear ? currentYear._id : undefined })
      .populate('standardId', 'name code')
      .populate('divisionId', 'name code')
      .populate('classTeacherId', 'name customId email department')
      .sort({ name: 1 });

    // Count enrolled students per class
    const result = await Promise.all(
      classes.map(async (cls) => {
        const studentCount = await StudentProfile.countDocuments({ classId: cls._id });
        return {
          ...cls.toObject(),
          studentCount,
        };
      })
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching classes', error: error.message });
  }
});

// POST /api/admin/classes - Add a new Class Division
router.post('/classes', async (req, res) => {
  try {
    const { standardId, divisionName, capacity, classTeacherId } = req.body;
    if (!standardId || !divisionName) {
      return res.status(400).json({ message: 'Standard and Division name are required' });
    }

    const standard = await Standard.findById(standardId);
    if (!standard) {
      return res.status(404).json({ message: 'Standard not found' });
    }

    const divCode = divisionName.trim().toUpperCase();
    let division = await Division.findOne({ code: divCode });
    if (!division) {
      division = await new Division({ name: `Division ${divCode}`, code: divCode }).save();
    }

    const currentYear = await AcademicYear.findOne({ isCurrent: true });
    const className = `${standard.code}${standard.code === 1 ? 'st' : standard.code === 2 ? 'nd' : standard.code === 3 ? 'rd' : 'th'}-${divCode}`;

    const existingClass = await Class.findOne({
      standardId: standard._id,
      divisionId: division._id,
      academicYearId: currentYear._id,
    });

    if (existingClass) {
      return res.status(400).json({ message: `Class '${className}' already exists for this Academic Year` });
    }

    const newClass = new Class({
      name: className,
      standardId: standard._id,
      divisionId: division._id,
      academicYearId: currentYear._id,
      classTeacherId: classTeacherId || null,
      capacity: Number(capacity) || 40,
    });

    await newClass.save();
    const populated = await Class.findById(newClass._id)
      .populate('standardId')
      .populate('divisionId')
      .populate('classTeacherId');

    res.status(201).json({ message: `Class '${className}' created successfully!`, class: populated });
  } catch (error) {
    res.status(500).json({ message: 'Error creating class', error: error.message });
  }
});

// PUT /api/admin/classes/:classId/class-teacher - Assign or Unassign Class Teacher
router.put('/classes/:classId/class-teacher', async (req, res) => {
  try {
    const { teacherId } = req.body;
    const cls = await Class.findById(req.params.classId);
    if (!cls) {
      return res.status(404).json({ message: 'Class not found' });
    }

    if (teacherId && teacherId !== 'none' && teacherId !== '') {
      const teacher = await User.findById(teacherId);
      if (!teacher || teacher.role !== 'teacher') {
        return res.status(400).json({ message: 'Selected user is not a valid faculty teacher' });
      }
      cls.classTeacherId = teacherId;
    } else {
      cls.classTeacherId = null;
    }

    await cls.save();
    const updatedClass = await Class.findById(cls._id)
      .populate('standardId')
      .populate('divisionId')
      .populate('classTeacherId', 'name customId email');

    const msg = cls.classTeacherId
      ? `Class Teacher assigned to ${updatedClass.name}`
      : `Class Teacher unassigned for ${updatedClass.name}`;

    res.json({ message: msg, class: updatedClass });
  } catch (error) {
    res.status(500).json({ message: 'Error assigning class teacher', error: error.message });
  }
});

// GET /api/admin/standards - Fetch 12 standards
router.get('/standards', async (req, res) => {
  try {
    const standards = await Standard.find().sort({ code: 1 });
    res.json(standards);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching standards', error: error.message });
  }
});

// GET /api/admin/subjects - Fetch subjects
router.get('/subjects', async (req, res) => {
  try {
    const subjects = await Subject.find().populate('standardId', 'name code').sort({ name: 1 });
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching subjects', error: error.message });
  }
});

// POST /api/admin/subjects - Add subject to standard
router.post('/subjects', async (req, res) => {
  try {
    const { name, standardId, description } = req.body;
    if (!name || !standardId) {
      return res.status(400).json({ message: 'Subject name and Standard are required' });
    }

    const newSub = new Subject({ name: name.trim(), standardId, description });
    await newSub.save();

    res.status(201).json({ message: `Subject '${name}' added successfully!`, subject: newSub });
  } catch (error) {
    res.status(500).json({ message: 'Error adding subject', error: error.message });
  }
});

// GET /api/admin/subject-teachers - Fetch subject teacher assignments
router.get('/subject-teachers', async (req, res) => {
  try {
    const currentYear = await AcademicYear.findOne({ isCurrent: true });
    const assignments = await SubjectTeacherAssignment.find({ academicYearId: currentYear?._id })
      .populate('classId', 'name')
      .populate('subjectId', 'name')
      .populate('teacherId', 'name customId email department');

    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching subject teacher assignments', error: error.message });
  }
});

// POST /api/admin/subject-teachers - Assign Subject Teacher
router.post('/subject-teachers', async (req, res) => {
  try {
    const { classId, subjectId, teacherId } = req.body;
    if (!classId || !subjectId || !teacherId) {
      return res.status(400).json({ message: 'classId, subjectId, and teacherId are required' });
    }

    const currentYear = await AcademicYear.findOne({ isCurrent: true });
    let assignment = await SubjectTeacherAssignment.findOne({
      classId,
      subjectId,
      academicYearId: currentYear._id,
    });

    if (assignment) {
      assignment.teacherId = teacherId;
      await assignment.save();
    } else {
      assignment = new SubjectTeacherAssignment({
        classId,
        subjectId,
        teacherId,
        academicYearId: currentYear._id,
      });
      await assignment.save();
    }

    res.json({ message: 'Subject Teacher assigned successfully!', assignment });
  } catch (error) {
    res.status(500).json({ message: 'Error assigning subject teacher', error: error.message });
  }
});

// GET /api/admin/users - Fetch all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

// POST /api/admin/create-student - Register Student
router.post('/create-student', async (req, res) => {
  try {
    const { name, email, gradeClass, classId, pendingFees, password } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and Email are required' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const customId = await generateCustomId('student');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password || 'password123', salt);

    const newStudent = new User({
      customId,
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'student',
      gradeClass: gradeClass || '5th-C',
      attendancePercentage: 100,
      pendingFees: Number(pendingFees) || 0,
    });

    await newStudent.save();

    // If a specific classId is provided, create a StudentProfile to link student to class
    if (classId) {
      const currentYear = await AcademicYear.findOne({ isCurrent: true });
      const classRecord = await Class.findById(classId);
      if (classRecord && currentYear) {
        // Update gradeClass to the class name for consistency
        newStudent.gradeClass = classRecord.name;
        await newStudent.save();

        // Upsert StudentProfile
        await StudentProfile.findOneAndUpdate(
          { userId: newStudent._id, academicYearId: currentYear._id },
          { classId: classRecord._id, academicYearId: currentYear._id },
          { upsert: true, new: true }
        );
      }
    }

    res.status(201).json({
      message: `Student account created successfully! Generated ID: ${customId}`,
      user: newStudent,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating student', error: error.message });
  }
});

// POST /api/admin/assign-student-class - Assign or reassign a student to a class
router.post('/assign-student-class', async (req, res) => {
  try {
    const { studentId, classId } = req.body;
    if (!studentId || !classId) {
      return res.status(400).json({ message: 'studentId and classId are required' });
    }

    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ message: 'Student not found' });
    }

    const classRecord = await Class.findById(classId)
      .populate('standardId', 'name code')
      .populate('divisionId', 'name code');
    if (!classRecord) {
      return res.status(404).json({ message: 'Class not found' });
    }

    const currentYear = await AcademicYear.findOne({ isCurrent: true });

    // Upsert StudentProfile
    await StudentProfile.findOneAndUpdate(
      { userId: student._id, academicYearId: currentYear._id },
      { classId: classRecord._id },
      { upsert: true, new: true }
    );

    // Keep gradeClass field in sync
    student.gradeClass = classRecord.name;
    await student.save();

    res.json({
      message: `${student.name} assigned to class ${classRecord.name} successfully!`,
      student,
      class: classRecord,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error assigning student to class', error: error.message });
  }
});

// POST /api/admin/create-teacher - Register Faculty
router.post('/create-teacher', async (req, res) => {
  try {
    const { name, email, department, password } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and Email are required' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const customId = await generateCustomId('teacher');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password || 'password123', salt);

    const newTeacher = new User({
      customId,
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'teacher',
      department: department || 'Computer Science',
    });

    await newTeacher.save();

    res.status(201).json({
      message: `Faculty account created successfully! Generated ID: ${customId}`,
      user: newTeacher,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating faculty', error: error.message });
  }
});

// PUT /api/admin/users/:id/fee - Update Pending Fees for Student
router.put('/users/:id/fee', async (req, res) => {
  try {
    const { pendingFees } = req.body;
    if (pendingFees === undefined || isNaN(Number(pendingFees))) {
      return res.status(400).json({ message: 'Valid pending fee amount required' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.role !== 'student') {
      return res.status(400).json({ message: 'Fees can only be set for student accounts' });
    }

    user.pendingFees = Number(pendingFees);
    await user.save();

    res.json({ message: 'Student pending fee updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Error updating fee', error: error.message });
  }
});

// DELETE /api/admin/users/:id - Delete User
router.delete('/users/:id', async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own admin account' });
    }
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
});

module.exports = router;