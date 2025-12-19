export interface TemplateVariable {
  [key: string]: string | number | Date;
}

export const notificationTemplates = {
  // Payment Templates
  payment_reminder: {
    en: {
      subject: 'Payment Reminder - {{unitNumber}}',
      body: `Dear {{tenantName}},

This is a friendly reminder that your rent payment of {{amount}} for unit {{unitNumber}} is due on {{dueDate}}.

Payment Details:
- Amount: {{amount}}
- Due Date: {{dueDate}}
- Unit: {{unitNumber}}
- Building: {{buildingName}}

Please ensure timely payment to avoid any late fees.

Best regards,
{{companyName}}`,
    },
    ar: {
      subject: 'تذكير بالدفع - {{unitNumber}}',
      body: `عزيزي/عزيزتي {{tenantName}}،

هذا تذكير ودي بأن دفعة الإيجار الخاصة بك بقيمة {{amount}} للوحدة {{unitNumber}} مستحقة في {{dueDate}}.

تفاصيل الدفع:
- المبلغ: {{amount}}
- تاريخ الاستحقاق: {{dueDate}}
- الوحدة: {{unitNumber}}
- المبنى: {{buildingName}}

يرجى التأكد من الدفع في الوقت المناسب لتجنب أي رسوم تأخير.

مع أطيب التحيات،
{{companyName}}`,
    },
  },

  payment_received: {
    en: {
      subject: 'Payment Received - Thank You!',
      body: `Dear {{tenantName}},

We have successfully received your payment of {{amount}} for unit {{unitNumber}}.

Payment Details:
- Amount Received: {{amount}}
- Payment Date: {{paymentDate}}
- Unit: {{unitNumber}}
- Reference: {{referenceNumber}}

Thank you for your prompt payment!

Best regards,
{{companyName}}`,
    },
    ar: {
      subject: 'تم استلام الدفعة - شكراً لك!',
      body: `عزيزي/عزيزتي {{tenantName}}،

لقد استلمنا بنجاح دفعتك بقيمة {{amount}} للوحدة {{unitNumber}}.

تفاصيل الدفعة:
- المبلغ المستلم: {{amount}}
- تاريخ الدفع: {{paymentDate}}
- الوحدة: {{unitNumber}}
- الرقم المرجعي: {{referenceNumber}}

شكراً لك على الدفع الفوري!

مع أطيب التحيات،
{{companyName}}`,
    },
  },

  payment_overdue: {
    en: {
      subject: 'URGENT: Payment Overdue - {{unitNumber}}',
      body: `Dear {{tenantName}},

Your rent payment for unit {{unitNumber}} is now overdue.

Overdue Details:
- Original Amount: {{amount}}
- Due Date: {{dueDate}}
- Days Overdue: {{daysOverdue}}
- Late Fee: {{lateFee}}
- Total Amount Due: {{totalAmount}}

Please make the payment immediately to avoid further action.

For any queries, please contact us immediately.

Regards,
{{companyName}}`,
    },
    ar: {
      subject: 'عاجل: دفعة متأخرة - {{unitNumber}}',
      body: `عزيزي/عزيزتي {{tenantName}}،

دفعة الإيجار الخاصة بك للوحدة {{unitNumber}} متأخرة الآن.

تفاصيل التأخير:
- المبلغ الأصلي: {{amount}}
- تاريخ الاستحقاق: {{dueDate}}
- أيام التأخير: {{daysOverdue}}
- رسوم التأخير: {{lateFee}}
- إجمالي المبلغ المستحق: {{totalAmount}}

يرجى السداد فوراً لتجنب اتخاذ إجراءات أخرى.

لأي استفسارات، يرجى الاتصال بنا فوراً.

مع التحية،
{{companyName}}`,
    },
  },

  // Contract Templates
  contract_expiring: {
    en: {
      subject: 'Contract Expiring Soon - {{unitNumber}}',
      body: `Dear {{tenantName}},

Your lease contract for unit {{unitNumber}} will expire on {{expiryDate}} ({{daysRemaining}} days remaining).

Contract Details:
- Unit: {{unitNumber}}
- Building: {{buildingName}}
- Current Rent: {{currentRent}}
- Expiry Date: {{expiryDate}}

Please contact us to discuss renewal options.

Best regards,
{{companyName}}`,
    },
    ar: {
      subject: 'العقد ينتهي قريباً - {{unitNumber}}',
      body: `عزيزي/عزيزتي {{tenantName}}،

عقد الإيجار الخاص بك للوحدة {{unitNumber}} سينتهي في {{expiryDate}} (متبقي {{daysRemaining}} يوم).

تفاصيل العقد:
- الوحدة: {{unitNumber}}
- المبنى: {{buildingName}}
- الإيجار الحالي: {{currentRent}}
- تاريخ الانتهاء: {{expiryDate}}

يرجى الاتصال بنا لمناقشة خيارات التجديد.

مع أطيب التحيات،
{{companyName}}`,
    },
  },

  contract_renewed: {
    en: {
      subject: 'Contract Renewed Successfully',
      body: `Dear {{tenantName}},

Your lease contract for unit {{unitNumber}} has been successfully renewed.

New Contract Details:
- Unit: {{unitNumber}}
- New Start Date: {{startDate}}
- New End Date: {{endDate}}
- Monthly Rent: {{monthlyRent}}
- Security Deposit: {{securityDeposit}}

Thank you for continuing with us!

Best regards,
{{companyName}}`,
    },
    ar: {
      subject: 'تم تجديد العقد بنجاح',
      body: `عزيزي/عزيزتي {{tenantName}}،

تم تجديد عقد الإيجار الخاص بك للوحدة {{unitNumber}} بنجاح.

تفاصيل العقد الجديد:
- الوحدة: {{unitNumber}}
- تاريخ البداية الجديد: {{startDate}}
- تاريخ الانتهاء الجديد: {{endDate}}
- الإيجار الشهري: {{monthlyRent}}
- التأمين: {{securityDeposit}}

شكراً لاستمرارك معنا!

مع أطيب التحيات،
{{companyName}}`,
    },
  },

  // Welcome Template
  welcome: {
    en: {
      subject: 'Welcome to {{companyName}}!',
      body: `Dear {{tenantName}},

Welcome to {{companyName}}! We're delighted to have you as our tenant.

Your Details:
- Unit: {{unitNumber}}
- Building: {{buildingName}}
- Move-in Date: {{moveInDate}}
- Monthly Rent: {{monthlyRent}}

Important Information:
- Rent is due on the {{dueDay}} of each month
- Emergency Contact: {{emergencyContact}}
- Office Hours: {{officeHours}}

If you have any questions, please don't hesitate to contact us.

Best regards,
{{companyName}} Team`,
    },
    ar: {
      subject: 'مرحباً بك في {{companyName}}!',
      body: `عزيزي/عزيزتي {{tenantName}}،

مرحباً بك في {{companyName}}! يسعدنا أن نرحب بك كمستأجر لدينا.

تفاصيلك:
- الوحدة: {{unitNumber}}
- المبنى: {{buildingName}}
- تاريخ الانتقال: {{moveInDate}}
- الإيجار الشهري: {{monthlyRent}}

معلومات مهمة:
- الإيجار مستحق في {{dueDay}} من كل شهر
- رقم الطوارئ: {{emergencyContact}}
- ساعات العمل: {{officeHours}}

إذا كان لديك أي أسئلة، لا تتردد في الاتصال بنا.

مع أطيب التحيات،
فريق {{companyName}}`,
    },
  },

  // Maintenance Templates
  maintenance_scheduled: {
    en: {
      subject: 'Maintenance Scheduled - {{unitNumber}}',
      body: `Dear {{tenantName}},

Maintenance work has been scheduled for your unit.

Maintenance Details:
- Unit: {{unitNumber}}
- Date: {{maintenanceDate}}
- Time: {{maintenanceTime}}
- Type: {{maintenanceType}}
- Expected Duration: {{duration}}

Please ensure someone is available at the scheduled time.

Thank you for your cooperation.

Best regards,
{{companyName}}`,
    },
    ar: {
      subject: 'صيانة مجدولة - {{unitNumber}}',
      body: `عزيزي/عزيزتي {{tenantName}}،

تم جدولة أعمال صيانة لوحدتك.

تفاصيل الصيانة:
- الوحدة: {{unitNumber}}
- التاريخ: {{maintenanceDate}}
- الوقت: {{maintenanceTime}}
- النوع: {{maintenanceType}}
- المدة المتوقعة: {{duration}}

يرجى التأكد من وجود شخص في الوقت المحدد.

شكراً لتعاونك.

مع أطيب التحيات،
{{companyName}}`,
    },
  },

  // Announcement Template
  announcement: {
    en: {
      subject: '{{subject}}',
      body: `Dear {{tenantName}},

{{message}}

Best regards,
{{companyName}}`,
    },
    ar: {
      subject: '{{subject}}',
      body: `عزيزي/عزيزتي {{tenantName}}،

{{message}}

مع أطيب التحيات،
{{companyName}}`,
    },
  },
};

/**
 * Replace template variables with actual values
 */
export function renderTemplate(template: string, variables: TemplateVariable): string {
  let rendered = template;

  Object.keys(variables).forEach(key => {
    const value = variables[key];
    const formattedValue = formatValue(value);
    const regex = new RegExp(`{{${key}}}`, 'g');
    rendered = rendered.replace(regex, formattedValue);
  });

  return rendered;
}

/**
 * Format value based on type
 */
function formatValue(value: any): string {
  if (value instanceof Date) {
    return value.toLocaleDateString();
  }
  if (typeof value === 'number') {
    return value.toLocaleString();
  }
  return String(value);
}

/**
 * Get template by type and language
 */
export function getTemplate(type: string, language: string = 'en'): { subject?: string; body: string } | null {
  const template = notificationTemplates[type as keyof typeof notificationTemplates];
  if (!template) return null;

  const languageTemplate = template[language as keyof typeof template] || template.en;
  return languageTemplate;
}