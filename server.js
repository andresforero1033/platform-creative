const mongoose = require("mongoose");
const http = require("http");
require("dotenv").config();
const connectDB = require("./config/db");
const createApp = require("./app");
const { initializeSocketServer, closeSocketServer } = require("./config/socket");

const app = createApp();

const PORT = process.env.PORT || 10000;

let httpServer;

async function gracefulShutdown(signal) {
    console.log(`Senal ${signal} recibida. Cerrando servidor...`);

    const forceTimer = setTimeout(async () => {
        await closeSocketServer();
        await mongoose.connection.close();
        process.exit(1);
    }, 10000);
    forceTimer.unref();

    if (httpServer) {
        httpServer.close(async () => {
            await closeSocketServer();
            await mongoose.connection.close();
            clearTimeout(forceTimer);
            console.log("Servidor HTTP, Socket.io y MongoDB cerrados correctamente.");
            process.exit(0);
        });
    } else {
        await closeSocketServer();
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
    httpServer = http.createServer(app);
    initializeSocketServer(httpServer);

    httpServer.listen(PORT, () => {
        console.log(`Servidor escuchando en puerto ${PORT}`);
        console.log("Socket.io inicializado y escuchando eventos realtime.");
    });
}).catch((error) => {
    console.error("ERROR DE MONGO:", error.message);
    process.exit(1);
});
