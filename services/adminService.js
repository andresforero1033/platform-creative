const AppError = require("../utils/appError");
const notificationService = require("./notificationService");
const userRepository = require("../repositories/userRepository");

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

module.exports = {
  triggerReminders,
  sendGlobalMessage,
  getUsersByRoleMetrics,
  getInstitutionUsers,
  setInstitutionUserActivation,
};
