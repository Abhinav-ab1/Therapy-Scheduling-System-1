import express from "express";
import session from "express-session";
import passport from "passport";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

// Import models first to initialize associations
import "./models/index.js";
import sequelize from "./config/db.js";

import "./config/googleStrategy.js";
import "./jobs/reminderJob.js";
import "./jobs/completionJob.js";

import authRoutes from "./routes/authRoutes.js";
import oauthRoutes from "./routes/oauthRoutes.js";
import practitionerRoutes from "./routes/practitionerRoutes.js";
import scheduleRoutes from "./routes/scheduleRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import userRoutes from "./routes/userRoutes.js";



//LOAD ENV
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

//  GLOBAL MIDDLEWARE 
app.use(helmet({
  crossOriginEmbedderPolicy: false, // Disable for development
}));

// Enhanced CORS configuration
app.use(
  cors({
    origin: [
      "http://localhost:3000", 
      "http://127.0.0.1:3000",
      process.env.FRONTEND_URL || "http://localhost:3000"
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

app.use(morgan("dev"));
app.use(bodyParser.json({ limit: "5mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "5mb" }));

//  SESSION & PASSPORT 
app.use(
  session({
    secret: process.env.SESSION_SECRET || "super_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production", // Only secure in production
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

//  MIDDLEWARE FOR DEBUGGING 
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, {
    body: req.body,
    user: req.user ? { id: req.user.id, email: req.user.email } : null,
    session: req.session.id,
  });
  next();
});

// ROUTES 
app.get("/", (req, res) => {
  res.json({ 
    message: "Panchakarma API is running",
    status: "OK",
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "healthy", 
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/auth", oauthRoutes);
app.use("/api/practitioners", practitionerRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/users", userRoutes);

// ERROR HANDLING MIDDLEWARE
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : "Something went wrong"
  });
});

// 404 handler
app.use("/", (req, res) => {
  res.status(404).json({
    message: "Route not found",
    path: req.originalUrl
  });
});

//  DATABASE CONNECT & START SERVER
const initServer = async () => {
  try {
    await sequelize.authenticate();
    console.log(" MySQL connected successfully");

    // Sync database models - 
    await sequelize.sync({ 
      alter: process.env.NODE_ENV === "development", 
      force: false// change kiya hai-saksham
    });
    console.log(" Database synced");

    // Test model associations
    console.log(" Testing model associations...");
    try {
      const { User, Schedule } = await import("./models/index.js");
      console.log(" Models imported successfully");
      console.log(" User associations:", Object.keys(User.associations || {}));
      console.log(" Schedule associations:", Object.keys(Schedule.associations || {}));
    } catch (modelError) {
      console.error(" Model association test failed:", modelError.message);
    }

    // Start server
    const server = app.listen(PORT, () => {
      console.log(` Server running on http://localhost:${PORT}`);
      console.log(` Health check: http://localhost:${PORT}/health`);
      console.log(` API endpoints: http://localhost:${PORT}/api`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        console.log('HTTP server closed');
        sequelize.close();
      });
    });

  } catch (err) {
    console.error(" Database connection error:", err.message);
    console.error("Full error:", err);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

initServer();

export default app;