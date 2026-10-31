import { Router, Request, Response } from "express";
import { getProjectsCollection, getInquiriesCollection } from "../db.js";
import { sendTelegramMessage } from "../services/telegram.js";
import { EDITING_STYLES, type EditingStyle } from "@alpha-cut/types";

const router = Router();
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;
const CLIENT_URL = process.env.CLIENT_URL || "https://alpha-cut.com";
const PORTAL_URL = `${CLIENT_URL}/portal`;

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
    const command = text.split(" ")[0].toLowerCase();
    const senderName = message.from?.first_name || "there";

    // 1. /start command & deep-linking
    if (command === "/start") {
      const parts = text.split(" ");
      const param = parts[1];

      if (param && param.startsWith("proposal_")) {
        const proposalId = param.replace("proposal_", "");
        await sendTelegramMessage({
          chatId,
          text: `🎬 <b>Alpha Cut Project Proposal</b>\n\nReview your custom editing scope, deliverables, and package tier inside the portal.`,
          parseMode: "HTML",
          replyMarkup: {
            inline_keyboard: [
              [
                {
                  text: "⚡ Review & Accept Proposal",
                  url: `${PORTAL_URL}?proposal=${proposalId}`,
                },
              ],
            ],
          },
        });
      } else if (param && param.startsWith("project_")) {
        const projectId = param.replace("project_", "");
        await sendTelegramMessage({
          chatId,
          text: `🎬 <b>Alpha Cut Project Update</b>\n\nYour video edit is being processed or ready for review.`,
          parseMode: "HTML",
          replyMarkup: {
            inline_keyboard: [
              [
                {
                  text: "🎬 Open Video Project",
                  url: `${PORTAL_URL}?project=${projectId}`,
                },
              ],
            ],
          },
        });
      } else {
        await sendTelegramMessage({
          chatId,
          text: `👋 Hey <b>${senderName}</b>! Welcome to <b>Alpha Cut Video Editing Agency</b> 🎬\n\nWe engineer retention-driven, cinematic video edits for creators, founders, and modern brands.\n\n<b>Quick Commands:</b>\n• /status — Check live pipeline capacity\n• /packages — View editing tiers & rates\n• /styles — Browse signature editing styles\n• /projects — View active video contracts\n• /about — Meet founders Amir & Aymen\n\nTap below to launch your client portal or submit a new brief:`,
          parseMode: "HTML",
          replyMarkup: {
            inline_keyboard: [
              [
                { text: "🚀 Open Client Portal", url: PORTAL_URL },
                { text: "📝 Submit New Brief", url: `${CLIENT_URL}#inquiry` },
              ],
              [
                { text: "🌐 Visit Official Website", url: CLIENT_URL },
              ],
            ],
          },
        });
      }
    } 

    // 2. /menu command
    else if (command === "/menu") {
      await sendTelegramMessage({
        chatId,
        text: `🎛 <b>Alpha Cut Agency Menu</b>\n\nSelect an option below to manage projects, review editing packages, or check pipeline status:`,
        parseMode: "HTML",
        replyMarkup: {
          inline_keyboard: [
            [
              { text: "📊 Operational Status", callback_data: "cmd_status" },
              { text: "🎬 Active Projects", callback_data: "cmd_projects" },
            ],
            [
              { text: "💎 Pricing & Packages", callback_data: "cmd_packages" },
              { text: "🎨 Editing Styles", callback_data: "cmd_styles" },
            ],
            [
              { text: "🚀 Open Client Workspace", url: PORTAL_URL },
              { text: "ℹ️ About Agency", callback_data: "cmd_about" },
            ],
          ],
        },
      });
    }

    // 3. /status command
    else if (command === "/status") {
      const projects = getProjectsCollection();
      const inquiries = getInquiriesCollection();

      const activeCount = await projects.countDocuments({
        stage: { $in: ["in_progress", "in_review", "revision_requested"] },
      });
      const pendingInquiries = await inquiries.countDocuments({ status: "new" });

      await sendTelegramMessage({
        chatId,
        text: `📊 <b>Alpha Cut Operational Snapshot</b>\n\n• <b>Active In-Flight Edits:</b> ${activeCount}\n• <b>New Leads in Review:</b> ${pendingInquiries}\n• <b>System Health:</b> Operational ⚡\n• <b>Current Delivery Window:</b> 48–72 hours\n\nNeed a custom video package? Tap below to submit a brief:`,
        parseMode: "HTML",
        replyMarkup: {
          inline_keyboard: [
            [{ text: "📝 Submit Video Brief", url: `${CLIENT_URL}#inquiry` }],
          ],
        },
      });
    }

    // 4. /projects command
    else if (command === "/projects") {
      const projects = getProjectsCollection();
      const list = await projects
        .find({ stage: { $ne: "completed" } })
        .limit(8)
        .toArray();

      if (list.length === 0) {
        await sendTelegramMessage({
          chatId,
          text: `🎬 <b>Active Pipeline</b>\n\nNo active video cuts currently in production. Capacity is fully open for new briefs!`,
          parseMode: "HTML",
          replyMarkup: {
            inline_keyboard: [
              [{ text: "⚡ Submit New Brief", url: `${CLIENT_URL}#inquiry` }],
            ],
          },
        });
      } else {
        const lines = list.map((p, idx) => {
          const editor = p.assignedEditor === "amir" ? "Amir" : p.assignedEditor === "aymen" ? "Aymen" : "Unassigned";
          return `${idx + 1}. <b>${p.title}</b>\n   • Stage: <code>${p.stage}</code> | Editor: ${editor}`;
        });

        await sendTelegramMessage({
          chatId,
          text: `🎬 <b>Active Production Pipeline (${list.length} in-flight):</b>\n\n${lines.join("\n\n")}`,
          parseMode: "HTML",
          replyMarkup: {
            inline_keyboard: [
              [{ text: "🚀 Open Client Portal", url: PORTAL_URL }],
            ],
          },
        });
      }
    }

    // 5. /deadlines command
    else if (command === "/deadlines") {
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
        await sendTelegramMessage({
          chatId,
          text: `✅ <b>No Urgent Deadlines</b>\n\nAll current deliverables are comfortably on schedule within the next 48 hours.`,
          parseMode: "HTML",
        });
      } else {
        const lines = urgent.map(
          (p) => `⏳ <b>${p.title}</b> — Due: <code>${new Date(p.deadline).toLocaleDateString()}</code> (${p.assignedEditor})`
        );
        await sendTelegramMessage({
          chatId,
          text: `⚠️ <b>Deliverables Due in &lt; 48 Hours:</b>\n\n${lines.join("\n")}`,
          parseMode: "HTML",
        });
      }
    }

    // 6. /packages command
    else if (command === "/packages") {
      await sendTelegramMessage({
        chatId,
        text: `💎 <b>Alpha Cut Editing Packages & Rates</b>\n\n<b>1. Basic Tier — $250 - $450</b>\n• Fast pacing & clean rhythm\n• Essential sound design & audio mastering\n• Clean subtitles & color balancing\n• 2 revision rounds\n\n<b>2. Professional Tier — $450 - $850 (Most Popular)</b>\n• Dynamic motion graphics & kinetic typography\n• Retention pattern interrupts & bespoke sound FX\n• 2 custom thumbnail variants included\n• 3 revision rounds + 48h turnaround\n\n<b>3. Premium Tier — $850 - $1,500+</b>\n• Film-grade color grading & bespoke animation\n• Multi-hook A/B testing package\n• Dedicated lead editor (Amir or Aymen)\n• Unlimited revision priority & VIP communication\n\n<i>All packages include 100% money-back guarantee if initial cut does not align with brief.</i>`,
        parseMode: "HTML",
        replyMarkup: {
          inline_keyboard: [
            [
              { text: "📝 Request Custom Quote", url: `${CLIENT_URL}#inquiry` },
              { text: "🚀 Launch Portal", url: PORTAL_URL },
            ],
          ],
        },
      });
    }

    // 7. /styles command
    else if (command === "/styles") {
      const styleItems = Object.entries(EDITING_STYLES).map(([key, item]) => {
        return `• <b>${item.label}</b>\n  ${item.tagline}\n  <i>Best for: ${item.bestFor}</i>`;
      });

      await sendTelegramMessage({
        chatId,
        text: `🎨 <b>Our 5 Signature Editing Styles</b>\n\n${styleItems.join("\n\n")}\n\nHave footage ready in one of these styles? Tap below to submit:`,
        parseMode: "HTML",
        replyMarkup: {
          inline_keyboard: [
            [{ text: "🎬 Choose Style & Submit Brief", url: `${CLIENT_URL}#inquiry` }],
          ],
        },
      });
    }

    // 8. /about command
    else if (command === "/about") {
      await sendTelegramMessage({
        chatId,
        text: `ℹ️ <b>About Alpha Cut Agency</b>\n\nAlpha Cut is a boutique video editing agency founded and operated by:\n\n• <b>Amir</b> — Lead Video Editor & Creative Director (Mastery in Premiere Pro, DaVinci Resolve & narrative pacing).\n• <b>Aymen</b> — Full-Stack Engineer & Motion Editor (Specialized in After Effects, kinetic typography & SaaS product animations).\n\n<b>Our Mission:</b>\nTurn raw footage into high-retention digital assets that build authority and drive conversions.\n\n🌐 <b>Website:</b> <a href="${CLIENT_URL}">alpha-cut.com</a>\n📧 <b>Email:</b> alphacutagency@gmail.com`,
        parseMode: "HTML",
        replyMarkup: {
          inline_keyboard: [
            [{ text: "🌐 Explore Portfolio", url: `${CLIENT_URL}#portfolio` }],
            [{ text: "💬 Direct Support", url: "https://t.me/alpha_cut_bot" }],
          ],
        },
      });
    }

    // 9. /help command
    else if (command === "/help") {
      await sendTelegramMessage({
        chatId,
        text: `📖 <b>Alpha Cut Bot Help & Commands</b>\n\nHere are the commands you can use anytime:\n\n/start — Launch the welcome message & portal links\n/menu — Open interactive control menu\n/status — Check live editing queue & turnaround\n/packages — Review pricing tiers & inclusions\n/styles — Explore our 5 signature video styles\n/projects — View active production pipeline\n/deadlines — Check deliverable deadlines\n/about — Meet founders Amir & Aymen\n\nNeed to submit footage or check an existing order?\nUse the button below:`,
        parseMode: "HTML",
        replyMarkup: {
          inline_keyboard: [
            [
              { text: "🚀 Open Client Portal", url: PORTAL_URL },
              { text: "📝 Submit New Brief", url: `${CLIENT_URL}#inquiry` },
            ],
          ],
        },
      });
    }

    // 10. Fallback for free-form user messages
    else {
      await sendTelegramMessage({
        chatId,
        text: `Thanks for messaging <b>Alpha Cut Agency</b>! 🎬\n\nI received your message. You can use the menu below to navigate our services, check live status, or launch your client portal:`,
        parseMode: "HTML",
        replyMarkup: {
          inline_keyboard: [
            [
              { text: "🚀 Open Client Portal", url: PORTAL_URL },
              { text: "📊 Check Queue Status", callback_data: "cmd_status" },
            ],
            [
              { text: "💎 View Packages", callback_data: "cmd_packages" },
              { text: "🎨 Browse Styles", callback_data: "cmd_styles" },
            ],
          ],
        },
      });
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("[Telegram Webhook Error]:", error);
    res.sendStatus(500);
  }
});

export default router;
