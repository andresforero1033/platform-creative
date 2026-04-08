const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const {
	triggerReminders,
	getUsersByRoleMetrics,
	sendGlobalMessage,
} = require("../controllers/adminController");

const router = express.Router();

router.get("/users-by-role", protect, authorize("admin", "supervisor"), getUsersByRoleMetrics);
router.post("/trigger-reminders", protect, authorize("admin", "supervisor"), triggerReminders);
router.post("/broadcast-message", protect, authorize("admin", "supervisor"), sendGlobalMessage);

module.exports = router;
