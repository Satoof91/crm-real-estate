import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface AddContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (data: any) => void;
}

export function AddContactDialog({ open, onOpenChange, onSubmit }: AddContactDialogProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    nationalId: '',
    language: 'en',
    status: 'prospect',
    isWhatsAppEnabled: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    onSubmit?.(formData);
    onOpenChange(false);
    setFormData({
      fullName: '',
      phone: '',
      email: '',
      nationalId: '',
      language: 'en',
      status: 'prospect',
      isWhatsAppEnabled: true,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('customers.addNewCustomer')}</DialogTitle>
          <DialogDescription>
            {t('customers.addNewCustomerDesc')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">{t('customers.fullName')} *</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
                data-testid="input-full-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t('customers.phone')} *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                data-testid="input-phone"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('customers.email')}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                data-testid="input-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nationalId">{t('customers.emiratesId')}</Label>
              <Input
                id="nationalId"
                value={formData.nationalId}
                onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                data-testid="input-national-id"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">{t('common.language')}</Label>
              <Select value={formData.language} onValueChange={(value) => setFormData({ ...formData, language: value })}>
                <SelectTrigger id="language" data-testid="select-language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="ar">Arabic</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">{t('customers.status')}</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger id="status" data-testid="select-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prospect">{t('customers.prospect')}</SelectItem>
                  <SelectItem value="active">{t('customers.active')}</SelectItem>
                  <SelectItem value="past">{t('customers.inactive')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between space-x-2 lg:col-span-2">
              <Label htmlFor="whatsapp" className="cursor-pointer">
                {t('customers.isWhatsAppEnabled')}
              </Label>
              <Switch
                id="whatsapp"
                checked={formData.isWhatsAppEnabled}
                onCheckedChange={(checked) => setFormData({ ...formData, isWhatsAppEnabled: checked })}
                data-testid="switch-whatsapp"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel">
              {t('common.cancel')}
            </Button>
            <Button type="submit" data-testid="button-submit">
              {t('customers.addContact')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
