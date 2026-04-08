const notificationRepository = require("../repositories/notificationRepository");
const progressRepository = require("../repositories/progressRepository");
const userRepository = require("../repositories/userRepository");
const socketService = require("./socketService");
const AppError = require("../utils/appError");

function toRealtimePayload(notification) {
  return {
    id: notification._id,
    userId: notification.userId,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    metadata: notification.metadata,
    read: notification.read,
    createdAt: notification.createdAt,
  };
}

function resolveRealtimeEvents(notification) {
  const events = ["NEW_NOTIFICATION"];
  const metadataEvent = notification?.metadata?.eventName;

  if (metadataEvent) {
    events.push(metadataEvent);
  } else if (notification?.type === "achievement") {
    events.push("badge_earned");
  }

  return [...new Set(events.filter(Boolean))];
}

function emitNotificationToUser(userId, notification) {
  const payload = toRealtimePayload(notification);
  const events = resolveRealtimeEvents(notification);

  for (const eventName of events) {
    socketService.sendToUser(userId, eventName, payload);
  }
}

async function createNotification(payload) {
  const notification = await notificationRepository.createNotification(payload);

  emitNotificationToUser(payload.userId, notification);

  return notification;
}

async function sendGlobalMessage({ senderId, title, message, targetRole }) {
  const normalizedTitle = (title || "Mensaje global").trim();
  const normalizedMessage = (message || "").trim();

  if (normalizedMessage.length < 5) {
    throw new AppError("message es obligatorio y debe tener al menos 5 caracteres.", 400);
  }

  const recipients = targetRole
    ? await userRepository.findByRoleLean(targetRole)
    : await userRepository.findAllLean();

  if (!recipients.length) {
    return {
      statusCode: 200,
      message: "No hay destinatarios disponibles para el mensaje global.",
      data: {
        recipients: 0,
        processedAt: new Date(),
      },
    };
  }

  const now = new Date();
  const payloads = recipients.map((recipient) => ({
    userId: recipient._id,
    type: "system",
    title: normalizedTitle,
    message: normalizedMessage,
    metadata: {
      eventName: "global_message",
      redirectPath: "/profile",
      senderId,
      targetRole: targetRole || "all",
    },
    read: false,
    createdAt: now,
    updatedAt: now,
  }));

  const notifications = await notificationRepository.createManyNotifications(payloads);

  for (const notification of notifications) {
    emitNotificationToUser(notification.userId, notification);
  }

  return {
    statusCode: 200,
    message: "Mensaje global enviado correctamente.",
    data: {
      recipients: notifications.length,
      processedAt: now,
    },
  };
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
          eventName: "review_reminder",
          redirectPath: "/dashboard/parent",
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
  sendGlobalMessage,
  sendReviewReminders,
};
