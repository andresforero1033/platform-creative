const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const {
  getTeacherInsights,
  getDifficultLessons,
} = require("../controllers/supervisorController");

const router = express.Router();

router.get("/test", protect, authorize("supervisor"), (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Acceso permitido para supervisor.",
    data: req.user,
  });
});

router.get("/dashboard/teachers", protect, authorize("supervisor"), getTeacherInsights);
router.get("/dashboard/difficult-lessons", protect, authorize("supervisor"), getDifficultLessons);

module.exports = router;
