import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { ObjectId } from "mongodb";
import {
  RegisterInputSchema,
  LoginInputSchema,
  GoogleAuthInputSchema,
  ChangePasswordSchema,
  UpdateProfileSchema,
} from "@alpha-cut/types";
import { getUsersCollection, getTelegramBindTokensCollection } from "../db.js";
import { signAccessToken, verifyAccessToken, requireAuth, requireRole } from "../middleware/auth.js";
import { sendTelegramMessage } from "../services/telegram.js";
import { sendEmailVerificationEmail } from "../services/email.js";

const router = Router();
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "alphacutagency@gmail.com")
  .split(",")
  .map((e) => e.trim().toLowerCase());

// Helper to set secure session cookie
function setAuthCookie(res: Response, token: string, rememberMe = true) {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
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

    const { name, email, password, telegramUsername, brandName } = parseResult.data;
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
    const isSuperAdmin = role === "super_admin";

    // Generate 6-digit OTP code & 32-char verification token
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationToken = crypto.randomBytes(16).toString("hex");
    const verificationExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    const now = new Date();
    const result = await users.insertOne({
      name,
      email: normalizedEmail,
      passwordHash,
      role,
      emailVerified: isSuperAdmin,
      emailVerifiedAt: isSuperAdmin ? now : undefined,
      emailVerificationCode: isSuperAdmin ? undefined : verificationCode,
      emailVerificationToken: isSuperAdmin ? undefined : verificationToken,
      emailVerificationExpires: isSuperAdmin ? undefined : verificationExpires,
      telegramUsername: telegramUsername?.replace(/^@/, "").trim(),
      brandName: brandName?.trim(),
      createdAt: now,
      updatedAt: now,
    });

    const userId = result.insertedId.toString();

    // Dispatch verification email via Resend if client
    if (!isSuperAdmin) {
      sendEmailVerificationEmail({
        to: normalizedEmail,
        name,
        code: verificationCode,
        token: verificationToken,
      }).catch((err) => console.error("[Resend Register Dispatch Warning]:", err));
    }

    const token = signAccessToken({
      userId,
      email: normalizedEmail,
      name,
      role,
    });

    setAuthCookie(res, token, true);
    res.status(201).json({
      user: {
        id: userId,
        name,
        email: normalizedEmail,
        role,
        emailVerified: isSuperAdmin,
        telegramUsername,
        brandName,
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

    const { email, password, rememberMe } = parseResult.data;
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

    setAuthCookie(res, token, rememberMe ?? true);
    res.json({
      user: {
        id: userId,
        name: user.name,
        email: user.email,
        role,
        emailVerified: role === "super_admin" || Boolean(user.emailVerified),
        telegramId: user.telegramId,
        telegramUsername: user.telegramUsername,
        telegramLinkedAt: user.telegramLinkedAt,
        brandName: user.brandName,
        avatarUrl: user.avatarUrl,
      },
      token,
    });
  } catch (error) {
    console.error("[Auth Login Error]:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

// POST /api/auth/google (Continue with Google Sign-In)
router.post("/google", async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = GoogleAuthInputSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: "Google credential is required" });
      return;
    }

    const { credential } = parseResult.data;

    // Verify token with Google
    const googleRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
    );

    if (!googleRes.ok) {
      res.status(401).json({ error: "Google verification failed or session expired" });
      return;
    }

    const payload = (await googleRes.json()) as {
      email?: string;
      email_verified?: string | boolean;
      name?: string;
      picture?: string;
      sub?: string;
    };

    const { email, name, picture, sub: googleId } = payload;
    if (!email) {
      res.status(400).json({ error: "No email returned from Google account" });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const users = getUsersCollection();

    let user = await users.findOne({
      $or: [{ email: normalizedEmail }, { googleId }],
    });

    const role = ADMIN_EMAILS.includes(normalizedEmail) ? "super_admin" : (user?.role || "client");
    const now = new Date();

    if (!user) {
      // Create new user account via Google (Pre-verified email)
      const insertResult = await users.insertOne({
        name: name || normalizedEmail.split("@")[0],
        email: normalizedEmail,
        googleId,
        avatarUrl: picture,
        role,
        emailVerified: true,
        emailVerifiedAt: now,
        createdAt: now,
        updatedAt: now,
      });

      const userId = insertResult.insertedId.toString();
      const token = signAccessToken({
        userId,
        email: normalizedEmail,
        name: name || normalizedEmail.split("@")[0],
        role,
      });

      setAuthCookie(res, token, true);
      res.status(201).json({
        user: {
          id: userId,
          name: name || normalizedEmail.split("@")[0],
          email: normalizedEmail,
          role,
          emailVerified: true,
          avatarUrl: picture,
        },
        token,
      });
      return;
    }

    // Existing user: Link googleId & avatar if missing, ensure emailVerified is true
    await users.updateOne(
      { _id: user._id },
      {
        $set: {
          googleId,
          emailVerified: true,
          ...(picture && !user.avatarUrl ? { avatarUrl: picture } : {}),
          role,
          updatedAt: now,
        },
      }
    );

    const userId = user._id ? user._id.toString() : "";
    const token = signAccessToken({
      userId,
      email: user.email,
      name: user.name,
      role,
    });

    setAuthCookie(res, token, true);
    res.json({
      user: {
        id: userId,
        name: user.name,
        email: user.email,
        role,
        emailVerified: true,
        avatarUrl: picture || user.avatarUrl,
        telegramId: user.telegramId,
        telegramUsername: user.telegramUsername,
        telegramLinkedAt: user.telegramLinkedAt,
        brandName: user.brandName,
      },
      token,
    });
  } catch (error) {
    console.error("[Google Auth Error]:", error);
    res.status(500).json({ error: "Google sign-in failed" });
  }
});

