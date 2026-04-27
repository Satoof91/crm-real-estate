import Database from 'better-sqlite3';

const db = new Database('local.db');

// Create system_settings table
db.exec(`
  CREATE TABLE IF NOT EXISTS system_settings (
    id TEXT PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

// Create notification_preferences table
db.exec(`
  CREATE TABLE IF NOT EXISTS notification_preferences (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    whatsapp_enabled INTEGER NOT NULL DEFAULT 1,
    email_enabled INTEGER NOT NULL DEFAULT 1,
    sms_enabled INTEGER NOT NULL DEFAULT 0,
    in_app_enabled INTEGER NOT NULL DEFAULT 1,
    payment_reminders INTEGER NOT NULL DEFAULT 1,
    contract_alerts INTEGER NOT NULL DEFAULT 1,
    maintenance_updates INTEGER NOT NULL DEFAULT 1,
    announcements INTEGER NOT NULL DEFAULT 1,
    quiet_hours_start TEXT,
    quiet_hours_end TEXT,
    timezone TEXT DEFAULT 'UTC',
    preferred_language TEXT DEFAULT 'en',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

// Insert default system settings for notifications
const insertSetting = db.prepare(`
  INSERT OR IGNORE INTO system_settings (id, key, value, description, updated_at)
  VALUES (?, ?, ?, ?, datetime('now'))
`);

insertSetting.run('sys_auto_payment', 'autoPaymentNotifications', 'true', 'Enable automatic payment reminder notifications');
insertSetting.run('sys_auto_monthly', 'autoMonthlySummary', 'true', 'Enable automatic monthly unpaid payment summaries');
insertSetting.run('sys_auto_contract', 'autoContractExpiry', 'true', 'Enable automatic contract expiry notifications');

console.log('✅ Tables created successfully');

// List all tables
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables:', (tables as any[]).map(t => t.name));

// Show system settings
const settings = db.prepare("SELECT * FROM system_settings").all();
console.log('System settings:', settings);

db.close();
