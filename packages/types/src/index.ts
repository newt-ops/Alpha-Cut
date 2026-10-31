import { z } from "zod";

// ==========================================
// User & Auth Types
// ==========================================

export const UserRoleSchema = z.enum(["super_admin", "client"]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserSchema = z.object({
  _id: z.string().optional(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  passwordHash: z.string().optional(),
  role: UserRoleSchema.default("client"),
  telegramId: z.string().optional(),
  telegramUsername: z.string().optional(),
  avatarUrl: z.string().optional(),
  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).optional()
});
export type User = z.infer<typeof UserSchema>;

export const RegisterInputSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Valid email required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  telegramUsername: z.string().optional()
});
export type RegisterInput = z.infer<typeof RegisterInputSchema>;

export const LoginInputSchema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(1, "Password required")
});
export type LoginInput = z.infer<typeof LoginInputSchema>;

// ==========================================
// Video Formats & Editing Styles
// ==========================================

export const VideoFormatSchema = z.enum(["short_form", "long_form"]);
export type VideoFormat = z.infer<typeof VideoFormatSchema>;

export const EditingStyleSchema = z.enum([
  "viral_animation",
  "cinematic_short",
  "saas_animation",
  "hook_talking_head",
  "storytelling_explainer"
]);
export type EditingStyle = z.infer<typeof EditingStyleSchema>;

export const PackageTierSchema = z.enum(["basic", "professional", "premium"]);
export type PackageTier = z.infer<typeof PackageTierSchema>;

export const ProjectStageSchema = z.enum([
  "inquiry_pending",
  "proposal_sent",
  "in_progress",
  "in_review",
  "revision_requested",
  "approved",
  "completed"
]);
export type ProjectStage = z.infer<typeof ProjectStageSchema>;

// Style display metadata
export interface EditingStyleMeta {
  key: EditingStyle;
  label: string;
  tagline: string;
  bestFor: string;
  formats: VideoFormat[];
}

export const EDITING_STYLES: Record<EditingStyle, EditingStyleMeta> = {
  viral_animation: {
    key: "viral_animation",
    label: "Viral Animation Breakdowns",
    tagline: "High-pace kinetic text, bold typography, rapid motion-graphic overlays.",
    bestFor: "Quick tips, listicles, educational carousels",
    formats: ["short_form"]
  },
  cinematic_short: {
    key: "cinematic_short",
    label: "Cinematic Short-Film",
    tagline: "Film-grade color grading, moody lighting, and deliberate narrative pacing.",
    bestFor: "Personal stories, founder journeys, brand films",
    formats: ["short_form", "long_form"]
  },
  saas_animation: {
    key: "saas_animation",
    label: "SaaS Animations",
    tagline: "Polished UI callouts, smooth gradient motion, and clean product highlights.",
    bestFor: "App demos, feature launches, product promos",
    formats: ["short_form", "long_form"]
  },
  hook_talking_head: {
    key: "hook_talking_head",
    label: "Hook-Driven Talking-Head",
    tagline: "High-energy talking-head edits built around strong opening hooks and pattern interrupts.",
    bestFor: "Talking-head content, multi-hook testing",
    formats: ["short_form"]
  },
  storytelling_explainer: {
    key: "storytelling_explainer",
    label: "Storytelling & Explainer",
    tagline: "Educational story-led edits that layer visual references and on-screen labels at a calm pace.",
    bestFor: "Deep dives, explainers, case studies",
    formats: ["short_form", "long_form"]
  }
};

// ==========================================
// Inquiries (Website Leads)
// ==========================================

export const InquirySchema = z.object({
  _id: z.string().optional(),
  name: z.string().min(2, "Name required"),
  email: z.string().email("Valid email required"),
  brandHandle: z.string().optional(),
  telegramUsername: z.string().optional(),
  format: VideoFormatSchema,
  style: EditingStyleSchema,
  budget: z.string().optional(),
  notes: z.string().min(10, "Please provide some project details"),
  status: z.enum(["new", "contacted", "converted", "archived"]).default("new"),
  createdAt: z.string().or(z.date()).optional()
});
export type Inquiry = z.infer<typeof InquirySchema>;

// ==========================================
// Proposals (Formal Agreements & Versioning)
// ==========================================

export const ProposalStatusSchema = z.enum([
  "draft",
  "sent",
  "viewed",
  "revision_requested",
  "accepted",
  "rejected",
  "expired",
]);
export type ProposalStatus = z.infer<typeof ProposalStatusSchema>;

export const ProposalCommentSchema = z.object({
  id: z.string(),
  senderName: z.string(),
  senderRole: z.enum(["super_admin", "client"]),
  message: z.string().min(1),
  timestamp: z.string().or(z.date()),
});
export type ProposalComment = z.infer<typeof ProposalCommentSchema>;

