const supervisorService = require("../services/supervisorService");

async function getTeacherInsights(req, res, next) {
  try {
    const result = await supervisorService.getTeacherInsights();

    return res.status(result.statusCode).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    return next(error);
  }
}

async function getDifficultLessons(req, res, next) {
  try {
    const result = await supervisorService.getDifficultLessons();

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
  getTeacherInsights,
  getDifficultLessons,
};
