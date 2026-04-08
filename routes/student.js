const express = require("express");
const {
	getSubjects,
	getSubjectById,
	getSubjectLesson,
	getSubjectCertificate,
} = require("../controllers/subjectController");
const {
	completeLesson,
	submitQuiz,
	getReviewRecommendations,
} = require("../controllers/progressController");
const { getFinalChallenge, submitFinalChallenge } = require("../controllers/challengeController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.get("/subjects", protect, authorize("student", "teacher", "supervisor"), getSubjects);
router.get("/subjects/:id", protect, authorize("student", "teacher", "supervisor"), getSubjectById);
router.get("/subjects/:subjectId/lessons/:lessonId", protect, authorize("student", "teacher", "supervisor"), getSubjectLesson);
router.get("/subjects/:id/certificate", protect, authorize("student", "supervisor"), getSubjectCertificate);
router.get("/subjects/:id/final-challenge", protect, authorize("student", "supervisor"), getFinalChallenge);
router.get("/recommendations/review", protect, authorize("student", "supervisor"), getReviewRecommendations);
router.post("/complete-lesson", protect, authorize("student", "supervisor"), completeLesson);
router.post("/subjects/:subjectId/lessons/:lessonId/quiz/submit", protect, authorize("student", "supervisor"), submitQuiz);
router.post("/subjects/:id/final-challenge/submit", protect, authorize("student", "supervisor"), submitFinalChallenge);

module.exports = router;
