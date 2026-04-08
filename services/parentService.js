const AppError = require("../utils/appError");
const notificationRepository = require("../repositories/notificationRepository");
const analyticsService = require("./analyticsService");
const userRepository = require("../repositories/userRepository");
const subjectRepository = require("../repositories/subjectRepository");
const progressRepository = require("../repositories/progressRepository");

function extractLinkedChildrenIds(parentUser) {
  const topLevelChildren = Array.isArray(parentUser?.childrenIds)
    ? parentUser.childrenIds
    : [];

  const profileChildren = Array.isArray(parentUser?.profile?.childrenIds)
    ? parentUser.profile.childrenIds
    : [];

  return [...new Set([...topLevelChildren, ...profileChildren].map((id) => String(id)))];
}

function ensureChildIsLinked(linkedChildrenIds, studentId) {
  if (!linkedChildrenIds.length) {
    throw new AppError("Este usuario no tiene hijos vinculados.", 400);
  }

  if (!linkedChildrenIds.includes(String(studentId))) {
    throw new AppError("No autorizado para consultar este estudiante.", 403);
  }
}

function buildLessonInfoMap(subjects) {
  const lessonInfoMap = new Map();

  for (const subject of subjects) {
    for (const lesson of subject.lessons || []) {
      lessonInfoMap.set(`${subject._id}-${lesson._id}`, {
        subjectId: subject._id,
        subjectName: subject.name,
        lessonId: lesson._id,
        lessonTitle: lesson.title,
      });
    }
  }

  return lessonInfoMap;
}

function buildEmptyDashboardData(message) {
  return {
    statusCode: 200,
    message,
    data: {
      summary: {
        linkedChildren: 0,
        subjectsInProgress: 0,
        completedSubjects: 0,
        averageMastery: 0,
        nextReviewDate: null,
      },
      children: [],
      progressBySubject: [],
      recentBadges: [],
      nextReview: null,
    },
  };
}

async function getStudentProgress(parentId, studentId) {
  if (!studentId) {
    throw new AppError("Debe enviar studentId.", 400);
  }

  const parentUser = await userRepository.findByIdLean(parentId);
  if (!parentUser) {
    throw new AppError("Usuario padre no encontrado.", 404);
  }

  const linkedChildrenIds = extractLinkedChildrenIds(parentUser);
  ensureChildIsLinked(linkedChildrenIds, studentId);

  const summary = await analyticsService.getStudentSummary(studentId);

  return {
    statusCode: 200,
    message: "Progreso del estudiante obtenido correctamente.",
    data: summary.data,
  };
}

async function getParentNotifications(parentId, studentId) {
  const parentUser = await userRepository.findByIdLean(parentId);
  if (!parentUser) {
    throw new AppError("Usuario padre no encontrado.", 404);
  }

  const linkedChildrenIds = extractLinkedChildrenIds(parentUser);
  if (studentId) {
    ensureChildIsLinked(linkedChildrenIds, studentId);
  }

  let notifications = await notificationRepository.findByUserIdLean(parentId);

  if (studentId) {
    notifications = notifications.filter(
      (notification) => String(notification?.metadata?.studentId) === String(studentId)
    );
  }

  return {
    statusCode: 200,
    message: "Notificaciones obtenidas correctamente.",
    data: notifications,
  };
}

async function getWeeklyReport(parentId, studentId) {
  if (!studentId) {
    throw new AppError("Debe enviar studentId.", 400);
  }

  const parentUser = await userRepository.findByIdLean(parentId);
  if (!parentUser) {
    throw new AppError("Usuario padre no encontrado.", 404);
  }

  const linkedChildrenIds = extractLinkedChildrenIds(parentUser);
  ensureChildIsLinked(linkedChildrenIds, studentId);

  return analyticsService.getWeeklyComparison(studentId);
}

