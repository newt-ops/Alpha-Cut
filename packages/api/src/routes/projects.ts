import { Router, Request, Response } from "express";
import { ObjectId } from "mongodb";
import { ProjectSchema, type Project } from "@alpha-cut/types";
import { getProjectsCollection } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { notifyAdmins } from "../services/telegram.js";

const router = Router();

// GET /api/projects/public/featured-reviews (Public for website social proof)
router.get("/public/featured-reviews", async (_req: Request, res: Response): Promise<void> => {
  try {
    const projects = getProjectsCollection();
    const reviews = await projects
      .find({ featuredOnWebsite: true, rating: { $exists: true } })
      .project({ clientName: 1, rating: 1, testimonial: 1, style: 1, format: 1 })
      .toArray();

    res.json({ reviews });
  } catch (error) {
    console.error("[Featured Reviews Error]:", error);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

// GET /api/projects (Role-isolated list)
router.get("/", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const projects = getProjectsCollection();

    // Super Admin gets all projects; Clients only get their own
    const filter = user.role === "super_admin" ? {} : { clientId: user.userId };
    const list = await projects.find(filter).sort({ createdAt: -1 }).toArray();

    res.json({ projects: list });
  } catch (error) {
    console.error("[Projects Fetch Error]:", error);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

// GET /api/projects/:id
router.get("/:id", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const projects = getProjectsCollection();
    const project = await projects.findOne({ _id: new ObjectId(id) as any });

    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    // Role check: non-admin can only access own project
    if (user.role !== "super_admin" && project.clientId !== user.userId) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    res.json({ project });
  } catch (error) {
    console.error("[Project Detail Error]:", error);
    res.status(500).json({ error: "Failed to fetch project" });
  }
});

// POST /api/projects (Create brief/project)
router.post("/", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const defaultDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const parseResult = ProjectSchema.omit({ _id: true }).safeParse({
      price: 0,
      revisionsAllowed: 2,
      deadline: defaultDeadline,
      ...req.body,
      clientId: user.userId,
      clientName: user.name,
      clientEmail: user.email,
    });

    if (!parseResult.success) {
      res.status(400).json({ error: "Validation failed", details: parseResult.error.errors });
      return;
    }

    const projects = getProjectsCollection();
    const now = new Date();
    const result = await projects.insertOne({
      ...parseResult.data,
      stage: "inquiry_pending",
      revisionsUsed: 0,
      createdAt: now,
      updatedAt: now,
    });

    const projectId = result.insertedId.toString();

    // Alert Amir & Aymen
    notifyAdmins(
      `*New Video Brief Submitted!*\n\n` +
      `*Project:* ${parseResult.data.title}\n` +
      `*Client:* ${user.name} (${user.email})\n` +
      `*Style:* ${parseResult.data.style}\n` +
      `*Format:* ${parseResult.data.format}\n\n` +
      `Review in ERP: ${process.env.CLIENT_URL || "http://localhost:5173"}/admin/projects/${projectId}`
    ).catch((err) => console.error("[Telegram Error]:", err));

    res.status(201).json({ message: "Project created", projectId });
  } catch (error) {
    console.error("[Project Creation Error]:", error);
    res.status(500).json({ error: "Failed to create project" });
  }
});

// PATCH /api/projects/:id/proposal (Super Admin crafts custom quote)
router.patch("/:id/proposal", requireAuth, requireRole(["super_admin"]), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { price, currency, deadline, revisionsAllowed, tier, assignedEditor } = req.body;

    const projects = getProjectsCollection();
    const now = new Date();

    const update: Partial<Project> = {
      price: Number(price),
      currency: currency || "USD",
      deadline: new Date(deadline),
      revisionsAllowed: Number(revisionsAllowed) || 2,
      tier: tier || "professional",
      stage: "proposal_sent",
      updatedAt: now,
    };
    if (assignedEditor) update.assignedEditor = assignedEditor;

    await projects.updateOne(
      { _id: new ObjectId(id) as any },
      { $set: update }
    );

    res.json({ message: "Proposal sent to client successfully" });
  } catch (error) {
    console.error("[Proposal Update Error]:", error);
    res.status(500).json({ error: "Failed to send proposal" });
  }
});

// POST /api/projects/:id/accept-proposal (Client 1-tap accept)
router.post("/:id/accept-proposal", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const projects = getProjectsCollection();

    const project = await projects.findOne({ _id: new ObjectId(id) as any });
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    if (user.role !== "super_admin" && project.clientId !== user.userId) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const now = new Date();
    await projects.updateOne(
      { _id: new ObjectId(id) as any },
      {
        $set: {
          stage: "in_progress",
          proposalAcceptedAt: now,
          updatedAt: now,
        },
      }
    );

    // Alert Amir & Aymen
    notifyAdmins(
      `*Proposal Accepted!*\n\n` +
      `*Project:* ${project.title}\n` +
      `*Client:* ${project.clientName}\n` +
      `*Amount:* ${project.price} ${project.currency}\n` +
      `*Status:* In Progress`
    ).catch((err) => console.error("[Telegram Error]:", err));

    res.json({ message: "Proposal accepted! Production has begun." });
  } catch (error) {
    console.error("[Accept Proposal Error]:", error);
    res.status(500).json({ error: "Failed to accept proposal" });
  }
});

