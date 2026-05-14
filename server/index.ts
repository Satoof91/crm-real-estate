import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import cors from "cors";
import path from "path";
import { passport } from "./auth";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";

const app = express();
app.set("trust proxy", 1);

// CORS configuration for Capacitor native apps
app.use(cors({
  origin: [
    'capacitor://localhost',    // iOS Capacitor
    'http://localhost',         // Android Capacitor
    'https://localhost',        // Capacitor with HTTPS scheme
    'http://localhost:5173',    // Vite dev server
    'http://localhost:5000',    // Express dev server
    'http://localhost:5012',    // Alternative dev port
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Serve uploaded files
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

const PgStore = connectPgSimple(session);

// Session configuration
app.use(
  session({
    store: process.env.NODE_ENV === "production" && pool
      ? new PgStore({ pool, createTableIfMissing: true })
      : undefined,
    secret: process.env.SESSION_SECRET || "your-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days for mobile persistence
    },
  })
);

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Ensure tables that exist only in SQLite schema are also present in PG.
  // Using raw SQL with IF NOT EXISTS so this is safe to run on every startup.
  if (pool) {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        id VARCHAR PRIMARY KEY,
        key TEXT NOT NULL UNIQUE,
        value TEXT NOT NULL,
        description TEXT,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query(`
      ALTER TABLE contacts ADD COLUMN IF NOT EXISTS auto_notification INTEGER NOT NULL DEFAULT 1
    `);
  }

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5012 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5012', 10);
  const host = process.platform === 'win32' ? 'localhost' : '0.0.0.0';
  server.listen(port, host, () => {
    log(`serving on port ${port}`);
  });
})();
