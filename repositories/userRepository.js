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

async function findByRoleLean(role) {
  return User.find({ role }).select("_id name email role").lean();
}

async function findManyByIdsLean(userIds, role) {
  const filter = {
    _id: { $in: userIds },
  };

  if (role) {
    filter.role = role;
  }

  return User.find(filter).lean();
}

async function aggregateUsersByRole() {
  return User.aggregate([
    {
      $group: {
        _id: "$role",
        total: { $sum: 1 },
      },
    },
  ]);
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

async function updateProfileMetadata(userId, profile) {
  return User.findByIdAndUpdate(
    userId,
    {
      $set: {
        "profile.avatar": profile.avatar,
        "profile.experienceLevel": profile.experienceLevel,
        "profile.interests": profile.interests,
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
  findByRoleLean,
  findManyByIdsLean,
  aggregateUsersByRole,
  incrementUserPoints,
  updateActivityAndStreak,
  addBadgeToUser,
  updateProfileMetadata,
};
