import React, { useState, useEffect } from 'react';
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

  // Load contacts for recipient selection
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedContact, setSelectedContact] = useState<string>('');

  useEffect(() => {
    loadContacts();
  }, []);

  useEffect(() => {
    // Load template when type changes
    if (useTemplate && notificationType !== 'custom') {
      // If a contact is already selected, re-populate with their data
      if (selectedContact) {
        handleContactSelect(selectedContact);
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

  const loadContacts = async () => {
    try {
      const response = await fetch('/api/contacts');
      if (response.ok) {
        const data = await response.json();
        setContacts(data.data || []);
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };

  const handleContactSelect = async (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    if (contact) {
      setRecipientPhone(contact.phone || '');
      setRecipientName(contact.fullName || '');
      setSelectedContact(contactId);

      // Fetch contract data to get unit and building info
      try {
        const contractsResponse = await fetch('/api/contracts');
        if (contractsResponse.ok) {
          const contractsData = await contractsResponse.json();
          const activeContract = (contractsData.data || []).find((c: any) => c.contactId === contactId);

          let unitNumber = 'N/A';
          let buildingName = 'N/A';
          let paymentAmount = 'N/A';
          let paymentDay = '1';

          if (activeContract) {
            // Fetch unit info
            const unitResponse = await fetch(`/api/units/${activeContract.unitId}`);
            if (unitResponse.ok) {
              const unit = await unitResponse.json();
              unitNumber = unit.unitNumber || 'N/A';

              // Fetch building info
              const buildingResponse = await fetch(`/api/buildings/${unit.buildingId}`);
              if (buildingResponse.ok) {
                const building = await buildingResponse.json();
                buildingName = building.name || 'N/A';
              }
            }

            // Calculate per-payment amount based on frequency
            const rentAmount = parseFloat(activeContract.rentAmount) || 0;
            const frequency = activeContract.paymentFrequency?.toLowerCase() || 'monthly';

            // Contract rent amount is yearly, divide by frequency
            let paymentsPerYear = 12; // default monthly
            switch (frequency) {
              case 'weekly':
                paymentsPerYear = 52;
                break;
              case 'monthly':
                paymentsPerYear = 12;
                break;
              case 'quarterly':
                paymentsPerYear = 4;
                break;
              case 'semi-annually':
                paymentsPerYear = 2;
                break;
              case 'yearly':
                paymentsPerYear = 1;
                break;
            }

            // If rent amount seems like a yearly amount (high value), divide accordingly
            // Otherwise, assume it's already the per-payment amount
            paymentAmount = rentAmount.toLocaleString();

            // Extract day from contract start date
            const startDate = new Date(activeContract.startDate);
            paymentDay = startDate.getDate().toString();
          }

          // Update template message with actual values
          if (useTemplate && notificationType !== 'custom') {
            const template = quickTemplates[language as 'ar' | 'en'][notificationType as keyof typeof quickTemplates['ar']];
            if (template) {
              let msg = template;
              msg = msg.replace(/{{name}}/g, contact.fullName || '');
              msg = msg.replace(/{{unit}}/g, unitNumber);
              msg = msg.replace(/{{building}}/g, buildingName);
              msg = msg.replace(/{{amount}}/g, paymentAmount);
              msg = msg.replace(/{{paymentDay}}/g, paymentDay);
              msg = msg.replace(/{{date}}/g, new Date().toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US'));
              msg = msg.replace(/{{emergency}}/g, '920000000'); // Placeholder emergency number
              setMessage(msg);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching contract data:', error);
        // Still update with basic info if contract fetch fails
        if (useTemplate && notificationType !== 'custom') {
          const template = quickTemplates[language as 'ar' | 'en'][notificationType as keyof typeof quickTemplates['ar']];
          if (template) {
            let msg = template;
            msg = msg.replace(/{{name}}/g, contact.fullName || '');
            setMessage(msg);
          }
        }
      }
    }
  };

  const sendNotification = async () => {
    if (!recipientPhone || !message) {
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
          recipients: contacts.filter(c => c.phone).map(c => ({
            id: c.id,
            phone: c.phone,
            name: c.fullName
          })),
          subject: notificationTemplates[notificationType as keyof typeof notificationTemplates][language as 'en' | 'ar'],
          message
        }
        : {
          phone: recipientPhone, // Backend handles Saudi number formatting
          message
        };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

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