// PATCH /api/projects/:id/delivery (Super Admin submits cut review URL)
router.patch("/:id/delivery", requireAuth, requireRole(["super_admin"]), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { deliverableUrl } = req.body;

    if (!deliverableUrl) {
      res.status(400).json({ error: "Deliverable URL required" });
      return;
    }

    const projects = getProjectsCollection();
    const now = new Date();

    await projects.updateOne(
      { _id: new ObjectId(id) as any },
      {
        $set: {
          deliverableUrl,
          stage: "in_review",
          updatedAt: now,
        },
      }
    );

    res.json({ message: "Deliverable cut published for client review" });
  } catch (error) {
    console.error("[Delivery Submission Error]:", error);
    res.status(500).json({ error: "Failed to publish deliverable" });
  }
});

// POST /api/projects/:id/request-revision & /:id/revision (Client submits revision feedback)
const handleRevisionRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const feedback = req.body.feedback || req.body.notes;

    if (!feedback || feedback.trim().length < 5) {
      res.status(400).json({ error: "Please provide revision details" });
      return;
    }

    const projects = getProjectsCollection();
    const project = await projects.findOne({ _id: new ObjectId(id) as any });
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    if (user.role !== "super_admin" && project.clientId !== user.userId) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const revisionsUsed = (project.revisionsUsed || 0) + 1;
    const now = new Date();

    await projects.updateOne(
      { _id: new ObjectId(id) as any },
      {
        $set: {
          revisionFeedback: feedback,
          revisionsUsed,
          stage: "revision_requested",
          updatedAt: now,
        },
      }
    );

    // Alert Editor
    notifyAdmins(
      `*Revision Requested!*\n\n` +
      `*Project:* ${project.title}\n` +
      `*Revision:* Round ${revisionsUsed} of ${project.revisionsAllowed}\n` +
      `*Feedback:* ${feedback}`
    ).catch((err) => console.error("[Telegram Error]:", err));

    res.json({
      message: "Revision submitted",
      revisionsUsed,
      revisionsAllowed: project.revisionsAllowed,
    });
  } catch (error) {
    console.error("[Revision Request Error]:", error);
    res.status(500).json({ error: "Failed to request revision" });
  }
};

router.post("/:id/request-revision", requireAuth, handleRevisionRequest);
router.post("/:id/revision", requireAuth, handleRevisionRequest);

// POST /api/projects/:id/approve (Client approves final cut)
router.post("/:id/approve", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const projects = getProjectsCollection();

    const project = await projects.findOne({ _id: new ObjectId(id) as any });
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    if (user.role !== "super_admin" && project.clientId !== user.userId) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const now = new Date();
    const update: any = {
      stage: "approved",
      approvedAt: now,
      updatedAt: now,
    };
    if (req.body?.rating) update.rating = Number(req.body.rating);
    if (req.body?.testimonial) update.testimonial = req.body.testimonial;

    await projects.updateOne(
      { _id: new ObjectId(id) as any },
      { $set: update }
    );

    notifyAdmins(
      `*Cut Approved by Client!*\n\n` +
      `*Project:* ${project.title}\n` +
      `*Client:* ${project.clientName}\n` +
      `Ready for final settlement and archiving.`
    ).catch((err) => console.error("[Telegram Error]:", err));

    res.json({ message: "Project cut approved successfully!" });
  } catch (error) {
    console.error("[Cut Approval Error]:", error);
    res.status(500).json({ error: "Failed to approve cut" });
  }
});

// POST /api/projects/:id/review (Client submits rating & testimonial)
router.post("/:id/review", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { rating, testimonial } = req.body;

    const ratingNum = Number(rating);
    if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
      res.status(400).json({ error: "Rating must be between 1 and 5 stars" });
      return;
    }

    const projects = getProjectsCollection();
    const project = await projects.findOne({ _id: new ObjectId(id) as any });
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    if (user.role !== "super_admin" && project.clientId !== user.userId) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    await projects.updateOne(
      { _id: new ObjectId(id) as any },
      {
        $set: {
          rating: ratingNum,
          testimonial: testimonial || "",
          updatedAt: new Date(),
        },
      }
    );

    res.json({ message: "Thank you for your feedback!" });
  } catch (error) {
    console.error("[Review Submission Error]:", error);
    res.status(500).json({ error: "Failed to submit review" });
  }
});

// PATCH /api/projects/:id/featured & /:id/feature-toggle (Admin toggles website publishing)
const handleFeatureToggle = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const isFeatured = req.body.featuredOnWebsite !== undefined ? req.body.featuredOnWebsite : req.body.featured;

    const projects = getProjectsCollection();
    await projects.updateOne(
      { _id: new ObjectId(id) as any },
      { $set: { featuredOnWebsite: Boolean(isFeatured), updatedAt: new Date() } }
    );

    res.json({ message: "Review display status updated" });
  } catch (error) {
    console.error("[Featured Review Error]:", error);
    res.status(500).json({ error: "Failed to update review status" });
  }
};

router.patch("/:id/featured", requireAuth, requireRole(["super_admin"]), handleFeatureToggle);
router.patch("/:id/feature-toggle", requireAuth, requireRole(["super_admin"]), handleFeatureToggle);

export default router;

