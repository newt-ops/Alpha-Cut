import { Router, Request, Response } from "express";
import { ObjectId } from "mongodb";
import {
  ProposalSchema,
  ProposalVersionSchema,
  type Proposal,
  type ProposalVersion,
} from "@alpha-cut/types";
import {
  getProposalsCollection,
  getProjectsCollection,
  getInvoicesCollection,
  getUsersCollection,
} from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { sendTelegramMessage, notifyAdmins } from "../services/telegram.js";
import { activateProposalProject } from "../services/proposalActivation.js";

const router = Router();
const CLIENT_URL = process.env.CLIENT_URL || "https://alpha-cut.com";
const MINIAPP_URL = process.env.MINIAPP_URL || "https://app.alpha-cut.com";

// Helper to check proposal access
function isProposalParticipant(proposal: Proposal, user: any): boolean {
  if (user.role === "super_admin") return true;
  if (proposal.clientId && proposal.clientId === user.userId) return true;
  if (proposal.clientEmail && user.email && proposal.clientEmail.toLowerCase() === user.email.toLowerCase()) return true;

  const userTgId = user.telegramId ? String(user.telegramId).toLowerCase().replace("@", "") : "";
  const userTgUsername = user.email && user.email.endsWith("@t.me") ? user.email.replace("@t.me", "").toLowerCase() : "";
  const propTg = proposal.clientTelegram ? String(proposal.clientTelegram).toLowerCase().replace("@", "") : "";

  if (propTg && (propTg === userTgId || propTg === userTgUsername)) return true;
  return false;
}

// Helper to resolve verified Telegram chat ID from linked user account
async function resolveClientTelegramChatId(params: {
  clientId?: string;
  clientEmail?: string;
  clientTelegram?: string;
}): Promise<string | number | undefined> {
  const users = getUsersCollection();

  if (params.clientId && ObjectId.isValid(params.clientId)) {
    const user = await users.findOne({ _id: new ObjectId(params.clientId) as any });
    if (user?.telegramId) return user.telegramId;
  }

  if (params.clientEmail) {
    const user = await users.findOne({ email: params.clientEmail.toLowerCase().trim() });
    if (user?.telegramId) return user.telegramId;
  }

  if (params.clientTelegram) {
    const clean = params.clientTelegram.replace(/^@/, "").trim().toLowerCase();
    const user = await users.findOne({
      $or: [
        { telegramUsername: clean },
        { telegramId: clean },
      ],
    });
    if (user?.telegramId) return user.telegramId;
    return params.clientTelegram;
  }

  return undefined;
}

// GET /api/proposals (List proposals)
router.get("/", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const proposals = getProposalsCollection();

    let filter: any = {};
    if (user.role !== "super_admin") {
      const orConditions: any[] = [{ clientId: user.userId }];
      if (user.email) {
        orConditions.push({ clientEmail: user.email.toLowerCase() });
        if (user.email.endsWith("@t.me")) {
          const username = user.email.replace("@t.me", "");
          orConditions.push(
            { clientTelegram: username },
            { clientTelegram: `@${username}` }
          );
        }
      }
      if (user.telegramId) {
        const cleanTg = String(user.telegramId).replace("@", "");
        orConditions.push(
          { clientTelegram: cleanTg },
          { clientTelegram: `@${cleanTg}` }
        );
      }
      filter = {
        $and: [
          { status: { $ne: "draft" } }, // Clients never see drafts
          { $or: orConditions },
        ],
      };
    }

    const list = await proposals.find(filter).sort({ updatedAt: -1 }).toArray();
    res.json({ proposals: list });
  } catch (error) {
    console.error("[Get Proposals Error]:", error);
    res.status(500).json({ error: "Failed to fetch proposals" });
  }
});

// GET /api/proposals/:id (Detail view with automatic 'viewed' tracking)
router.get("/:id", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const proposals = getProposalsCollection();

    const proposal = await proposals.findOne({ _id: new ObjectId(id) as any });
    if (!proposal) {
      res.status(404).json({ error: "Proposal not found" });
      return;
    }

    if (!isProposalParticipant(proposal, user)) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    // If client opens for the first time while in 'sent' status, auto-mark as 'viewed'
    if (user.role !== "super_admin" && proposal.status === "sent") {
      const now = new Date();
      await proposals.updateOne(
        { _id: new ObjectId(id) as any },
        { $set: { status: "viewed", viewedAt: now, updatedAt: now } }
      );
      proposal.status = "viewed";
      proposal.viewedAt = now;
    }

    res.json({ proposal });
  } catch (error) {
    console.error("[Get Proposal Detail Error]:", error);
    res.status(500).json({ error: "Failed to fetch proposal details" });
  }
});

