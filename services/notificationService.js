const notificationRepository = require("../repositories/notificationRepository");
const progressRepository = require("../repositories/progressRepository");
const userRepository = require("../repositories/userRepository");
const socketService = require("./socketService");

async function createNotification(payload) {
  const notification = await notificationRepository.createNotification(payload);

  socketService.sendToUser(payload.userId, "NEW_NOTIFICATION", {
    id: notification._id,
    userId: notification.userId,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    metadata: notification.metadata,
    createdAt: notification.createdAt,
  });

  return notification;
}

async function sendReviewReminders() {
  const now = new Date();
  const [students, parents] = await Promise.all([
    userRepository.findByRoleLean("student"),
    userRepository.findByRoleLean("parent"),
  ]);

  let remindersSent = 0;

  for (const student of students) {
    const dueReviews = await progressRepository.findDueReviewsByUserLean(student._id, now);

    if (!dueReviews.length) {
      continue;
    }

    for (const parent of parents) {
      await createNotification({
        userId: parent._id,
        type: "system",
        title: "Recordatorio de repaso pendiente",
        message: `El estudiante ${student.name} tiene ${dueReviews.length} lecciones pendientes de repaso hoy.`,
        metadata: {
          studentId: student._id,
          dueReviewCount: dueReviews.length,
          dueReviews: dueReviews.map((item) => ({
            subjectId: item.subjectId,
            lessonId: item.lessonId,
            nextReviewDate: item.nextReviewDate,
            reviewLevel: item.reviewLevel,
          })),
        },
      });

      remindersSent += 1;
    }
  }

  return {
    statusCode: 200,
    message: "Recordatorios de repaso enviados correctamente.",
    data: {
      remindersSent,
      processedAt: now,
    },
  };
}

module.exports = {
  createNotification,
  sendReviewReminders,
};
