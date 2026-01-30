import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import dotenv from 'dotenv';

dotenv.config();
neonConfig.webSocketConstructor = ws;

async function createNotificationsTable() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    console.log('🔄 Creating notifications table in Neon Postgres...');

    try {
        // Create the notifications table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        type TEXT NOT NULL,
        channel TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        recipient_id TEXT NOT NULL,
        recipient_phone TEXT,
        recipient_email TEXT,
        recipient_name TEXT,
        subject TEXT,
        message TEXT NOT NULL,
        template_id TEXT,
        template_data TEXT,
        metadata TEXT,
        scheduled_for TIMESTAMP WITH TIME ZONE,
        sent_at TIMESTAMP WITH TIME ZONE,
        delivered_at TIMESTAMP WITH TIME ZONE,
        read_at TIMESTAMP WITH TIME ZONE,
        failed_at TIMESTAMP WITH TIME ZONE,
        failure_reason TEXT,
        retry_count INTEGER DEFAULT 0,
        whatsapp_message_id TEXT,
        whatsapp_status TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);

        console.log('✅ notifications table created successfully!');

        // Verify
        const result = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'notifications'
    `);

        if (result.rows.length > 0) {
            console.log('✅ Verified: notifications table exists in Neon');
        } else {
            console.log('❌ Error: notifications table was not created');
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

createNotificationsTable();
