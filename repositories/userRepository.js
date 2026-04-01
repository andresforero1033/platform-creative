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

module.exports = {
  findByEmailLean,
  createUser,
  findByEmailWithPassword,
  findByIdLean,
  incrementUserPoints,
};
