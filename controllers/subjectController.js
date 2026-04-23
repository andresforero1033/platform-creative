const subjectService = require("../services/subjectService");
const certificateService = require("../services/certificateService");

async function getSubjects(req, res, next) {
  try {
    const result = await subjectService.getSubjects(req.query.search, req.user);

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    return next(error);
  }
}

async function getSubjectById(req, res, next) {
  try {
    const result = await subjectService.getSubjectById(req.params.id, req.user);

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    return next(error);
  }
}

async function getSubjectLesson(req, res, next) {
  try {
    const result = await subjectService.getSubjectLesson(
      req.params.subjectId,
      req.params.lessonId,
      req.user
    );

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    return next(error);
  }
}

async function getSubjectCertificate(req, res, next) {
  try {
    const result = await certificateService.generateSubjectCertificate(req.user.id, req.params.id);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${result.fileName}"`);

    return res.status(result.statusCode).send(result.buffer);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getSubjects,
  getSubjectById,
  getSubjectLesson,
  getSubjectCertificate,
};
