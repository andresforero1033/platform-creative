const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const { triggerReminders } = require("../controllers/adminController");

const router = express.Router();

router.post("/trigger-reminders", protect, authorize("admin", "supervisor"), triggerReminders);

module.exports = router;
