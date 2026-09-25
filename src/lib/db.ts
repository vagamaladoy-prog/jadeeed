import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// DATABASE_URL = Supabase transaction pooler (port 6543) for the running app.
// Migrations use DIRECT_URL (port 5432) via prisma.config.ts.
function createClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");
  // small pool per serverless instance; DB_POOL_MAX=1 for the local PGlite test server
  const max = Number(process.env.DB_POOL_MAX) || (process.env.VERCEL ? 3 : 10);
  const adapter = new PrismaPg({ connectionString, max });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? createClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
