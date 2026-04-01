const progressService = require("../services/progressService");

async function completeLesson(req, res, next) {
  try {
    const result = await progressService.completeLesson(req.user.id, req.body);

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
  completeLesson,
};
