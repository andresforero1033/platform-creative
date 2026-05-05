const AppError = require("../utils/appError");
const notificationService = require("./notificationService");
const userRepository = require("../repositories/userRepository");
const institutionRepository = require("../repositories/institutionRepository");
const socketService = require("./socketService");
const Subject = require("../models/Subject");
const Classroom = require("../models/Classroom");

const MANAGED_ROLES = ["student", "teacher", "parent"];

function buildRoleCountMap(aggregateRows) {
  const base = {
    student: 0,
    teacher: 0,
    parent: 0,
    supervisor: 0,
    admin: 0,
  };

  for (const row of aggregateRows) {
    if (!row?._id) {
      continue;
    }

    base[row._id] = row.total || 0;
  }

  return base;
}

async function triggerReminders() {
  return notificationService.sendReviewReminders();
}

async function sendGlobalMessage(adminId, payload) {
  const title = payload?.title;
  const message = payload?.message;
  const targetRole = payload?.targetRole;

  return notificationService.sendGlobalMessage({
    senderId: adminId,
    title,
    message,
    targetRole,
  });
}

async function getUsersByRoleMetrics() {
  const aggregateRows = await userRepository.aggregateUsersByRole();
  const byRole = buildRoleCountMap(aggregateRows);

  const totalUsers = Object.values(byRole).reduce((acc, value) => acc + value, 0);

  return {
    statusCode: 200,
    message: "Metricas de usuarios por rol obtenidas correctamente.",
    data: {
      totalUsers,
      byRole,
      rows: Object.entries(byRole).map(([role, total]) => ({ role, total })),
    },
  };
}

function resolveAdminReference(adminUser) {
  return (adminUser?.institutionAdminReference || "").trim().toLowerCase();
}

function isManagedRole(role) {
  return MANAGED_ROLES.includes(role);
}

async function getInstitutionUsers(adminUser, roleFilter = "all") {
  const adminReference = resolveAdminReference(adminUser);
  if (!adminReference) {
    throw new AppError("El admin no tiene referencia institucional configurada.", 400);
  }

  const normalizedRoleFilter = (roleFilter || "all").trim().toLowerCase();
  const queryRole = isManagedRole(normalizedRoleFilter) ? normalizedRoleFilter : null;

  if (normalizedRoleFilter !== "all" && !queryRole) {
    throw new AppError("Filtro de rol invalido. Usa student, teacher, parent o all.", 400);
  }

  const rawUsers = await userRepository.findByInstitutionReferenceLean(adminReference, queryRole);
  const users = rawUsers.filter((user) => isManagedRole(user.role));

  const byRole = {
    student: users.filter((user) => user.role === "student").length,
    teacher: users.filter((user) => user.role === "teacher").length,
    parent: users.filter((user) => user.role === "parent").length,
  };

  return {
    statusCode: 200,
    message: "Usuarios institucionales obtenidos correctamente.",
    data: {
      institutionAdminReference: adminReference,
      roleFilter: normalizedRoleFilter,
      total: users.length,
      byRole,
      users: users.map((user) => ({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        dni: user.dni || null,
        institutionAdminReference: user.institutionAdminReference || null,
        isInstitutionValidated: user.isInstitutionValidated !== false,
        createdAt: user.createdAt,
      })),
    },
  };
}

async function setInstitutionUserActivation(adminUser, targetUserId, isInstitutionValidated = true) {
  const adminReference = resolveAdminReference(adminUser);
  if (!adminReference) {
    throw new AppError("El admin no tiene referencia institucional configurada.", 400);
  }

  const targetUser = await userRepository.findByIdLean(targetUserId);
  if (!targetUser) {
    throw new AppError("Usuario objetivo no encontrado.", 404);
  }

  const targetReference = resolveAdminReference(targetUser);
  if (targetReference !== adminReference) {
    throw new AppError("No puedes gestionar usuarios de otra institucion.", 403);
  }

  if (!isManagedRole(targetUser.role)) {
    throw new AppError("Solo se puede activar/desactivar estudiantes, docentes y padres.", 400);
  }

  const updatedUser = await userRepository.updateInstitutionValidationStatus(
    targetUserId,
    isInstitutionValidated
  );

  return {
    statusCode: 200,
    message: "Estado de activacion actualizado correctamente.",
    data: {
      user: {
        id: updatedUser._id,
        role: updatedUser.role,
        name: updatedUser.name,
        email: updatedUser.email,
        institutionAdminReference: updatedUser.institutionAdminReference || null,
        isInstitutionValidated: updatedUser.isInstitutionValidated !== false,
      },
    },
  };
}

async function bulkSetInstitutionUserActivation(adminUser, userIds = [], isInstitutionValidated = true) {
  const adminReference = resolveAdminReference(adminUser);
  if (!adminReference) {
    throw new AppError('El admin no tiene referencia institucional configurada.', 400);
  }

  if (!Array.isArray(userIds) || userIds.length === 0) {
    throw new AppError('Se requiere un array de userIds para la operacion en lote.', 400);
  }

  // perform updateMany via repository - repository enforces institution reference + role filter
  const result = await userRepository.updateManyValidationStatusByIdsAndInstitutionReference(
    userIds,
    adminReference,
    isInstitutionValidated
  );

  return {
    statusCode: 200,
    message: 'Operacion masiva completada.',
    data: {
      requested: userIds.length,
      matched: result.matchedCount || 0,
      modified: result.modifiedCount || 0,
      isInstitutionValidated: !!isInstitutionValidated,
    },
  };
}

