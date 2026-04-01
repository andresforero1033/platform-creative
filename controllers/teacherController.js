const teacherService = require("../services/teacherService");

async function addLessonToSubject(req, res, next) {
  try {
    const result = await teacherService.addLessonToSubject(req.params.id, req.body, req.user.id);

    return res.status(result.statusCode).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    return next(error);
  }
}

async function updateLesson(req, res, next) {
  try {
    const result = await teacherService.updateLesson(
      req.params.id,
      req.params.lessonId,
      req.body
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

async function deleteLesson(req, res, next) {
  try {
    const result = await teacherService.deleteLesson(req.params.id, req.params.lessonId);

    return res.status(result.statusCode).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    return next(error);
  }
}

async function getMyFeedback(req, res, next) {
  try {
    const result = await teacherService.getMyFeedback(req.user.id);

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
  addLessonToSubject,
  updateLesson,
  deleteLesson,
  getMyFeedback,
};
