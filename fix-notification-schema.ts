import "dotenv/config";
import { neon } from "@neondatabase/serverless";

async function fixNotificationSchema() {
    const dbUrl = process.env.DATABASE_URL;

    if (!dbUrl || !dbUrl.startsWith('postgres')) {
        console.error("ERROR: DATABASE_URL not set or not postgres");
        process.exit(1);
    }

    console.log("Connecting to Neon database...");
    const sql = neon(dbUrl);

    try {
        // Check if notification_templates table exists
        const tableCheck = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('notifications', 'notification_templates', 'notification_preferences')
    `;

        const existingTables = tableCheck.map(t => t.table_name);
        console.log("Existing notification tables:", existingTables);

        // Create notifications table if missing
        if (!existingTables.includes('notifications')) {
            console.log("Creating 'notifications' table...");
            await sql`
        CREATE TABLE notifications (
          id TEXT PRIMARY KEY,
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
          template_data JSONB,
          metadata JSONB,
          scheduled_for TIMESTAMP,
          sent_at TIMESTAMP,
          delivered_at TIMESTAMP,
          read_at TIMESTAMP,
          failed_at TIMESTAMP,
          failure_reason TEXT,
          retry_count INTEGER DEFAULT 0,
          whatsapp_message_id TEXT,
          whatsapp_status TEXT,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `;
            console.log("✓ Created 'notifications' table");
        } else {
            console.log("✓ 'notifications' table already exists");
        }

        // Create notification_templates table if missing
        if (!existingTables.includes('notification_templates')) {
            console.log("Creating 'notification_templates' table...");
            await sql`
        CREATE TABLE notification_templates (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          channel TEXT NOT NULL,
          subject TEXT,
          body_template TEXT NOT NULL,
          language TEXT DEFAULT 'en',
          whatsapp_template_id TEXT,
          whatsapp_template_name TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `;
            console.log("✓ Created 'notification_templates' table");
        } else {
            console.log("✓ 'notification_templates' table already exists");
        }

        // Create notification_preferences table if missing
        if (!existingTables.includes('notification_preferences')) {
            console.log("Creating 'notification_preferences' table...");
            await sql`
        CREATE TABLE notification_preferences (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          whatsapp_enabled BOOLEAN DEFAULT true,
          email_enabled BOOLEAN DEFAULT true,
          sms_enabled BOOLEAN DEFAULT false,
          in_app_enabled BOOLEAN DEFAULT true,
          payment_reminders BOOLEAN DEFAULT true,
          contract_alerts BOOLEAN DEFAULT true,
          maintenance_updates BOOLEAN DEFAULT true,
          announcements BOOLEAN DEFAULT true,
          quiet_hours_start TEXT,
          quiet_hours_end TEXT,
          timezone TEXT DEFAULT 'UTC',
          preferred_language TEXT DEFAULT 'en',
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `;
            console.log("✓ Created 'notification_preferences' table");
        } else {
            console.log("✓ 'notification_preferences' table already exists");
        }

        // Verify all tables now exist
        const verifyCheck = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('notifications', 'notification_templates', 'notification_preferences')
    `;

        console.log("\n✓ All notification tables verified:", verifyCheck.map(t => t.table_name));

    } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
    }
}

fixNotificationSchema();
