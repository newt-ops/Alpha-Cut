import { MongoClient, Db, Collection } from "mongodb";
import dotenv from "dotenv";
import type { User, Inquiry, Project, Invoice, Expense } from "@alpha-cut/types";

dotenv.config();

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/alphacut";
let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectDB(): Promise<Db> {
  if (db) return db;

  try {
    client = new MongoClient(uri, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    await client.connect();
    db = client.db();
    console.log("[MongoDB] Connected successfully to database:", db.databaseName);
    return db;
  } catch (error) {
    console.error("[MongoDB] Connection error:", error);
    throw error;
  }
}

export function getDB(): Db {
  if (!db) {
    throw new Error("[MongoDB] Database not initialized. Call connectDB() first.");
  }
  return db;
}

// Typed collections
export function getUsersCollection(): Collection<User> {
  return getDB().collection<User>("users");
}

export function getInquiriesCollection(): Collection<Inquiry> {
  return getDB().collection<Inquiry>("inquiries");
}

export function getProjectsCollection(): Collection<Project> {
  return getDB().collection<Project>("projects");
}

export function getInvoicesCollection(): Collection<Invoice> {
  return getDB().collection<Invoice>("invoices");
}

export function getExpensesCollection(): Collection<Expense> {
  return getDB().collection<Expense>("expenses");
}

