import Database from 'better-sqlite3';
import { randomBytes } from 'crypto';

const db = new Database('local.db');

// Drop existing tables
db.exec(`
  DROP TABLE IF EXISTS payments;
  DROP TABLE IF EXISTS contracts;
  DROP TABLE IF EXISTS units;
  DROP TABLE IF EXISTS buildings;
  DROP TABLE IF EXISTS contacts;
  DROP TABLE IF EXISTS users;
`);

// Create UUID function for SQLite
function generateUUID() {
  return randomBytes(16).toString('hex').toLowerCase();
}

// Create all tables without auto-generated UUIDs (we'll generate them in the application)
db.exec(`
  CREATE TABLE users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE contacts (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    is_whatsapp_enabled INTEGER NOT NULL DEFAULT 1,
    email TEXT,
    national_id TEXT,
    language TEXT NOT NULL DEFAULT 'en',
    status TEXT NOT NULL DEFAULT 'prospect',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE buildings (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    total_units INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE units (
    id TEXT PRIMARY KEY,
    building_id TEXT NOT NULL,
    unit_number TEXT NOT NULL,
    type TEXT NOT NULL,
    size INTEGER,
    status TEXT NOT NULL DEFAULT 'vacant',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE CASCADE
  );

  CREATE TABLE contracts (
    id TEXT PRIMARY KEY,
    unit_id TEXT NOT NULL,
    contact_id TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    rent_amount TEXT NOT NULL,
    payment_frequency TEXT NOT NULL DEFAULT 'monthly',
    security_deposit TEXT,
    document_url TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
  );

  CREATE TABLE payments (
    id TEXT PRIMARY KEY,
    contract_id TEXT NOT NULL,
    due_date TEXT NOT NULL,
    amount TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    paid_date TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE
  );
`);

console.log('✅ Database tables created successfully!');
db.close();
