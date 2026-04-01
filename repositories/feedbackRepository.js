const Feedback = require("../models/Feedback");

async function createFeedback(payload) {
  return Feedback.create(payload);
}

async function findByTeacherIdLean(teacherId) {
  return Feedback.find({ teacherId }).sort({ createdAt: -1 }).lean();
}

module.exports = {
  createFeedback,
  findByTeacherIdLean,
};
