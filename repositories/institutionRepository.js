const Institution = require("../models/Institution");

function normalizeAdminUsername(adminUsername) {
  return (adminUsername || "").trim().toLowerCase();
}

async function findByAdminUsernameLean(adminUsername) {
  const normalizedAdminUsername = normalizeAdminUsername(adminUsername);
  if (!normalizedAdminUsername) {
    return null;
  }

  return Institution.findOne({ adminUsername: normalizedAdminUsername }).lean();
}

async function findByIdLean(institutionId) {
  if (!institutionId) {
    return null;
  }

  return Institution.findById(institutionId).lean();
}

async function createInstitution(payload) {
  const normalizedAdminUsername = normalizeAdminUsername(payload.adminUsername);

  return Institution.create({
    name: payload.name,
    adminUsername: normalizedAdminUsername,
    legalId: payload.legalId,
    licenseStatus: payload.licenseStatus || "active",
    isActive: payload.isActive !== false,
  });
}

async function upsertByAdminUsername(payload) {
  const normalizedAdminUsername = normalizeAdminUsername(payload.adminUsername);

  return Institution.findOneAndUpdate(
    { adminUsername: normalizedAdminUsername },
    {
      $set: {
        name: payload.name,
        legalId: payload.legalId,
        licenseStatus: payload.licenseStatus || "active",
        isActive: payload.isActive !== false,
      },
      $setOnInsert: {
        adminUsername: normalizedAdminUsername,
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
  normalizeAdminUsername,
  findByAdminUsernameLean,
  findByIdLean,
  createInstitution,
  upsertByAdminUsername,
};
