
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './shared/schema';
import { eq } from 'drizzle-orm';

dotenv.config();
neonConfig.webSocketConstructor = ws;

async function inspectData() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle(pool, { schema });

    try {
        console.log('--- Contracts ---');
        const allContacts = await db.select().from(schema.contacts);
        const targetContact = allContacts.find(c => c.fullName.includes('Mustafa Bushajea'));

        if (!targetContact) {
            console.log('Contact "Mustafa Bushajea" not found.');
        } else {
            console.log(`Found Contact: ${targetContact.fullName} (ID: ${targetContact.id})`);

            const contracts = await db.select().from(schema.contracts).where(eq(schema.contracts.contactId, targetContact.id));
            console.log(`Found ${contracts.length} contracts for this contact.`);

            for (const contract of contracts) {
                console.log(`\nContract ID: ${contract.id}`);
                const payments = await db.select().from(schema.payments).where(eq(schema.payments.contractId, contract.id));
                console.log(`Found ${payments.length} payments.`);
                payments.forEach(p => {
                    console.log(` - Payment Due: ${p.dueDate}, Amount: ${p.amount}, Status: '${p.status}'`);
                });
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

inspectData();
