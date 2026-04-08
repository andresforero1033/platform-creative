const Lead = require("../models/Lead");

async function findByEmailLean(email) {
  return Lead.findOne({ email }).lean();
}

async function createLead(payload) {
  return Lead.create(payload);
}

module.exports = {
  findByEmailLean,
  createLead,
};
