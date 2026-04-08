const Notification = require("../models/Notification");

async function createNotification(payload) {
  return Notification.create(payload);
}

async function createManyNotifications(payloads) {
  if (!Array.isArray(payloads) || payloads.length === 0) {
    return [];
  }

  return Notification.insertMany(payloads, { ordered: false });
}

async function findByUserIdLean(userId) {
  return Notification.find({ userId })
    .sort({ createdAt: -1 })
    .lean();
}

async function markNotificationAsReadByIdLean(userId, notificationId) {
  return Notification.findOneAndUpdate(
    {
      _id: notificationId,
      userId,
    },
    {
      $set: {
        read: true,
      },
    },
    {
      new: true,
      runValidators: true,
    }
  ).lean();
}

async function markAllNotificationsAsRead(userId) {
  return Notification.updateMany(
    {
      userId,
      read: false,
    },
    {
      $set: {
        read: true,
      },
    }
  );
}

module.exports = {
  createNotification,
  createManyNotifications,
  findByUserIdLean,
  markNotificationAsReadByIdLean,
  markAllNotificationsAsRead,
};
