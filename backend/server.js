const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const AcademicYear = require('./models/AcademicYear');
const Standard = require('./models/Standard');
const Division = require('./models/Division');
const Class = require('./models/Class');
const Subject = require('./models/Subject');
const SubjectTeacherAssignment = require('./models/SubjectTeacherAssignment');
const StudentProfile = require('./models/StudentProfile');
const Attendance = require('./models/Attendance');
const Marks = require('./models/Marks');

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const studentRoutes = require('./routes/studentRoutes');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb+srv://shreeshingote2004_db_user:Shree1704@cluster0.qsvrwxl.mongodb.net/schoolERPDB?retryWrites=true&w=majority';

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log('MongoDB Connected successfully!');

    const salt = await bcrypt.genSalt(10);
    const defaultPassword = await bcrypt.hash('password123', salt);
    const adminPassword = await bcrypt.hash('admin123', salt);

    // 1. Seed Academic Year (2026-27)
    let academicYear = await AcademicYear.findOne({ year: '2026-27' });
    if (!academicYear) {
      academicYear = await new AcademicYear({
        year: '2026-27',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2027-04-30'),
        isCurrent: true,
      }).save();
      console.log('✅ Academic Year 2026-27 Seeded');
    }

    // 2. Seed 12 Standards (1st..12th)
    const stdNames = [
      '1st Standard', '2nd Standard', '3rd Standard', '4th Standard',
      '5th Standard', '6th Standard', '7th Standard', '8th Standard',
      '9th Standard', '10th Standard', '11th Standard', '12th Standard'
    ];
    const stdDocs = [];
    for (let i = 0; i < stdNames.length; i++) {
      let std = await Standard.findOne({ code: i + 1 });
      if (!std) {
        std = await new Standard({ name: stdNames[i], code: i + 1 }).save();
      }
      stdDocs.push(std);
    }

    // 3. Seed 3 Divisions (A, B, C)
    const divLetters = ['A', 'B', 'C'];
    const divDocs = [];
    for (const letter of divLetters) {
      let div = await Division.findOne({ code: letter });
      if (!div) {
        div = await new Division({ name: `Division ${letter}`, code: letter }).save();
      }
      divDocs.push(div);
    }

    // 4. Seed Admin
    let admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      admin = await new User({
        customId: 'ADM001',
        name: 'System Admin',
        email: 'admin@school.com',
        password: adminPassword,
        role: 'admin',
      }).save();
    }

    // 5. Seed Default Faculty Teacher (EMP1001)
    let teacher = await User.findOne({ customId: 'EMP1001' });
    if (!teacher) {
      teacher = await new User({
        customId: 'EMP1001',
        name: 'Prof. Rajesh Sharma',
        email: 'teacher@school.com',
        password: defaultPassword,
        role: 'teacher',
        department: 'Computer Science',
      }).save();
    }

    // 6. Seed 36 Classes (1st-A .. 12th-C)
    let fifthClassC = null;
    for (const std of stdDocs) {
      for (const div of divDocs) {
        const className = `${std.code}${std.code === 1 ? 'st' : std.code === 2 ? 'nd' : std.code === 3 ? 'rd' : 'th'}-${div.code}`;
        let cls = await Class.findOne({
          standardId: std._id,
          divisionId: div._id,
          academicYearId: academicYear._id,
        });

        if (!cls) {
          cls = await new Class({
            name: className,
            standardId: std._id,
            divisionId: div._id,
            academicYearId: academicYear._id,
            classTeacherId: className === '5th-C' ? teacher._id : null,
            capacity: 40,
          }).save();
        } else if (className === '5th-C' && !cls.classTeacherId) {
          cls.classTeacherId = teacher._id;
          await cls.save();
        }

        if (className === '5th-C') {
          fifthClassC = cls;
        }
      }
    }
    console.log('✅ 36 School Classes Seeded (1st-A to 12th-C)');

    // 7. Seed Default Student (STU1001) & StudentProfile
    let student = await User.findOne({ customId: 'STU1001' });
    if (!student) {
      student = await new User({
        customId: 'STU1001',
        name: 'Aarav Patel',
        email: 'student@school.com',
        password: defaultPassword,
        role: 'student',
        gradeClass: '5th-C',
        attendancePercentage: 92.5,
        pendingFees: 1200,
      }).save();
    }

    if (student && fifthClassC) {
      let profile = await StudentProfile.findOne({ userId: student._id });
      if (!profile) {
        await new StudentProfile({
          userId: student._id,
          admissionNo: 'ADM2026001',
          rollNo: 17,
          classId: fifthClassC._id,
          academicYearId: academicYear._id,
          dob: '2015-08-15',
          gender: 'Male',
          parentName: 'Suresh Patel',
          parentPhone: '+91 98765 43210',
          parentEmail: 'parent.patel@gmail.com',
          address: '402 Sunrise Apartments, MG Road, Pune',
        }).save();
      }
    }

    // 8. Seed Sample Attendance & Marks for STU1001 if empty
    const attendanceCount = await Attendance.countDocuments({ studentId: student._id });
    if (attendanceCount === 0) {
      await Attendance.insertMany([
        { studentId: student._id, studentName: student.name, date: '2026-10-01', subject: 'Mathematics', status: 'Present' },
        { studentId: student._id, studentName: student.name, date: '2026-10-02', subject: 'Computer Science', status: 'Present' },
        { studentId: student._id, studentName: student.name, date: '2026-10-03', subject: 'Physics', status: 'Absent' },
        { studentId: student._id, studentName: student.name, date: '2026-10-04', subject: 'Chemistry', status: 'Present' },
        { studentId: student._id, studentName: student.name, date: '2026-10-05', subject: 'English Literature', status: 'Present' },
      ]);
    }

    const marksCount = await Marks.countDocuments({ studentId: student._id });
    if (marksCount === 0) {
      await Marks.insertMany([
        { studentId: student._id, studentName: student.name, subject: 'Mathematics', examName: 'Midterm 2026', marksObtained: 88, totalMarks: 100 },
        { studentId: student._id, studentName: student.name, subject: 'Computer Science', examName: 'Midterm 2026', marksObtained: 95, totalMarks: 100 },
        { studentId: student._id, studentName: student.name, subject: 'Physics', examName: 'Midterm 2026', marksObtained: 79, totalMarks: 100 },
        { studentId: student._id, studentName: student.name, subject: 'Chemistry', examName: 'Midterm 2026', marksObtained: 84, totalMarks: 100 },
      ]);
    }

    console.log('----------------------------------------------------');
    console.log('🔑 SCHOOL ERP ACCOUNTS READY FOR TESTING:');
    console.log('   [ADMIN]   ID/Email: admin@school.com  | Pass: admin123');
    console.log('   [TEACHER] ID: EMP1001 | Email: teacher@school.com | Pass: password123');
    console.log('   [STUDENT] ID: STU1001 | Email: student@school.com | Pass: password123');
    console.log('----------------------------------------------------');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/student', studentRoutes);

app.get('/', (req, res) => {
  res.send('School ERP 1st-12th Standard Multi-Portal API is running...');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});