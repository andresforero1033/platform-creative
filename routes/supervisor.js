const express = require("express");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.get("/test", protect, authorize("supervisor"), (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Acceso permitido para supervisor.",
    data: req.user,
  });
});

module.exports = router;
