const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const {
  getParentDashboard,
  getStudentProgress,
  getParentNotifications,
  getWeeklyReport,
} = require("../controllers/parentController");

const router = express.Router();

router.get(
  "/dashboard",
  protect,
  authorize("parent", "supervisor"),
  getParentDashboard
);

router.get(
  "/progress/:studentId",
  protect,
  authorize("parent", "supervisor"),
  getStudentProgress
);

router.get(
  "/notifications",
  protect,
  authorize("parent", "supervisor"),
  getParentNotifications
);

router.get(
  "/children/:id/weekly-report",
  protect,
  authorize("parent", "supervisor"),
  getWeeklyReport
);

module.exports = router;
