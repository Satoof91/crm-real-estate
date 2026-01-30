import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import dotenv from 'dotenv';

dotenv.config();

// Configure WebSocket for Neon serverless
neonConfig.webSocketConstructor = ws;

async function insertMonthlyUnpaidTemplate() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    try {
        console.log('Connecting to Neon database...');

        // Insert Arabic template
        const arTemplate = await pool.query(`
      INSERT INTO notification_templates (id, name, type, channel, subject, body_template, language, is_active, created_at, updated_at)
      VALUES (
        'monthly_unpaid_ar',
        'تذكير شهري بالمدفوعات المستحقة',
        'monthly_unpaid_summary',
        'whatsapp',
        'تذكير شهري بالمدفوعات - رصيد مستحق',
        'عزيزي/عزيزتي {{name}},

هذا تذكير بأن لديك مدفوعات مستحقة للوحدة {{unit}}.

📋 *الدفعات المستحقة:*
{{paymentsList}}

💰 *إجمالي المبلغ المستحق: {{amount}}*

يرجى تسديد رصيدك المستحق في أقرب وقت ممكن.

لأي استفسارات، يرجى الاتصال بنا.

مع أطيب التحيات،
Real Estate CRM',
        'ar',
        true,
        NOW(),
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        body_template = EXCLUDED.body_template,
        updated_at = NOW()
      RETURNING id;
    `);

        console.log('✅ Arabic template inserted/updated:', arTemplate.rows[0]?.id);

        // Insert English template
        const enTemplate = await pool.query(`
      INSERT INTO notification_templates (id, name, type, channel, subject, body_template, language, is_active, created_at, updated_at)
      VALUES (
        'monthly_unpaid_en',
        'Monthly Unpaid Payment Summary',
        'monthly_unpaid_summary',
        'whatsapp',
        'Monthly Payment Reminder - Outstanding Balance',
        'Dear {{name}},

This is a reminder that you have outstanding payments for unit {{unit}}.

📋 *Outstanding Payments:*
{{paymentsList}}

💰 *Total Amount Due: {{amount}}*

Please settle your outstanding balance at your earliest convenience.

For any queries, please contact us.

Best regards,
Real Estate CRM',
        'en',
        true,
        NOW(),
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        body_template = EXCLUDED.body_template,
        updated_at = NOW()
      RETURNING id;
    `);

        console.log('✅ English template inserted/updated:', enTemplate.rows[0]?.id);

        // Verify templates exist
        const result = await pool.query(`
      SELECT id, name, type, language FROM notification_templates 
      WHERE type = 'monthly_unpaid_summary'
    `);

        console.log('\n📋 Monthly Unpaid Summary templates in database:');
        result.rows.forEach(row => {
            console.log(`   - ${row.id}: ${row.name} (${row.language})`);
        });

        console.log('\n✅ Done! Templates are now available in the notification dropdown.');

    } catch (error: any) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

insertMonthlyUnpaidTemplate();
