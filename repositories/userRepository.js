const User = require("../models/User");

function normalizeDni(dni) {
  return (dni || "").trim().toUpperCase();
}

function normalizeInstitutionAdminReference(institutionAdminReference) {
  return (institutionAdminReference || "").trim().toLowerCase();
}

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

async function findByRoleLean(role, institutionId = null) {
  const filter = { role };

  if (institutionId) {
    filter.institutionId = institutionId;
  }

  return User.find(filter)
    .select("_id name email role institutionId institutionAdminReference isInstitutionValidated dni")
    .lean();
}

async function findAllLean(institutionId = null) {
  const filter = {};

  if (institutionId) {
    filter.institutionId = institutionId;
  }

  return User.find(filter)
    .select("_id name email role institutionId institutionAdminReference isInstitutionValidated dni")
    .lean();
}

async function findByInstitutionReferenceLean(institutionAdminReference, role = null) {
  const normalizedReference = normalizeInstitutionAdminReference(institutionAdminReference);
  if (!normalizedReference) {
    return [];
  }

  const filter = {
    institutionAdminReference: normalizedReference,
  };

  if (role) {
    filter.role = role;
  }

  return User.find(filter)
    .select("_id name email role institutionId institutionAdminReference isInstitutionValidated dni createdAt")
    .sort({ createdAt: -1 })
    .lean();
}

async function findParentsByChildIdLean(childId) {
  return User.find({
    role: "parent",
    $or: [
      { childrenIds: childId },
      { "profile.childrenIds": childId },
    ],
  }).select("_id name email role").lean();
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

async function findByDniAndInstitutionLean(dni, institutionId, role = null) {
  const normalizedDni = normalizeDni(dni);
  if (!normalizedDni || !institutionId) {
    return null;
  }

  const filter = {
    dni: normalizedDni,
    institutionId,
  };

  if (role) {
    filter.role = role;
  }

  return User.findOne(filter).lean();
}

async function addChildToParent(parentId, childId) {
  return User.findByIdAndUpdate(
    parentId,
    {
      $addToSet: {
        childrenIds: childId,
      },
    },
    {
      new: true,
      runValidators: true,
    }
  ).lean();
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

async function updateInstitutionValidationStatus(userId, isInstitutionValidated) {
  return User.findByIdAndUpdate(
    userId,
    {
      $set: {
        isInstitutionValidated: !!isInstitutionValidated,
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
  findAllLean,
  findByInstitutionReferenceLean,
  findParentsByChildIdLean,
  findManyByIdsLean,
  findByDniAndInstitutionLean,
  addChildToParent,
  aggregateUsersByRole,
  incrementUserPoints,
  updateActivityAndStreak,
  addBadgeToUser,
  updateProfileMetadata,
  updateInstitutionValidationStatus,
};
