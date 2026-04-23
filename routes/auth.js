const express = require("express");
const { body } = require("express-validator");
const rateLimit = require("express-rate-limit");
const {
	validateInstitutionAdmin,
	validateSchoolCode,
	register,
	login,
	refresh,
	logout,
} = require("../controllers/authController");
const validateRequest = require("../middleware/validateRequest");

const INSTITUTION_ADMIN_USERNAME_REGEX = /^[A-Za-z0-9._-]{4,30}$/;

const router = express.Router();
const authCriticalLimiter = rateLimit({
	windowMs: 60 * 1000,
	max: process.env.NODE_ENV === "test" ? 1000 : 5,
	standardHeaders: true,
	legacyHeaders: false,
	message: {
		success: false,
		message: "Demasiados intentos. Intenta nuevamente en 1 minuto.",
	},
});

router.post(
	"/validate-institution-admin",
	authCriticalLimiter,
	[
		body("institutionAdminUsername")
			.trim()
			.matches(INSTITUTION_ADMIN_USERNAME_REGEX)
			.withMessage(
				"institutionAdminUsername debe tener entre 4 y 30 caracteres (a-z, 0-9, ., _, -)."
			),
	],
	validateRequest,
	validateInstitutionAdmin
);

router.post(
	"/validate-school-code",
	authCriticalLimiter,
	[
		body("schoolCode")
			.trim()
			.matches(INSTITUTION_ADMIN_USERNAME_REGEX)
			.withMessage("schoolCode debe tener entre 4 y 30 caracteres (a-z, 0-9, ., _, -)."),
	],
	validateRequest,
	validateSchoolCode
);

router.post(
	"/register",
	authCriticalLimiter,
	[
		body("registrationMode")
			.optional()
			.isIn(["create_institution", "join_institution"])
			.withMessage("registrationMode invalido."),
		body("institutionAdminUsername")
			.if((value, { req }) => (req.body.registrationMode || "join_institution") === "join_institution")
			.trim()
			.matches(INSTITUTION_ADMIN_USERNAME_REGEX)
			.withMessage(
				"institutionAdminUsername debe tener entre 4 y 30 caracteres (a-z, 0-9, ., _, -)."
			),
		body("adminUsername")
			.if((value, { req }) => req.body.registrationMode === "create_institution")
			.trim()
			.matches(INSTITUTION_ADMIN_USERNAME_REGEX)
			.withMessage("adminUsername invalido para crear institucion."),
		body("institutionName")
			.if((value, { req }) => req.body.registrationMode === "create_institution")
			.trim()
			.isLength({ min: 3, max: 120 })
			.withMessage("institutionName debe tener entre 3 y 120 caracteres."),
		body("legalId")
			.if((value, { req }) => req.body.registrationMode === "create_institution")
			.trim()
			.isLength({ min: 5, max: 40 })
			.withMessage("legalId debe tener entre 5 y 40 caracteres."),
		body("name").trim().isLength({ min: 2 }).withMessage("name debe tener al menos 2 caracteres."),
		body("email").isEmail().withMessage("email invalido."),
		body("password").isLength({ min: 6 }).withMessage("password debe tener al menos 6 caracteres."),
		body("dni")
			.trim()
			.matches(/^[A-Za-z0-9-]{5,30}$/)
			.withMessage("dni invalido."),
		body("childDni")
			.if(body("role").equals("parent"))
			.trim()
			.matches(/^[A-Za-z0-9-]{5,30}$/)
			.withMessage("childDni es obligatorio para rol parent y debe ser valido."),
		body("role")
			.isIn(["student", "teacher", "parent", "supervisor", "admin"])
			.withMessage("role invalido."),
		body("role").custom((role, { req }) => {
			const mode = req.body.registrationMode || "join_institution";

			if (mode === "create_institution" && role !== "admin") {
				throw new Error("Solo rol admin puede crear institucion nueva.");
			}

			if (mode === "join_institution" && role === "admin") {
				throw new Error("Rol admin solo permitido en modo crear institucion.");
			}

			return true;
		}),
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
