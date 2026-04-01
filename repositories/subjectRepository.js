const Subject = require("../models/Subject");

async function findSubjects(filter) {
  return Subject.find(filter).sort({ name: 1 }).lean();
}

async function findByIdLean(subjectId) {
  return Subject.findById(subjectId).lean();
}

async function findByIdWithLessons(subjectId) {
  return Subject.findById(subjectId);
}

async function findByIdWithLessonsLean(subjectId) {
  return Subject.findById(subjectId).select("_id lessons").lean();
}

async function addLesson(subjectId, title, content, teacherId) {
  return Subject.findByIdAndUpdate(
    subjectId,
    {
      $push: {
        lessons: {
          teacherId: teacherId || null,
          title,
          content,
        },
      },
    },
    {
      new: true,
      runValidators: true,
    }
  ).lean();
}

async function saveSubject(subject) {
  await subject.save();
  return subject.toObject();
}

async function countSubjects() {
  return Subject.countDocuments({});
}

async function findAllWithLessonsLean() {
  return Subject.find({}).select("_id name lessons").lean();
}

module.exports = {
  findSubjects,
  findByIdLean,
  findByIdWithLessons,
  findByIdWithLessonsLean,
  addLesson,
  saveSubject,
  countSubjects,
  findAllWithLessonsLean,
};