async function getInstitutionBrand(adminUser) {
  const adminReference = resolveAdminReference(adminUser);
  if (!adminReference) {
    throw new AppError('El admin no tiene referencia institucional configurada.', 400);
  }

  const institution = await institutionRepository.findByAdminUsernameLean(adminReference);
  if (!institution) {
    throw new AppError('Institucion no encontrada.', 404);
  }

  return {
    statusCode: 200,
    message: 'Brand institucional obtenida correctamente.',
    data: {
      logoUrl: institution.logoUrl || null,
      primaryColor: institution.primaryColor || null,
      name: institution.name || null,
      adminUsername: institution.adminUsername || null,
    },
  };
}

async function updateInstitutionBrand(adminUser, brandPayload = {}) {
  const adminReference = resolveAdminReference(adminUser);
  if (!adminReference) {
    throw new AppError('El admin no tiene referencia institucional configurada.', 400);
  }

  const updated = await institutionRepository.updateBrandByAdminUsername(adminReference, brandPayload);
  if (!updated) {
    throw new AppError('No se pudo actualizar la marca institucional.', 400);
  }
  // Notify connected users of this institution via sockets
  const affectedUsers = await userRepository.findByInstitutionReferenceLean(adminReference);
  const payload = {
    logoUrl: updated.logoUrl || null,
    primaryColor: updated.primaryColor || null,
  };

  for (const u of Array.isArray(affectedUsers) ? affectedUsers : []) {
    try {
      socketService.sendToUser(u._id, 'INSTITUTION_BRAND_UPDATED', payload);
    } catch (_e) {
      // ignore socket errors
    }
  }

  return {
    statusCode: 200,
    message: 'Marca institucional actualizada correctamente.',
    data: {
      logoUrl: updated.logoUrl || null,
      primaryColor: updated.primaryColor || null,
      name: updated.name || null,
      adminUsername: updated.adminUsername || null,
    },
  };
}

module.exports = {
  triggerReminders,
  sendGlobalMessage,
  getUsersByRoleMetrics,
  getInstitutionUsers,
  setInstitutionUserActivation,
  bulkSetInstitutionUserActivation,
  getInstitutionBrand,
  updateInstitutionBrand,
  getStaffStats,
};

async function getStaffStats(adminUser, period = 'month') {
  const adminReference = resolveAdminReference(adminUser);
  if (!adminReference) {
    throw new AppError('El admin no tiene referencia institucional configurada.', 400);
  }

  // get teacher list for the institution
  const rawTeachers = await userRepository.findByInstitutionReferenceLean(adminReference, 'teacher');
  const teacherIds = Array.isArray(rawTeachers) ? rawTeachers.map((t) => t._id) : [];

  if (teacherIds.length === 0) {
    return {
      statusCode: 200,
      message: 'Estadisticas de docentes obtenidas correctamente.',
      data: {
        teachers: [],
        lessonsDistributionBySubject: [],
        period: period || 'all',
      },
    };
  }

  // Optionally filter teachers by lastActivity if period==='month'
  let teachersFull = await userRepository.findManyByIdsLean(teacherIds);
  if (period === 'month') {
    const now = new Date();
    const since = new Date(now.getFullYear(), now.getMonth(), 1);
    teachersFull = teachersFull.filter((t) => t.lastActivity && new Date(t.lastActivity) >= since);
  }

  const filteredTeacherIds = teachersFull.map((t) => t._id);

  // lessons count per teacher (lifetime - lessons are embedded and don't have timestamps)
  const lessonsAgg = await Subject.aggregate([
    { $unwind: '$lessons' },
    { $match: { 'lessons.teacherId': { $in: filteredTeacherIds } } },
    { $group: { _id: '$lessons.teacherId', lessonsCount: { $sum: 1 } } },
  ]);

  const lessonsMap = new Map();
  for (const row of lessonsAgg) {
    lessonsMap.set(String(row._id), row.lessonsCount || 0);
  }

  // students per teacher via classrooms
  const studentsAgg = await Classroom.aggregate([
    { $match: { teacherId: { $in: filteredTeacherIds } } },
    { $project: { teacherId: 1, studentsCount: { $size: { $ifNull: ['$studentIds', []] } } } },
    { $group: { _id: '$teacherId', totalStudents: { $sum: '$studentsCount' } } },
  ]);

  const studentsMap = new Map();
  for (const row of studentsAgg) {
    studentsMap.set(String(row._id), row.totalStudents || 0);
  }

  // distribution of lessons by subject for these teachers
  const distAgg = await Subject.aggregate([
    { $unwind: '$lessons' },
    { $match: { 'lessons.teacherId': { $in: filteredTeacherIds } } },
    { $group: { _id: '$_id', name: { $first: '$name' }, color: { $first: '$color' }, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const rows = teachersFull.map((t) => ({
    id: t._id,
    name: t.name,
    email: t.email,
    lastActivity: t.lastActivity || null,
    lessonsCreated: lessonsMap.get(String(t._id)) || 0,
    studentsEnrolled: studentsMap.get(String(t._id)) || 0,
  }));

  return {
    statusCode: 200,
    message: 'Estadisticas de docentes obtenidas correctamente.',
    data: {
      period: period || 'all',
      teachers: rows,
      lessonsDistributionBySubject: distAgg.map((d) => ({ subjectId: d._id, name: d.name, color: d.color, count: d.count })),
    },
  };
}
