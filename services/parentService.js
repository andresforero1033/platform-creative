const AppError = require("../utils/appError");
const notificationRepository = require("../repositories/notificationRepository");
const analyticsService = require("./analyticsService");

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

async function getWeeklyReport(studentId) {
  return analyticsService.getWeeklyComparison(studentId);
}

module.exports = {
  getStudentProgress,
  getParentNotifications,
  getWeeklyReport,
};
