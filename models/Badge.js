const mongoose = require("mongoose");

const badgeSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    descripcion: {
      type: String,
      required: true,
      trim: true,
    },
    icono: {
      type: String,
      required: true,
      trim: true,
    },
    requerimiento: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.Badge || mongoose.model("Badge", badgeSchema);
