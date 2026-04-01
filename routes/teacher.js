const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const auditLogger = require("../middleware/auditLogger");
const {
  addLessonToSubject,
  updateLesson,
  deleteLesson,
} = require("../controllers/teacherController");

const router = express.Router();

router.post(
  "/subjects/:id/lessons",
  protect,
  authorize("teacher", "supervisor"),
  auditLogger,
  addLessonToSubject
);

router.put(
  "/subjects/:id/lessons/:lessonId",
  protect,
  authorize("teacher", "supervisor"),
  auditLogger,
  updateLesson
);

router.delete(
  "/subjects/:id/lessons/:lessonId",
  protect,
  authorize("teacher", "supervisor"),
  auditLogger,
  deleteLesson
);

module.exports = router;
