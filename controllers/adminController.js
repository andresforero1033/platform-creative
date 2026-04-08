const adminService = require("../services/adminService");

async function triggerReminders(req, res, next) {
  try {
    const result = await adminService.triggerReminders();

    return res.status(result.statusCode).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    return next(error);
  }
}

async function getUsersByRoleMetrics(req, res, next) {
  try {
    const result = await adminService.getUsersByRoleMetrics();

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
  getUsersByRoleMetrics,
};