// GET /api/auth/clients (Super Admin only: list registered clients for proposal crafting)
router.get("/clients", requireAuth, requireRole(["super_admin"]), async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = getUsersCollection();
    const clients = await users
      .find({ role: "client" })
      .project({ _id: 1, name: 1, email: 1, telegramUsername: 1, brandName: 1, avatarUrl: 1, createdAt: 1 })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({ clients });
  } catch (error) {
    console.error("[Get Clients Error]:", error);
    res.status(500).json({ error: "Failed to fetch clients" });
  }
});

// GET /api/auth/me
router.get("/me", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userPayload = req.user!;
    const users = getUsersCollection();
    let dbUser = null;
    if (ObjectId.isValid(userPayload.userId)) {
      dbUser = await users.findOne({ _id: new ObjectId(userPayload.userId) as any });
    } else {
      dbUser = await users.findOne({ email: userPayload.email });
    }

    res.json({
      user: {
        id: userPayload.userId,
        email: userPayload.email,
        name: dbUser?.name || userPayload.name,
        role: dbUser?.role || userPayload.role,
        emailVerified: userPayload.role === "super_admin" || Boolean(dbUser?.emailVerified),
        telegramId: dbUser?.telegramId,
        telegramUsername: dbUser?.telegramUsername,
        telegramLinkedAt: dbUser?.telegramLinkedAt,
        brandName: dbUser?.brandName,
        avatarUrl: dbUser?.avatarUrl,
      },
    });
  } catch {
    res.json({ user: req.user });
  }
});

// POST /api/auth/verify-email (Verify email via 6-digit OTP code or 1-click token)
router.post("/verify-email", async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, token, email } = req.body;
    const users = getUsersCollection();

    let user = null;

    // 1. Try finding by authenticated user session if token present
    const authHeader = req.headers.authorization?.replace("Bearer ", "") || req.cookies?.token;
    if (authHeader) {
      const payload = verifyAccessToken(authHeader);
      if (payload?.userId && ObjectId.isValid(payload.userId)) {
        user = await users.findOne({ _id: new ObjectId(payload.userId) as any });
      }
    }

    // 2. If not found via session, try finding via email
    if (!user && email) {
      user = await users.findOne({ email: String(email).toLowerCase().trim() });
    }

    // 3. If still not found, try matching verification token directly
    if (!user && token) {
      user = await users.findOne({ emailVerificationToken: String(token).trim() });
    }

    if (!user) {
      res.status(404).json({ error: "User account not found" });
      return;
    }

    if (user.emailVerified) {
      res.json({ message: "Email is already verified", emailVerified: true });
      return;
    }

    // Check expiration
    if (user.emailVerificationExpires && new Date(user.emailVerificationExpires).getTime() < Date.now()) {
      res.status(400).json({ error: "Verification code has expired. Please request a new one." });
      return;
    }

    // Verify code or token
    const isCodeMatch = code && user.emailVerificationCode && String(code).trim() === user.emailVerificationCode;
    const isTokenMatch = token && user.emailVerificationToken && String(token).trim() === user.emailVerificationToken;

    if (!isCodeMatch && !isTokenMatch) {
      res.status(400).json({ error: "Invalid verification code or link" });
      return;
    }

    // Mark verified and clear temporary fields
    const now = new Date();
    await users.updateOne(
      { _id: user._id },
      {
        $set: {
          emailVerified: true,
          emailVerifiedAt: now,
          updatedAt: now,
        },
        $unset: {
          emailVerificationCode: "",
          emailVerificationToken: "",
          emailVerificationExpires: "",
        },
      }
    );

    res.json({ message: "Email verified successfully!", emailVerified: true });
  } catch (error) {
    console.error("[Verify Email Error]:", error);
    res.status(500).json({ error: "Failed to verify email" });
  }
});

