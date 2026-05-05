const express = require("express");
const { body, param, query } = require("express-validator");
const { protect, authorize } = require("../middleware/auth");
const {
	triggerReminders,
	getUsersByRoleMetrics,
	sendGlobalMessage,
	getInstitutionUsers,
	setInstitutionUserActivation,
	bulkSetInstitutionUserActivation,
	getInstitutionBrand,
	updateInstitutionBrand,
	getStaffStats,
} = require("../controllers/adminController");
const validateRequest = require("../middleware/validateRequest");

const router = express.Router();

router.get("/users-by-role", protect, authorize("admin", "supervisor"), getUsersByRoleMetrics);
router.post("/trigger-reminders", protect, authorize("admin", "supervisor"), triggerReminders);
router.post("/broadcast-message", protect, authorize("admin", "supervisor"), sendGlobalMessage);

router.get(
	"/institution-users",
	protect,
	authorize("admin"),
	[
		query("role")
			.optional()
			.isIn(["all", "student", "teacher", "parent"])
			.withMessage("role debe ser all, student, teacher o parent."),
	],
	validateRequest,
	getInstitutionUsers
);

router.get(
	"/institution/brand",
	protect,
	authorize("admin"),
	getInstitutionBrand
);

router.patch(
	"/institution/brand",
	protect,
	authorize("admin"),
	[
		body("logoUrl").optional().isString().withMessage("logoUrl debe ser una URL o cadena."),
		body("primaryColor")
			.optional()
			.matches(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
			.withMessage("primaryColor debe ser un hex valido, ej. #1a73e8"),
	],
	validateRequest,
	updateInstitutionBrand
);

router.patch(
	"/institution-users/:userId/activation",
	protect,
	authorize("admin"),
	[
		param("userId").isMongoId().withMessage("userId invalido."),
		body("isInstitutionValidated")
			.optional()
			.isBoolean()
			.withMessage("isInstitutionValidated debe ser booleano."),
	],
	validateRequest,
	setInstitutionUserActivation
);

router.patch(
	"/users/bulk-activation",
	protect,
	authorize("admin"),
	[
		body("userIds").isArray({ min: 1 }).withMessage("userIds debe ser un array con al menos un id."),
		body("userIds.*").isMongoId().withMessage("Cada userId debe ser un id de Mongo valido."),
		body("isInstitutionValidated").optional().isBoolean().withMessage("isInstitutionValidated debe ser booleano."),
	],
	validateRequest,
	bulkSetInstitutionUserActivation
);

router.get(
  '/staff-stats',
  protect,
  authorize('admin'),
  [
    query('period').optional().isIn(['month', 'all']).withMessage('period debe ser month o all'),
  ],
  validateRequest,
  getStaffStats
);

module.exports = router;

