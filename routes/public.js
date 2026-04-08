const express = require("express");
const rateLimit = require("express-rate-limit");
const { body } = require("express-validator");
const { createLead } = require("../controllers/leadController");
const validateRequest = require("../middleware/validateRequest");

const router = express.Router();

const leadCaptureLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Demasiadas solicitudes. Intenta nuevamente en 1 minuto.",
  },
});

router.post(
  "/leads",
  leadCaptureLimiter,
  [
    body("email").isEmail().withMessage("email invalido."),
    body("source")
      .optional({ nullable: true })
      .isString()
      .isLength({ max: 60 })
      .withMessage("source invalido."),
    body("metadata")
      .optional({ nullable: true })
      .isObject()
      .withMessage("metadata invalido."),
  ],
  validateRequest,
  createLead
);

module.exports = router;
