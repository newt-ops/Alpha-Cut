import bcrypt from "bcryptjs";
import { connectDB, getUsersCollection } from "../src/db.js";

async function initAdmin() {
  await connectDB();
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash("AlphaCutAdmin2026!", salt);
  await getUsersCollection().updateOne(
    { email: "alphacutagency@gmail.com" },
    { $set: { passwordHash, role: "super_admin", updatedAt: new Date() } }
  );
  console.log("Admin account password and super_admin role initialized successfully!");
  process.exit(0);
}

initAdmin().catch((err) => {
  console.error(err);
  process.exit(1);
});
