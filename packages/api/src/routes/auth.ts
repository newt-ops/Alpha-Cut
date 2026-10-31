import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { RegisterInputSchema, LoginInputSchema } from "@alpha-cut/types";
import { getUsersCollection } from "../db.js";
import { signAccessToken, requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "alphacutagency@gmail.com")
  .split(",")
  .map((e) => e.trim().toLowerCase());

// Helper to set secure session cookie
function setAuthCookie(res: Response, token: string) {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

// POST /api/auth/register
router.post("/register", async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = RegisterInputSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: "Validation failed", details: parseResult.error.errors });
      return;
    }

    const { name, email, password, telegramUsername } = parseResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    const users = getUsersCollection();
    const existing = await users.findOne({ email: normalizedEmail });
    if (existing) {
      res.status(409).json({ error: "An account with this email already exists" });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // If email is in admin whitelist, assign super_admin; otherwise client
    const role = ADMIN_EMAILS.includes(normalizedEmail) ? "super_admin" : "client";

    const now = new Date();
    const result = await users.insertOne({
      name,
      email: normalizedEmail,
      passwordHash,
      role,
      telegramUsername: telegramUsername?.replace(/^@/, "").trim(),
      createdAt: now,
      updatedAt: now,
    });

    const userId = result.insertedId.toString();
    const token = signAccessToken({
      userId,
      email: normalizedEmail,
      name,
      role,
    });

    setAuthCookie(res, token);
    res.status(201).json({
      user: {
        id: userId,
        name,
        email: normalizedEmail,
        role,
        telegramUsername,
      },
      token,
    });
  } catch (error) {
    console.error("[Auth Register Error]:", error);
    res.status(500).json({ error: "Failed to register account" });
  }
});

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = LoginInputSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: "Invalid login credentials" });
      return;
    }

    const { email, password } = parseResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    const users = getUsersCollection();
    const user = await users.findOne({ email: normalizedEmail });
    if (!user || !user.passwordHash) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const role = ADMIN_EMAILS.includes(normalizedEmail) ? "super_admin" : (user.role || "client");
    if (user.role !== role) {
      await users.updateOne({ _id: user._id }, { $set: { role, updatedAt: new Date() } });
    }

    const userId = user._id ? user._id.toString() : "";
    const token = signAccessToken({
      userId,
      email: user.email,
      name: user.name,
      role,
    });

    setAuthCookie(res, token);
    res.json({
      user: {
        id: userId,
        name: user.name,
        email: user.email,
        role,
        telegramUsername: user.telegramUsername,
      },
      token,
    });
  } catch (error) {
    console.error("[Auth Login Error]:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

// GET /api/auth/clients (Super Admin only: list registered clients for proposal crafting)
router.get("/clients", requireAuth, requireRole(["super_admin"]), async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = getUsersCollection();
    const clients = await users
      .find({ role: "client" })
      .project({ _id: 1, name: 1, email: 1, telegramUsername: 1, createdAt: 1 })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({ clients });
  } catch (error) {
    console.error("[Get Clients Error]:", error);
    res.status(500).json({ error: "Failed to fetch clients" });
  }
});

// GET /api/auth/me
router.get("/me", requireAuth, (req: Request, res: Response): void => {
  res.json({ user: req.user });
});

// POST /api/auth/logout
router.post("/logout", (_req: Request, res: Response): void => {
  res.clearCookie("token");
  res.json({ message: "Logged out successfully" });
});

export default router;

