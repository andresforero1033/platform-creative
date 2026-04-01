const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xssClean = require("xss-clean");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");

const authRoutes = require("./routes/auth");
const supervisorRoutes = require("./routes/supervisor");
const studentRoutes = require("./routes/student");
const teacherRoutes = require("./routes/teacher");
const parentRoutes = require("./routes/parent");
const adminRoutes = require("./routes/admin");
const errorHandler = require("./middleware/errorHandler");
const { logger, accessLogStream } = require("./config/logger");

function createApp() {
  const app = express();
  const openApiDocument = YAML.load(path.join(__dirname, "docs", "openapi.yaml"));
  const startTime = Date.now();
  const defaultAllowedOrigins = ["http://localhost:5173", "http://localhost:5174"];
  const envAllowedOrigins = (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  const allowedOrigins = [...new Set([...defaultAllowedOrigins, ...envAllowedOrigins])];
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: "Demasiadas peticiones, intenta de nuevo en 15 minutos.",
    },
  });

  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        return callback(new Error("Origen no permitido por CORS"));
      },
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    })
  );
  app.use(apiLimiter);

  if (process.env.NODE_ENV !== "test") {
    app.use(morgan("dev"));
    app.use(morgan("combined", { stream: accessLogStream }));
  }

  app.use(express.json());
  app.use(mongoSanitize());
  app.use(xssClean());

  app.use((req, res, next) => {
    res.on("finish", () => {
      logger.info({
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
      });
    });

    next();
  });

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));
  app.use("/api/auth", authRoutes);
  app.use("/api/supervisor", supervisorRoutes);
  app.use("/api/student", studentRoutes);
  app.use("/api/teacher", teacherRoutes);
  app.use("/api/parent", parentRoutes);
  app.use("/api/admin", adminRoutes);

  app.get("/", (_req, res) => {
    res.status(200).json({
      success: true,
      message: "Servidor activo",
      data: {
        service: "Creative API",
        status: "ok",
      },
    });
  });

  app.get("/health", (_req, res) => {
    const dbState = mongoose.connection.readyState;
    const isDbConnected = dbState === 1;
    const uptimeSeconds = Math.floor(process.uptime());
    const uptimeMilliseconds = Date.now() - startTime;

    res.status(isDbConnected ? 200 : 503).json({
      success: isDbConnected,
      message: isDbConnected ? "Servicio saludable" : "Servicio degradado",
      data: {
        status: isDbConnected ? "healthy" : "degraded",
        database: isDbConnected ? "connected" : "disconnected",
        uptime: {
          seconds: uptimeSeconds,
          milliseconds: uptimeMilliseconds,
        },
      },
    });
  });

  app.use((_req, res) => {
    return res.status(404).json({
      success: false,
      message: "Ruta no encontrada.",
    });
  });

  app.use(errorHandler);

  return app;
}

module.exports = createApp;
