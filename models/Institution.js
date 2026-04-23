const mongoose = require("mongoose");

const LICENSE_STATUS = ["active", "inactive", "suspended", "expired", "trial"];

const institutionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 120,
    },
    adminUsername: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9._-]{4,30}$/, "adminUsername debe tener entre 4 y 30 caracteres (a-z, 0-9, ., _, -)."],
      index: true,
    },
    legalId: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 40,
    },
    licenseStatus: {
      type: String,
      enum: LICENSE_STATUS,
      default: "active",
      index: true,
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

module.exports = mongoose.models.Institution || mongoose.model("Institution", institutionSchema);
