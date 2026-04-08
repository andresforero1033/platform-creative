const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const {
	triggerReminders,
	getUsersByRoleMetrics,
} = require("../controllers/adminController");

const router = express.Router();

router.get("/users-by-role", protect, authorize("admin", "supervisor"), getUsersByRoleMetrics);
router.post("/trigger-reminders", protect, authorize("admin", "supervisor"), triggerReminders);

module.exports = router;
