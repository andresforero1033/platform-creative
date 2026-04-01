const mongoose = require("mongoose");

const quizSchema = new mongoose.Schema(
  {
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
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
    },
    questionIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Question",
      required: true,
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length > 0;
        },
        message: "El quiz debe tener al menos una pregunta.",
      },
    },
    passingScore: {
      type: Number,
      default: 70,
      min: 0,
      max: 100,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

quizSchema.index({ subjectId: 1, lessonId: 1 }, { unique: true });

module.exports = mongoose.models.Quiz || mongoose.model("Quiz", quizSchema);
