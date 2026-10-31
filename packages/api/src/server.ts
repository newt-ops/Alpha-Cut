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
  "https://app.alpha-cut.com",
  "https://api.alpha-cut.com",
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
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".alpha-cut.com")) {
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

// Root / Gateway Status Dashboard
const renderGatewayStatus = (req: Request, res: Response) => {
  const uptimeSeconds = Math.floor(process.uptime());
  const hours = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = uptimeSeconds % 60;
  const uptimeString = `${hours}h ${minutes}m ${seconds}s`;

  if (req.accepts("html")) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Alpha Cut — API Gateway</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #0A0A0C;
      color: #EDEDED;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      -webkit-font-smoothing: antialiased;
    }
    .card {
      width: 100%;
      max-width: 560px;
      background: #121216;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 28px;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .logo {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: #2481CC;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 13px;
      letter-spacing: 0.5px;
    }
    .title {
      font-size: 16px;
      font-weight: 700;
      color: #FFFFFF;
      letter-spacing: -0.2px;
    }
    .subtitle {
      font-size: 12px;
      color: #8E8E93;
      margin-top: 2px;
    }
    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 999px;
      background: rgba(34, 197, 94, 0.1);
      border: 1px solid rgba(34, 197, 94, 0.25);
      color: #4ADE80;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #22C55E;
      box-shadow: 0 0 8px #22C55E;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      margin-bottom: 20px;
    }
    .meta-item {
      background: #0E0E12;
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 10px;
      padding: 12px;
    }
    .meta-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #636366;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .meta-value {
      font-size: 13px;
      color: #EDEDED;
      font-weight: 500;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
    .section-title {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: #8E8E93;
      font-weight: 600;
      margin-bottom: 10px;
    }
    .endpoints {
      background: #0E0E12;
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 10px;
      overflow: hidden;
      margin-bottom: 20px;
    }
    .endpoint-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 9px 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      font-size: 12px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
    .endpoint-row:last-child { border-bottom: none; }
    .method {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 700;
      background: rgba(36, 129, 204, 0.15);
      color: #5AC8FA;
    }
    .path { color: #EDEDED; margin-left: 8px; }
    .desc { color: #636366; font-size: 11px; font-family: -apple-system, sans-serif; }
    .links {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }
    .link-btn {
      display: block;
      text-align: center;
      padding: 10px;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.06);
      color: #EDEDED;
      text-decoration: none;
      font-size: 11px;
      font-weight: 600;
      transition: all 0.15s ease;
    }
    .link-btn:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.15);
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="brand">
        <div class="logo">AC</div>
        <div>
          <div class="title">Alpha Cut API Gateway</div>
          <div class="subtitle">Production Backend Services</div>
        </div>
      </div>
      <div class="status-pill">
        <span class="status-dot"></span>
        <span>Operational</span>
      </div>
    </div>
    
    <div class="meta-grid">
      <div class="meta-item">
        <div class="meta-label">Environment</div>
        <div class="meta-value">${process.env.NODE_ENV || "production"}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Region</div>
        <div class="meta-value">frankfurt (fra1)</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Service Health</div>
        <div class="meta-value">200 OK</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Uptime</div>
        <div class="meta-value">${uptimeString}</div>
      </div>
    </div>

    <div class="section-title">Core Endpoints</div>
    <div class="endpoints">
      <div class="endpoint-row">
        <div><span class="method">GET</span><span class="path">/api/health</span></div>
        <span class="desc">Heartbeat</span>
      </div>
      <div class="endpoint-row">
        <div><span class="method">POST</span><span class="path">/api/auth/*</span></div>
        <span class="desc">Session & WebApp Auth</span>
      </div>
      <div class="endpoint-row">
        <div><span class="method">ALL</span><span class="path">/api/projects/*</span></div>
        <span class="desc">Pipeline & Revisions</span>
      </div>
      <div class="endpoint-row">
        <div><span class="method">POST</span><span class="path">/api/inquiries</span></div>
        <span class="desc">Client Intake</span>
      </div>
      <div class="endpoint-row">
        <div><span class="method">POST</span><span class="path">/api/telegram/webhook</span></div>
        <span class="desc">Bot Dispatcher</span>
      </div>
    </div>

    <div class="section-title">Connected Surfaces</div>
    <div class="links">
      <a href="https://alpha-cut.com" target="_blank" class="link-btn">Marketing Site</a>
      <a href="https://app.alpha-cut.com" target="_blank" class="link-btn">Mini App</a>
      <a href="https://t.me/alpha_cut_bot" target="_blank" class="link-btn">Telegram Bot</a>
    </div>
  </div>
</body>
</html>`);
    return;
  }

  res.json({
    service: "alpha-cut-api",
    name: "Alpha Cut API Gateway",
    status: "operational",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "production",
    region: "frankfurt",
    uptimeSeconds,
    uptime: uptimeString,
    timestamp: new Date().toISOString(),
    endpoints: {
      health: "/api/health",
      auth: "/api/auth",
      projects: "/api/projects",
      inquiries: "/api/inquiries",
      telegram: "/api/telegram/webhook",
    },
    surfaces: {
      website: "https://alpha-cut.com",
      app: "https://app.alpha-cut.com",
      bot: "https://t.me/alpha_cut_bot",
    },
  });
};

app.get("/", renderGatewayStatus);
app.get("/api", renderGatewayStatus);

// 404 handler for unmatched routes
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: "Not Found",
    message: `Cannot ${req.method} ${req.originalUrl}`,
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

    // Automated Keep-Alive self-ping to prevent Render Free Tier sleep
    if (process.env.NODE_ENV === "production" && process.env.SERVER_URL) {
      const pingUrl = `${process.env.SERVER_URL}/api/health`;
      const INTERVAL_MS = 12 * 60 * 1000; // 12 minutes
      setInterval(async () => {
        try {
          const res = await fetch(pingUrl);
          if (res.ok) {
            console.log(`[KeepAlive] Pinged ${pingUrl} successfully at ${new Date().toISOString()}`);
          }
        } catch (err: any) {
          console.warn("[KeepAlive Warning] Ping failed:", err.message);
        }
      }, INTERVAL_MS);
    }

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
