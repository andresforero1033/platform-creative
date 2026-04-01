const mongoose = require("mongoose");
const AppError = require("../utils/appError");
const subjectRepository = require("../repositories/subjectRepository");
const progressRepository = require("../repositories/progressRepository");
const userRepository = require("../repositories/userRepository");
const notificationRepository = require("../repositories/notificationRepository");
const badgeService = require("./badgeService");
const { logger } = require("../config/logger");

const STREAK_BONUS_INTERVAL = 7;
const STREAK_BONUS_POINTS = 20;

function isSameDay(dateA, dateB) {
  return (
    dateA.getUTCFullYear() === dateB.getUTCFullYear()
    && dateA.getUTCMonth() === dateB.getUTCMonth()
    && dateA.getUTCDate() === dateB.getUTCDate()
  );
}

function wasYesterday(lastActivity, now) {
  const yesterday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1));

  return (
    lastActivity.getUTCFullYear() === yesterday.getUTCFullYear()
    && lastActivity.getUTCMonth() === yesterday.getUTCMonth()
    && lastActivity.getUTCDate() === yesterday.getUTCDate()
  );
}

function calculateStreakOutcome(lastActivityRaw, currentStreak, now = new Date()) {
  const safeCurrentStreak = Number.isFinite(currentStreak) ? currentStreak : 0;
  const lastActivity = lastActivityRaw ? new Date(lastActivityRaw) : null;

  if (!lastActivity || Number.isNaN(lastActivity.getTime())) {
    return { newStreak: 1, shouldAwardStreakBonus: false };
  }

  if (isSameDay(lastActivity, now)) {
    return {
      newStreak: safeCurrentStreak,
      shouldAwardStreakBonus: false,
    };
  }

  if (wasYesterday(lastActivity, now)) {
    const newStreak = Math.max(1, safeCurrentStreak + 1);
    const shouldAwardStreakBonus = newStreak % STREAK_BONUS_INTERVAL === 0;

    return {
      newStreak,
      shouldAwardStreakBonus,
    };
  }

  const elapsedMs = now.getTime() - lastActivity.getTime();
  if (elapsedMs > 48 * 60 * 60 * 1000) {
    return { newStreak: 1, shouldAwardStreakBonus: false };
  }

  return { newStreak: 1, shouldAwardStreakBonus: false };
}

async function processSubjectBadgeTrigger(userId, subject) {
  const totalLessons = subject.lessons.length;
  if (totalLessons === 0) {
    return null;
  }

  const completedLessons = await progressRepository.countCompletedLessonsBySubject(userId, subject._id);

  if (completedLessons !== totalLessons) {
    return null;
  }

  return badgeService.awardSubjectMasterBadge(userId, subject);
}

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
    const user = await userRepository.findByIdLean(userId);
    if (!user) {
      throw new AppError("Usuario no encontrado.", 404);
    }

    const { newStreak, shouldAwardStreakBonus } = calculateStreakOutcome(user.lastActivity, user.currentStreak);
    const awardedPoints = 10 + (shouldAwardStreakBonus ? STREAK_BONUS_POINTS : 0);

    await userRepository.incrementUserPoints(userId, awardedPoints);
    await userRepository.updateActivityAndStreak(userId, {
      lastActivity: new Date(),
      currentStreak: newStreak,
    });

    await notificationRepository.createNotification({
      userId,
      type: "achievement",
      title: "Nueva leccion completada",
      message: shouldAwardStreakBonus
        ? `Ganaste ${awardedPoints} puntos (incluye bono de racha).`
        : "Ganaste 10 puntos por completar una leccion.",
      metadata: {
        subjectId,
        lessonId,
        awardedPoints,
        currentStreak: newStreak,
        streakBonusApplied: shouldAwardStreakBonus,
      },
    });

    const badgeResult = await processSubjectBadgeTrigger(userId, subject);
    if (badgeResult?.awarded) {
      logger.info({
        event: "subject_master_badge_awarded",
        userId,
        subjectId,
        badgeName: badgeResult.badge.nombre,
      });
    }

    return {
      statusCode: 200,
      message: shouldAwardStreakBonus
        ? `Leccion marcada como completada. +${awardedPoints} puntos otorgados (incluye bono por racha).`
        : "Leccion marcada como completada. +10 puntos otorgados.",
      data: progress,
    };
  }

  return {
    statusCode: 200,
    message: "Leccion marcada como completada.",
    data: progress,
  };
}

module.exports = {
  completeLesson,
  calculateStreakOutcome,
};