// POST /api/auth/resend-verification (Resend verification code via Resend)
router.post("/resend-verification", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    const users = getUsersCollection();

    let user = null;
    const authHeader = req.headers.authorization?.replace("Bearer ", "") || req.cookies?.token;
    if (authHeader) {
      const payload = verifyAccessToken(authHeader);
      if (payload?.userId && ObjectId.isValid(payload.userId)) {
        user = await users.findOne({ _id: new ObjectId(payload.userId) as any });
      }
    }

    if (!user && email) {
      user = await users.findOne({ email: String(email).toLowerCase().trim() });
    }

    if (!user) {
      res.status(404).json({ error: "Account not found" });
      return;
    }

    if (user.emailVerified) {
      res.status(400).json({ error: "Email is already verified" });
      return;
    }

    // Rate limiting: 60-second cooldown
    const lastUpdate = user.updatedAt ? new Date(user.updatedAt).getTime() : 0;
    if (Date.now() - lastUpdate < 60000) {
      const waitSeconds = Math.ceil((60000 - (Date.now() - lastUpdate)) / 1000);
      res.status(429).json({ error: `Please wait ${waitSeconds}s before requesting a new code.` });
      return;
    }

    // Generate fresh code & token
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationToken = crypto.randomBytes(16).toString("hex");
    const verificationExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
    const now = new Date();

    await users.updateOne(
      { _id: user._id },
      {
        $set: {
          emailVerificationCode: verificationCode,
          emailVerificationToken: verificationToken,
          emailVerificationExpires: verificationExpires,
          updatedAt: now,
        },
      }
    );

    await sendEmailVerificationEmail({
      to: user.email,
      name: user.name,
      code: verificationCode,
      token: verificationToken,
    });

    res.json({ message: "Verification code resent successfully" });
  } catch (error) {
    console.error("[Resend Verification Error]:", error);
    res.status(500).json({ error: "Failed to resend verification email" });
  }
});

// POST /api/auth/telegram-bind-token (Generate 1-click binding deep-link)
router.post("/telegram-bind-token", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const clientEmail = req.user!.email;

    const bindTokens = getTelegramBindTokensCollection();
    // Delete any old pending tokens for this user
    await bindTokens.deleteMany({ userId });

    // Generate 32-char hex token
    const token = crypto.randomBytes(16).toString("hex");
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000); // 15 mins

    await bindTokens.insertOne({
      token,
      userId,
      clientEmail,
      createdAt: now,
      expiresAt,
    });

    const botUsername = process.env.TELEGRAM_BOT_USERNAME || "alpha_cut_bot";
    const bindUrl = `https://t.me/${botUsername}?start=bind_${token}`;

    res.json({
      token,
      botUsername,
      bindUrl,
      expiresAt,
    });
  } catch (error) {
    console.error("[Telegram Bind Token Error]:", error);
    res.status(500).json({ error: "Failed to generate Telegram binding link" });
  }
});

