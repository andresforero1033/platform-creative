const Notification = require("../models/Notification");

async function createNotification(payload) {
  return Notification.create(payload);
}

async function findByUserIdLean(userId) {
  return Notification.find({ userId })
    .sort({ createdAt: -1 })
    .lean();
}

module.exports = {
  createNotification,
  findByUserIdLean,
};
