import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { API_BASE, apiRequest, queryClient } from '@/lib/queryClient';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MessageSquare, Send, Globe, Users, User, Phone, Building, Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';

interface SendNotificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultRecipient?: {
    id: string;
    name: string;
    phone: string;
    unitNumber?: string;
    buildingName?: string;
  };
  defaultType?: string;
}

// Notification templates
const notificationTemplates = {
  payment_reminder: {
    en: 'Payment Reminder',
    ar: 'تذكير بالدفع',
    icon: '💰'
  },
  monthly_unpaid_summary: {
    en: 'Monthly Unpaid Summary',
    ar: 'ملخص المدفوعات المستحقة',
    icon: '📊'
  },
  contract_expiring: {
    en: 'Contract Expiring',
    ar: 'انتهاء العقد',
    icon: '📅'
  },
  maintenance_scheduled: {
    en: 'Maintenance Scheduled',
    ar: 'صيانة مجدولة',
    icon: '🔧'
  },
  welcome: {
    en: 'Welcome Message',
    ar: 'رسالة ترحيب',
    icon: '🏠'
  },
  announcement: {
    en: 'General Announcement',
    ar: 'إعلان عام',
    icon: '📢'
  },
  custom: {
    en: 'Custom Message',
    ar: 'رسالة مخصصة',
    icon: '✉️'
  }
};

// Quick message templates
const quickTemplates = {
  ar: {
    payment_reminder: `تذكير: موعد سداد الإيجار الشهري

السيد/ة {{name}} المحترم/ة،

نود تذكيركم بأن موعد سداد الإيجار للوحدة {{unit}} في {{building}} يحل في {{date}}.

المبلغ المستحق: {{amount}} ريال

يرجى السداد في الموعد المحدد.

شكراً لكم`,

    monthly_unpaid_summary: `ملخص المدفوعات المستحقة

عزيزي/عزيزتي {{name}}،

هذا تذكير بأن لديك مدفوعات مستحقة للوحدة {{unit}}.

📋 الدفعات المستحقة:
{{paymentsList}}

💰 إجمالي المبلغ المستحق: {{amount}} ريال

يرجى تسديد رصيدك المستحق في أقرب وقت ممكن.

لأي استفسارات، يرجى الاتصال بنا.

مع أطيب التحيات`,

    contract_expiring: `تنبيه: اقتراب انتهاء العقد

السيد/ة {{name}} المحترم/ة،

نود إشعاركم بأن عقد الإيجار الخاص بالوحدة {{unit}} سينتهي في {{date}}.

يرجى التواصل معنا لتجديد العقد.

مع تحياتنا`,

    maintenance_scheduled: `إشعار بموعد الصيانة

السيد/ة {{name}} المحترم/ة،

سيقوم فريق الصيانة بزيارة الوحدة {{unit}} في {{date}} الساعة {{time}}.

نوع الصيانة: {{type}}

يرجى التواجد في الموعد المحدد.

شكراً لتعاونكم`,

    welcome: `أهلاً وسهلاً بكم!

السيد/ة {{name}} المحترم/ة،

يسعدنا أن نرحب بكم في {{building}}.

رقم وحدتكم: {{unit}}
موعد السداد الشهري: يوم {{paymentDay}} من كل شهر

للطوارئ: {{emergency}}

نتمنى لكم إقامة سعيدة!`,

    custom: ''
  },
  en: {
    payment_reminder: `Payment Reminder

Dear {{name}},

This is a reminder that your rent payment for unit {{unit}} in {{building}} is due on {{date}}.

Amount due: {{amount}} SAR

Please ensure timely payment.

Thank you`,

    monthly_unpaid_summary: `Outstanding Payments Summary

Dear {{name}},

This is a reminder that you have outstanding payments for unit {{unit}}.

📋 Outstanding Payments:
{{paymentsList}}

💰 Total Amount Due: {{amount}} SAR

Please settle your outstanding balance at your earliest convenience.

For any queries, please contact us.

Best regards`,

    contract_expiring: `Contract Expiry Notice

Dear {{name}},

Your lease contract for unit {{unit}} will expire on {{date}}.

Please contact us to discuss renewal options.

Best regards`,

    maintenance_scheduled: `Maintenance Notice

Dear {{name}},

Our maintenance team will visit unit {{unit}} on {{date}} at {{time}}.

Maintenance type: {{type}}

Please ensure someone is available.

Thank you`,

    welcome: `Welcome!

Dear {{name}},

Welcome to {{building}}!

Your unit number: {{unit}}
Monthly payment due: Day {{paymentDay}} of each month

Emergency contact: {{emergency}}

We wish you a pleasant stay!`,

    custom: ''
  }
};