// POST /api/auth/telegram-unlink (Unlink Telegram from account)
router.post("/telegram-unlink", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const users = getUsersCollection();

    if (!ObjectId.isValid(userId)) {
      res.status(400).json({ error: "Invalid user session" });
      return;
    }

    await users.updateOne(
      { _id: new ObjectId(userId) as any },
      {
        $unset: {
          telegramId: "",
          telegramUsername: "",
          telegramLinkedAt: "",
        },
        $set: { updatedAt: new Date() },
      }
    );

    res.json({ message: "Telegram account unlinked successfully" });
  } catch (error) {
    console.error("[Telegram Unlink Error]:", error);
    res.status(500).json({ error: "Failed to unlink Telegram account" });
  }
});

// POST /api/auth/telegram-test (Send test ping to verified Telegram account)
router.post("/telegram-test", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const users = getUsersCollection();

    if (!ObjectId.isValid(userId)) {
      res.status(400).json({ error: "Invalid user session" });
      return;
    }

    const user = await users.findOne({ _id: new ObjectId(userId) as any });
    if (!user || !user.telegramId) {
      res.status(400).json({ error: "No Telegram account connected to this profile yet." });
      return;
    }

    const success = await sendTelegramMessage({
      chatId: user.telegramId,
      text:
        `⚡ <b>Alpha Cut Integration Verification</b>\n\n` +
        `Hello <b>${user.name}</b>! Your Telegram is actively paired 1:1 with your Alpha Cut account (<code>${user.email}</code>).\n\n` +
        `• <b>Fast Actions:</b> Ready (1-tap proposal approvals & cut reviews)\n` +
        `• <b>Alerts:</b> Enabled\n` +
        `• <b>Security:</b> 1:1 verified binding`,
      parseMode: "HTML",
    });

    if (!success) {
      res.status(502).json({ error: "Could not deliver message to Telegram. Ensure you have not blocked the bot." });
      return;
    }

    res.json({ message: "Test ping dispatched successfully to Telegram." });
  } catch (error) {
    console.error("[Telegram Test Error]:", error);
    res.status(500).json({ error: "Failed to send test message" });
  }
});

// PATCH /api/auth/profile
router.patch("/profile", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = UpdateProfileSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: "Validation failed", details: parseResult.error.errors });
      return;
    }

    const { name, telegramUsername, brandName } = parseResult.data;
    const users = getUsersCollection();
    const userId = req.user!.userId;

    if (!ObjectId.isValid(userId)) {
      res.status(400).json({ error: "Invalid user session" });
      return;
    }

    const updateFields: any = { updatedAt: new Date() };
    if (name) updateFields.name = name.trim();
    if (telegramUsername !== undefined) {
      updateFields.telegramUsername = telegramUsername ? telegramUsername.replace(/^@/, "").trim() : "";
    }
    if (brandName !== undefined) {
      updateFields.brandName = brandName.trim();
    }

    await users.updateOne({ _id: new ObjectId(userId) as any }, { $set: updateFields });
    const updated = await users.findOne({ _id: new ObjectId(userId) as any });

    res.json({
      user: {
        id: userId,
        name: updated?.name || req.user!.name,
        email: req.user!.email,
        role: req.user!.role,
        telegramUsername: updated?.telegramUsername,
        brandName: updated?.brandName,
        avatarUrl: updated?.avatarUrl,
      },
    });
  } catch (error) {
    console.error("[Update Profile Error]:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// POST /api/auth/change-password
router.post("/change-password", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = ChangePasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: "Validation failed", details: parseResult.error.errors });
      return;
    }

    const { oldPassword, newPassword } = parseResult.data;
    const users = getUsersCollection();
    const userId = req.user!.userId;

    if (!ObjectId.isValid(userId)) {
      res.status(400).json({ error: "Invalid user session" });
      return;
    }

    const user = await users.findOne({ _id: new ObjectId(userId) as any });
    if (!user || !user.passwordHash) {
      res.status(400).json({ error: "Account was created via social login or has no password set" });
      return;
    }

    const validOld = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!validOld) {
      res.status(400).json({ error: "Current password is incorrect" });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    await users.updateOne(
      { _id: new ObjectId(userId) as any },
      { $set: { passwordHash: newPasswordHash, updatedAt: new Date() } }
    );

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("[Change Password Error]:", error);
    res.status(500).json({ error: "Failed to change password" });
  }
});

// POST /api/auth/logout
router.post("/logout", (_req: Request, res: Response): void => {
  res.clearCookie("token");
  res.json({ message: "Logged out successfully" });
});

export default router;
