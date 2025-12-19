import { Router } from 'express';
import { isAuthenticated } from '../middleware';
import { notificationService } from '../services/notification.service';
import { createNotificationSchema, updatePreferencesSchema } from '@shared/notifications-schema';
import { NotificationType } from '@shared/notifications-schema';

const router = Router();

// All routes require authentication by default
// Note: test-whatsapp endpoint will not require auth for testing purposes

/**
 * Send a notification
 */
router.post('/send', isAuthenticated, async (req, res) => {
  try {
    const data = createNotificationSchema.parse(req.body);

    const notificationId = await notificationService.sendNotification({
      ...data,
      metadata: {
        ...data.metadata,
        sentBy: req.session.userId,
      },
    });

    if (!notificationId) {
      return res.status(400).json({ error: 'Failed to send notification' });
    }

    res.json({
      success: true,
      notificationId,
      message: 'Notification sent successfully'
    });
  } catch (error: any) {
    console.error('Send notification error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * Send test WhatsApp message (No authentication required for testing)
 */
router.post('/test-whatsapp', async (req, res) => {
  try {
    const { phone, message } = req.body;

    if (!phone || !message) {
      return res.status(400).json({ error: 'Phone and message are required' });
    }

    const notificationId = await notificationService.sendNotification({
      type: NotificationType.ANNOUNCEMENT,
      recipientId: 'test-user',  // Use a test user ID instead of session
      recipientPhone: phone,
      recipientName: 'Test User',
      templateData: {
        tenantName: 'Test User',
        message,
        companyName: 'Real Estate CRM',
        subject: 'Test Message'
      },
      channel: 'whatsapp',
    });

    res.json({
      success: true,
      notificationId,
      message: 'Test message sent'
    });
  } catch (error: any) {
    console.error('Test WhatsApp error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Send payment reminder (No authentication required for testing)
 */
router.post('/payment-reminder', async (req, res) => {
  try {
    const { contractId, paymentId } = req.body;

    // TODO: Fetch contract and payment details from database
    // For now, using mock data
    const notificationId = await notificationService.sendNotification({
      type: NotificationType.PAYMENT_REMINDER,
      recipientId: req.body.recipientId,
      recipientPhone: req.body.phone,
      recipientName: req.body.tenantName,
      templateData: {
        tenantName: req.body.tenantName,
        amount: req.body.amount,
        dueDate: req.body.dueDate,
        unitNumber: req.body.unitNumber,
        buildingName: req.body.buildingName,
        companyName: 'Real Estate CRM',
      },
      metadata: {
        contractId,
        paymentId,
      },
    });

    res.json({
      success: true,
      notificationId,
      message: 'Payment reminder sent'
    });
  } catch (error: any) {
    console.error('Payment reminder error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Send contract expiry notification (No authentication required for testing)
 */
router.post('/contract-expiring', async (req, res) => {
  try {
    const { contractId } = req.body;

    // TODO: Fetch contract details from database
    const notificationId = await notificationService.sendNotification({
      type: NotificationType.CONTRACT_EXPIRING,
      recipientId: req.body.recipientId,
      recipientPhone: req.body.phone,
      recipientName: req.body.tenantName,
      templateData: {
        tenantName: req.body.tenantName,
        unitNumber: req.body.unitNumber,
        buildingName: req.body.buildingName,
        currentRent: req.body.currentRent,
        expiryDate: req.body.expiryDate,
        daysRemaining: req.body.daysRemaining,
        companyName: 'Real Estate CRM',
      },
      metadata: {
        contractId,
      },
    });

    res.json({
      success: true,
      notificationId,
      message: 'Contract expiry notification sent'
    });
  } catch (error: any) {
    console.error('Contract expiry notification error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Send bulk announcement
 */
router.post('/announcement', isAuthenticated, async (req, res) => {
  try {
    const { recipients, subject, message } = req.body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: 'Recipients required' });
    }

    const notificationIds = await notificationService.sendBulkNotifications(
      recipients.map(r => ({
        recipientId: r.id,
        recipientPhone: r.phone,
        recipientName: r.name,
        templateData: {
          tenantName: r.name,
          subject,
          message,
          companyName: 'Real Estate CRM',
        },
      })),
      NotificationType.ANNOUNCEMENT,
      { sentBy: (req as any).session?.userId || 'test-user' }
    );

    res.json({
      success: true,
      notificationIds,
      count: notificationIds.length,
      message: `Announcement sent to ${notificationIds.length} recipients`
    });
  } catch (error: any) {
    console.error('Send announcement error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get notification history
 */
router.get('/history', isAuthenticated, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const recipientId = req.query.recipientId as string || (req as any).session?.userId;

    const notifications = await notificationService.getNotificationHistory(recipientId, limit);

    res.json({
      success: true,
      data: notifications
    });
  } catch (error: any) {
    console.error('Get notification history error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get my notifications
 */
router.get('/my-notifications', isAuthenticated, async (req, res) => {
  try {
    const notifications = await notificationService.getNotificationHistory(
      (req as any).session?.userId,
      100
    );

    res.json({
      success: true,
      data: notifications
    });
  } catch (error: any) {
    console.error('Get my notifications error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Mark notification as read
 */
router.put('/:id/read', isAuthenticated, async (req, res) => {
  try {
    await notificationService.markAsRead(req.params.id);

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error: any) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get notification preferences
 */
router.get('/preferences', isAuthenticated, async (req, res) => {
  try {
    const userId = req.query.userId as string || (req as any).session?.userId;
    const preferences = await notificationService.getRecipientPreferences(userId);

    res.json({
      success: true,
      data: preferences || {
        whatsappEnabled: true,
        emailEnabled: true,
        smsEnabled: false,
        inAppEnabled: true,
        paymentReminders: true,
        contractAlerts: true,
        maintenanceUpdates: true,
        announcements: true,
        preferredLanguage: 'en',
      }
    });
  } catch (error: any) {
    console.error('Get preferences error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update notification preferences
 */
router.put('/preferences', isAuthenticated, async (req, res) => {
  try {
    const userId = req.body.userId || (req as any).session?.userId;
    const preferences = updatePreferencesSchema.parse(req.body);

    await notificationService.updatePreferences(userId, preferences);

    res.json({
      success: true,
      message: 'Preferences updated successfully'
    });
  } catch (error: any) {
    console.error('Update preferences error:', error);
    res.status(400).json({ error: error.message });
  }
});

export default router;