export function SendNotificationDialog({
  open,
  onOpenChange,
  defaultRecipient,
  defaultType = 'custom'
}: SendNotificationDialogProps) {
  const { i18n, t } = useTranslation();
  const { toast } = useToast();
  const language = i18n.language;
  const isRTL = language === 'ar';

  const [loading, setLoading] = useState(false);
  const [recipientType, setRecipientType] = useState<'individual' | 'all'>('individual');
  const [notificationType, setNotificationType] = useState(defaultType);
  const [recipientPhone, setRecipientPhone] = useState(defaultRecipient?.phone || '');
  const [recipientName, setRecipientName] = useState(defaultRecipient?.name || '');
  const [message, setMessage] = useState('');
  const [useTemplate, setUseTemplate] = useState(true);
  const [messageLanguage, setMessageLanguage] = useState<'ar' | 'en'>(language as 'ar' | 'en');

  // Load contacts for recipient selection using useQuery for caching and proper fetch logic
  const { data: contactsResponse } = useQuery<any>({
    queryKey: ['/api/contacts'],
    enabled: open, // Only fetch when dialog is open
  });
  
  const contacts = contactsResponse?.data || [];
  const [selectedContact, setSelectedContact] = useState<string>('');

  useEffect(() => {
    // Load template when type changes
    if (useTemplate && notificationType !== 'custom') {
      // If a contact is already selected, re-populate with their data
      if (selectedContact) {
        handleContactSelect(selectedContact, notificationType);
      } else if (defaultRecipient) {
        // Use default recipient if provided
        const template = quickTemplates[language as 'ar' | 'en'][notificationType as keyof typeof quickTemplates['ar']];
        if (template) {
          let msg = template;
          msg = msg.replace(/{{name}}/g, defaultRecipient.name);
          msg = msg.replace(/{{unit}}/g, defaultRecipient.unitNumber || 'N/A');
          msg = msg.replace(/{{building}}/g, defaultRecipient.buildingName || 'N/A');
          setMessage(msg);
        }
      } else {
        // Just load the template with placeholders if no contact selected
        const template = quickTemplates[language as 'ar' | 'en'][notificationType as keyof typeof quickTemplates['ar']];
        if (template) {
          setMessage(template);
        }
      }
    }
  }, [notificationType, useTemplate, language]);

  const handleContactSelect = async (contactId: string, currentNotificationType?: string, currentLang?: 'ar' | 'en') => {
    // Use passed notificationType or fall back to state (for direct dropdown selection)
    const effectiveNotificationType = currentNotificationType || notificationType;
    const effectiveLang = currentLang || messageLanguage;
    const contact = contacts.find((c: any) => c.id === contactId);
    
    if (contact) {
      setRecipientPhone(contact.phone || '');
      setRecipientName(contact.fullName || '');
      setSelectedContact(contactId);

      let unitNumber = 'N/A';
      let buildingName = 'N/A';
      let paymentAmount = 'N/A';
      let paymentDay = '1';
      let paymentsList = 'No overdue payments';
      let totalAmount = 0;

      // Fetch contract and payment data using queryClient for automatic caching and instant responses
      try {
        const contractsData: any = await queryClient.fetchQuery({ queryKey: ['/api/contracts'] });
        const paymentsData: any = await queryClient.fetchQuery({ queryKey: ['/api/payments'] });

        const activeContract = (contractsData.data || []).find((c: any) => c.contactId === contactId);

        if (activeContract) {
          // Fetch unit info
          try {
            const unit: any = await queryClient.fetchQuery({ queryKey: [`/api/units/${activeContract.unitId}`] });
            unitNumber = unit.unitNumber || 'N/A';

            // Fetch building info
            try {
              const building: any = await queryClient.fetchQuery({ queryKey: [`/api/buildings/${unit.buildingId}`] });
              buildingName = building.name || 'N/A';
            } catch (e) { console.error('Error fetching building:', e); }
          } catch (e) { console.error('Error fetching unit:', e); }

            // Get actual payment amount from payments data (pending payments for this contract)
            const contractPayments = (paymentsData.data || []).filter((p: any) => p.contractId === activeContract.id);
            if (contractPayments.length > 0) {
              // Get the first pending payment or the most recent one
              const pendingPayment = contractPayments.find((p: any) => p.status === 'pending');
              const relevantPayment = pendingPayment || contractPayments[0];
              paymentAmount = parseFloat(relevantPayment.amount).toLocaleString();
            } else {
              // Fallback to contract rent amount if no payments found
              paymentAmount = parseFloat(activeContract.rentAmount).toLocaleString();
            }

            // Extract day from contract start date
            const startDate = new Date(activeContract.startDate);
            paymentDay = startDate.getDate().toString();

            // Special handling for monthly_unpaid_summary
            if (effectiveNotificationType === 'monthly_unpaid_summary') {
              let targetPayments = paymentsData.data || [];
              targetPayments = targetPayments.filter((p: any) => p.contractId === activeContract.id);

              const overduePayments = targetPayments.filter((p: any) => {
                const isDynamicOverdue = p.status === 'pending' && new Date(p.dueDate) < new Date();
                return p.status === 'overdue' || isDynamicOverdue;
              });

              paymentsList = overduePayments
                .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                .map((p: any, index: number) => {
                  const dueDate = new Date(p.dueDate).toLocaleDateString(effectiveLang === 'ar' ? 'ar-SA' : 'en-US');
                  const amount = parseFloat(p.amount).toLocaleString();
                  return `${index + 1}. ${dueDate} - ${amount} ${effectiveLang === 'ar' ? 'ريال' : 'SAR'}`;
                })
                .join('\n');

              totalAmount = overduePayments.reduce((sum: number, p: any) => sum + parseFloat(p.amount || '0'), 0);
            }
          }
      } catch (error) {
        console.error('Error fetching contract data:', error);
      }

      // Update template message with actual values using selected message language
      // This is placed OUTSIDE the try-catch to guarantee the message is set even if API fails
      if (useTemplate && effectiveNotificationType !== 'custom') {
        const template = quickTemplates[effectiveLang][effectiveNotificationType as keyof typeof quickTemplates['ar']];
        if (template) {
          let msg = template;
          msg = msg.replace(/{{name}}/g, contact.fullName || '');
          msg = msg.replace(/{{unit}}/g, unitNumber);
          msg = msg.replace(/{{building}}/g, buildingName);

          if (effectiveNotificationType === 'monthly_unpaid_summary') {
            msg = msg.replace(/{{paymentsList}}/g, paymentsList || 'No overdue payments');
            msg = msg.replace(/{{amount}}/g, totalAmount.toLocaleString());
          } else {
            msg = msg.replace(/{{amount}}/g, paymentAmount);
          }

          msg = msg.replace(/{{paymentDay}}/g, paymentDay);
          msg = msg.replace(/{{date}}/g, new Date().toLocaleDateString(effectiveLang === 'ar' ? 'ar-SA' : 'en-US'));
          msg = msg.replace(/{{emergency}}/g, '920000000'); // Placeholder emergency number
          setMessage(msg);
        }
      }
    }
  };

  const sendNotification = async () => {
    if ((recipientType === 'individual' && !recipientPhone) || !message) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const endpoint = recipientType === 'all'
        ? '/api/notifications/announcement'
        : '/api/notifications/test-whatsapp';

      const body = recipientType === 'all'
        ? {
          recipients: contacts.filter((c: any) => c.phone).map((c: any) => ({
            id: c.id,
            phone: c.phone,
            name: c.fullName
          })),
          subject: notificationTemplates[notificationType as keyof typeof notificationTemplates][language as 'en' | 'ar'] || 'Notification',
          message
        }
        : {
          phone: recipientPhone, // Backend handles Saudi number formatting
          message
        };

      const response = await apiRequest('POST', endpoint, body);

      if (response.ok) {
        toast({
          title: language === 'ar' ? 'نجح' : 'Success',
          description: language === 'ar'
            ? 'تم إرسال الإشعار بنجاح'
            : 'Notification sent successfully',
        });
        onOpenChange(false);
        // Reset form
        setMessage('');
        setRecipientPhone('');
        setRecipientName('');
        setSelectedContact('');
      } else {
        throw new Error('Failed to send notification');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar'
          ? 'فشل إرسال الإشعار'
          : 'Failed to send notification',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {language === 'ar' ? 'إرسال إشعار' : 'Send Notification'}
          </DialogTitle>
          <DialogDescription>
            {language === 'ar'
              ? 'إرسال إشعار WhatsApp للعملاء'
              : 'Send WhatsApp notification to customers'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-y-auto pr-2">
          {/* Recipient Type */}
          <div className="space-y-2">
            <Label>{language === 'ar' ? 'إرسال إلى' : 'Send To'}</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={recipientType === 'individual' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setRecipientType('individual')}
              >
                <User className="h-4 w-4 mr-2" />
                {language === 'ar' ? 'فرد محدد' : 'Individual'}
              </Button>
              <Button
                type="button"
                variant={recipientType === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setRecipientType('all')}
              >
                <Users className="h-4 w-4 mr-2" />
                {language === 'ar' ? 'جميع العملاء' : 'All Customers'}
              </Button>
            </div>
          </div>

          {/* Individual Recipient Selection */}
          {recipientType === 'individual' && (
            <>
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'اختر جهة اتصال' : 'Select Contact'}</Label>
                <Select value={selectedContact} onValueChange={handleContactSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder={language === 'ar' ? 'اختر جهة اتصال...' : 'Select a contact...'} />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts.map(contact => (
                      <SelectItem key={contact.id} value={contact.id}>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {contact.fullName} - {contact.phone}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}</Label>
                  <Input
                    placeholder="+966..."
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'الاسم' : 'Name'}</Label>
                  <Input
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          {/* Message Language Toggle */}
          <div className="space-y-2">
            <Label>{language === 'ar' ? 'لغة الرسالة' : 'Message Language'}</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={messageLanguage === 'ar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setMessageLanguage('ar');
                  // Re-fetch with Arabic template
                  if (selectedContact) {
                    handleContactSelect(selectedContact, notificationType, 'ar');
                  } else if (useTemplate && notificationType !== 'custom') {
                    const template = quickTemplates['ar'][notificationType as keyof typeof quickTemplates['ar']];
                    if (template) setMessage(template);
                  }
                }}
              >
                العربية
              </Button>
              <Button
                type="button"
                variant={messageLanguage === 'en' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setMessageLanguage('en');
                  // Re-fetch with English template
                  if (selectedContact) {
                    handleContactSelect(selectedContact, notificationType, 'en');
                  } else if (useTemplate && notificationType !== 'custom') {
                    const template = quickTemplates['en'][notificationType as keyof typeof quickTemplates['en']];
                    if (template) setMessage(template);
                  }
                }}
              >
                English
              </Button>
            </div>
          </div>

          {/* Notification Type */}
          <div className="space-y-2">
            <Label>{language === 'ar' ? 'نوع الإشعار' : 'Notification Type'}</Label>
            <Select value={notificationType} onValueChange={setNotificationType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(notificationTemplates).map(([key, template]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <span>{template.icon}</span>
                      <span>{template[language as 'en' | 'ar']}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>{language === 'ar' ? 'الرسالة' : 'Message'}</Label>
              {notificationType !== 'custom' && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setUseTemplate(!useTemplate)}
                >
                  {useTemplate
                    ? (language === 'ar' ? 'تخصيص' : 'Customize')
                    : (language === 'ar' ? 'استخدام القالب' : 'Use Template')
                  }
                </Button>
              )}
            </div>
            <Textarea
              rows={8}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={language === 'ar'
                ? 'اكتب رسالتك هنا...'
                : 'Type your message here...'}
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            />
            <p className="text-xs text-muted-foreground">
              {language === 'ar'
                ? 'يمكنك استخدام المتغيرات: {{name}}, {{unit}}, {{building}}, {{amount}}, {{date}}'
                : 'You can use variables: {{name}}, {{unit}}, {{building}}, {{amount}}, {{date}}'}
            </p>
          </div>

          {/* Language Toggle */}
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <span className="text-sm text-muted-foreground">
              {language === 'ar'
                ? 'الرسالة ستُرسل باللغة المحددة'
                : 'Message will be sent in the selected language'}
            </span>
          </div>
        </div>

        <DialogFooter className="shrink-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button
            onClick={sendNotification}
            disabled={loading || !message || (recipientType === 'individual' && !recipientPhone)}
          >
            {loading ? (
              language === 'ar' ? 'جاري الإرسال...' : 'Sending...'
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                {language === 'ar' ? 'إرسال' : 'Send'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}