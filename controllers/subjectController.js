const subjectService = require("../services/subjectService");

async function getSubjects(req, res, next) {
  try {
    const result = await subjectService.getSubjects(req.query.search);

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
    const result = await subjectService.getSubjectById(req.params.id);

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getSubjects,
  getSubjectById,
};
