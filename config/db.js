const mongoose = require("mongoose");

async function connectDB() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("Falta la variable MONGODB_URI en el entorno.");
  }

  await mongoose.connect(mongoUri);
  console.log("MongoDB Atlas conectado correctamente.");
}

module.exports = connectDB;