async function getParentDashboard(parentId) {
  const parentUser = await userRepository.findByIdLean(parentId);
  if (!parentUser) {
    throw new AppError("Usuario padre no encontrado.", 404);
  }

  const linkedChildrenIds = extractLinkedChildrenIds(parentUser);
  if (!linkedChildrenIds.length) {
    return buildEmptyDashboardData("No hay hijos vinculados a este padre.");
  }

  const students = await userRepository.findManyByIdsLean(linkedChildrenIds, "student");
  if (!students.length) {
    return buildEmptyDashboardData("No se encontraron estudiantes vinculados.");
  }

  const studentIds = students.map((student) => student._id);

  const [subjects, progressRows] = await Promise.all([
    subjectRepository.findAllWithLessonsLean(),
    progressRepository.findManyLean({
      userId: { $in: studentIds },
    }),
  ]);

  const subjectsWithLessons = subjects.filter((subject) => (subject.lessons || []).length > 0);
  const rowsByStudentSubject = new Map();

  for (const row of progressRows) {
    const key = `${row.userId}-${row.subjectId}`;
    if (!rowsByStudentSubject.has(key)) {
      rowsByStudentSubject.set(key, []);
    }
    rowsByStudentSubject.get(key).push(row);
  }

  const progressBySubjectAccumulator = new Map();
  const subjectsInProgress = new Set();
  const completedSubjects = new Set();
  let masteryAccumulator = 0;
  let masterySamples = 0;

  for (const subject of subjectsWithLessons) {
    const subjectId = String(subject._id);
    const totalLessons = subject.lessons.length;

    let trackedChildren = 0;
    let masterySum = 0;

    for (const student of students) {
      const studentId = String(student._id);
      const rows = rowsByStudentSubject.get(`${studentId}-${subjectId}`) || [];
      if (!rows.length) {
        continue;
      }

      const masteredLessons = rows.filter((item) => item.mastered).length;
      const mastery = Math.round((Math.min(masteredLessons, totalLessons) / totalLessons) * 100);

      trackedChildren += 1;
      masterySum += mastery;
      masteryAccumulator += mastery;
      masterySamples += 1;

      if (mastery >= 100) {
        completedSubjects.add(subjectId);
      } else {
        subjectsInProgress.add(subjectId);
      }
    }

    if (trackedChildren > 0) {
      progressBySubjectAccumulator.set(subjectId, {
        subjectId,
        subjectName: subject.name,
        trackedChildren,
        totalLessons,
        averageMastery: Math.round(masterySum / trackedChildren),
      });
    }
  }

  const lessonInfoMap = buildLessonInfoMap(subjects);
  const studentMap = new Map(students.map((student) => [String(student._id), student]));

  const nextReviewRow = progressRows
    .filter((row) => row.nextReviewDate)
    .sort((a, b) => new Date(a.nextReviewDate) - new Date(b.nextReviewDate))[0] || null;

  let nextReview = null;
  if (nextReviewRow) {
    const student = studentMap.get(String(nextReviewRow.userId));
    const lessonInfo = lessonInfoMap.get(`${nextReviewRow.subjectId}-${nextReviewRow.lessonId}`);

    nextReview = {
      studentId: nextReviewRow.userId,
      studentName: student?.name || "Estudiante",
      subjectId: lessonInfo?.subjectId || nextReviewRow.subjectId,
      subjectName: lessonInfo?.subjectName || "Materia",
      lessonId: lessonInfo?.lessonId || nextReviewRow.lessonId,
      lessonTitle: lessonInfo?.lessonTitle || "Leccion",
      reviewLevel: nextReviewRow.reviewLevel,
      nextReviewDate: nextReviewRow.nextReviewDate,
    };
  }

  const recentBadges = students
    .flatMap((student) => (student.badges || []).map((badge) => ({
      studentId: student._id,
      studentName: student.name,
      badgeId: badge.badgeId,
      nombre: badge.nombre,
      awardedAt: badge.awardedAt,
    })))
    .sort((a, b) => new Date(b.awardedAt || 0) - new Date(a.awardedAt || 0))
    .slice(0, 8);

  return {
    statusCode: 200,
    message: "Dashboard parental generado correctamente.",
    data: {
      summary: {
        linkedChildren: students.length,
        subjectsInProgress: subjectsInProgress.size,
        completedSubjects: completedSubjects.size,
        averageMastery: masterySamples ? Math.round(masteryAccumulator / masterySamples) : 0,
        nextReviewDate: nextReview?.nextReviewDate || null,
      },
      children: students.map((student) => ({
        id: student._id,
        name: student.name,
        points: student.points || 0,
        currentStreak: student.currentStreak || 0,
      })),
      progressBySubject: Array.from(progressBySubjectAccumulator.values()).sort(
        (a, b) => a.averageMastery - b.averageMastery
      ),
      recentBadges,
      nextReview,
    },
  };
}

module.exports = {
  getStudentProgress,
  getParentNotifications,
  getWeeklyReport,
  getParentDashboard,
};
