const parentService = require("../services/parentService");

async function getStudentProgress(req, res, next) {
  try {
    const result = await parentService.getStudentProgress(
      req.user.id,
      req.params.studentId
    );

    return res.status(result.statusCode).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    return next(error);
  }
}

async function getParentNotifications(req, res, next) {
  try {
    const result = await parentService.getParentNotifications(
      req.user.id,
      req.query.studentId
    );

    return res.status(result.statusCode).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    return next(error);
  }
}

async function getWeeklyReport(req, res, next) {
  try {
    const result = await parentService.getWeeklyReport(req.user.id, req.params.id);

    return res.status(result.statusCode).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    return next(error);
  }
}

async function getParentDashboard(req, res, next) {
  try {
    const result = await parentService.getParentDashboard(req.user.id);

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
  getStudentProgress,
  getParentNotifications,
  getWeeklyReport,
  getParentDashboard,
};
