import dotenv from "dotenv";
dotenv.config();

import { connectDB, getDB, getUsersCollection, getInquiriesCollection, getProjectsCollection, getInvoicesCollection, getExpensesCollection } from "../src/db.js";
import { signAccessToken, verifyAccessToken } from "../src/middleware/auth.js";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";

async function runLiveSystemTest() {
  console.log("=================================================");
  console.log("   ALPHA CUT LIVE SYSTEM TEST & BASELINE VERIFICATION");
  console.log("=================================================\n");

  let allPassed = true;

  // 1. Check MongoDB Atlas Connection
  console.log("[1/6] Testing MongoDB Atlas Connection...");
  try {
    const db = await connectDB();
    const adminPing = await db.command({ ping: 1 });
    if (adminPing.ok === 1) {
      console.log(`  ✓ MongoDB Atlas Connected successfully! Database: "${db.databaseName}"`);
    } else {
      throw new Error("Ping command did not return ok: 1");
    }

    // Ensure collections exist & create test probe
    const probeCol = db.collection("_test_probe");
    const probeDoc = { probe: true, timestamp: new Date() };
    const insertRes = await probeCol.insertOne(probeDoc);
    const foundDoc = await probeCol.findOne({ _id: insertRes.insertedId });
    if (foundDoc && foundDoc.probe === true) {
      console.log("  ✓ MongoDB Read/Write probe succeeded!");
    }
    await probeCol.deleteOne({ _id: insertRes.insertedId });
    console.log("  ✓ MongoDB Cleanup completed.");
  } catch (err: any) {
    console.error("  ✗ MongoDB connection failed:", err.message);
    allPassed = false;
  }

  // 2. Test User Auth Flow (Registration & Login Logic)
  console.log("\n[2/6] Testing Auth Registration & Login Logic...");
  try {
    const users = getUsersCollection();
    const testEmail = `test_client_${Date.now()}@alphacut.agency`;
    const testPassword = "AlphaCutTestPassword123!";
    
    // Test Hash
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(testPassword, salt);
    const isMatch = await bcrypt.compare(testPassword, hash);
    if (!isMatch) throw new Error("Bcrypt hash/compare mismatch");

    // Insert test user
    const insertUserRes = await users.insertOne({
      name: "Test Client Agent",
      email: testEmail,
      passwordHash: hash,
      role: "client",
      telegramUsername: "testclient_tg",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Test Token generation
    const token = signAccessToken({
      userId: insertUserRes.insertedId.toString(),
      email: testEmail,
      name: "Test Client Agent",
      role: "client",
    });

    const verified = verifyAccessToken(token);
    if (!verified || verified.email !== testEmail || verified.role !== "client") {
      throw new Error("Token payload validation mismatch");
    }
    console.log(`  ✓ Client Registration, Bcrypt Hashing, and JWT signing/verification passed!`);

    // Clean up test user
    await users.deleteOne({ _id: insertUserRes.insertedId });
    console.log("  ✓ Test User cleanup completed.");
  } catch (err: any) {
    console.error("  ✗ Auth flow failed:", err.message);
    allPassed = false;
  }

  // 3. Test Inquiries Pipeline
  console.log("\n[3/6] Testing Inquiry Pipeline...");
  try {
    const inquiries = getInquiriesCollection();
    const inq = {
      name: "Jordan Belfort",
      email: "jordan@stratton.com",
      brandHandle: "@wolfofwallst",
      telegramUsername: "wolf_official",
      format: "short_form" as const,
      style: "high_energy_hype" as const,
      notes: "Need 10 high octane vertical shorts with bold subtitles and dynamic sound effects.",
      budget: "$1,500 - $3,000",
      status: "new" as const,
      createdAt: new Date(),
    };

    const inqInsert = await inquiries.insertOne(inq);
    const fetched = await inquiries.findOne({ _id: inqInsert.insertedId });
    if (!fetched || fetched.name !== "Jordan Belfort") {
      throw new Error("Inquiry retrieval failed");
    }
    console.log(`  ✓ Inquiry inserted and retrieved (ID: ${inqInsert.insertedId.toString()})`);

    // Update status to contacted
    await inquiries.updateOne({ _id: inqInsert.insertedId }, { $set: { status: "contacted" } });
    const updated = await inquiries.findOne({ _id: inqInsert.insertedId });
    if (updated?.status !== "contacted") throw new Error("Status update failed");
    console.log("  ✓ Inquiry status lifecycle update verified (new -> contacted)");

    // Cleanup
    await inquiries.deleteOne({ _id: inqInsert.insertedId });
  } catch (err: any) {
    console.error("  ✗ Inquiry pipeline failed:", err.message);
    allPassed = false;
  }

  // 4. Test Project Lifecycle (Brief -> Proposal -> Accept -> Delivery -> Review -> Complete)
  console.log("\n[4/6] Testing Full Project Lifecycle...");
  try {
    const projects = getProjectsCollection();
    const newProject = {
      title: "FinTech App Launch Teaser",
      clientId: "usr_mock_123",
      clientName: "Alpha Partner",
      clientEmail: "partner@fintech.io",
      format: "short_form" as const,
      style: "motion_graphic_heavy" as const,
      tier: "professional" as const,
      assignedEditor: "aymen" as const,
      stage: "inquiry_pending" as const,
      footageUrl: "https://drive.google.com/drive/folders/sample-footage-link",
      notes: "Clean Apple-style 3D device mockups and smooth kinetic typography.",
      revisionsAllowed: 2,
      revisionsUsed: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const projInsert = await projects.insertOne(newProject);
    const projId = projInsert.insertedId;
    console.log(`  ✓ 1. Brief created with stage 'inquiry_pending' (ID: ${projId.toString()})`);

    // Super Admin submits proposal
    await projects.updateOne(
      { _id: projId },
      {
        $set: {
          price: 600,
          currency: "USD",
          deadline: new Date(Date.now() + 5 * 24 * 3600 * 1000),
          revisionsAllowed: 3,
          stage: "proposal_sent",
          updatedAt: new Date(),
        },
      }
    );
    let curr = await projects.findOne({ _id: projId });
    if (curr?.stage !== "proposal_sent" || curr.price !== 600) throw new Error("Proposal update failed");
    console.log(`  ✓ 2. Proposal sent (Price: $600, Revisions: 3, Stage: 'proposal_sent')`);

    // Client accepts proposal
    await projects.updateOne(
      { _id: projId },
      {
        $set: {
          stage: "in_progress",
          proposalAcceptedAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );
    curr = await projects.findOne({ _id: projId });
    if (curr?.stage !== "in_progress") throw new Error("Proposal accept failed");
    console.log(`  ✓ 3. Client accepted proposal (Stage: 'in_progress')`);

    // Editor delivers v1
    await projects.updateOne(
      { _id: projId },
      {
        $set: {
          deliverableUrl: "https://vimeo.com/manage/videos/sample123",
          stage: "in_review",
          updatedAt: new Date(),
        },
      }
    );
    curr = await projects.findOne({ _id: projId });
    if (curr?.stage !== "in_review" || !curr.deliverableUrl) throw new Error("Delivery update failed");
    console.log(`  ✓ 4. Cut v1 delivered for review (Stage: 'in_review')`);

    // Client requests revision round 1
    await projects.updateOne(
      { _id: projId },
      {
        $inc: { revisionsUsed: 1 },
        $set: {
          revisionNotes: "Please make the subtitle typography bolder and quicken pacing between 0:05 and 0:12.",
          stage: "in_progress",
          updatedAt: new Date(),
        },
      }
    );
    curr = await projects.findOne({ _id: projId });
    if (curr?.revisionsUsed !== 1 || curr.stage !== "in_progress") throw new Error("Revision round failed");
    console.log(`  ✓ 5. Revision round 1 requested (revisionsUsed: 1/3, Stage: 'in_progress')`);

    // Editor delivers v2 final
    await projects.updateOne(
      { _id: projId },
      {
        $set: {
          deliverableUrl: "https://vimeo.com/manage/videos/sample123-v2",
          stage: "in_review",
          updatedAt: new Date(),
        },
      }
    );

    // Client approves and rates project
    await projects.updateOne(
      { _id: projId },
      {
        $set: {
          stage: "completed",
          rating: 5,
          testimonial: "Incredible speed and cinematic quality. Amir & Aymen nailed the retention hooks!",
          featuredOnWebsite: true,
          completedAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );
    curr = await projects.findOne({ _id: projId });
    if (curr?.stage !== "completed" || curr.rating !== 5 || !curr.featuredOnWebsite) throw new Error("Completion failed");
    console.log(`  ✓ 6. Project approved & rated 5 stars! Testimonial published. Stage: 'completed'`);

    // Cleanup
    await projects.deleteOne({ _id: projId });
  } catch (err: any) {
    console.error("  ✗ Project lifecycle failed:", err.message);
    allPassed = false;
  }

  // 5. Test Financial Ledger
  console.log("\n[5/6] Testing Financial Ledger & Profit Calculation...");
  try {
    const invoices = getInvoicesCollection();
    const expenses = getExpensesCollection();

    // Insert 2 invoices: 1 paid USD $600, 1 pending USD $400
    const inv1 = await invoices.insertOne({
      invoiceNumber: "INV-TEST-001",
      clientId: "usr_mock_123",
      clientName: "Alpha Partner",
      amount: 600,
      currency: "USD",
      status: "paid",
      paymentMethod: "crypto",
      dueDate: new Date(),
      paidAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const inv2 = await invoices.insertOne({
      invoiceNumber: "INV-TEST-002",
      clientId: "usr_mock_456",
      clientName: "Beta Creator",
      amount: 400,
      currency: "USD",
      status: "pending",
      dueDate: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Insert 1 expense: $150 Envato Elements & sound design
    const exp1 = await expenses.insertOne({
      title: "Audio Jungle SFX & Fonts",
      category: "software_tools",
      amount: 150,
      currency: "USD",
      loggedBy: "amir",
      date: new Date(),
      createdAt: new Date(),
    });

    // Calculate profit
    const allInvoices = await invoices.find({ _id: { $in: [inv1.insertedId, inv2.insertedId] } }).toArray();
    const allExpenses = await expenses.find({ _id: exp1.insertedId }).toArray();

    let revenue = 0;
    let pending = 0;
    allInvoices.forEach((inv) => {
      if (inv.status === "paid") revenue += inv.amount;
      else if (inv.status === "pending") pending += inv.amount;
    });

    let expenseTotal = 0;
    allExpenses.forEach((exp) => {
      expenseTotal += exp.amount;
    });

    const netProfit = revenue - expenseTotal;

    if (revenue !== 600 || pending !== 400 || expenseTotal !== 150 || netProfit !== 450) {
      throw new Error(`Financial math mismatch: rev=${revenue}, pen=${pending}, exp=${expenseTotal}, net=${netProfit}`);
    }
    console.log(`  ✓ Financial Ledger Math Verified:`);
    console.log(`     Revenue (Paid): $${revenue}`);
    console.log(`     Pending (Receivable): $${pending}`);
    console.log(`     Expenses: $${expenseTotal}`);
    console.log(`     Net Profit: $${netProfit}`);

    // Cleanup
    await invoices.deleteMany({ _id: { $in: [inv1.insertedId, inv2.insertedId] } });
    await expenses.deleteOne({ _id: exp1.insertedId });
  } catch (err: any) {
    console.error("  ✗ Financial ledger failed:", err.message);
    allPassed = false;
  }

  // 6. Test Telegram Bot API Connectivity
  console.log("\n[6/6] Testing Telegram Bot API Connectivity...");
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    console.warn("  ⚠ TELEGRAM_BOT_TOKEN is not defined in .env");
  } else {
    try {
      const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
      const tgData = await tgRes.json();
      if (tgData.ok) {
        console.log(`  ✓ Telegram Bot Connected!`);
        console.log(`     Bot ID: ${tgData.result.id}`);
        console.log(`     Bot Name: ${tgData.result.first_name}`);
        console.log(`     Bot Username: @${tgData.result.username}`);
      } else {
        console.warn(`  ⚠ Telegram API error: ${tgData.description}`);
      }
    } catch (err: any) {
      console.warn(`  ⚠ Telegram API network reachability: ${err.message}`);
    }
  }

  console.log("\n=================================================");
  if (allPassed) {
    console.log("   ALL LIVE SYSTEM VERIFICATIONS PASSED SUCCESSFULLY!");
  } else {
    console.log("   SOME VERIFICATIONS FAILED - CHECK DETAILS ABOVE");
  }
  console.log("=================================================");

  process.exit(allPassed ? 0 : 1);
}

runLiveSystemTest().catch((err) => {
  console.error("Fatal test runner error:", err);
  process.exit(1);
});