// POST /api/proposals (Super Admin creates proposal)
router.post("/", requireAuth, requireRole(["super_admin"]), async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      clientId,
      clientEmail,
      clientName,
      clientTelegram,
      title,
      format,
      style,
      tier,
      price,
      currency,
      revisionsAllowed,
      deadline,
      deliverablesSummary,
      footageUrl,
      notes,
      assignedEditor,
      status = "draft",
    } = req.body;

    const proposals = getProposalsCollection();
    const count = await proposals.countDocuments();
    const currentYear = new Date().getFullYear();
    const proposalNumber = `PROP-${currentYear}-${String(count + 1).padStart(3, "0")}`;

    const now = new Date();
    const initialVersion: ProposalVersion = {
      version: 1,
      title: title || "Video Editing Scope",
      format: format || "short_form",
      style: style || "viral_animation",
      tier: tier || "professional",
      price: Number(price) || 0,
      currency: currency || "USD",
      revisionsAllowed: Number(revisionsAllowed) ?? 2,
      deadline: deadline || new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      deliverablesSummary: deliverablesSummary || [],
      footageUrl: footageUrl || "",
      notes: notes || "",
      assignedEditor: assignedEditor || "unassigned",
      createdAt: now,
    };

    const newProposal: Partial<Proposal> = {
      proposalNumber,
      clientId: clientId || "",
      clientName: clientName || "Valued Client",
      clientEmail: (clientEmail || "").toLowerCase().trim(),
      clientTelegram: clientTelegram ? clientTelegram.replace(/^@/, "").trim() : "",
      status: status === "sent" ? "sent" : "draft",
      currentVersion: 1,
      versions: [initialVersion],
      discussion: [],
      validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
      createdAt: now,
      updatedAt: now,
    };

    const result = await proposals.insertOne(newProposal as any);
    const proposalId = result.insertedId.toString();

    // If sent immediately, notify client via Telegram if available
    if (status === "sent") {
      const resolvedChatId = await resolveClientTelegramChatId({
        clientId,
        clientEmail,
        clientTelegram,
      });

      if (resolvedChatId) {
        sendTelegramMessage({
          chatId: resolvedChatId,
          text:
            `🎬 <b>New Alpha Cut Editing Proposal Ready!</b>\n\n` +
            `<b>Proposal:</b> ${proposalNumber}\n` +
            `<b>Scope:</b> ${initialVersion.title}\n` +
            `<b>Investment:</b> ${initialVersion.price} ${initialVersion.currency}\n` +
            `<b>Turnaround Due:</b> ${new Date(initialVersion.deadline).toLocaleDateString()}\n\n` +
            `Tap below to accept and start production immediately, or request changes:`,
          parseMode: "HTML",
          replyMarkup: {
            inline_keyboard: [
              [
                { text: "✅ Accept & Start Production", callback_data: `prop_accept:${proposalId}` },
                { text: "✍️ Request Adjustments", callback_data: `prop_revise:${proposalId}` },
              ],
              [
                { text: "⚡ Review in Mini App", web_app: { url: `${MINIAPP_URL}?proposal=${proposalId}` } },
                { text: "🌐 Open Web Portal", url: `${CLIENT_URL}/portal` },
              ],
            ],
          },
        }).catch((err) => console.error("[Telegram Client Dispatch Warning]:", err));
      }
    }

    res.status(201).json({
      message: "Proposal created successfully",
      proposalId,
      proposalNumber,
    });
  } catch (error) {
    console.error("[Create Proposal Error]:", error);
    res.status(500).json({ error: "Failed to create proposal" });
  }
});

