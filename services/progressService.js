const mongoose = require("mongoose");
const AppError = require("../utils/appError");
const subjectRepository = require("../repositories/subjectRepository");
const progressRepository = require("../repositories/progressRepository");
const userRepository = require("../repositories/userRepository");
const notificationRepository = require("../repositories/notificationRepository");

async function completeLesson(userId, payload) {
  const { subjectId, lessonId } = payload;

  if (!subjectId || !lessonId) {
    throw new AppError("subjectId y lessonId son obligatorios.", 400);
  }

  if (!mongoose.Types.ObjectId.isValid(subjectId) || !mongoose.Types.ObjectId.isValid(lessonId)) {
    throw new AppError("subjectId o lessonId tiene formato invalido.", 400);
  }

  const subject = await subjectRepository.findByIdWithLessonsLean(subjectId);

  if (!subject) {
    throw new AppError("Materia no encontrada.", 404);
  }

  const lessonExists = subject.lessons.some((lesson) => String(lesson._id) === String(lessonId));
  if (!lessonExists) {
    throw new AppError("Leccion no encontrada en la materia indicada.", 404);
  }

  const existingProgress = await progressRepository.findOneLean({
    userId,
    subjectId,
    lessonId,
  });

  const progress = await progressRepository.upsertCompletedLesson(userId, subjectId, lessonId);

  if (!existingProgress) {
    await userRepository.incrementUserPoints(userId, 10);

    await notificationRepository.createNotification({
      userId,
      type: "achievement",
      title: "Nueva leccion completada",
      message: "Ganaste 10 puntos por completar una leccion.",
      metadata: {
        subjectId,
        lessonId,
        awardedPoints: 10,
      },
    });
  }

  return {
    statusCode: 200,
    message: existingProgress
      ? "Leccion marcada como completada."
      : "Leccion marcada como completada. +10 puntos otorgados.",
    data: progress,
  };
}

module.exports = {
  completeLesson,
};
