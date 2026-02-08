import Database from 'better-sqlite3';

const db = new Database('local.db');

try {
    console.log('Checking for user_settings table...');
    const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='user_settings'").get();

    if (tableExists) {
        console.log('user_settings table already exists.');
    } else {
        console.log('Creating user_settings table...');
        db.exec(`
      CREATE TABLE IF NOT EXISTS user_settings (
        id text PRIMARY KEY NOT NULL,
        user_id text NOT NULL,
        key text NOT NULL,
        value text NOT NULL,
        updated_at text NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE no action ON DELETE cascade
      );
    `);
        console.log('user_settings table created successfully.');
    }

    // Also check if system_settings exists, and if so, maybe migrate? 
    // For now, user request didn't ask for migration, just isolation.
    // We can leave system_settings or drop it. Let's leave it to avoid data loss if they revert.

} catch (error) {
    console.error('Error creating table:', error);
    process.exit(1);
}
