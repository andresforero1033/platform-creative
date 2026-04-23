const Classroom = require("../models/Classroom");

async function createClassroom(payload) {
  return Classroom.create(payload);
}

async function findByClassCodeLean(classCode) {
  if (!classCode) {
    return null;
  }

  return Classroom.findOne({ classCode: classCode.toUpperCase() }).lean();
}

async function findByTeacherLean(teacherId, institutionId) {
  return Classroom.find({
    teacherId,
    institutionId,
    isActive: true,
  })
    .sort({ createdAt: -1 })
    .lean();
}

async function addStudentToClassroom(classroomId, studentId) {
  return Classroom.findByIdAndUpdate(
    classroomId,
    {
      $addToSet: {
        studentIds: studentId,
      },
    },
    {
      new: true,
      runValidators: true,
    }
  ).lean();
}

async function findByStudentLean(studentId, institutionId) {
  return Classroom.find({
    institutionId,
    isActive: true,
    studentIds: studentId,
  }).lean();
}

async function findByStudentAndSubjectLean(studentId, subjectId) {
  return Classroom.findOne({
    subjectId,
    isActive: true,
    studentIds: studentId,
  }).lean();
}

async function findBySubjectAndInstitutionLean(subjectId, institutionId) {
  return Classroom.find({
    subjectId,
    institutionId,
    isActive: true,
  }).lean();
}

module.exports = {
  createClassroom,
  findByClassCodeLean,
  findByTeacherLean,
  addStudentToClassroom,
  findByStudentLean,
  findByStudentAndSubjectLean,
  findBySubjectAndInstitutionLean,
};
