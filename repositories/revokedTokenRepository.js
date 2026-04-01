const RevokedToken = require("../models/RevokedToken");

async function findByTokenLean(token) {
  return RevokedToken.findOne({ token }).lean();
}

async function revokeToken(token, expiresAt, reason = "logout") {
  return RevokedToken.findOneAndUpdate(
    { token },
    {
      $set: {
        token,
        expiresAt,
        reason,
      },
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
    }
  ).lean();
}

module.exports = {
  findByTokenLean,
  revokeToken,
};
