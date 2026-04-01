const Badge = require("../models/Badge");

async function findByNombreLean(nombre) {
  return Badge.findOne({ nombre }).lean();
}

async function upsertByNombre(payload) {
  return Badge.findOneAndUpdate(
    { nombre: payload.nombre },
    {
      $setOnInsert: payload,
    },
    {
      upsert: true,
      new: true,
      runValidators: true,
    }
  ).lean();
}

module.exports = {
  findByNombreLean,
  upsertByNombre,
};
