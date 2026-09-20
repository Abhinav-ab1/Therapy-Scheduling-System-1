import express from "express";
import session from "express-session";
import passport from "passport";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

dotenv.config();

// =========================================================
// MONGODB
// =========================================================

import connectMongoDB from "./config/mongo.js";

// =========================================================
// MODELS
// =========================================================

import "./models/index.js";

// =========================================================
// GOOGLE / JOBS
// =========================================================

import "./config/googleStrategy.js";
import "./jobs/reminderJob.js";
import "./jobs/completionJob.js";

// =========================================================
// ROUTES
// =========================================================

import authRoutes from "./routes/authRoutes.js";
import oauthRoutes from "./routes/oauthRoutes.js";
import practitionerRoutes from "./routes/practitionerRoutes.js";
import scheduleRoutes from "./routes/scheduleRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import userRoutes from "./routes/userRoutes.js";

// =========================================================
// AI ROUTE
// =========================================================

import aiRoutes from "./routes/aiRoutes.js";

// =========================================================
// APP
// =========================================================

const app = express();

const PORT = process.env.PORT || 5000;

// =========================================================
// TRUST PROXY
// =========================================================

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// =========================================================
// CORS
// =========================================================

const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  process.env.FRONTEND_URL,
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests without Origin
    // (Postman, server-to-server, etc.)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.log("Blocked CORS origin:", origin);

    return callback(new Error("Not allowed by CORS"));
  },

  credentials: true,

  methods: [
    "GET",
    "POST",
    "PUT",
    "DELETE",
    "PATCH",
    "OPTIONS",
  ],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
  ],
};

// =========================================================
// EXPLICIT PREFLIGHT HANDLER
// =========================================================
//
// IMPORTANT:
// This is placed before helmet, sessions, passport,
// body parsing, and routes.
//
// It directly answers browser OPTIONS requests.

app.use((req, res, next) => {
  if (req.method !== "OPTIONS") {
    return next();
  }

  const origin = req.headers.origin;

  if (
    origin &&
    !allowedOrigins.includes(origin)
  ) {
    console.log("Blocked OPTIONS origin:", origin);

    return res.status(403).json({
      message: "CORS error: origin not allowed",
    });
  }

  if (origin) {
    res.setHeader(
      "Access-Control-Allow-Origin",
      origin
    );
  }

  res.setHeader(
    "Access-Control-Allow-Credentials",
    "true"
  );

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,DELETE,PATCH,OPTIONS"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );

  res.setHeader(
    "Access-Control-Max-Age",
    "86400"
  );

  return res.sendStatus(204);
});

// Normal CORS handling
app.use(cors(corsOptions));

// =========================================================
// GLOBAL MIDDLEWARE
// =========================================================

app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
  })
);

app.use(morgan("dev"));

// =========================================================
// BODY PARSER
// =========================================================

app.use(
  bodyParser.json({
    limit: "5mb",
  })
);

app.use(
  bodyParser.urlencoded({
    extended: true,
    limit: "5mb",
  })
);

// =========================================================
// SESSION
// =========================================================

const sessionSecret =
  process.env.SESSION_SECRET ||
  (process.env.NODE_ENV === "production"
    ? null
    : "development_session_secret");

if (!sessionSecret) {
  console.error(
    "❌ SESSION_SECRET is missing in production."
  );

  process.exit(1);
}

app.use(
  session({
    secret: sessionSecret,

    resave: false,

    saveUninitialized: false,

    cookie: {
      httpOnly: true,

      sameSite:
        process.env.NODE_ENV === "production"
          ? "none"
          : "lax",

      secure:
        process.env.NODE_ENV === "production",

      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

// =========================================================
// PASSPORT
// =========================================================

app.use(passport.initialize());

app.use(passport.session());

// =========================================================
// DEBUGGING MIDDLEWARE
// =========================================================

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, {
    body: req.body,

    user: req.user
      ? {
          id: req.user.id,
          email: req.user.email,
        }
      : null,

    session: req.session?.id || null,
  });

  next();
});

// =========================================================
// BASIC ROUTE
// =========================================================

app.get("/", (req, res) => {
  res.json({
    message: "Panchakarma API is running",

    status: "OK",

    environment:
      process.env.NODE_ENV || "development",

    timestamp: new Date().toISOString(),
  });
});

// =========================================================
// HEALTH CHECK
// =========================================================

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",

    uptime: process.uptime(),

    timestamp: new Date().toISOString(),
  });
});

// =========================================================
// API ROUTES
// =========================================================

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/auth",
  oauthRoutes
);

app.use(
  "/api/practitioners",
  practitionerRoutes
);

app.use(
  "/api/schedules",
  scheduleRoutes
);

app.use(
  "/api/notifications",
  notificationRoutes
);

app.use(
  "/api/users",
  userRoutes
);

// =========================================================
// AI ROUTE
// =========================================================

app.use(
  "/api/ai",
  aiRoutes
);

// =========================================================
// ERROR HANDLER
// =========================================================

app.use(
  (err, req, res, next) => {
    console.error(
      "❌ Error:",
      err
    );

    if (
      err.message ===
      "Not allowed by CORS"
    ) {
      return res.status(403).json({
        message:
          "CORS error: origin not allowed",
      });
    }

    res.status(500).json({
      message:
        "Internal server error",

      error:
        process.env.NODE_ENV ===
        "development"
          ? err.message
          : "Something went wrong",
    });
  }
);

// =========================================================
// 404 HANDLER
// =========================================================

app.use(
  (req, res) => {
    res.status(404).json({
      message:
        "Route not found",

      path:
        req.originalUrl,
    });
  }
);

// =========================================================
// CONNECT DATABASE + START SERVER
// =========================================================

const initServer = async () => {
  try {
    await connectMongoDB();

    console.log(
      "✅ MongoDB database ready"
    );

    const server = app.listen(
      PORT,
      "0.0.0.0",
      () => {
        console.log("");
        console.log(
          "===================================="
        );

        console.log(
          `🚀 Server running on port ${PORT}`
        );

        console.log(
          "❤️ Health check available"
        );

        console.log(
          "📡 API endpoints available"
        );

        console.log(
          `🌍 Environment: ${
            process.env.NODE_ENV ||
            "development"
          }`
        );

        console.log(
          "===================================="
        );

        console.log("");
      }
    );

    // =====================================================
    // GRACEFUL SHUTDOWN - SIGTERM
    // =====================================================

    process.on(
      "SIGTERM",
      () => {
        console.log(
          "SIGTERM signal received: closing HTTP server"
        );

        server.close(
          () => {
            console.log(
              "HTTP server closed"
            );

            process.exit(0);
          }
        );
      }
    );

    // =====================================================
    // GRACEFUL SHUTDOWN - SIGINT
    // =====================================================

    process.on(
      "SIGINT",
      () => {
        console.log(
          "SIGINT signal received: closing HTTP server"
        );

        server.close(
          () => {
            console.log(
              "HTTP server closed"
            );

            process.exit(0);
          }
        );
      }
    );

  } catch (error) {
    console.error(
      "❌ Database connection error:"
    );

    console.error(
      error.message
    );

    process.exit(1);
  }
};

// =========================================================
// UNHANDLED PROMISE REJECTION
// =========================================================

process.on(
  "unhandledRejection",
  (reason, promise) => {
    console.error(
      "❌ Unhandled Rejection at:",
      promise,
      "reason:",
      reason
    );
  }
);

// =========================================================
// START APPLICATION
// =========================================================

initServer();

// =========================================================
// EXPORT APP
// =========================================================

export default app;