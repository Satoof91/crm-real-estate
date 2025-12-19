import axios from 'axios';

export interface WhatsAppMessage {
  to: string;
  message: string;
  mediaUrl?: string; // Kept for interface compatibility, though Wasender basic send might not support it directly in the same way
  templateName?: string;
  templateParams?: Record<string, any>;
}

export interface WhatsAppResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  status?: string;
}

class WhatsAppService {
  private apiKey: string;
  private apiUrl: string;

  constructor() {
    this.apiKey = process.env.WASENDER_API_KEY || '';
    this.apiUrl = process.env.WASENDER_API_URL || 'https://wasenderapi.com/api/send-message';

    if (!this.apiKey) {
      console.warn('⚠️ WASENDER_API_KEY not found in environment variables');
    }
  }

  /**
   * Send WhatsApp message via Wasender
   */
  async sendMessage(params: WhatsAppMessage): Promise<WhatsAppResponse> {
    try {
      if (!this.apiKey) {
        return {
          success: false,
          error: 'Wasender API key not configured',
        };
      }

      const phoneNumber = this.formatPhoneNumber(params.to);

      console.log(`📱 Sending WhatsApp message via Wasender:`);
      console.log(`   To: ${phoneNumber}`);
      console.log(`   Message length: ${params.message.length} characters`);

      const payload = {
        to: phoneNumber,
        text: params.message
      };

      const response = await axios.post(this.apiUrl, payload, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`✅ Message sent successfully!`);
      // Wasender response structure needs to be handled. Assuming success if 200 OK.
      // Adjust based on actual API response if needed.
      console.log('   Response:', response.data);

      return {
        success: true,
        messageId: response.data.id || 'unknown', // Adjust based on actual response
        status: 'sent',
      };

    } catch (error: any) {
      console.error('❌ Wasender error:', error.message);
      if (error.response) {
        console.error('   Status:', error.response.status);
        console.error('   Data:', error.response.data);
      }

      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to send WhatsApp message',
      };
    }
  }

  /**
   * Format phone number for WhatsApp
   * Ensures format is +[CountryCode][Number]
   */
  private formatPhoneNumber(phone: string): string {
    // Remove 'whatsapp:' prefix if present (legacy Twilio support)
    let cleaned = phone.replace('whatsapp:', '').trim();

    // Remove non-numeric characters EXCEPT '+' at the start
    // If it starts with +, keep it. If not, we'll process it.
    const hasPlus = cleaned.startsWith('+');
    cleaned = cleaned.replace(/[^\d]/g, '');

    // Saudi specific handling
    if (cleaned.startsWith('966')) {
      // Good, do nothing
    } else if (cleaned.startsWith('05')) {
      // Saudi mobile number with leading 0 - replace 0 with 966
      cleaned = '966' + cleaned.substring(1);
    } else if (cleaned.startsWith('5') && cleaned.length === 9) {
      // Saudi number without 0 prefix
      cleaned = '966' + cleaned;
    } else if (cleaned.startsWith('0')) {
      // Other domestic numbers, assume Saudi for now or leave as is if unsure
      cleaned = '966' + cleaned.substring(1);
    }

    // Ensure it starts with +
    if (!hasPlus && !cleaned.startsWith('+')) {
      return '+' + cleaned;
    } else if (hasPlus && !cleaned.startsWith('+')) { // If we stripped the + but it was there
      return '+' + cleaned;
    }

    // If it was already +966..., cleaned is now 966... so add +
    return '+' + cleaned;
  }

  /**
   * Send bulk messages
   */
  async sendBulkMessages(recipients: Array<{ phone: string; message: string }>): Promise<{
    sent: number;
    failed: number;
    results: Array<{ phone: string; success: boolean; messageId?: string; error?: string }>;
  }> {
    const results = [];
    let sent = 0;
    let failed = 0;

    console.log(`📨 Sending bulk messages to ${recipients.length} recipients`);

    for (const recipient of recipients) {
      const result = await this.sendMessage({
        to: recipient.phone,
        message: recipient.message,
      });

      if (result.success) {
        sent++;
        results.push({
          phone: recipient.phone,
          success: true,
          messageId: result.messageId,
        });
      } else {
        failed++;
        results.push({
          phone: recipient.phone,
          success: false,
          error: result.error,
        });
      }

      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`✅ Bulk send complete: ${sent} sent, ${failed} failed`);

    return { sent, failed, results };
  }

  /**
   * Build template message
   * Simple string replacement
   */
  buildTemplateMessage(template: string, params: Record<string, any>): string {
    let message = template;

    Object.keys(params).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      message = message.replace(regex, params[key]);
    });

    return message;
  }

  /**
   * Check if service is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }
}

// Export singleton instance
export const whatsAppService = new WhatsAppService();
export { WhatsAppService };
