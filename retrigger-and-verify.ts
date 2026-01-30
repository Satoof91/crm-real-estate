
import { notificationService } from './server/services/notification.service';
import { db } from './server/db';
import { notifications } from './shared/notifications-schema';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import dotenv from 'dotenv';
import { eq, desc } from 'drizzle-orm';
import { notifications as notificationsSchema } from './shared/notifications-schema';

dotenv.config();
neonConfig.webSocketConstructor = ws;

async function run() {
    console.log('🚀 Triggering Monthly Summary for Mustafa Bushajea...');

    try {
        // 1. Trigger
        await notificationService.sendMonthlyUnpaidSummary('Mustafa Bushajea');
        console.log('✅ Trigger function finished.');

        // 2. Verify DB
        // We need to wait a sec? No, it's awaited.

        // We need to query DB.
        // I will use direct DB query using the schema.
        const results = await db.select().from(notificationsSchema)
            .orderBy(desc(notificationsSchema.createdAt))
            .limit(5);

        console.log(`\n📋 Latest 5 Notifications in DB:`);
        if (results.length === 0) {
            console.log("   (No notifications found)");
        }

        results.forEach(n => {
            console.log(`   - [${n.status}] To: ${n.recipientName} | Type: ${n.type} | Msg: ${n.message.substring(0, 30)}...`);
        });

        const mustafaNotifs = results.filter(n => n.recipientName?.includes('Mustafa'));
        if (mustafaNotifs.length > 0) {
            console.log(`\n✅ SUCCESS: Found ${mustafaNotifs.length} recent notification(s) for Mustafa!`);
        } else {
            console.log(`\n❌ FAILURE: No recent notifications found for Mustafa.`);
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        process.exit(0);
    }
}

run();
