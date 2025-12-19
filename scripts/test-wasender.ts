import 'dotenv/config';
import { whatsAppService } from '../server/services/whatsapp.service';

async function main() {
    console.log('Testing Wasender API...');

    // Use the number provided by the user
    const testNumber = '+966560244464';

    try {
        const result = await whatsAppService.sendMessage({
            to: testNumber,
            message: 'Hello from Wasender API (via Test Script)! 🚀'
        });

        console.log('Test Result:', JSON.stringify(result, null, 2));

        if (result.success) {
            console.log('✅ Test Passed!');
            process.exit(0);
        } else {
            console.error('❌ Test Failed');
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ Unexpected Error:', error);
        process.exit(1);
    }
}

main();
