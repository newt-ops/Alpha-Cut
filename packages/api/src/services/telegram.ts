import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;

/**
 * Validates Telegram Mini App initData signature according to official Telegram spec
 */
export function verifyTelegramInitData(initData: string): { isValid: boolean; user?: any } {
  if (!BOT_TOKEN || !initData) {
    return { isValid: false };
  }

  try {
    const params = new URLSearchParams(initData);
    const hash = params.get("hash");
    if (!hash) return { isValid: false };

    params.delete("hash");

    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join("\n");

    const secretKey = crypto.createHmac("sha256", "WebAppData").update(BOT_TOKEN).digest();
    const calculatedHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

    if (calculatedHash !== hash) {
      return { isValid: false };
    }

    const userParam = params.get("user");
    const user = userParam ? JSON.parse(userParam) : undefined;
    return { isValid: true, user };
  } catch (error) {
    console.error("[Telegram Auth] Verification error:", error);
    return { isValid: false };
  }
}

/**
 * Sends a message via Telegram Bot API
 */
export async function sendTelegramMessage(params: {
  chatId: string | number;
  text: string;
  replyMarkup?: any;
}): Promise<boolean> {
  if (!BOT_TOKEN) {
    console.log(`[Telegram Mock] Sending to ${params.chatId}: ${params.text}`);
    return true;
  }

  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: params.chatId,
        text: params.text,
        parse_mode: "Markdown",
        reply_markup: params.replyMarkup,
      }),
    });

    const data = await response.json();
    return data.ok;
  } catch (error) {
    console.error("[Telegram API Error] Failed to send message:", error);
    return false;
  }
}

/**
 * Dispatches an instant alert to Amir & Aymen
 */
export async function notifyAdmins(text: string, replyMarkup?: any): Promise<void> {
  if (ADMIN_CHAT_ID) {
    await sendTelegramMessage({
      chatId: ADMIN_CHAT_ID,
      text,
      replyMarkup,
    });
  } else {
    console.log(`[Telegram Admin Notification]:\n${text}`);
  }
}
