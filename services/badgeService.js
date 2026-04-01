const badgeRepository = require("../repositories/badgeRepository");
const userRepository = require("../repositories/userRepository");
const notificationRepository = require("../repositories/notificationRepository");
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

  await notificationRepository.createNotification({
    userId: studentId,
    type: "achievement",
    title: `Logro desbloqueado: ${badge.nombre}`,
    message: `Notificacion para padre/madre: el estudiante obtuvo la medalla ${badge.nombre}.`,
    metadata: {
      badgeId: badge._id,
      subjectId: subject._id,
      subjectName: subject.name,
    },
  });

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

  await notificationRepository.createNotification({
    userId: studentId,
    type: "achievement",
    title: `Logro desbloqueado: ${badge.nombre}`,
    message: `Notificacion para padre/madre: el estudiante obtuvo la medalla especial ${badge.nombre}.`,
    metadata: {
      badgeId: badge._id,
      subjectId: subject._id,
      subjectName: subject.name,
      tier: "grand_master",
    },
  });

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
