const mongoose = require("mongoose");
const AppError = require("../utils/appError");
const notificationRepository = require("../repositories/notificationRepository");

async function getMyNotifications(userId) {
  const notifications = await notificationRepository.findByUserIdLean(userId);
  const unreadCount = notifications.filter((item) => !item.read).length;

  return {
    statusCode: 200,
    message: "Notificaciones obtenidas correctamente.",
    data: {
      unreadCount,
      notifications,
    },
  };
}

async function markNotificationRead(userId, notificationId) {
  if (!mongoose.Types.ObjectId.isValid(notificationId)) {
    throw new AppError("notificationId invalido.", 400);
  }

  const notification = await notificationRepository.markNotificationAsReadByIdLean(userId, notificationId);
  if (!notification) {
    throw new AppError("Notificacion no encontrada.", 404);
  }

  return {
    statusCode: 200,
    message: "Notificacion marcada como leida.",
    data: notification,
  };
}

async function markAllNotificationsRead(userId) {
  const updateResult = await notificationRepository.markAllNotificationsAsRead(userId);

  return {
    statusCode: 200,
    message: "Notificaciones marcadas como leidas.",
    data: {
      modifiedCount: updateResult.modifiedCount || 0,
    },
  };
}

module.exports = {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};
