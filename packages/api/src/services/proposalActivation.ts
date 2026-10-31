import { ObjectId } from "mongodb";
import {
  getProposalsCollection,
  getProjectsCollection,
  getInvoicesCollection,
} from "../db.js";
import { notifyAdmins } from "./telegram.js";

export interface ActivationResult {
  success: boolean;
  projectId?: string;
  invoiceId?: string;
  proposalNumber?: string;
  title?: string;
  clientName?: string;
  clientEmail?: string;
  price?: number;
  currency?: string;
  editor?: string;
  deadline?: string;
  error?: string;
}

/**
 * Executes Choice A Project & Financial Activation upon proposal acceptance.
 * Can be called identically from the Web REST API or from Telegram Bot webhook callbacks.
 */
export async function activateProposalProject(proposalId: string): Promise<ActivationResult> {
  const proposals = getProposalsCollection();
  const proposal = await proposals.findOne({ _id: new ObjectId(proposalId) as any });

  if (!proposal) {
    return { success: false, error: "Proposal not found" };
  }

  if (proposal.status === "accepted") {
    return {
      success: true,
      projectId: proposal.activatedProjectId,
      proposalNumber: proposal.proposalNumber,
      error: "Proposal was already accepted",
    };
  }

  const activeVersion = proposal.versions[proposal.currentVersion - 1];
  const now = new Date();

  // 1. ACTIVATE PROJECT (Choice A: Begins immediately in 'in_progress')
  const projects = getProjectsCollection();
  const projectResult = await projects.insertOne({
    proposalId,
    title: activeVersion.title,
    clientId: proposal.clientId,
    clientName: proposal.clientName,
    clientEmail: proposal.clientEmail,
    clientTelegram: proposal.clientTelegram,
    format: activeVersion.format,
    style: activeVersion.style,
    tier: activeVersion.tier,
    assignedEditor: activeVersion.assignedEditor || "unassigned",
    stage: "in_progress",
    price: activeVersion.price,
    currency: activeVersion.currency,
    revisionsAllowed: activeVersion.revisionsAllowed,
    revisionsUsed: 0,
    deadline: new Date(activeVersion.deadline),
    footageUrl: activeVersion.footageUrl || "",
    deliverableUrl: "",
    notes: activeVersion.notes || "",
    featuredOnWebsite: false,
    proposalAcceptedAt: now,
    createdAt: now,
    updatedAt: now,
  });

  const projectId = projectResult.insertedId.toString();

  // 2. GENERATE INVOICE (Financial record tracked independently)
  const invoices = getInvoicesCollection();
  const invCount = await invoices.countDocuments();
  const invoiceNumber = `INV-${now.getFullYear()}-${String(invCount + 1).padStart(3, "0")}`;
  const invoiceResult = await invoices.insertOne({
    invoiceNumber,
    projectId,
    projectTitle: activeVersion.title,
    clientId: proposal.clientId,
    clientName: proposal.clientName,
    amount: activeVersion.price,
    currency: activeVersion.currency,
    status: "pending",
    notes: `Generated from Proposal ${proposal.proposalNumber} (v${proposal.currentVersion})`,
    createdAt: now,
  });

  const invoiceId = invoiceResult.insertedId.toString();

  // 3. UPDATE PROPOSAL TO ACCEPTED
  await proposals.updateOne(
    { _id: new ObjectId(proposalId) as any },
    {
      $set: {
        status: "accepted",
        acceptedAt: now,
        activatedProjectId: projectId,
        updatedAt: now,
      },
    }
  );

  // 4. NOTIFY ADMINS (Amir & Aymen) ON TELEGRAM
  notifyAdmins(
    `🎉 *Proposal Accepted & Project Activated!*\n\n` +
    `*Proposal:* ${proposal.proposalNumber} (v${proposal.currentVersion})\n` +
    `*Project:* ${activeVersion.title}\n` +
    `*Client:* ${proposal.clientName} (${proposal.clientEmail})\n` +
    `*Amount:* ${activeVersion.price} ${activeVersion.currency}\n` +
    `*Lead Editor:* ${(activeVersion.assignedEditor || "unassigned").toUpperCase()}\n` +
    `*Due:* ${new Date(activeVersion.deadline).toLocaleDateString()}\n\n` +
    `Production has officially begun.`
  ).catch((err) => console.error("[Admin Alert Error]:", err));

  return {
    success: true,
    projectId,
    invoiceId,
    proposalNumber: proposal.proposalNumber,
    title: activeVersion.title,
    clientName: proposal.clientName,
    clientEmail: proposal.clientEmail,
    price: activeVersion.price,
    currency: activeVersion.currency,
    editor: activeVersion.assignedEditor || "unassigned",
    deadline: new Date(activeVersion.deadline).toLocaleDateString(),
  };
}

