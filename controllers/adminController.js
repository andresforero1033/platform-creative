const notificationService = require("../services/notificationService");

async function triggerReminders(req, res, next) {
  try {
    const result = await notificationService.sendReviewReminders();

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
  triggerReminders,
};
