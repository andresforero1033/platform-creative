const classroomService = require("../services/classroomService");

async function createClassroom(req, res, next) {
  try {
    const result = await classroomService.createClassroom(req.user, req.body);

    return res.status(result.statusCode).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    return next(error);
  }
}

async function listTeacherClassrooms(req, res, next) {
  try {
    const result = await classroomService.listTeacherClassrooms(req.user);

    return res.status(result.statusCode).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    return next(error);
  }
}

async function enrollStudentByClassCode(req, res, next) {
  try {
    const result = await classroomService.enrollStudentByClassCode(req.user, req.body);

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
  createClassroom,
  listTeacherClassrooms,
  enrollStudentByClassCode,
};
