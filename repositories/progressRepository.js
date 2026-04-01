const Progress = require("../models/Progress");

async function findOneLean(filter) {
  return Progress.findOne(filter).lean();
}

async function upsertCompletedLesson(userId, subjectId, lessonId) {
  return Progress.findOneAndUpdate(
    {
      userId,
      subjectId,
      lessonId,
    },
    {
      $set: {
        completed: true,
        completedAt: new Date(),
      },
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
    }
  ).lean();
}

module.exports = {
  findOneLean,
  upsertCompletedLesson,
};
