const express = require("express");
const {
	getSubjects,
	getSubjectById,
	getSubjectCertificate,
} = require("../controllers/subjectController");
const { completeLesson } = require("../controllers/progressController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.get("/subjects", protect, authorize("student", "teacher", "supervisor"), getSubjects);
router.get("/subjects/:id", protect, authorize("student", "teacher", "supervisor"), getSubjectById);
router.get("/subjects/:id/certificate", protect, authorize("student", "supervisor"), getSubjectCertificate);
router.post("/complete-lesson", protect, authorize("student", "supervisor"), completeLesson);

module.exports = router;
