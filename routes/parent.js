const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const {
  getStudentProgress,
  getParentNotifications,
} = require("../controllers/parentController");

const router = express.Router();

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

module.exports = router;
