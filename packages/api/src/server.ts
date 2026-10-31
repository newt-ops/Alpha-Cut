import express, { type Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import dotenv from "dotenv";
import { connectDB } from "./db.js";
import authRouter from "./routes/auth.js";
import inquiriesRouter from "./routes/inquiries.js";
import projectsRouter from "./routes/projects.js";
import financesRouter from "./routes/finances.js";
import telegramRouter from "./routes/telegram.js";

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

const allowedOrigins = [
  CLIENT_URL,
  "https://alpha-cut.com",
  "https://www.alpha-cut.com",
  "https://api.alpha-cut.com",
  "https://alpha-cut-nine.vercel.app",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "https://web.telegram.org",
].filter(Boolean);

app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Allow during development
      }
    },
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

// Routes
app.use("/api/auth", authRouter);
app.use("/api/inquiries", inquiriesRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/finances", financesRouter);
app.use("/api/telegram", telegramRouter);

// Health check
app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    service: "alpha-cut-api",
    timestamp: new Date().toISOString(),
  });
});

// Centralized error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[Unhandled API Error]:", err);
  res.status(500).json({
    error: "Internal Server Error",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

async function startServer() {
  try {
    // Attempt DB connection (non-blocking if local DB offline in dev)
    connectDB().catch((err) => {
      console.warn("[MongoDB Warning] Database not currently reachable. Ensure MongoDB Atlas URI is set in .env:", err.message);
    });

    app.listen(PORT, () => {
      console.log(`[Alpha Cut API] Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("[Fatal API Error]:", error);
    process.exit(1);
  }
}

startServer();

export default app;
