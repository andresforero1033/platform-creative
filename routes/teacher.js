const express = require("express");
const { body } = require("express-validator");
const { protect, authorize } = require("../middleware/auth");
const auditLogger = require("../middleware/auditLogger");
const validateRequest = require("../middleware/validateRequest");
const {
  addLessonToSubject,
  updateLesson,
  deleteLesson,
  getMyFeedback,
} = require("../controllers/teacherController");
const {
  createClassroom,
  listTeacherClassrooms,
} = require("../controllers/classroomController");

const router = express.Router();

router.get(
  "/classes",
  protect,
  authorize("teacher", "supervisor"),
  listTeacherClassrooms
);

router.post(
  "/classes",
  protect,
  authorize("teacher", "supervisor"),
  [
    body("subjectId").isMongoId().withMessage("subjectId invalido."),
    body("courseName")
      .trim()
      .isLength({ min: 2, max: 40 })
      .withMessage("courseName debe tener entre 2 y 40 caracteres."),
  ],
  validateRequest,
  auditLogger,
  createClassroom
);

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

router.get(
  "/my-feedback",
  protect,
  authorize("teacher", "supervisor"),
  getMyFeedback
);

module.exports = router;
