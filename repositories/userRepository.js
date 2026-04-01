const User = require("../models/User");

async function findByEmailLean(email) {
  return User.findOne({ email }).lean();
}

async function createUser(payload) {
  return User.create(payload);
}

async function findByEmailWithPassword(email) {
  return User.findOne({ email }).select("+password");
}

async function findByIdLean(userId) {
  return User.findById(userId).lean();
}

async function incrementUserPoints(userId, points) {
  return User.findByIdAndUpdate(userId, { $inc: { points } });
}

async function updateActivityAndStreak(userId, payload) {
  return User.findByIdAndUpdate(
    userId,
    {
      $set: {
        lastActivity: payload.lastActivity,
        currentStreak: payload.currentStreak,
      },
    },
    {
      new: true,
      runValidators: true,
    }
  ).lean();
}

async function addBadgeToUser(userId, badge) {
  return User.findOneAndUpdate(
    {
      _id: userId,
      "badges.badgeId": { $ne: badge.badgeId },
    },
    {
      $push: {
        badges: {
          badgeId: badge.badgeId,
          nombre: badge.nombre,
          awardedAt: badge.awardedAt,
        },
      },
    },
    {
      new: true,
      runValidators: true,
    }
  ).lean();
}

module.exports = {
  findByEmailLean,
  createUser,
  findByEmailWithPassword,
  findByIdLean,
  incrementUserPoints,
  updateActivityAndStreak,
  addBadgeToUser,
};
