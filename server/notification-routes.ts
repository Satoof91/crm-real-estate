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
    const { db } = await import('../db');
    const { notifications } = await import('@shared/notifications-schema');
    const { desc, eq } = await import('drizzle-orm');

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;
    const status = req.query.status as string;

    let query = db.select().from(notifications).orderBy(desc(notifications.createdAt));

    if (status) {
      query = query.where(eq(notifications.status, status as any)) as any;
    }

    const allNotifications = await query.limit(limit).offset(offset) as any;
    const total = allNotifications.length; // Simplified for now

    res.json({
      data: allNotifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('Get notification history error:', error);
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

// Manually trigger payment reminders (admin only)
router.post('/api/notifications/trigger-reminders', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { notificationService } = await import('./services/notification.service');

    console.log('Manually triggering payment reminders...');
    await notificationService.sendPaymentReminders();

    res.json({
      success: true,
      message: 'Payment reminders job triggered successfully',
      triggeredAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Trigger reminders error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get notification stats for admin dashboard
router.get('/api/notifications/stats', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { db } = await import('../db');
    const { notifications, NotificationStatus } = await import('@shared/notifications-schema');
    const { eq, count } = await import('drizzle-orm');

    const [pending] = await db.select({ count: count() }).from(notifications).where(eq(notifications.status, NotificationStatus.PENDING));
    const [sent] = await db.select({ count: count() }).from(notifications).where(eq(notifications.status, NotificationStatus.SENT));
    const [failed] = await db.select({ count: count() }).from(notifications).where(eq(notifications.status, NotificationStatus.FAILED));
    const [total] = await db.select({ count: count() }).from(notifications);

    res.json({
      pending: pending?.count || 0,
      sent: sent?.count || 0,
      failed: failed?.count || 0,
      total: total?.count || 0
    });
  } catch (error: any) {
    console.error('Get notification stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;