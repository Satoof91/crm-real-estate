
import { notificationService } from './server/services/notification.service';
import dotenv from 'dotenv';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

dotenv.config();
neonConfig.webSocketConstructor = ws;

async function triggerMustafa() {
    console.log('🚀 Triggering Monthly Unpaid Summary for: Mustafa Bushajea');
    try {
        await notificationService.sendMonthlyUnpaidSummary('Mustafa Bushajea');
        console.log('✅ Trigger completed successfully.');
    } catch (error) {
        console.error('❌ Trigger failed:', error);
    } finally {
        process.exit(0);
    }
}

triggerMustafa();
