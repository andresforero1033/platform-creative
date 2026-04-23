const express = require("express");
const { body, param, query } = require("express-validator");
const { protect, authorize } = require("../middleware/auth");
const {
	triggerReminders,
	getUsersByRoleMetrics,
	sendGlobalMessage,
	getInstitutionUsers,
	setInstitutionUserActivation,
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

module.exports = router;
