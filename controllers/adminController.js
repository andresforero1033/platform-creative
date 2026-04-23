const adminService = require("../services/adminService");

async function triggerReminders(req, res, next) {
  try {
    const result = await adminService.triggerReminders();

    return res.status(result.statusCode).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    return next(error);
  }
}

async function getUsersByRoleMetrics(req, res, next) {
  try {
    const result = await adminService.getUsersByRoleMetrics();

    return res.status(result.statusCode).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    return next(error);
  }
}

async function sendGlobalMessage(req, res, next) {
  try {
    const result = await adminService.sendGlobalMessage(req.user.id, req.body);

    return res.status(result.statusCode).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    return next(error);
  }
}

async function getInstitutionUsers(req, res, next) {
  try {
    const result = await adminService.getInstitutionUsers(req.user, req.query.role);

    return res.status(result.statusCode).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    return next(error);
  }
}

async function setInstitutionUserActivation(req, res, next) {
  try {
    const result = await adminService.setInstitutionUserActivation(
      req.user,
      req.params.userId,
      req.body?.isInstitutionValidated !== false
    );

    return res.status(result.statusCode).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  triggerReminders,
  getUsersByRoleMetrics,
  sendGlobalMessage,
  getInstitutionUsers,
  setInstitutionUserActivation,
};
