import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import dotenv from "dotenv";

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

app.use(helmet());
app.use(
  cors({
    origin: [CLIENT_URL, "https://web.telegram.org"],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

// Basic health check route
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "alpha-cut-api",
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`[Alpha Cut API] Server running on port ${PORT}`);
});

export default app;

