const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
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
    prompt: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
    },
    options: {
      type: [String],
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length >= 2;
        },
        message: "La pregunta debe tener al menos 2 opciones.",
      },
      required: true,
    },
    correctOption: {
      type: Number,
      required: true,
      min: 0,
    },
    explanation: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

questionSchema.pre("validate", function validateCorrectOption(next) {
  if (Array.isArray(this.options) && this.correctOption >= this.options.length) {
    return next(new Error("correctOption fuera de rango para las opciones configuradas."));
  }

  return next();
});

questionSchema.index({ subjectId: 1, lessonId: 1 });

module.exports = mongoose.models.Question || mongoose.model("Question", questionSchema);
