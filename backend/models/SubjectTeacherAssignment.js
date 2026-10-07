const mongoose = require('mongoose');

const subjectTeacherAssignmentSchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: true,
    },
  },
  { timestamps: true }
);

subjectTeacherAssignmentSchema.index(
  { classId: 1, subjectId: 1, academicYearId: 1 },
  { unique: true }
);

module.exports = mongoose.model('SubjectTeacherAssignment', subjectTeacherAssignmentSchema);
