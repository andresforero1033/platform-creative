const mongoose = require("mongoose");
const AppError = require("../utils/appError");
const subjectRepository = require("../repositories/subjectRepository");
const progressRepository = require("../repositories/progressRepository");
const userRepository = require("../repositories/userRepository");
const notificationRepository = require("../repositories/notificationRepository");
const quizRepository = require("../repositories/quizRepository");
const questionRepository = require("../repositories/questionRepository");
const badgeService = require("./badgeService");
const classroomService = require("./classroomService");
const { logger } = require("../config/logger");

const STREAK_BONUS_INTERVAL = 7;
const STREAK_BONUS_POINTS = 20;
const REVIEW_FAIL_DAYS = 2;
const REVIEW_PASS_DAYS = 7;

function extractUserId(authUser) {
  if (!authUser) {
    return null;
  }

  if (typeof authUser === "string") {
    return authUser;
  }

  return authUser.id || authUser._id || null;
}

function isStudentUserContext(authUser) {
  return !!authUser && typeof authUser === "object" && authUser.role === "student";
}

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

async function processSubjectMasteryBadgeTrigger(userId, subject) {
  const totalLessons = subject.lessons.length;
  if (totalLessons === 0) {
    return null;
  }

  const masteredLessons = await progressRepository.countMasteredLessonsBySubject(userId, subject._id);

  if (masteredLessons !== totalLessons) {
    return null;
  }

  return badgeService.awardSubjectMasterBadge(userId, subject);
}

function sanitizeQuizQuestions(questions, questionIds) {
  const questionMap = new Map(questions.map((question) => [String(question._id), question]));

  return questionIds
    .map((questionId) => questionMap.get(String(questionId)))
    .filter(Boolean)
    .map((question) => ({
      id: question._id,
      prompt: question.prompt,
      options: question.options,
      explanation: question.explanation,
    }));
}

async function getLessonQuiz(authUser, payload) {
  const userId = extractUserId(authUser);
  const { subjectId, lessonId } = payload;

  if (!userId) {
    throw new AppError("Usuario no valido.", 401);
  }

  if (!subjectId || !lessonId) {
    throw new AppError("subjectId y lessonId son obligatorios.", 400);
  }

  if (!mongoose.Types.ObjectId.isValid(subjectId) || !mongoose.Types.ObjectId.isValid(lessonId)) {
    throw new AppError("subjectId o lessonId tiene formato invalido.", 400);
  }

  if (isStudentUserContext(authUser)) {
    await classroomService.ensureStudentEnrollmentForSubject(authUser, subjectId);
  }

  const subject = await subjectRepository.findByIdWithLessonsLean(subjectId);

  if (!subject) {
    throw new AppError("Materia no encontrada.", 404);
  }

  const lesson = subject.lessons.find((item) => String(item._id) === String(lessonId));
  if (!lesson) {
    throw new AppError("Leccion no encontrada en la materia indicada.", 404);
  }

  const quiz = await quizRepository.findBySubjectAndLessonLean(subjectId, lessonId);
  if (!quiz) {
    throw new AppError("Quiz no disponible para esta leccion.", 404);
  }

  const questions = await questionRepository.findByIdsLean(quiz.questionIds);
  if (!questions.length) {
    throw new AppError("El quiz no tiene preguntas configuradas.", 400);
  }

  const progress = await progressRepository.findOneLean({
    userId,
    subjectId,
    lessonId,
  });

  return {
    statusCode: 200,
    message: "Quiz de leccion obtenido correctamente.",
    data: {
      subjectId,
      lessonId,
      title: quiz.title,
      passingScore: quiz.passingScore,
      alreadyMastered: !!progress?.mastered,
      questions: sanitizeQuizQuestions(questions, quiz.questionIds),
    },
  };
}

