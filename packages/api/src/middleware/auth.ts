import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import type { UserRole } from "@alpha-cut/types";
import { verifyTelegramInitData } from "../services/telegram.js";

dotenv.config();

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "alpha_cut_default_access_secret_32_chars";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "alpha_cut_default_refresh_secret_32_chars";

export interface AuthUserPayload {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  telegramId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}

export function signAccessToken(payload: AuthUserPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: "15m" });
}

export function signRefreshToken(payload: AuthUserPayload): string {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: "7d" });
}

export function verifyAccessToken(token: string): AuthUserPayload | null {
  try {
    return jwt.verify(token, ACCESS_SECRET) as AuthUserPayload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): AuthUserPayload | null {
  try {
    return jwt.verify(token, REFRESH_SECRET) as AuthUserPayload;
  } catch {
    return null;
  }
}

/**
 * Middleware ensuring a valid user session exists
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  // Check HttpOnly cookie first, then Authorization header
  const token = req.cookies?.token || req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    res.status(401).json({ error: "Invalid or expired session token" });
    return;
  }

  req.user = payload;
  next();
}

/**
 * Middleware enforcing Role-Based Access Control
 */
export function requireRole(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: "Forbidden: Insufficient permissions" });
      return;
    }

    next();
  };
}

/**
 * Middleware for Telegram Mini App requests
 */
export function requireTelegramAuth(req: Request, res: Response, next: NextFunction): void {
  const initData = req.headers["x-telegram-init-data"] as string;

  if (!initData) {
    res.status(401).json({ error: "Missing Telegram initData header" });
    return;
  }

  const { isValid, user } = verifyTelegramInitData(initData);
  if (!isValid || !user) {
    res.status(401).json({ error: "Invalid Telegram authentication data" });
    return;
  }

  req.user = {
    userId: String(user.id),
    email: user.username ? `${user.username}@t.me` : `tg_${user.id}@alphacut.internal`,
    name: `${user.first_name} ${user.last_name || ""}`.trim(),
    role: "client",
    telegramId: String(user.id),
  };

  next();
}
