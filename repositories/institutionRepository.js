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
    logoUrl: payload.logoUrl || null,
    primaryColor: payload.primaryColor || null,
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
        logoUrl: payload.logoUrl || null,
        primaryColor: payload.primaryColor || null,
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

async function updateBrandByAdminUsername(adminUsername, brandPayload = {}) {
  const normalizedAdminUsername = normalizeAdminUsername(adminUsername);
  if (!normalizedAdminUsername) return null;

  const set = {};
  if (typeof brandPayload.logoUrl === 'string') set.logoUrl = brandPayload.logoUrl || null;
  if (typeof brandPayload.primaryColor === 'string') set.primaryColor = brandPayload.primaryColor || null;

  if (Object.keys(set).length === 0) return null;

  return Institution.findOneAndUpdate(
    { adminUsername: normalizedAdminUsername },
    { $set: set },
    { new: true, runValidators: true }
  ).lean();
}

module.exports = {
  normalizeAdminUsername,
  findByAdminUsernameLean,
  findByIdLean,
  createInstitution,
  upsertByAdminUsername,
  updateBrandByAdminUsername,
};
