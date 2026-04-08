const notificationService = require("./notificationService");
const userRepository = require("../repositories/userRepository");

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

module.exports = {
  triggerReminders,
  sendGlobalMessage,
  getUsersByRoleMetrics,
};
