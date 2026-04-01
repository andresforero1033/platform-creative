const Progress = require("../models/Progress");
const mongoose = require("mongoose");

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

async function countCompletedLessonsBySubject(userId, subjectId) {
  return Progress.countDocuments({
    userId,
    subjectId,
    completed: true,
  });
}

async function countMasteredLessonsBySubject(userId, subjectId) {
  return Progress.countDocuments({
    userId,
    subjectId,
    mastered: true,
  });
}

async function upsertQuizAttempt(userId, subjectId, lessonId, score) {
  return Progress.findOneAndUpdate(
    {
      userId,
      subjectId,
      lessonId,
    },
    {
      $set: {
        lastQuizScore: score,
      },
      $inc: {
        quizAttempts: 1,
      },
      $setOnInsert: {
        completed: false,
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

async function markLessonAsMastered(userId, subjectId, lessonId, score) {
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
        mastered: true,
        masteredAt: new Date(),
        lastQuizScore: score,
      },
      $inc: {
        quizAttempts: 1,
      },
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
    }
  ).lean();
}

async function aggregateCompletedLessonsBySubject(userId) {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return [];
  }

  return Progress.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(String(userId)),
        completed: true,
      },
    },
    {
      $group: {
        _id: "$subjectId",
        completedLessons: { $sum: 1 },
      },
    },
    {
      $sort: {
        completedLessons: -1,
      },
    },
  ]);
}

async function countCompletedLessonsByUserBetween(userId, startDate, endDate) {
  return Progress.countDocuments({
    userId,
    completed: true,
    completedAt: {
      $gte: startDate,
      $lt: endDate,
    },
  });
}

module.exports = {
  findOneLean,
  upsertCompletedLesson,
  countCompletedLessonsBySubject,
  countMasteredLessonsBySubject,
  upsertQuizAttempt,
  markLessonAsMastered,
  aggregateCompletedLessonsBySubject,
  countCompletedLessonsByUserBetween,
};
