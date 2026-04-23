const authService = require("../services/authService");

async function validateInstitutionAdmin(req, res, next) {
  try {
    const result = await authService.validateInstitutionAdminUsername(req.body);

    return res.status(result.statusCode).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    return next(error);
  }
}

async function validateSchoolCode(req, res, next) {
  return validateInstitutionAdmin(req, res, next);
}

async function register(req, res, next) {
  try {
    const result = await authService.register(req.body);

    return res.status(result.statusCode).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const result = await authService.login(req.body);

    return res.status(result.statusCode).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    return next(error);
  }
}

async function refresh(req, res, next) {
  try {
    const result = await authService.refreshAccessToken(req.body);

    return res.status(result.statusCode).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    return next(error);
  }
}

async function logout(req, res, next) {
  try {
    const result = await authService.logout(req.body);

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
  validateInstitutionAdmin,
  validateSchoolCode,
  register,
  login,
  refresh,
  logout,
};