export const ProposalVersionSchema = z.object({
  version: z.number().int().positive(),
  title: z.string().min(3),
  format: VideoFormatSchema,
  style: EditingStyleSchema,
  tier: PackageTierSchema.default("professional"),
  price: z.number().nonnegative(),
  currency: z.enum(["USD", "ETB"]).default("USD"),
  revisionsAllowed: z.number().int().nonnegative().default(2),
  deadline: z.string().or(z.date()),
  deliverablesSummary: z.array(z.string()).default([]),
  footageUrl: z.string().optional().or(z.literal("")),
  notes: z.string().optional(),
  assignedEditor: z.enum(["amir", "aymen", "unassigned"]).default("unassigned"),
  createdAt: z.string().or(z.date()),
});
export type ProposalVersion = z.infer<typeof ProposalVersionSchema>;

export const ProposalSchema = z.object({
  _id: z.string().optional(),
  proposalNumber: z.string(),
  clientId: z.string(),
  clientName: z.string(),
  clientEmail: z.string().email(),
  clientTelegram: z.string().optional(),
  status: ProposalStatusSchema.default("draft"),
  currentVersion: z.number().int().positive().default(1),
  versions: z.array(ProposalVersionSchema).min(1),
  discussion: z.array(ProposalCommentSchema).default([]),
  activatedProjectId: z.string().optional(),
  validUntil: z.string().or(z.date()).optional(),
  viewedAt: z.string().or(z.date()).optional(),
  acceptedAt: z.string().or(z.date()).optional(),
  rejectedAt: z.string().or(z.date()).optional(),
  revisionFeedback: z.string().optional(),
  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).optional(),
});
export type Proposal = z.infer<typeof ProposalSchema>;

// ==========================================
// Project Specification
// ==========================================

export const ProjectSchema = z.object({
  _id: z.string().optional(),
  proposalId: z.string().optional(),
  title: z.string().min(3, "Project title required"),
  clientId: z.string(),
  clientName: z.string(),
  clientEmail: z.string().email(),
  clientTelegram: z.string().optional(),
  format: VideoFormatSchema,
  style: EditingStyleSchema,
  tier: PackageTierSchema.default("professional"),
  assignedEditor: z.enum(["amir", "aymen", "unassigned"]).default("unassigned"),
  stage: ProjectStageSchema.default("inquiry_pending"),
  price: z.number().nonnegative(),
  currency: z.enum(["USD", "ETB"]).default("USD"),
  revisionsAllowed: z.number().int().nonnegative().default(2),
  revisionsUsed: z.number().int().nonnegative().default(0),
  deadline: z.string().or(z.date()),
  footageUrl: z.string().url("Must be a valid URL (Drive, Dropbox, Frame.io)").optional().or(z.literal("")),
  deliverableUrl: z.string().url("Must be a valid review URL").optional().or(z.literal("")),
  notes: z.string().optional(),
  revisionFeedback: z.string().optional(),
  rating: z.number().int().min(1).max(5).optional(),
  testimonial: z.string().optional(),
  featuredOnWebsite: z.boolean().default(false),
  proposalAcceptedAt: z.string().or(z.date()).optional(),
  approvedAt: z.string().or(z.date()).optional(),
  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).optional()
});
export type Project = z.infer<typeof ProjectSchema>;

// ==========================================
// Financial Ledger: Invoices & Expenses
// ==========================================

export const InvoiceStatusSchema = z.enum(["pending", "partial", "paid", "refunded"]);
export type InvoiceStatus = z.infer<typeof InvoiceStatusSchema>;

export const InvoiceSchema = z.object({
  _id: z.string().optional(),
  invoiceNumber: z.string(),
  projectId: z.string(),
  projectTitle: z.string(),
  clientId: z.string(),
  clientName: z.string(),
  amount: z.number().positive(),
  currency: z.enum(["USD", "ETB"]),
  status: InvoiceStatusSchema.default("pending"),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
  paidAt: z.string().or(z.date()).optional(),
  createdAt: z.string().or(z.date()).optional()
});
export type Invoice = z.infer<typeof InvoiceSchema>;

export const ExpenseSchema = z.object({
  _id: z.string().optional(),
  title: z.string().min(2),
  category: z.enum(["software", "assets", "gear", "marketing", "other"]),
  amount: z.number().positive(),
  currency: z.enum(["USD", "ETB"]),
  date: z.string().or(z.date()),
  notes: z.string().optional(),
  createdAt: z.string().or(z.date()).optional()
});
export type Expense = z.infer<typeof ExpenseSchema>;

// ==========================================
// Telegram Integration Schemas
// ==========================================

export const TelegramInitDataUserSchema = z.object({
  id: z.number(),
  first_name: z.string(),
  last_name: z.string().optional(),
  username: z.string().optional(),
  language_code: z.string().optional()
});
export type TelegramInitDataUser = z.infer<typeof TelegramInitDataUserSchema>;

