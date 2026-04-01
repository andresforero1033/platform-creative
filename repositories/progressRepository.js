const Progress = require("../models/Progress");
const mongoose = require("mongoose");

async function findOneLean(filter) {
  return Progress.findOne(filter).lean();
}

async function findManyLean(filter) {
  return Progress.find(filter).lean();
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

async function saveQuizOutcome(userId, subjectId, lessonId, payload) {
  const increment = {
    quizAttempts: 1,
    quizPassCount: payload.passed ? 1 : 0,
    quizFailCount: payload.passed ? 0 : 1,
  };

  return Progress.findOneAndUpdate(
    {
      userId,
      subjectId,
      lessonId,
    },
    {
      $set: {
        completed: payload.completed,
        completedAt: payload.completed ? new Date() : null,
        mastered: payload.mastered,
        masteredAt: payload.mastered ? new Date() : null,
        lastQuizScore: payload.score,
        nextReviewDate: payload.nextReviewDate,
        reviewLevel: payload.reviewLevel,
      },
      $inc: increment,
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

async function findDueReviewsByUserLean(userId, now) {
  return Progress.find({
    userId,
    nextReviewDate: { $lte: now },
  })
    .select("subjectId lessonId nextReviewDate reviewLevel lastQuizScore")
    .lean();
}

async function aggregateMasteryBySubjectForStudents(studentIds) {
  if (!studentIds.length) {
    return [];
  }

  return Progress.aggregate([
    {
      $match: {
        userId: { $in: studentIds },
      },
    },
    {
      $group: {
        _id: "$subjectId",
        totalLessons: { $sum: 1 },
        masteredLessons: {
          $sum: {
            $cond: [{ $eq: ["$mastered", true] }, 1, 0],
          },
        },
      },
    },
  ]);
}

async function aggregateDifficultLessons() {
  return Progress.aggregate([
    {
      $match: {
        quizAttempts: { $gt: 0 },
      },
    },
    {
      $group: {
        _id: {
          subjectId: "$subjectId",
          lessonId: "$lessonId",
        },
        totalAttempts: { $sum: "$quizAttempts" },
        totalFails: { $sum: "$quizFailCount" },
      },
    },
    {
      $addFields: {
        failRate: {
          $cond: [
            { $eq: ["$totalAttempts", 0] },
            0,
            { $multiply: [{ $divide: ["$totalFails", "$totalAttempts"] }, 100] },
          ],
        },
      },
    },
    {
      $match: {
        failRate: { $gt: 50 },
      },
    },
    {
      $sort: {
        failRate: -1,
      },
    },
  ]);
}

module.exports = {
  findOneLean,
  findManyLean,
  upsertCompletedLesson,
  countCompletedLessonsBySubject,
  countMasteredLessonsBySubject,
  upsertQuizAttempt,
  markLessonAsMastered,
  saveQuizOutcome,
  aggregateCompletedLessonsBySubject,
  countCompletedLessonsByUserBetween,
  findDueReviewsByUserLean,
  aggregateMasteryBySubjectForStudents,
  aggregateDifficultLessons,
};
