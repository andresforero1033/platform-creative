const mongoose = require("mongoose");

const classroomSchema = new mongoose.Schema(
  {
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institution",
      required: true,
      index: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
      index: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    courseName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 40,
    },
    classCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      match: [/^[A-Z0-9]{6,14}$/, "classCode debe ser alfanumerico entre 6 y 14 caracteres."],
      index: true,
    },
    studentIds: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

classroomSchema.index(
  { institutionId: 1, teacherId: 1, subjectId: 1, courseName: 1 },
  { unique: true }
);

module.exports = mongoose.models.Classroom || mongoose.model("Classroom", classroomSchema);
