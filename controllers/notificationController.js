const notificationCenterService = require("../services/notificationCenterService");

async function getMyNotifications(req, res, next) {
  try {
    const result = await notificationCenterService.getMyNotifications(req.user.id);

    return res.status(result.statusCode).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    return next(error);
  }
}

async function markNotificationRead(req, res, next) {
  try {
    const result = await notificationCenterService.markNotificationRead(req.user.id, req.params.id);

    return res.status(result.statusCode).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    return next(error);
  }
}

async function markAllNotificationsRead(req, res, next) {
  try {
    const result = await notificationCenterService.markAllNotificationsRead(req.user.id);

    return res.status(result.statusCode).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};
