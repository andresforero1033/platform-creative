const mongoose = require("mongoose");
require("dotenv").config();
const connectDB = require("./config/db");
const createApp = require("./app");

const app = createApp();

const PORT = process.env.PORT || 10000;

let httpServer;

async function gracefulShutdown(signal) {
    console.log(`Senal ${signal} recibida. Cerrando servidor...`);

    const forceTimer = setTimeout(async () => {
        await mongoose.connection.close();
        process.exit(1);
    }, 10000);
    forceTimer.unref();

    if (httpServer) {
        httpServer.close(async () => {
            await mongoose.connection.close();
            clearTimeout(forceTimer);
            console.log("Servidor HTTP y MongoDB cerrados correctamente.");
            process.exit(0);
        });
    } else {
        await mongoose.connection.close();
        clearTimeout(forceTimer);
        process.exit(0);
    }
}

process.on("SIGINT", () => {
    gracefulShutdown("SIGINT").catch((error) => {
        console.error("Error en graceful shutdown:", error.message);
        process.exit(1);
    });
});

process.on("SIGTERM", () => {
    gracefulShutdown("SIGTERM").catch((error) => {
        console.error("Error en graceful shutdown:", error.message);
        process.exit(1);
    });
});

connectDB().then(() => {
    httpServer = app.listen(PORT, () => {
        console.log(`Servidor escuchando en puerto ${PORT}`);
    });
}).catch((error) => {
    console.error("❌ ERROR DE MONGO:", error.message);
    process.exit(1);
});
