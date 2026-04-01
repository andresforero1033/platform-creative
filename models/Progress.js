const mongoose = require("mongoose");

const progressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
      index: true,
    },
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    completed: {
      type: Boolean,
      default: true,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
    mastered: {
      type: Boolean,
      default: false,
    },
    masteredAt: {
      type: Date,
      default: null,
    },
    lastQuizScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    quizAttempts: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

progressSchema.index({ userId: 1, subjectId: 1, lessonId: 1 }, { unique: true });

module.exports = mongoose.models.Progress || mongoose.model("Progress", progressSchema);
