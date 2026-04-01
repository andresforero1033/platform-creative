const Quiz = require("../models/Quiz");

async function findBySubjectAndLessonLean(subjectId, lessonId) {
  return Quiz.findOne({ subjectId, lessonId, isActive: true }).lean();
}

module.exports = {
  findBySubjectAndLessonLean,
};
