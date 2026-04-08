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

async function submitQuiz(req, res, next) {
  try {
    const result = await progressService.submitQuiz(req.user.id, {
      subjectId: req.params.subjectId,
      lessonId: req.params.lessonId,
      answers: req.body.answers,
    });

    return res.status(result.statusCode).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    return next(error);
  }
}

async function getLessonQuiz(req, res, next) {
  try {
    const result = await progressService.getLessonQuiz(req.user.id, {
      subjectId: req.params.subjectId,
      lessonId: req.params.lessonId,
    });

    return res.status(result.statusCode).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    return next(error);
  }
}

async function getReviewRecommendations(req, res, next) {
  try {
    const result = await progressService.getReviewRecommendations(req.user.id);

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
  getLessonQuiz,
  submitQuiz,
  getReviewRecommendations,
};
