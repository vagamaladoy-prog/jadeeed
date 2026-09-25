import "dotenv/config";
import { defineConfig } from "prisma/config";

// Migrations and seed use the DIRECT connection (Supabase, port 5432).
// The running app uses DATABASE_URL (pooler, port 6543) via the pg adapter in src/lib/db.ts.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
});
