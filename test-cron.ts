
import { notificationService } from './server/services/notification.service';
import dotenv from 'dotenv';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

dotenv.config();
neonConfig.webSocketConstructor = ws;

async function testCron() {
    console.log('Testing monthly cron job for: Mustafa Bushajea');
    try {
        // Override console.log to capture output
        const originalLog = console.log;
        console.log = (...args) => {
            originalLog('[Service Log]:', ...args);
        };

        await notificationService.sendMonthlyUnpaidSummary('Mustafa Bushajea');

        console.log = originalLog;
        console.log('Test completed.');
    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        process.exit(0);
    }
}

testCron();
