import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import { neonConfig, Pool } from '@neondatabase/serverless';
import Database from 'better-sqlite3';
import ws from 'ws';
import * as pgSchema from '../shared/schema';
import * as sqliteSchema from '../shared/sqlite-schema';

// Use SQLite for local development if DATABASE_URL is not set
const useSqlite = !process.env.DATABASE_URL || process.env.DATABASE_URL === 'sqlite';

let db: ReturnType<typeof drizzleNeon> | ReturnType<typeof drizzleSqlite>;
let pool: Pool | undefined;

if (useSqlite) {
  console.log('🗄️  Using SQLite database for local development');
  const sqlite = new Database('local.db');
  // Use SQLite-specific schema for proper date handling
  db = drizzleSqlite(sqlite, { schema: sqliteSchema });
} else {
  console.log('🗄️  Using PostgreSQL database');
  neonConfig.webSocketConstructor = ws;
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzleNeon({ client: pool, schema: pgSchema });
}

export { db, pool };
