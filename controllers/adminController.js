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

async function bulkSetInstitutionUserActivation(req, res, next) {
  try {
    const userIds = Array.isArray(req.body?.userIds) ? req.body.userIds : [];
    const isInstitutionValidated = req.body?.isInstitutionValidated !== false;

    const result = await adminService.bulkSetInstitutionUserActivation(
      req.user,
      userIds,
      isInstitutionValidated
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

async function getInstitutionBrand(req, res, next) {
  try {
    const result = await adminService.getInstitutionBrand(req.user);

    return res.status(result.statusCode).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    return next(error);
  }
}

async function updateInstitutionBrand(req, res, next) {
  try {
    const payload = {
      logoUrl: req.body?.logoUrl,
      primaryColor: req.body?.primaryColor,
    };

    const result = await adminService.updateInstitutionBrand(req.user, payload);

    return res.status(result.statusCode).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    return next(error);
  }
}

async function getStaffStats(req, res, next) {
  try {
    const period = (req.query?.period || 'month').toString().trim().toLowerCase();
    const result = await adminService.getStaffStats(req.user, period);

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
  bulkSetInstitutionUserActivation,
  getInstitutionBrand,
  updateInstitutionBrand,
  getStaffStats,
};
