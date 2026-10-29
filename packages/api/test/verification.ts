import { InquirySchema, ProjectSchema, EditingStyleSchema } from "@alpha-cut/types";
import { verifyTelegramInitData } from "../src/services/telegram.js";
import { signAccessToken, verifyAccessToken } from "../src/middleware/auth.js";
import crypto from "crypto";

function runVerification() {
  console.log("=== Running Alpha Cut System Verification Suite ===");

  // 1. Zod Inquiries Validation Test
  console.log("Test 1: Validating Inquiry schema...");
  const validInquiry = {
    name: "Alex Creator",
    email: "alex@creator.com",
    brandHandle: "@alexcreates",
    telegramUsername: "alex_tg",
    format: "short_form",
    style: "hook_talking_head",
    notes: "Need 4 high-retention vertical cuts with multi-hook testing.",
  };
  const inqResult = InquirySchema.safeParse(validInquiry);
  if (!inqResult.success) throw new Error("Inquiry schema validation failed");
  console.log("✓ Inquiry schema validation passed");

  // 2. Zod Project Schema Test
  console.log("Test 2: Validating Project schema...");
  const validProject = {
    title: "Episode 14 Deep Work",
    clientId: "usr_12345",
    clientName: "Alex Creator",
    clientEmail: "alex@creator.com",
    format: "long_form",
    style: "storytelling_explainer",
    tier: "professional",
    assignedEditor: "amir",
    stage: "in_progress",
    price: 450,
    currency: "USD",
    revisionsAllowed: 2,
    revisionsUsed: 0,
    deadline: new Date().toISOString(),
    footageUrl: "https://drive.google.com/drive/folders/sample",
  };
  const projResult = ProjectSchema.safeParse(validProject);
  if (!projResult.success) throw new Error("Project schema validation failed");
  console.log("✓ Project schema validation passed");

  // 3. JWT Sign & Verify Test
  console.log("Test 3: Testing JWT Auth generation and verification...");
  const userPayload = {
    userId: "usr_amir_001",
    email: "alphacutagency@gmail.com",
    name: "Amir",
    role: "super_admin" as const,
  };
  const token = signAccessToken(userPayload);
  const decoded = verifyAccessToken(token);
  if (!decoded || decoded.userId !== userPayload.userId || decoded.role !== "super_admin") {
    throw new Error("JWT token verification failed");
  }
  console.log("✓ JWT Auth signing and decoding passed");

  // 4. Telegram HMAC-SHA256 InitData Test
  console.log("Test 4: Testing Telegram initData HMAC-SHA256 verification...");
  const mockToken = "1234567890:ABCdefGHIjklMNOpqrSTUvwxYZ";
  process.env.TELEGRAM_BOT_TOKEN = mockToken;

  const mockUser = JSON.stringify({ id: 987654321, first_name: "John", username: "john_doe" });
  const authDate = "1700000000";
  const dataCheckString = `auth_date=${authDate}\nuser=${mockUser}`;
  const secretKey = crypto.createHmac("sha256", "WebAppData").update(mockToken).digest();
  const hash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
  const validInitData = `auth_date=${authDate}&user=${encodeURIComponent(mockUser)}&hash=${hash}`;

  const tgResult = verifyTelegramInitData(validInitData, mockToken);
  if (!tgResult.isValid || tgResult.user?.id !== 987654321) {
    throw new Error("Telegram initData verification failed");
  }
  console.log("✓ Telegram initData HMAC validation passed");

  console.log("\n=== ALL 4 VERIFICATION TESTS PASSED SUCCESSFULLY ===");
}

runVerification();
