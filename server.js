const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 10000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error("Falta la variable MONGODB_URI en el entorno.");
    process.exit(1);
}

async function connectToDatabase() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("MongoDB Atlas conectado correctamente.");
    } catch (error) {
        console.error("❌ ERROR DE MONGO:", error.message);
    }
}

app.get("/", (_req, res) => {
    res.status(200).json({
        service: "Creative API",
        status: "ok",
        message: "Servidor activo"
    });
});

app.get("/health", (_req, res) => {
    const dbState = mongoose.connection.readyState;
    const isDbConnected = dbState === 1;

    res.status(isDbConnected ? 200 : 503).json({
        status: isDbConnected ? "healthy" : "degraded",
        database: isDbConnected ? "connected" : "disconnected"
    });
});

connectToDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`Servidor escuchando en puerto ${PORT}`);
    });
});
