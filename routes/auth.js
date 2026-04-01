const express = require("express");
const { body } = require("express-validator");
const rateLimit = require("express-rate-limit");
const { register, login, refresh, logout } = require("../controllers/authController");
const validateRequest = require("../middleware/validateRequest");

const router = express.Router();
const authCriticalLimiter = rateLimit({
	windowMs: 60 * 1000,
	max: 5,
	standardHeaders: true,
	legacyHeaders: false,
	message: {
		success: false,
		message: "Demasiados intentos. Intenta nuevamente en 1 minuto.",
	},
});

router.post(
	"/register",
	authCriticalLimiter,
	[
		body("name").trim().isLength({ min: 2 }).withMessage("name debe tener al menos 2 caracteres."),
		body("email").isEmail().withMessage("email invalido."),
		body("password").isLength({ min: 6 }).withMessage("password debe tener al menos 6 caracteres."),
		body("role")
			.isIn(["student", "teacher", "parent", "supervisor", "admin"])
			.withMessage("role invalido."),
	],
	validateRequest,
	register
);

router.post(
	"/login",
	authCriticalLimiter,
	[
		body("email").isEmail().withMessage("email invalido."),
		body("password").notEmpty().withMessage("password es obligatorio."),
	],
	validateRequest,
	login
);

router.post(
	"/refresh",
	[
		body("refreshToken").notEmpty().withMessage("refreshToken es obligatorio."),
	],
	validateRequest,
	refresh
);

router.post(
	"/logout",
	[
		body("refreshToken").notEmpty().withMessage("refreshToken es obligatorio."),
	],
	validateRequest,
	logout
);

module.exports = router;
