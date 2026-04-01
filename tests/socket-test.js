/* eslint-disable no-console */
const http = require("http");
const jwt = require("jsonwebtoken");
const { io: createClient } = require("socket.io-client");

const createApp = require("../app");
const { initializeSocketServer, closeSocketServer } = require("../config/socket");
const socketService = require("../services/socketService");

async function runSocketTest() {
  process.env.NODE_ENV = "test";
  process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "socket_test_secret";

  const app = createApp();
  const server = http.createServer(app);
  initializeSocketServer(server);

  await new Promise((resolve) => server.listen(12000, resolve));

  const userId = "507f1f77bcf86cd799439011";
  const token = jwt.sign(
    {
      sub: userId,
      role: "teacher",
      type: "access",
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: "10m" }
  );

  const client = createClient("http://localhost:12000", {
    transports: ["websocket"],
    auth: { token },
  });

  const received = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Timeout esperando evento NEW_NOTIFICATION")), 5000);

    client.on("connect", () => {
      socketService.sendToUser(userId, "NEW_NOTIFICATION", {
        title: "Prueba realtime",
        message: "Evento recibido correctamente",
      });
    });

    client.on("NEW_NOTIFICATION", (payload) => {
      clearTimeout(timeout);
      resolve(payload);
    });

    client.on("connect_error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });

  console.log("Evento recibido:", received);

  client.disconnect();
  await closeSocketServer();
  await new Promise((resolve) => server.close(resolve));
}

runSocketTest()
  .then(() => {
    console.log("socket-test finalizado correctamente.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("socket-test fallo:", error.message);
    process.exit(1);
  });
