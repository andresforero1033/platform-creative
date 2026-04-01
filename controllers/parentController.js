const parentService = require("../services/parentService");

async function getStudentProgress(req, res, next) {
  try {
    const result = await parentService.getStudentProgress(req.params.studentId);

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
    const result = await parentService.getParentNotifications(req.query.studentId);

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
};
