const badgeRepository = require("../repositories/badgeRepository");
const userRepository = require("../repositories/userRepository");
const notificationService = require("./notificationService");
const { logger } = require("../config/logger");

function buildSubjectMasterBadgePayload(subject) {
  return {
    nombre: `Maestro de ${subject.name}`,
    descripcion: `Completaste todas las lecciones de ${subject.name}.`,
    icono: subject.icon,
    requerimiento: `Completar el 100% de las lecciones de ${subject.name}`,
  };
}

function buildGrandMasterBadgePayload(subject) {
  return {
    nombre: `Gran Maestro de ${subject.name}`,
    descripcion: `Aprobaste el Examen de Gran Maestro en ${subject.name}.`,
    icono: subject.icon,
    requerimiento: `Aprobar Examen de Gran Maestro en ${subject.name}`,
  };
}

async function notifyStudentAndParents(studentId, badge, subject, tier) {
  await notificationService.createNotification({
    userId: studentId,
    type: "achievement",
    title: `Logro desbloqueado: ${badge.nombre}`,
    message: `Felicidades, obtuviste la medalla ${badge.nombre}.`,
    metadata: {
      eventName: "badge_earned",
      redirectPath: "/dashboard/student",
      badgeId: badge._id,
      subjectId: subject._id,
      subjectName: subject.name,
      tier,
    },
  });

  const [student, parents] = await Promise.all([
    userRepository.findByIdLean(studentId),
    userRepository.findParentsByChildIdLean(studentId),
  ]);

  if (!parents.length) {
    return;
  }

  const studentName = student?.name || "Tu hijo/a";

  await Promise.all(
    parents.map((parent) => notificationService.createNotification({
      userId: parent._id,
      type: "achievement",
      title: `Logro de ${studentName}: ${badge.nombre}`,
      message: `${studentName} obtuvo una nueva medalla en ${subject.name}.`,
      metadata: {
        eventName: "badge_earned",
        redirectPath: "/dashboard/parent",
        studentId,
        studentName,
        badgeId: badge._id,
        badgeName: badge.nombre,
        subjectId: subject._id,
        subjectName: subject.name,
        tier,
      },
    }))
  );
}

async function awardSubjectMasterBadge(studentId, subject) {
  const badgePayload = buildSubjectMasterBadgePayload(subject);
  const badge = await badgeRepository.upsertByNombre(badgePayload);

  const updatedUser = await userRepository.addBadgeToUser(studentId, {
    badgeId: badge._id,
    nombre: badge.nombre,
    awardedAt: new Date(),
  });

  if (!updatedUser) {
    return { awarded: false, badge: null };
  }

  await notifyStudentAndParents(studentId, badge, subject, "subject_master");

  logger.info({
    event: "badge_awarded",
    studentId,
    badgeId: badge._id,
    badgeName: badge.nombre,
    subjectId: subject._id,
  });

  return {
    awarded: true,
    badge,
  };
}

async function awardGrandMasterBadge(studentId, subject) {
  const badgePayload = buildGrandMasterBadgePayload(subject);
  const badge = await badgeRepository.upsertByNombre(badgePayload);

  const updatedUser = await userRepository.addBadgeToUser(studentId, {
    badgeId: badge._id,
    nombre: badge.nombre,
    awardedAt: new Date(),
  });

  if (!updatedUser) {
    return { awarded: false, badge: null };
  }

  await notifyStudentAndParents(studentId, badge, subject, "grand_master");

  logger.info({
    event: "grand_master_badge_awarded",
    studentId,
    badgeId: badge._id,
    badgeName: badge.nombre,
    subjectId: subject._id,
  });

  return {
    awarded: true,
    badge,
  };
}

module.exports = {
  awardSubjectMasterBadge,
  awardGrandMasterBadge,
};
