const mongoose = require("mongoose");

const SUBJECT_NAMES = [
  "Matemáticas",
  "Español",
  "Ciencias Naturales",
  "Ciencias Sociales",
  "Inglés",
  "Arte y Creatividad",
  "Educación Física",
  "Desarrollo de Software (Enfoque en lógica y coding para niños)",
  "Inteligencia Emocional",
  "Educación Financiera"
];

const lessonSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    title: {
      type: String,
      required: true,
      minlength: 3,
      trim: true
    },
    content: {
      type: String,
      required: true,
      minlength: 10,
      trim: true
    }
  }
);

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      enum: SUBJECT_NAMES,
      unique: true
    },
    color: {
      type: String,
      required: true,
      match: [/^#([A-Fa-f0-9]{6})$/, "Color debe ser hexadecimal de 6 digitos"],
      trim: true
    },
    icon: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    lessons: {
      type: [lessonSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.models.Subject || mongoose.model("Subject", subjectSchema);
