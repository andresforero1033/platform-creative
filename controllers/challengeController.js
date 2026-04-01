const challengeService = require("../services/challengeService");

async function getFinalChallenge(req, res, next) {
  try {
    const result = await challengeService.getFinalChallenge(req.user.id, req.params.id);

    return res.status(result.statusCode).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    return next(error);
  }
}

async function submitFinalChallenge(req, res, next) {
  try {
    const result = await challengeService.submitFinalChallenge(
      req.user.id,
      req.params.id,
      req.body.answers
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
  getFinalChallenge,
  submitFinalChallenge,
};
