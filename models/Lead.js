const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Email invalido"],
    },
    source: {
      type: String,
      default: "landing",
      trim: true,
      maxlength: 60,
    },
    status: {
      type: String,
      enum: ["new", "contacted", "archived"],
      default: "new",
    },
    metadata: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.Lead || mongoose.model("Lead", leadSchema);
