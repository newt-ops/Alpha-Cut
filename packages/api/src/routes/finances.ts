import { Router, Request, Response } from "express";
import { ObjectId } from "mongodb";
import { InvoiceSchema, ExpenseSchema } from "@alpha-cut/types";
import { getInvoicesCollection, getExpensesCollection } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

// All routes here strictly require super_admin
router.use(requireAuth, requireRole(["super_admin"]));

// GET /api/finances/summary
router.get("/summary", async (_req: Request, res: Response): Promise<void> => {
  try {
    const invoices = getInvoicesCollection();
    const expenses = getExpensesCollection();

    const allInvoices = await invoices.find().toArray();
    const allExpenses = await expenses.find().toArray();

    const summary = {
      usd: { revenue: 0, pending: 0, expenses: 0, netProfit: 0 },
      etb: { revenue: 0, pending: 0, expenses: 0, netProfit: 0 },
    };

    allInvoices.forEach((inv) => {
      const cur = inv.currency.toLowerCase() as "usd" | "etb";
      if (inv.status === "paid") {
        summary[cur].revenue += inv.amount;
      } else if (inv.status === "pending" || inv.status === "partial") {
        summary[cur].pending += inv.amount;
      }
    });

    allExpenses.forEach((exp) => {
      const cur = exp.currency.toLowerCase() as "usd" | "etb";
      summary[cur].expenses += exp.amount;
    });

    summary.usd.netProfit = summary.usd.revenue - summary.usd.expenses;
    summary.etb.netProfit = summary.etb.revenue - summary.etb.expenses;

    res.json({ summary });
  } catch (error) {
    console.error("[Finances Summary Error]:", error);
    res.status(500).json({ error: "Failed to fetch financial summary" });
  }
});

// GET /api/finances/invoices
router.get("/invoices", async (_req: Request, res: Response): Promise<void> => {
  try {
    const invoices = getInvoicesCollection();
    const list = await invoices.find().sort({ createdAt: -1 }).toArray();
    res.json({ invoices: list });
  } catch (error) {
    console.error("[Invoices Fetch Error]:", error);
    res.status(500).json({ error: "Failed to fetch invoices" });
  }
});

// POST /api/finances/invoices
router.post("/invoices", async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = InvoiceSchema.omit({ _id: true }).safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: "Validation failed", details: parseResult.error.errors });
      return;
    }

    const invoices = getInvoicesCollection();
    const now = new Date();
    const result = await invoices.insertOne({
      ...parseResult.data,
      createdAt: now,
    });

    res.status(201).json({ message: "Invoice created", invoiceId: result.insertedId.toString() });
  } catch (error) {
    console.error("[Invoice Creation Error]:", error);
    res.status(500).json({ error: "Failed to create invoice" });
  }
});

// PATCH /api/finances/invoices/:id/status
router.patch("/invoices/:id/status", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, paymentMethod, notes } = req.body;

    const invoices = getInvoicesCollection();
    const update: any = {
      status,
      updatedAt: new Date(),
    };
    if (paymentMethod) update.paymentMethod = paymentMethod;
    if (notes) update.notes = notes;
    if (status === "paid") update.paidAt = new Date();

    await invoices.updateOne(
      { _id: new ObjectId(id) as any },
      { $set: update }
    );

    res.json({ message: "Invoice status updated" });
  } catch (error) {
    console.error("[Invoice Update Error]:", error);
    res.status(500).json({ error: "Failed to update invoice status" });
  }
});

// GET /api/finances/expenses
router.get("/expenses", async (_req: Request, res: Response): Promise<void> => {
  try {
    const expenses = getExpensesCollection();
    const list = await expenses.find().sort({ date: -1 }).toArray();
    res.json({ expenses: list });
  } catch (error) {
    console.error("[Expenses Fetch Error]:", error);
    res.status(500).json({ error: "Failed to fetch expenses" });
  }
});

// POST /api/finances/expenses
router.post("/expenses", async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = ExpenseSchema.omit({ _id: true }).safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: "Validation failed", details: parseResult.error.errors });
      return;
    }

    const expenses = getExpensesCollection();
    const now = new Date();
    const result = await expenses.insertOne({
      ...parseResult.data,
      createdAt: now,
    });

    res.status(201).json({ message: "Expense logged", expenseId: result.insertedId.toString() });
  } catch (error) {
    console.error("[Expense Logging Error]:", error);
    res.status(500).json({ error: "Failed to log expense" });
  }
});

export default router;