// PATCH /api/proposals/:id/send (Super Admin dispatches draft to client)
router.patch("/:id/send", requireAuth, requireRole(["super_admin"]), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const proposals = getProposalsCollection();

    const proposal = await proposals.findOne({ _id: new ObjectId(id) as any });
    if (!proposal) {
      res.status(404).json({ error: "Proposal not found" });
      return;
    }

    const now = new Date();
    await proposals.updateOne(
      { _id: new ObjectId(id) as any },
      { $set: { status: "sent", updatedAt: now } }
    );

    const activeVersion = proposal.versions[proposal.currentVersion - 1];
    const resolvedChatId = await resolveClientTelegramChatId({
      clientId: proposal.clientId,
      clientEmail: proposal.clientEmail,
      clientTelegram: proposal.clientTelegram,
    });

    if (resolvedChatId) {
      sendTelegramMessage({
        chatId: resolvedChatId,
        text:
          `🎬 <b>Your Alpha Cut Editing Proposal has Arrived!</b>\n\n` +
          `<b>Proposal:</b> ${proposal.proposalNumber}\n` +
          `<b>Scope:</b> ${activeVersion.title}\n` +
          `<b>Investment:</b> ${activeVersion.price} ${activeVersion.currency}\n` +
          `<b>Included Revisions:</b> ${activeVersion.revisionsAllowed} rounds\n` +
          `<b>Target Due:</b> ${new Date(activeVersion.deadline).toLocaleDateString()}\n\n` +
          `Tap below to accept and start production immediately, or request changes:`,
        parseMode: "HTML",
        replyMarkup: {
          inline_keyboard: [
            [
              { text: "✅ Accept & Start Production", callback_data: `prop_accept:${id}` },
              { text: "✍️ Request Adjustments", callback_data: `prop_revise:${id}` },
            ],
            [
              { text: "⚡ Review in Mini App", web_app: { url: `${MINIAPP_URL}?proposal=${id}` } },
              { text: "🌐 Open Web Portal", url: `${CLIENT_URL}/portal` },
            ],
          ],
        },
      }).catch((err) => console.error("[Telegram Client Dispatch Warning]:", err));
    }

    res.json({ message: "Proposal dispatched to client successfully" });
  } catch (error) {
    console.error("[Send Proposal Error]:", error);
    res.status(500).json({ error: "Failed to dispatch proposal" });
  }
});

// POST /api/proposals/:id/version (Super Admin creates negotiated Version v2, v3)
router.post("/:id/version", requireAuth, requireRole(["super_admin"]), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const proposals = getProposalsCollection();

    const proposal = await proposals.findOne({ _id: new ObjectId(id) as any });
    if (!proposal) {
      res.status(404).json({ error: "Proposal not found" });
      return;
    }

    const currentVer = proposal.versions[proposal.currentVersion - 1];
    const nextVerNum = proposal.currentVersion + 1;
    const now = new Date();

    const newVersion: ProposalVersion = {
      version: nextVerNum,
      title: req.body.title || currentVer.title,
      format: req.body.format || currentVer.format,
      style: req.body.style || currentVer.style,
      tier: req.body.tier || currentVer.tier,
      price: req.body.price !== undefined ? Number(req.body.price) : currentVer.price,
      currency: req.body.currency || currentVer.currency,
      revisionsAllowed: req.body.revisionsAllowed !== undefined ? Number(req.body.revisionsAllowed) : currentVer.revisionsAllowed,
      deadline: req.body.deadline || currentVer.deadline,
      deliverablesSummary: req.body.deliverablesSummary || currentVer.deliverablesSummary,
      footageUrl: req.body.footageUrl !== undefined ? req.body.footageUrl : currentVer.footageUrl,
      notes: req.body.notes !== undefined ? req.body.notes : currentVer.notes,
      assignedEditor: req.body.assignedEditor || currentVer.assignedEditor,
      createdAt: now,
    };

    await proposals.updateOne(
      { _id: new ObjectId(id) as any },
      {
        $push: { versions: newVersion },
        $set: {
          currentVersion: nextVerNum,
          status: "sent",
          revisionFeedback: undefined,
          updatedAt: now,
        },
      }
    );

    // Notify client of new version
    const resolvedChatId = await resolveClientTelegramChatId({
      clientId: proposal.clientId,
      clientEmail: proposal.clientEmail,
      clientTelegram: proposal.clientTelegram,
    });

    if (resolvedChatId) {
      sendTelegramMessage({
        chatId: resolvedChatId,
        text:
          `📝 <b>Revised Proposal (Version ${nextVerNum}) Prepared</b>\n\n` +
          `Amir & Aymen updated the terms for <b>${proposal.proposalNumber}</b>.\n` +
          `<b>New Investment:</b> ${newVersion.price} ${newVersion.currency}\n` +
          `<b>Included Revisions:</b> ${newVersion.revisionsAllowed} rounds\n` +
          `<b>Target Due:</b> ${new Date(newVersion.deadline).toLocaleDateString()}\n\n` +
          `Tap below to accept Version ${nextVerNum} or request further adjustments:`,
        parseMode: "HTML",
        replyMarkup: {
          inline_keyboard: [
            [
              { text: `✅ Accept Version ${nextVerNum}`, callback_data: `prop_accept:${id}` },
              { text: "✍️ Request Adjustments", callback_data: `prop_revise:${id}` },
            ],
            [
              { text: `⚡ Review in Mini App`, web_app: { url: `${MINIAPP_URL}?proposal=${id}` } },
              { text: "🌐 Open Web Portal", url: `${CLIENT_URL}/portal` },
            ],
          ],
        },
      }).catch((err) => console.error(err));
    }

    res.json({ message: `Version ${nextVerNum} created and dispatched`, version: nextVerNum });
  } catch (error) {
    console.error("[Create Version Error]:", error);
    res.status(500).json({ error: "Failed to create revised version" });
  }
});

