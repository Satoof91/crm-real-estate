import { Request, Response, Router } from 'express';
import { whatsAppService } from './services/whatsapp.service';
import { arabicTemplates, getArabicTemplate } from './services/arabic-templates';
import { notificationTemplates, getTemplate, renderTemplate } from './services/notification-templates';
import { isAuthenticated } from './middleware';

const router = Router();

// Test WhatsApp endpoint (no auth required for testing)
router.post('/api/notifications/test-whatsapp', async (req: Request, res: Response) => {
  try {
    const { phone, message } = req.body;

    if (!phone || !message) {
      return res.status(400).json({
        success: false,
        error: 'Phone and message are required'
      });
    }

    console.log(`📱 Testing WhatsApp notification to ${phone}`);

    // Send the message via WhatsApp service
    const result = await whatsAppService.sendMessage({
      to: phone,
      message: message
    });

    if (result.success) {
      res.json({
        success: true,
        notificationId: result.messageId,
        message: 'WhatsApp message sent successfully',
        status: result.status
      });
    } else {
      // Return the actual error from the WhatsApp service
      res.status(400).json({
        success: false,
        error: result.error || 'Failed to send WhatsApp message',
        details: result
      });
    }
  } catch (error: any) {
    console.error('Test WhatsApp error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// Payment reminder notification
router.post('/api/notifications/payment-reminder', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { recipientId, phone, tenantName, amount, dueDate, unitNumber, buildingName } = req.body;

    const template = getTemplate('payment_reminder', 'ar');
    if (!template) {
      return res.status(400).json({ error: 'Template not found' });
    }

    const message = renderTemplate(template.body, {
      tenantName,
      amount,
      dueDate,
      unitNumber,
      buildingName,
      companyName: 'Real Estate CRM'
    });

    const result = await whatsAppService.sendMessage({
      to: phone,
      message
    });

    res.json({
      success: true,
      notificationId: result.messageId
    });
  } catch (error: any) {
    console.error('Payment reminder error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Contract expiring notification
router.post('/api/notifications/contract-expiring', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { recipientId, phone, tenantName, unitNumber, buildingName, currentRent, expiryDate, daysRemaining } = req.body;

    const template = getTemplate('contract_expiring', 'ar');
    if (!template) {
      return res.status(400).json({ error: 'Template not found' });
    }

    const message = renderTemplate(template.body, {
      tenantName,
      unitNumber,
      buildingName,
      currentRent,
      expiryDate,
      daysRemaining,
      companyName: 'Real Estate CRM'
    });

    const result = await whatsAppService.sendMessage({
      to: phone,
      message
    });

    res.json({
      success: true,
      notificationId: result.messageId
    });
  } catch (error: any) {
    console.error('Contract expiring error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Bulk announcement
router.post('/api/notifications/announcement', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { recipients, subject, message } = req.body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: 'Recipients array is required' });
    }

    const results = [];
    const errors = [];

    for (const recipient of recipients) {
      try {
        const result = await whatsAppService.sendMessage({
          to: recipient.phone,
          message: `📢 *${subject}*\n\n${message}`
        });
        results.push({
          recipientId: recipient.id,
          success: true,
          messageId: result.messageId
        });
      } catch (error: any) {
        errors.push({
          recipientId: recipient.id,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      sent: results.length,
      failed: errors.length,
      results,
      errors
    });
  } catch (error: any) {
    console.error('Announcement error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get notification history
router.get('/api/notifications/history', isAuthenticated, async (req: Request, res: Response) => {
  try {
    // For now, return empty array since we don't have a notifications table
    res.json([]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get notification preferences
router.get('/api/notifications/preferences', isAuthenticated, async (req: Request, res: Response) => {
  try {
    // Return default preferences
    res.json({
      whatsapp: true,
      email: false,
      sms: false,
      language: 'ar'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get notifications (for UI)
router.get('/api/notifications', isAuthenticated, async (req: Request, res: Response) => {
  try {
    // Return empty array for now
    res.json([]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;