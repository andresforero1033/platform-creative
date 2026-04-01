const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

let ioInstance = null;
const socketsByUserId = new Map();

function getAccessSecret() {
  return process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
}

function registerSocket(userId, socketId) {
  const key = String(userId);
  const set = socketsByUserId.get(key) || new Set();
  set.add(socketId);
  socketsByUserId.set(key, set);
}

function unregisterSocket(userId, socketId) {
  const key = String(userId);
  const set = socketsByUserId.get(key);
  if (!set) {
    return;
  }

  set.delete(socketId);
  if (set.size === 0) {
    socketsByUserId.delete(key);
  }
}

function socketAuthMiddleware(socket, next) {
  try {
    const token = socket.handshake.auth?.token
      || socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, "");

    if (!token) {
      return next(new Error("No autorizado: token requerido."));
    }

    const secret = getAccessSecret();
    if (!secret) {
      return next(new Error("JWT_ACCESS_SECRET o JWT_SECRET no configurado."));
    }

    const decoded = jwt.verify(token, secret);
    if (decoded.type && decoded.type !== "access") {
      return next(new Error("No autorizado: token invalido."));
    }

    socket.data.user = {
      id: decoded.sub,
      role: decoded.role,
      email: decoded.email,
    };

    return next();
  } catch (_error) {
    return next(new Error("No autorizado: token invalido."));
  }
}

function initializeSocketServer(httpServer) {
  ioInstance = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  ioInstance.use(socketAuthMiddleware);

  ioInstance.on("connection", (socket) => {
    const userId = socket.data?.user?.id;
    if (userId) {
      registerSocket(userId, socket.id);
    }

    socket.on("disconnect", () => {
      if (userId) {
        unregisterSocket(userId, socket.id);
      }
    });
  });

  return ioInstance;
}

function getSocketServer() {
  return ioInstance;
}

function closeSocketServer() {
  return new Promise((resolve) => {
    if (!ioInstance) {
      resolve();
      return;
    }

    ioInstance.close(() => {
      socketsByUserId.clear();
      ioInstance = null;
      resolve();
    });
  });
}

function getConnectedSocketIdsByUser(userId) {
  const set = socketsByUserId.get(String(userId));
  if (!set) {
    return [];
  }

  return Array.from(set);
}

module.exports = {
  initializeSocketServer,
  getSocketServer,
  closeSocketServer,
  getConnectedSocketIdsByUser,
};
