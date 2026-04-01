const mongoose = require("mongoose");

const revokedTokenSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    reason: {
      type: String,
      default: "logout",
    },
  },
  {
    timestamps: true,
  }
);

revokedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports =
  mongoose.models.RevokedToken || mongoose.model("RevokedToken", revokedTokenSchema);