// POST /api/proposals/:id/accept (Client accepts proposal -> Project & Invoice Activation)
router.post("/:id/accept", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const proposals = getProposalsCollection();

    const proposal = await proposals.findOne({ _id: new ObjectId(id) as any });
    if (!proposal) {
      res.status(404).json({ error: "Proposal not found" });
      return;
    }

    if (!isProposalParticipant(proposal, user)) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    if (proposal.status === "accepted") {
      res.status(400).json({ error: "Proposal has already been accepted" });
      return;
    }

    const result = await activateProposalProject(id);
    if (!result.success) {
      res.status(500).json({ error: result.error || "Failed to activate proposal project" });
      return;
    }

    res.json({
      message: "Proposal accepted! Your project is now in active production.",
      projectId: result.projectId,
      activated: true,
    });
  } catch (error) {
    console.error("[Accept Proposal Error]:", error);
    res.status(500).json({ error: "Failed to accept proposal" });
  }
});

// POST /api/proposals/:id/request-revision (Client requests changes to scope/price)
router.post("/:id/request-revision", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { feedback } = req.body;

    if (!feedback || !feedback.trim()) {
      res.status(400).json({ error: "Please provide feedback notes describing the requested adjustments." });
      return;
    }

    const proposals = getProposalsCollection();
    const proposal = await proposals.findOne({ _id: new ObjectId(id) as any });
    if (!proposal) {
      res.status(404).json({ error: "Proposal not found" });
      return;
    }

    if (!isProposalParticipant(proposal, user)) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const now = new Date();
    const comment = {
      id: new ObjectId().toString(),
      senderName: user.name,
      senderRole: (user.role === "super_admin" ? "super_admin" : "client") as any,
      message: `[Revision Request]: ${feedback}`,
      timestamp: now,
    };

    await proposals.updateOne(
      { _id: new ObjectId(id) as any },
      {
        $set: {
          status: "revision_requested",
          revisionFeedback: feedback,
          updatedAt: now,
        },
        $push: { discussion: comment },
      }
    );

    // Alert Amir & Aymen
    notifyAdmins(
      `💬 *Proposal Changes Requested!*\n\n` +
      `*Proposal:* ${proposal.proposalNumber}\n` +
      `*Client:* ${proposal.clientName}\n` +
      `*Feedback:* "${feedback}"\n\n` +
      `Review feedback in ERP and create Version ${proposal.currentVersion + 1}: ${CLIENT_URL}/admin`
    ).catch((err) => console.error(err));

    res.json({ message: "Revision request submitted to Amir & Aymen" });
  } catch (error) {
    console.error("[Request Revision Error]:", error);
    res.status(500).json({ error: "Failed to request proposal revision" });
  }
});

// POST /api/proposals/:id/comment (Discussion thread comment)
router.post("/:id/comment", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      res.status(400).json({ error: "Message content required" });
      return;
    }

    const proposals = getProposalsCollection();
    const proposal = await proposals.findOne({ _id: new ObjectId(id) as any });
    if (!proposal) {
      res.status(404).json({ error: "Proposal not found" });
      return;
    }

    if (!isProposalParticipant(proposal, user)) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const now = new Date();
    const comment = {
      id: new ObjectId().toString(),
      senderName: user.name,
      senderRole: (user.role === "super_admin" ? "super_admin" : "client") as any,
      message: message.trim(),
      timestamp: now,
    };

    await proposals.updateOne(
      { _id: new ObjectId(id) as any },
      {
        $push: { discussion: comment },
        $set: { updatedAt: now },
      }
    );

    // If client commented, notify admin; if admin commented, notify client
    if (user.role !== "super_admin") {
      notifyAdmins(
        `💬 *New Proposal Question*\n\n` +
        `*Proposal:* ${proposal.proposalNumber}\n` +
        `*From:* ${user.name}\n` +
        `*Message:* "${message}"`
      ).catch((err) => console.error(err));
    } else {
      const targetChatId = proposal.clientTelegram || proposal.clientId;
      if (targetChatId) {
        sendTelegramMessage({
          chatId: targetChatId,
          text: `💬 <b>Message from Amir & Aymen regarding Proposal ${proposal.proposalNumber}:</b>\n\n"${message}"`,
          parseMode: "HTML",
        }).catch((err) => console.error(err));
      }
    }

    res.status(201).json({ message: "Comment posted", comment });
  } catch (error) {
    console.error("[Post Comment Error]:", error);
    res.status(500).json({ error: "Failed to post comment" });
  }
});

export default router;
