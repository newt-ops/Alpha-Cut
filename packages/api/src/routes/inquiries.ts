import { Router, Request, Response } from "express";
import { ObjectId } from "mongodb";
import { InquirySchema, EDITING_STYLES, type EditingStyle } from "@alpha-cut/types";
import { getInquiriesCollection } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { sendInquiryConfirmationEmail } from "../services/email.js";
import { notifyAdmins } from "../services/telegram.js";

const router = Router();

// POST /api/inquiries (Public lead capture)
router.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = InquirySchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: "Validation failed", details: parseResult.error.errors });
      return;
    }

    const inquiryData = parseResult.data;
    const inquiries = getInquiriesCollection();
    const now = new Date();

    const result = await inquiries.insertOne({
      ...inquiryData,
      status: "new",
      createdAt: now,
    });

    const inquiryId = result.insertedId.toString();
    const styleLabel = EDITING_STYLES[inquiryData.style as EditingStyle]?.label || inquiryData.style;
    const formatLabel = inquiryData.format === "short_form" ? "Short-Form (9:16)" : "Long-Form (16:9)";

    // 1. Send automated Resend confirmation email to client
    sendInquiryConfirmationEmail({
      to: inquiryData.email,
      name: inquiryData.name,
      style: styleLabel,
      format: formatLabel,
    }).catch((err) => console.error("[Resend Error]:", err));

    // 2. Dispatch instant alert to Amir & Aymen on Telegram
    const tgMessage = `*New Alpha Cut Website Inquiry!*\n\n` +
      `*Client:* ${inquiryData.name}\n` +
      `*Email:* ${inquiryData.email}\n` +
      `*Telegram:* ${inquiryData.telegramUsername ? `@${inquiryData.telegramUsername.replace(/^@/, '')}` : "None"}\n` +
      `*Style:* ${styleLabel}\n` +
      `*Format:* ${formatLabel}\n` +
      `*Budget:* ${inquiryData.budget || "Not specified"}\n\n` +
      `*Brief:* ${inquiryData.notes}`;

    notifyAdmins(tgMessage, {
      inline_keyboard: [
        [
          {
            text: "Open Admin ERP",
            url: `${process.env.CLIENT_URL || "http://localhost:5173"}/admin/inquiries`,
          },
        ],
      ],
    }).catch((err) => console.error("[Telegram Alert Error]:", err));

    res.status(201).json({
      message: "Inquiry submitted successfully",
      inquiryId,
    });
  } catch (error) {
    console.error("[Inquiry Creation Error]:", error);
    res.status(500).json({ error: "Failed to submit inquiry" });
  }
});

// GET /api/inquiries (Super Admin Only)
router.get("/", requireAuth, requireRole(["super_admin"]), async (_req: Request, res: Response): Promise<void> => {
  try {
    const inquiries = getInquiriesCollection();
    const list = await inquiries.find().sort({ createdAt: -1 }).toArray();
    res.json({ inquiries: list });
  } catch (error) {
    console.error("[Inquiries Fetch Error]:", error);
    res.status(500).json({ error: "Failed to fetch inquiries" });
  }
});

// PATCH /api/inquiries/:id/status (Super Admin Only)
router.patch("/:id/status", requireAuth, requireRole(["super_admin"]), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["new", "contacted", "converted", "archived"].includes(status)) {
      res.status(400).json({ error: "Invalid status value" });
      return;
    }

    const inquiries = getInquiriesCollection();
    await inquiries.updateOne(
      { _id: new ObjectId(id) as any },
      { $set: { status } }
    );

    res.json({ message: "Status updated successfully" });
  } catch (error) {
    console.error("[Inquiry Update Error]:", error);
    res.status(500).json({ error: "Failed to update inquiry status" });
  }
});

export default router;
