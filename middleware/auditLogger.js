const { auditLogger } = require("../config/logger");

function auditLoggerMiddleware(req, res, next) {
  res.on("finish", () => {
    const role = req.user?.role;
    const method = req.method;
    const auditableMethods = ["POST", "PUT", "PATCH", "DELETE"];

    if (!auditableMethods.includes(method)) {
      return;
    }

    if (!(role === "teacher" || role === "supervisor")) {
      return;
    }

    if (res.statusCode >= 500) {
      return;
    }

    auditLogger.info({
      role,
      method,
      route: req.originalUrl,
      statusCode: res.statusCode,
      actorUserId: req.user?.id,
      timestamp: new Date().toISOString(),
    });
  });

  return next();
}

module.exports = auditLoggerMiddleware;
