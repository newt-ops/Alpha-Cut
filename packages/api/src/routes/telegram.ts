import { Router, Request, Response } from "express";
import {
  getProjectsCollection,
  getInquiriesCollection,
  getProposalsCollection,
  getInvoicesCollection,
} from "../db.js";
import { sendTelegramMessage, answerCallbackQuery } from "../services/telegram.js";
import { EDITING_STYLES } from "@alpha-cut/types";

const router = Router();
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;
const CLIENT_URL = process.env.CLIENT_URL || "https://alpha-cut.com";
const MINIAPP_URL = process.env.MINIAPP_URL || "https://app.alpha-cut.com";
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;
const ADMIN_USERNAMES = ["amir_alpha_cut", "aymen_editor"];

router.post("/webhook", async (req: Request, res: Response): Promise<void> => {
  try {
    // Secret token check
    const secret = req.headers["x-telegram-bot-api-secret-token"];
    if (WEBHOOK_SECRET && secret !== WEBHOOK_SECRET) {
      res.status(401).json({ error: "Invalid webhook secret" });
      return;
    }

    const { message, callback_query } = req.body;

    let chatId: number | string | undefined;
    let text = "";
    let callbackId: string | undefined;
    let senderName = "there";
    let senderUsername = "";

    if (callback_query) {
      chatId = callback_query.message?.chat?.id;
      text = callback_query.data || "";
      callbackId = callback_query.id;
      senderName = callback_query.from?.first_name || "there";
      senderUsername = (callback_query.from?.username || "").toLowerCase();
      if (callbackId) {
        await answerCallbackQuery(callbackId);
      }
    } else if (message && message.text) {
      chatId = message.chat.id;
      text = message.text.trim();
      senderName = message.from?.first_name || "there";
      senderUsername = (message.from?.username || "").toLowerCase();
    } else {
      res.sendStatus(200);
      return;
    }

    if (!chatId) {
      res.sendStatus(200);
      return;
    }

    const isSuperAdmin =
      (ADMIN_CHAT_ID && String(chatId) === String(ADMIN_CHAT_ID)) ||
      ADMIN_USERNAMES.includes(senderUsername);

    const command = text.split(" ")[0].toLowerCase();

    // ==========================================
    // 1. SUPER ADMIN WORKFLOW & COMMANDS
    // ==========================================
    if (isSuperAdmin) {
      const projects = getProjectsCollection();
      const proposals = getProposalsCollection();
      const inquiries = getInquiriesCollection();
      const invoices = getInvoicesCollection();

      // Admin Start & Menu
      if (command === "/start" || command === "/admin" || command === "/menu" || command === "admin_menu") {
        const activeCount = await projects.countDocuments({ stage: { $in: ["in_progress", "in_review", "revision_requested"] } });
        const pendingProposals = await proposals.countDocuments({ status: { $in: ["draft", "sent", "viewed", "revision_requested"] } });
        const newInquiries = await inquiries.countDocuments({ status: "new" });

        await sendTelegramMessage({
          chatId,
          text:
            `👑 <b>Alpha Cut Agency Executive Command</b>\n\n` +
            `Welcome back, <b>${senderName}</b>. Here is your operational snapshot:\n\n` +
            `• <b>Active Cuts in Production:</b> ${activeCount}\n` +
            `• <b>Active Proposals:</b> ${pendingProposals}\n` +
            `• <b>New Leads / Inquiries:</b> ${newInquiries}\n\n` +
            `<b>Quick Executive Commands:</b>\n` +
            `• /proposals — Review sent & negotiating proposals\n` +
            `• /pipeline — Check active editor timelines\n` +
            `• /finance — Review invoices & revenue ledger\n` +
            `• /status — Global capacity & system health`,
          parseMode: "HTML",
          replyMarkup: {
            inline_keyboard: [
              [
                { text: "📊 Open Admin ERP", url: `${CLIENT_URL}/admin` },
                { text: "📑 View Proposals", callback_data: "admin_proposals" },
              ],
              [
                { text: "🎬 Production Pipeline", callback_data: "admin_pipeline" },
                { text: "💰 Financial Ledger", callback_data: "admin_finance" },
              ],
              [
                { text: "🚀 Preview Client Mini App", web_app: { url: MINIAPP_URL } },
              ],
            ],
          },
        });
        res.sendStatus(200);
        return;
      }

      // Admin Proposals List
      if (command === "/proposals" || command === "admin_proposals") {
        const list = await proposals.find({}).sort({ updatedAt: -1 }).limit(6).toArray();
        if (list.length === 0) {
          await sendTelegramMessage({
            chatId,
            text: `📑 <b>Proposals Board</b>\n\nNo proposals currently created. You can craft one in the Admin ERP.`,
            parseMode: "HTML",
            replyMarkup: {
              inline_keyboard: [[{ text: "📝 Craft Proposal in ERP", url: `${CLIENT_URL}/admin` }]],
            },
          });
        } else {
          const lines = list.map((p, idx) => {
            const v = p.versions[p.currentVersion - 1];
            return `${idx + 1}. <b>${p.proposalNumber}</b> (v${p.currentVersion}) — <code>${p.status.toUpperCase()}</code>\n   • Client: ${p.clientName} | ${v.price} ${v.currency}`;
          });

          await sendTelegramMessage({
            chatId,
            text: `📑 <b>Recent Client Proposals (${list.length}):</b>\n\n${lines.join("\n\n")}`,
            parseMode: "HTML",
            replyMarkup: {
              inline_keyboard: [
                [{ text: "📊 Open Proposal Manager", url: `${CLIENT_URL}/admin` }],
                [{ text: "⬅️ Back to Command Menu", callback_data: "admin_menu" }],
              ],
            },
          });
        }
        res.sendStatus(200);
        return;
      }

      // Admin Production Pipeline
      if (command === "/pipeline" || command === "admin_pipeline") {
        const list = await projects.find({ stage: { $ne: "completed" } }).limit(8).toArray();
        if (list.length === 0) {
          await sendTelegramMessage({
            chatId,
            text: `🎬 <b>Production Pipeline</b>\n\nNo cuts currently on timeline. Full capacity open!`,
            parseMode: "HTML",
          });
        } else {
          const lines = list.map((p, idx) => {
            const editor = p.assignedEditor === "amir" ? "Amir" : p.assignedEditor === "aymen" ? "Aymen" : "Unassigned";
            return `${idx + 1}. <b>${p.title}</b>\n   • Stage: <code>${p.stage}</code> | Lead: ${editor} | Due: ${new Date(p.deadline).toLocaleDateString()}`;
          });

          await sendTelegramMessage({
            chatId,
            text: `🎬 <b>Active Cuts in Production (${list.length}):</b>\n\n${lines.join("\n\n")}`,
            parseMode: "HTML",
            replyMarkup: {
              inline_keyboard: [
                [{ text: "📊 Open Production Board", url: `${CLIENT_URL}/admin` }],
                [{ text: "⬅️ Back to Command Menu", callback_data: "admin_menu" }],
              ],
            },
          });
        }
        res.sendStatus(200);
        return;
      }

      // Admin Financial Ledger
      if (command === "/finance" || command === "admin_finance") {
        const unpaidInvoices = await invoices.find({ status: { $ne: "paid" } }).toArray();
        const totalPending = unpaidInvoices.reduce((acc, inv) => acc + (inv.amount || 0), 0);

        await sendTelegramMessage({
          chatId,
          text:
            `💰 <b>Financial Overview</b>\n\n` +
            `• <b>Unpaid / Pending Invoices:</b> ${unpaidInvoices.length}\n` +
            `• <b>Outstanding Receivables:</b> $${totalPending.toLocaleString()} USD (approx)\n\n` +
            `View detailed revenue, expense logging, and invoice generation in the Admin ERP:`,
          parseMode: "HTML",
          replyMarkup: {
            inline_keyboard: [
              [{ text: "📊 Financial Analytics ERP", url: `${CLIENT_URL}/admin` }],
              [{ text: "⬅️ Back to Command Menu", callback_data: "admin_menu" }],
            ],
          },
        });
        res.sendStatus(200);
        return;
      }
    }

    // ==========================================
    // 2. CLIENT WORKFLOW & COMMANDS
    // ==========================================

    // /start command & deep-linking
    if (command === "/start") {
      const parts = text.split(" ");
      const param = parts[1];

      if (param && param.startsWith("proposal_")) {
        const proposalId = param.replace("proposal_", "");
        await sendTelegramMessage({
          chatId,
          text: `🎬 <b>Alpha Cut Project Proposal</b>\n\nReview your custom editing scope, deliverables, and package tier inside the Mini App.`,
          parseMode: "HTML",
          replyMarkup: {
            inline_keyboard: [
              [
                {
                  text: "⚡ Review & Accept Proposal",
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
          text: `🎬 <b>Alpha Cut Project Update</b>\n\nYour video edit is being processed or ready for review.`,
          parseMode: "HTML",
          replyMarkup: {
            inline_keyboard: [
              [
                {
                  text: "🎬 Open Video Project",
                  web_app: { url: `${MINIAPP_URL}?project=${projectId}` },
                },
              ],
            ],
          },
        });
      } else {
        await sendTelegramMessage({
          chatId,
          text: `👋 Hey <b>${senderName}</b>! Welcome to <b>Alpha Cut Video Editing Agency</b> 🎬\n\nWe engineer retention-driven, cinematic video edits for creators, founders, and modern brands.\n\n<b>Quick Commands:</b>\n• /status — Check live pipeline capacity\n• /packages — View editing tiers & rates\n• /styles — Browse signature editing styles\n• /projects — View active video contracts\n• /about — Meet founders Amir & Aymen\n\nTap below to launch your Mini App portal or submit a new brief:`,
          parseMode: "HTML",
          replyMarkup: {
            inline_keyboard: [
              [
                { text: "🚀 Open Client Portal", web_app: { url: MINIAPP_URL } },
                { text: "📝 Submit New Brief", web_app: { url: `${MINIAPP_URL}?tab=new_brief` } },
              ],
              [
                { text: "🌐 Visit Official Website", url: CLIENT_URL },
                { text: "💬 Chat with Amir", url: "https://t.me/Amir_Alpha_Cut" },
              ],
            ],
          },
        });
      }
    }

    // /menu command or callback
    else if (command === "/menu" || command === "cmd_menu") {
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
              { text: "🚀 Open Mini App", web_app: { url: MINIAPP_URL } },
              { text: "ℹ️ About Agency", callback_data: "cmd_about" },
            ],
          ],
        },
      });
    }

    // /status command or callback
    else if (command === "/status" || command === "cmd_status") {
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
            [
              { text: "📝 Submit Video Brief", web_app: { url: `${MINIAPP_URL}?tab=new_brief` } },
              { text: "🚀 Open Mini App", web_app: { url: MINIAPP_URL } },
            ],
          ],
        },
      });
    }

    // /projects command or callback
    else if (command === "/projects" || command === "cmd_projects") {
      await sendTelegramMessage({
        chatId,
        text: `🎬 <b>Alpha Cut Client Workspace</b>\n\nView your formal proposals, active cuts, and revision requests directly in the client dashboard:`,
        parseMode: "HTML",
        replyMarkup: {
          inline_keyboard: [
            [{ text: "🚀 Open Client Workspace", web_app: { url: MINIAPP_URL } }],
          ],
        },
      });
    }

    // /deadlines command or callback
    else if (command === "/deadlines" || command === "cmd_deadlines") {
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

    // /packages command or callback
    else if (command === "/packages" || command === "cmd_packages") {
      await sendTelegramMessage({
        chatId,
        text: `💎 <b>Alpha Cut Editing Packages & Rates</b>\n\n<b>1. Basic Tier — $250 - $450</b>\n• Fast pacing & clean rhythm\n• Essential sound design & audio mastering\n• Clean subtitles & color balancing\n• 2 revision rounds\n\n<b>2. Professional Tier — $450 - $850 (Most Popular)</b>\n• Dynamic motion graphics & kinetic typography\n• Retention pattern interrupts & bespoke sound FX\n• 2 custom thumbnail variants included\n• 3 revision rounds + 48h turnaround\n\n<b>3. Premium Tier — $850 - $1,500+</b>\n• Film-grade color grading & bespoke animation\n• Multi-hook A/B testing package\n• Dedicated lead editor (Amir or Aymen)\n• Unlimited revision priority & VIP communication\n\n<i>All packages include 100% money-back guarantee if initial cut does not align with brief.</i>`,
        parseMode: "HTML",
        replyMarkup: {
          inline_keyboard: [
            [
              { text: "📝 Submit Brief", web_app: { url: `${MINIAPP_URL}?tab=new_brief` } },
              { text: "🚀 Launch Mini App", web_app: { url: MINIAPP_URL } },
            ],
          ],
        },
      });
    }

    // /styles command or callback
    else if (command === "/styles" || command === "cmd_styles") {
      const styleItems = Object.entries(EDITING_STYLES).map(([, item]) => {
        return `• <b>${item.label}</b>\n  ${item.tagline}\n  <i>Best for: ${item.bestFor}</i>`;
      });

      await sendTelegramMessage({
        chatId,
        text: `🎨 <b>Our 5 Signature Editing Styles</b>\n\n${styleItems.join("\n\n")}\n\nHave footage ready in one of these styles? Tap below to submit:`,
        parseMode: "HTML",
        replyMarkup: {
          inline_keyboard: [
            [{ text: "🎬 Choose Style & Submit Brief", web_app: { url: `${MINIAPP_URL}?tab=styles` } }],
          ],
        },
      });
    }

    // /about command or callback
    else if (command === "/about" || command === "cmd_about") {
      await sendTelegramMessage({
        chatId,
        text: `ℹ️ <b>About Alpha Cut Agency</b>\n\nAlpha Cut is a boutique video editing agency founded and operated by:\n\n• <b>Amir</b> — Lead Video Editor & Creative Director (Mastery in Premiere Pro, DaVinci Resolve & narrative pacing).\n• <b>Aymen</b> — Full-Stack Engineer & Motion Editor (Specialized in After Effects, kinetic typography & SaaS product animations).\n\n<b>Our Mission:</b>\nTurn raw footage into high-retention digital assets that build authority and drive conversions.\n\n🌐 <b>Website:</b> <a href="${CLIENT_URL}">alpha-cut.com</a>\n📧 <b>Email:</b> alphacutagency@gmail.com`,
        parseMode: "HTML",
        replyMarkup: {
          inline_keyboard: [
            [{ text: "🌐 Explore Portfolio", url: `${CLIENT_URL}#portfolio` }],
            [{ text: "💬 Chat with Amir", url: "https://t.me/Amir_Alpha_Cut" }],
          ],
        },
      });
    }

    // /help command or callback
    else if (command === "/help" || command === "cmd_help") {
      await sendTelegramMessage({
        chatId,
        text: `📖 <b>Alpha Cut Bot Help & Commands</b>\n\nHere are the commands you can use anytime:\n\n/start — Launch the welcome message & portal links\n/menu — Open interactive control menu\n/status — Check live editing queue & turnaround\n/packages — Review pricing tiers & inclusions\n/styles — Explore our 5 signature video styles\n/projects — View active production pipeline\n/deadlines — Check deliverable deadlines\n/about — Meet founders Amir & Aymen\n\nNeed to submit footage or check an existing order?\nUse the button below:`,
        parseMode: "HTML",
        replyMarkup: {
          inline_keyboard: [
            [
              { text: "🚀 Open Mini App", web_app: { url: MINIAPP_URL } },
              { text: "📝 Submit New Brief", web_app: { url: `${MINIAPP_URL}?tab=new_brief` } },
            ],
          ],
        },
      });
    }

    // Fallback for free-form user messages
    else {
      await sendTelegramMessage({
        chatId,
        text: `Thanks for messaging <b>Alpha Cut Agency</b>! 🎬\n\nI received your message. You can use the menu below to navigate our services, check live status, or launch your client portal:`,
        parseMode: "HTML",
        replyMarkup: {
          inline_keyboard: [
            [
              { text: "🚀 Open Mini App", web_app: { url: MINIAPP_URL } },
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
