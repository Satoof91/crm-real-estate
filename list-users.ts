
import { db } from './server/db';
import { users } from './shared/sqlite-schema'; // Adjust if needed
import { users as pgUsers } from './shared/schema'; // Try this one too if sqlite one fails or vice versa. Usually schema.ts has it.
import * as schema from './shared/schema';

import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import dotenv from 'dotenv';
dotenv.config();
neonConfig.webSocketConstructor = ws;

async function getUsers() {
    try {
        // We'll use the pool directly to avoid import issues with db.ts if any
        const pool = new Pool({ connectionString: process.env.DATABASE_URL });
        const result = await pool.query('SELECT username, role, password FROM users LIMIT 5');
        console.log('Users found:', result.rows);
        await pool.end();
    } catch (error) {
        console.error('Error:', error);
    }
}

getUsers();
