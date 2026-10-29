import { Router, Request, Response } from "express";
import { getProjectsCollection, getInquiriesCollection } from "../db.js";
import { sendTelegramMessage } from "../services/telegram.js";

const router = Router();
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;
const MINIAPP_URL = process.env.MINIAPP_URL || "https://t.me/alpha_cut_bot/app";

router.post("/webhook", async (req: Request, res: Response): Promise<void> => {
  try {
    // Secret token check
    const secret = req.headers["x-telegram-bot-api-secret-token"];
    if (WEBHOOK_SECRET && secret !== WEBHOOK_SECRET) {
      res.status(401).json({ error: "Invalid webhook secret" });
      return;
    }

    const { message } = req.body;
    if (!message || !message.text) {
      res.sendStatus(200);
      return;
    }

    const chatId = message.chat.id;
    const text = message.text.trim();

    if (text.startsWith("/start")) {
      const parts = text.split(" ");
      const param = parts[1];

      if (param && param.startsWith("proposal_")) {
        const proposalId = param.replace("proposal_", "");
        await sendTelegramMessage({
          chatId,
          text: `🎬 *Alpha Cut Project Proposal Ready*\n\nReview your custom editing scope, deliverables, and package tier inside the portal.`,
          replyMarkup: {
            inline_keyboard: [
              [
                {
                  text: "Review & Accept Proposal ⚡",
                  web_app: { url: `${MINIAPP_URL}?proposal=${proposalId}` },
                },
              ],
            ],
          },
        });
      } else if (param && param.startsWith("project_")) {
        const projectId = param.replace("project_", "");
        await sendTelegramMessage({
          chatId,
          text: `🎬 *Alpha Cut Project Update*\n\nYour video edit is being processed or ready for review.`,
          replyMarkup: {
            inline_keyboard: [
              [
                {
                  text: "Open Video Project 🎬",
                  web_app: { url: `${MINIAPP_URL}?project=${projectId}` },
                },
              ],
            ],
          },
        });
      } else {
        await sendTelegramMessage({
          chatId,
          text: `Welcome to *Alpha Cut Video Editing Agency* 🎬\n\nWe engineer video content for maximum retention, hook strength, and brand conversion.\n\nTap below to launch our client workspace, submit a brief, or review active cuts.`,
          replyMarkup: {
            inline_keyboard: [
              [
                {
                  text: "Open Client Portal 🚀",
                  web_app: { url: MINIAPP_URL },
                },
              ],
            ],
          },
        });
      }
    } else if (text === "/status") {
      const projects = getProjectsCollection();
      const inquiries = getInquiriesCollection();

      const activeCount = await projects.countDocuments({
        stage: { $in: ["in_progress", "in_review", "revision_requested"] },
      });
      const pendingInquiries = await inquiries.countDocuments({ status: "new" });

      await sendTelegramMessage({
        chatId,
        text: `📊 *Alpha Cut Operational Snapshot*\n\n• Active In-Flight Edits: *${activeCount}*\n• New Unassigned Inquiries: *${pendingInquiries}*`,
      });
    } else if (text === "/projects") {
      const projects = getProjectsCollection();
      const list = await projects
        .find({ stage: { $ne: "completed" } })
        .limit(10)
        .toArray();

      if (list.length === 0) {
        await sendTelegramMessage({ chatId, text: "No active projects in the pipeline." });
      } else {
        const lines = list.map(
          (p) => `• *${p.title}* (${p.stage}) - Editor: ${p.assignedEditor}`
        );
        await sendTelegramMessage({
          chatId,
          text: `🎬 *Active Pipeline:*\n\n${lines.join("\n")}`,
        });
      }
    } else if (text === "/deadlines") {
      const projects = getProjectsCollection();
      const now = new Date();
      const twoDaysFromNow = new Date(now.getTime() + 48 * 60 * 60 * 1000);

      const urgent = await projects
        .find({
          deadline: { $gte: now, $lte: twoDaysFromNow },
          stage: { $in: ["in_progress", "in_review", "revision_requested"] },
        })
        .toArray();

      if (urgent.length === 0) {
        await sendTelegramMessage({ chatId, text: "✅ No urgent deadlines within the next 48 hours." });
      } else {
        const lines = urgent.map(
          (p) => `⏳ *${p.title}* - Due: ${new Date(p.deadline).toLocaleDateString()} (${p.assignedEditor})`
        );
        await sendTelegramMessage({
          chatId,
          text: `⚠️ *Deliverables Due in < 48 Hours:*\n\n${lines.join("\n")}`,
        });
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("[Telegram Webhook Error]:", error);
    res.sendStatus(500);
  }
});

export default router;
