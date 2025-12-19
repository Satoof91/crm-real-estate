import { defineConfig } from "drizzle-kit";
import "dotenv/config";

// Use SQLite for local development if DATABASE_URL is not set
const useSqlite = !process.env.DATABASE_URL || process.env.DATABASE_URL === 'sqlite';

export default defineConfig({
  out: "./migrations",
  schema: useSqlite ? "./shared/sqlite-schema.ts" : "./shared/schema.ts",
  dialect: useSqlite ? "sqlite" : "postgresql",
  dbCredentials: useSqlite
    ? { url: "local.db" }
    : { url: process.env.DATABASE_URL! },
});
