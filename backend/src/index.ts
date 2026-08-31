import "dotenv/config";
import "./config/env.js"; // Valida env al arrancar (fail-fast)
import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import authRoutes from "./auth/routes.js";
import userRoutes from "./user/routes.js";
import { connectDB, mongoose } from "./db/index.js";
import { env, allowedOrigins } from "./config/env.js";
import { securityLog } from "./security/logger.js";

const app = express();

// Render y Vercel usan proxies. Sin esto, req.ip devuelve la IP del proxy
// (todos los usuarios con la misma IP) y rate-limiting se rompe.
app.set("trust proxy", 1);

app.disable("x-powered-by"); // No exponer Express en headers

/* ───────────────────────── Helmet (headers de seguridad) ───────────────────────── */
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://accounts.google.com"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: ["'self'", "https://accounts.google.com"],
        frameSrc: ["https://accounts.google.com"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000, // 1 año
      includeSubDomains: true,
      preload: true,
    },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  })
);

/* ───────────────────────── CORS estricto ───────────────────────── */
app.use(
  cors({
    origin: (origin, callback) => {
      // Permitir requests sin Origin (ej: health checks de Render).
      if (!origin) {
        callback(null, true);
        return;
      }
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      securityLog.corsBlock(origin, "unknown");
      callback(new Error("Origen no permitido"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false,
    maxAge: 86400, // Cache preflight 24h
  })
);

app.use(express.json({ limit: "1mb" }));

/* ───────────────────────── Rate Limiting por endpoint ───────────────────────── */
const authLimiter = rateLimit({
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS, // 15 min
  limit: env.AUTH_RATE_LIMIT_MAX, // 5 intentos por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: `Demasiados intentos. Intenta en ${Math.ceil(
      env.AUTH_RATE_LIMIT_WINDOW_MS / 60000
    )} minutos.`,
  },
  handler: (req, res, _next, options) => {
    securityLog.rateLimitHit(req.ip ?? "unknown", req.path);
    res.status(options.statusCode).json({
      error: options.message.error,
    });
  },
  skipSuccessfulRequests: true, // No contar requests exitosos
});

const refreshLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  limit: 30, // 30 refrescos por minuto
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiadas renovaciones de token" },
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiadas peticiones" },
});

/* ───────────────────────── Endpoints ───────────────────────── */
app.get("/health", (_req, res) => {
  const dbState = mongoose.connection.readyState;
  res.json({
    status: dbState === 1 ? "ok" : "degraded",
    service: "webstore-backend",
    db: dbState === 1 ? "connected" : "disconnected",
    uptime: Math.floor(process.uptime()),
  });
});

// Rate limit general antes de todo lo demás.
app.use(generalLimiter);

// Endpoints de auth (5/15min por IP).
app.use("/api/auth", authLimiter, authRoutes);

// Refresh con su propio limit.
app.use("/api/auth/refresh", refreshLimiter);

app.use("/api/user", userRoutes);

/* ───────────────────────── Error handler final ───────────────────────── */
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    // No leakear detalles internos al cliente en producción.
    if (env.NODE_ENV === "production") {
      console.error("Error interno:", err);
      res.status(500).json({ error: "Error interno del servidor" });
      return;
    }
    console.error("Error:", err.message);
    res.status(500).json({ error: err.message });
  }
);

// 404 handler.
app.use((_req, res) => {
  res.status(404).json({ error: "Endpoint no encontrado" });
});

/* ───────────────────────── Start ───────────────────────── */
async function start() {
  try {
    await connectDB();
    const server = app.listen(env.PORT, () => {
      console.log(
        `🔒 Backend seguro escuchando en puerto ${env.PORT} (${env.NODE_ENV})`
      );
    });

    // Graceful shutdown
    const shutdown = (signal: string) => {
      console.log(`\n${signal} recibido, cerrando servidor...`);
      server.close(() => {
        mongoose.disconnect().then(() => process.exit(0));
      });
      setTimeout(() => process.exit(1), 10000).unref();
    };
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (err) {
    console.error("No se pudo iniciar el servidor:", err);
    process.exit(1);
  }
}

start();