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

async function addLesson(subjectId, title, content) {
  return Subject.findByIdAndUpdate(
    subjectId,
    {
      $push: {
        lessons: {
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

module.exports = {
  findSubjects,
  findByIdLean,
  findByIdWithLessons,
  findByIdWithLessonsLean,
  addLesson,
  saveSubject,
};
