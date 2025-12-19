# WhatsApp Integration Guide for Real Estate CRM

## Overview
This guide explains how to set up and use the WhatsApp notification system in the Real Estate CRM application.

## Table of Contents
1. [Architecture](#architecture)
2. [Setup Options](#setup-options)
3. [Configuration](#configuration)
4. [Usage](#usage)
5. [API Endpoints](#api-endpoints)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

## Architecture

The WhatsApp integration consists of several components:

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Application   │────▶│  Notification    │────▶│    WhatsApp     │
│     Events      │     │    Service       │     │    Service      │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │                         │
                               ▼                         ▼
                        ┌──────────────┐         ┌──────────────┐
                        │   Database   │         │  WhatsApp    │
                        │   (Queue)    │         │     API      │
                        └──────────────┘         └──────────────┘
```

### Key Components:

1. **Notification Service** (`server/services/notification.service.ts`)
   - Manages notification queue
   - Handles templates and personalization
   - Schedules and retries failed messages

2. **WhatsApp Service** (`server/services/whatsapp.service.ts`)
   - Integrates with WhatsApp providers (Twilio/Meta)
   - Handles message formatting and delivery

3. **Notification Templates** (`server/services/notification-templates.ts`)
   - Pre-defined message templates
   - Multi-language support (English/Arabic)

4. **Database Schema** (`shared/notifications-schema.ts`)
   - Stores notification history
   - Tracks delivery status
   - Manages user preferences

## Setup Options

### Option 1: Twilio (Recommended for Quick Setup)

Twilio provides an easy-to-use WhatsApp Business API integration.

#### Step 1: Create Twilio Account
1. Sign up at [https://www.twilio.com](https://www.twilio.com)
2. Verify your email and phone number
3. Get your Account SID and Auth Token from the Console Dashboard

#### Step 2: Set Up WhatsApp Sandbox (For Testing)
1. Go to Twilio Console > Messaging > Try it out > Send a WhatsApp message
2. Follow the instructions to connect your WhatsApp number to the sandbox
3. Note the sandbox number (usually `whatsapp:+14155238886`)

#### Step 3: Production Setup (Optional)
1. Apply for WhatsApp Business API access
2. Submit your business for verification
3. Get your dedicated WhatsApp Business number approved

### Option 2: Meta WhatsApp Business API

For direct integration with Meta's WhatsApp Business Platform.

#### Step 1: Meta Business Verification
1. Create a Meta Business account
2. Verify your business
3. Apply for WhatsApp Business API access

#### Step 2: Set Up WhatsApp Business App
1. Go to [https://developers.facebook.com](https://developers.facebook.com)
2. Create a new app or select existing
3. Add WhatsApp product to your app
4. Get your API token and Phone Number ID

### Option 3: Alternative Providers

You can also use:
- **Vonage** (formerly Nexmo)
- **MessageBird**
- **Infobip**
- **Gupshup**

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
# For Twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886  # Sandbox number
TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  # Optional

# For Meta WhatsApp API
WHATSAPP_API_URL=https://graph.facebook.com/v17.0/
WHATSAPP_API_TOKEN=your_access_token_here
WHATSAPP_PHONE_ID=your_phone_number_id_here

# Notification Settings
NOTIFICATION_ENABLED=true
NOTIFICATION_BATCH_SIZE=50
NOTIFICATION_RETRY_ATTEMPTS=3
```

### Database Setup

Run migrations to create notification tables:

```bash
# If using PostgreSQL
npx drizzle-kit push:pg

# If using SQLite (for development)
npx drizzle-kit push:sqlite
```

## Usage

### 1. Sending a Simple WhatsApp Message

```javascript
// Send a test message
const response = await fetch('/api/notifications/test-whatsapp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phone: '+1234567890',
    message: 'Hello from Real Estate CRM!'
  })
});
```

### 2. Sending Payment Reminders

```javascript
// Send payment reminder
await fetch('/api/notifications/payment-reminder', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    recipientId: 'contact_id',
    phone: '+1234567890',
    tenantName: 'John Doe',
    amount: 1500,
    dueDate: '2024-01-15',
    unitNumber: 'A101',
    buildingName: 'Plaza Tower',
    contractId: 'contract_123',
    paymentId: 'payment_456'
  })
});
```

### 3. Sending Contract Expiry Notifications

```javascript
// Notify about expiring contract
await fetch('/api/notifications/contract-expiring', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    recipientId: 'contact_id',
    phone: '+1234567890',
    tenantName: 'John Doe',
    unitNumber: 'A101',
    buildingName: 'Plaza Tower',
    currentRent: 1500,
    expiryDate: '2024-02-01',
    daysRemaining: 15,
    contractId: 'contract_123'
  })
});
```

### 4. Sending Bulk Announcements

```javascript
// Send announcement to multiple recipients
await fetch('/api/notifications/announcement', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    recipients: [
      { id: '1', phone: '+1234567890', name: 'John Doe' },
      { id: '2', phone: '+0987654321', name: 'Jane Smith' }
    ],
    subject: 'Building Maintenance',
    message: 'The building will undergo maintenance on Sunday.'
  })
});
```

## API Endpoints

### Core Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/notifications/send` | POST | Send custom notification |
| `/api/notifications/test-whatsapp` | POST | Test WhatsApp connection |
| `/api/notifications/payment-reminder` | POST | Send payment reminder |
| `/api/notifications/contract-expiring` | POST | Send contract expiry notification |
| `/api/notifications/announcement` | POST | Send bulk announcement |
| `/api/notifications/history` | GET | Get notification history |
| `/api/notifications/my-notifications` | GET | Get user's notifications |
| `/api/notifications/:id/read` | PUT | Mark notification as read |
| `/api/notifications/preferences` | GET | Get notification preferences |
| `/api/notifications/preferences` | PUT | Update notification preferences |

### Notification Types

- `payment_reminder` - Rent payment reminders
- `payment_received` - Payment confirmation
- `payment_overdue` - Overdue payment alerts
- `contract_expiring` - Contract expiry alerts
- `contract_expired` - Contract expired notifications
- `contract_renewed` - Contract renewal confirmation
- `maintenance_scheduled` - Maintenance notifications
- `maintenance_completed` - Maintenance completion
- `announcement` - General announcements
- `welcome` - Welcome messages for new tenants

## Testing

### 1. Test with Twilio Sandbox

```bash
# 1. Connect your WhatsApp to Twilio Sandbox
# Send "join <your-sandbox-keyword>" to the Twilio sandbox number

# 2. Update .env with sandbox credentials
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# 3. Send test message
curl -X POST http://localhost:5000/api/notifications/test-whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+1234567890",
    "message": "Test message from CRM"
  }'
```

### 2. Test Notification Templates

```javascript
// Test payment reminder template
const testData = {
  tenantName: 'John Doe',
  amount: '$1,500',
  dueDate: '2024-01-15',
  unitNumber: 'A101',
  buildingName: 'Plaza Tower',
  companyName: 'ABC Properties'
};

// Template will generate:
// "Dear John Doe, This is a reminder that your rent payment of $1,500
// for unit A101 is due on 2024-01-15..."
```

### 3. Test Scheduled Notifications

```javascript
// Schedule a notification for later
await fetch('/api/notifications/send', {
  method: 'POST',
  body: JSON.stringify({
    type: 'payment_reminder',
    recipientId: 'user_123',
    recipientPhone: '+1234567890',
    channel: 'whatsapp',
    scheduledFor: new Date('2024-01-14T09:00:00'),
    templateData: { /* template variables */ }
  })
});
```

## Troubleshooting

### Common Issues

#### 1. "Twilio client not configured"
**Solution:** Ensure `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` are set in `.env`

#### 2. WhatsApp number not verified
**Solution:** For Twilio sandbox, ensure the recipient has joined the sandbox by sending the join message

#### 3. Template not found
**Solution:** Check that the notification type exists in `notification-templates.ts`

#### 4. Rate limiting errors
**Solution:** Adjust `NOTIFICATION_BATCH_SIZE` and add delays between bulk sends

#### 5. Messages not delivered
**Checklist:**
- Verify phone number format (include country code)
- Check WhatsApp Business API status
- Ensure recipient has WhatsApp installed
- Check notification preferences aren't disabled

### Debug Mode

Enable debug logging:

```javascript
// In notification.service.ts
console.log('Sending notification:', {
  type: params.type,
  recipient: params.recipientId,
  channel: channel,
  status: 'pending'
});
```

### Webhook Setup (For Production)

Configure webhooks to receive delivery status updates:

```javascript
// Add webhook endpoint
router.post('/webhook/whatsapp', (req, res) => {
  const { MessageStatus, MessageSid } = req.body;

  // Update notification status in database
  await db.update(notifications)
    .set({
      whatsappStatus: MessageStatus,
      deliveredAt: MessageStatus === 'delivered' ? new Date() : undefined
    })
    .where(eq(notifications.whatsappMessageId, MessageSid));

  res.sendStatus(200);
});
```

## Best Practices

1. **Message Templates**: Use pre-approved templates for better delivery rates
2. **Opt-in**: Always get user consent before sending WhatsApp messages
3. **Timing**: Respect quiet hours (configured in preferences)
4. **Personalization**: Use recipient's preferred language
5. **Retry Logic**: Implement exponential backoff for failed messages
6. **Rate Limiting**: Don't exceed provider's rate limits
7. **Monitoring**: Track delivery rates and failures
8. **Compliance**: Follow WhatsApp Business Policy

## Security Considerations

1. **Encrypt sensitive data** in notifications
2. **Validate phone numbers** before sending
3. **Rate limit** API endpoints to prevent abuse
4. **Log all notifications** for audit trail
5. **Use environment variables** for credentials
6. **Implement authentication** on all endpoints
7. **Sanitize template variables** to prevent injection

## Next Steps

1. **Set up production WhatsApp Business account**
2. **Create custom message templates**
3. **Implement automated triggers for events**
4. **Build notification preferences UI**
5. **Add analytics dashboard**
6. **Set up monitoring and alerts**

## Support

For issues or questions:
- Check the logs in `/server/logs/notifications.log`
- Review the error messages in the notifications table
- Contact WhatsApp Business API support
- Refer to provider documentation (Twilio/Meta)

---

## Quick Start Checklist

- [ ] Choose WhatsApp provider (Twilio/Meta)
- [ ] Create account and get credentials
- [ ] Add credentials to `.env` file
- [ ] Install dependencies (`npm install`)
- [ ] Run database migrations
- [ ] Test with sandbox number
- [ ] Send test notification
- [ ] Configure notification preferences
- [ ] Set up automated triggers
- [ ] Deploy to production