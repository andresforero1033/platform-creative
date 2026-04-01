const { logger } = require("../config/logger");
const AppError = require("../utils/appError");

function errorHandler(err, _req, res, _next) {
  let handledError = err;

  if (err?.name === "ValidationError") {
    const validationMessage = Object.values(err.errors || {})
      .map((error) => error.message)
      .join("; ");

    handledError = new AppError(
      validationMessage || "Error de validacion.",
      400
    );
  }

  const statusCode = handledError.statusCode || 500;
  const message = handledError.message || "Error interno del servidor.";

  logger.error({
    message,
    statusCode,
    stack: handledError.stack,
  });

  const response = {
    success: false,
    message,
  };

  if (process.env.NODE_ENV === "development" && handledError.stack) {
    response.stack = handledError.stack;
  }

  return res.status(statusCode).json(response);
}

module.exports = errorHandler;
