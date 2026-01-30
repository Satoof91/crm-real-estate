
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './shared/schema';
import { eq, like } from 'drizzle-orm';

dotenv.config();
neonConfig.webSocketConstructor = ws;

async function getMustafaId() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle(pool, { schema });

    try {
        const contacts = await db.select().from(schema.contacts);
        const mustafa = contacts.find(c => c.fullName.toLowerCase().includes('mustafa bushajea'));

        if (mustafa) {
            console.log(`Mustafa ID: ${mustafa.id}`);
        } else {
            console.log('Mustafa not found');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

getMustafaId();
