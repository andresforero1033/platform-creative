const AppError = require("../utils/appError");
const notificationRepository = require("../repositories/notificationRepository");

async function getStudentProgress(studentId) {
  return {
    statusCode: 200,
    message: `Consultando progreso del estudiante ${studentId}`,
    data: {
      studentId,
    },
  };
}

async function getParentNotifications(studentId) {
  if (!studentId) {
    throw new AppError("Debe enviar studentId como query param.", 400);
  }

  const notifications = await notificationRepository.findByUserIdLean(studentId);

  return {
    statusCode: 200,
    message: "Notificaciones obtenidas correctamente.",
    data: notifications,
  };
}

module.exports = {
  getStudentProgress,
  getParentNotifications,
};
