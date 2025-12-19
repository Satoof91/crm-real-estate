import Database from 'better-sqlite3';

const db = new Database('local.db');

const users = db.prepare('SELECT id, username, email, full_name, role, created_at FROM users').all();

console.log('Total users:', users.length);
console.log('Users:', JSON.stringify(users, null, 2));

db.close();
