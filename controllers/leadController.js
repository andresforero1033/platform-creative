const leadService = require("../services/leadService");

async function createLead(req, res, next) {
  try {
    const result = await leadService.registerLead(req.body);

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
  createLead,
};