async function completeLesson(authUser, payload) {
  const userId = extractUserId(authUser);
  const { subjectId, lessonId } = payload;

  if (!userId) {
    throw new AppError("Usuario no valido.", 401);
  }

  if (!subjectId || !lessonId) {
    throw new AppError("subjectId y lessonId son obligatorios.", 400);
  }

  if (!mongoose.Types.ObjectId.isValid(subjectId) || !mongoose.Types.ObjectId.isValid(lessonId)) {
    throw new AppError("subjectId o lessonId tiene formato invalido.", 400);
  }

  if (isStudentUserContext(authUser)) {
    await classroomService.ensureStudentEnrollmentForSubject(authUser, subjectId);
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

function normalizeAnswers(answers) {
  const answerMap = new Map();

  for (const answer of answers) {
    if (!answer?.questionId || !Number.isInteger(answer.selectedOption)) {
      continue;
    }

    answerMap.set(String(answer.questionId), answer.selectedOption);
  }

  return answerMap;
}

async function submitQuiz(authUser, payload) {
  const userId = extractUserId(authUser);
  const { subjectId, lessonId, answers } = payload;

  if (!userId) {
    throw new AppError("Usuario no valido.", 401);
  }

  if (!subjectId || !lessonId || !Array.isArray(answers)) {
    throw new AppError("subjectId, lessonId y answers son obligatorios.", 400);
  }

  if (!mongoose.Types.ObjectId.isValid(subjectId) || !mongoose.Types.ObjectId.isValid(lessonId)) {
    throw new AppError("subjectId o lessonId tiene formato invalido.", 400);
  }

  if (isStudentUserContext(authUser)) {
    await classroomService.ensureStudentEnrollmentForSubject(authUser, subjectId);
  }

  const subject = await subjectRepository.findByIdWithLessonsLean(subjectId);
  if (!subject) {
    throw new AppError("Materia no encontrada.", 404);
  }

  const lessonExists = subject.lessons.some((lesson) => String(lesson._id) === String(lessonId));
  if (!lessonExists) {
    throw new AppError("Leccion no encontrada en la materia indicada.", 404);
  }

  const quiz = await quizRepository.findBySubjectAndLessonLean(subjectId, lessonId);
  if (!quiz) {
    throw new AppError("Quiz no encontrado para la leccion indicada.", 404);
  }

  const questions = await questionRepository.findByIdsLean(quiz.questionIds);
  if (!questions.length) {
    throw new AppError("El quiz no tiene preguntas configuradas.", 400);
  }

  const answerMap = normalizeAnswers(answers);
  let correctAnswers = 0;

  for (const question of questions) {
    const selectedOption = answerMap.get(String(question._id));
    if (selectedOption === question.correctOption) {
      correctAnswers += 1;
    }
  }

  const score = Math.round((correctAnswers / questions.length) * 100);
  const passingScore = Number.isFinite(quiz.passingScore) ? quiz.passingScore : 70;
  const passed = score > passingScore;
  const previousProgress = await progressRepository.findOneLean({ userId, subjectId, lessonId });
  const now = new Date();

  let nextReviewDate = previousProgress?.nextReviewDate || null;
  let reviewLevel = previousProgress?.reviewLevel || 0;

  if (!passed) {
    nextReviewDate = new Date(now.getTime() + (REVIEW_FAIL_DAYS * 24 * 60 * 60 * 1000));
    reviewLevel = Math.max(1, reviewLevel);
  } else {
    const wasReview = !!previousProgress?.nextReviewDate || (previousProgress?.reviewLevel || 0) > 0;
    if (wasReview) {
      reviewLevel += 1;
      nextReviewDate = new Date(now.getTime() + (REVIEW_PASS_DAYS * 24 * 60 * 60 * 1000));
    } else {
      nextReviewDate = null;
      reviewLevel = 0;
    }
  }

  const progress = await progressRepository.saveQuizOutcome(userId, subjectId, lessonId, {
    score,
    passed,
    completed: passed,
    mastered: passed,
    nextReviewDate,
    reviewLevel,
  });

  const lesson = subject.lessons.find((item) => String(item._id) === String(lessonId));

  let earnedBadge = null;
  if (passed) {
    const badgeResult = await processSubjectMasteryBadgeTrigger(userId, subject);

    if (badgeResult?.awarded && badgeResult.badge) {
      earnedBadge = {
        badgeId: badgeResult.badge._id,
        nombre: badgeResult.badge.nombre,
        tier: "subject_master",
      };
    } else {
      earnedBadge = {
        badgeId: null,
        nombre: `Dominio de ${lesson?.title || "Leccion"}`,
        tier: "lesson_mastery",
      };
    }
  }

  logger.info({
    event: "quiz_submitted",
    userId,
    subjectId,
    lessonId,
    score,
    passed,
    mastered: passed,
  });

  return {
    statusCode: 200,
    message: passed
      ? "Quiz aprobado. Leccion marcada como Dominada (Mastered)."
      : "Quiz reprobado. Debes superar 70 para dominar la leccion.",
    data: {
      score,
      passed,
      mastered: passed,
      totalQuestions: questions.length,
      correctAnswers,
      nextReviewDate,
      reviewLevel,
      earnedBadge,
      progress,
    },
  };
}

async function getReviewRecommendations(authUser) {
  const userId = extractUserId(authUser);
  if (!userId) {
    throw new AppError("Usuario no valido.", 401);
  }

  const dueProgressItems = await progressRepository.findDueReviewsByUserLean(userId, new Date());
  if (!dueProgressItems.length) {
    return {
      statusCode: 200,
      message: "No hay recomendaciones de repaso para hoy.",
      data: [],
    };
  }

  const subjects = await subjectRepository.findAllWithLessonsLean();
  const lessonsByKey = new Map();

  for (const subject of subjects) {
    for (const lesson of subject.lessons) {
      lessonsByKey.set(`${subject._id}-${lesson._id}`, {
        subjectId: subject._id,
        subjectName: subject.name,
        lessonId: lesson._id,
        lessonTitle: lesson.title,
      });
    }
  }

  const recommendations = dueProgressItems
    .map((item) => {
      const key = `${item.subjectId}-${item.lessonId}`;
      const lessonInfo = lessonsByKey.get(key);
      if (!lessonInfo) {
        return null;
      }

      return {
        subjectId: lessonInfo.subjectId,
        subjectName: lessonInfo.subjectName,
        lessonId: lessonInfo.lessonId,
        lessonTitle: lessonInfo.lessonTitle,
        reviewLevel: item.reviewLevel,
        nextReviewDate: item.nextReviewDate,
      };
    })
    .filter(Boolean);

  return {
    statusCode: 200,
    message: "Recomendaciones de repaso generadas correctamente.",
    data: recommendations,
  };
}

module.exports = {
  completeLesson,
  getLessonQuiz,
  calculateStreakOutcome,
  submitQuiz,
  getReviewRecommendations,
};
