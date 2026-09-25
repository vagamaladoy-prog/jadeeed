// npm run db:local — local PostgreSQL for development without Docker/Supabase
// (PGlite = real Postgres compiled to WASM, served over TCP on 127.0.0.1:5433).
// .env:  DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5433/postgres?sslmode=disable
//        DIRECT_URL= (same)
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

const db = await PGlite.create("./.local-db");
const server = new PGLiteSocketServer({ db, host: "127.0.0.1", port: 5433, maxConnections: 20 });
await server.start();
console.log("Local Postgres (PGlite) on 127.0.0.1:5433 — Ctrl+C to stop");
const stop = async () => {
  await server.stop();
  await db.close();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
