import { useState, useEffect } from "react";
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

interface Contact {
    id: string;
    fullName: string;
    phone: string;
    email?: string;
    nationalId?: string;
    language?: string;
    status: string;
    isWhatsAppEnabled: boolean | number;
}

interface EditContactDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    contact: Contact | null;
    onSubmit?: (data: any) => void;
}

export function EditContactDialog({ open, onOpenChange, contact, onSubmit }: EditContactDialogProps) {
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

    useEffect(() => {
        if (contact) {
            setFormData({
                fullName: contact.fullName || '',
                phone: contact.phone || '',
                email: contact.email || '',
                nationalId: contact.nationalId || '',
                language: contact.language || 'en',
                status: contact.status || 'prospect',
                isWhatsAppEnabled: Boolean(contact.isWhatsAppEnabled),
            });
        }
    }, [contact]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (contact) {
            onSubmit?.({ ...formData, id: contact.id });
        }
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{t('customers.editCustomer')}</DialogTitle>
                    <DialogDescription>
                        {t('customers.editCustomerDesc')}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-fullName">{t('customers.fullName')} *</Label>
                            <Input
                                id="edit-fullName"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                required
                                data-testid="input-edit-full-name"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-phone">{t('customers.phone')} *</Label>
                            <Input
                                id="edit-phone"
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                required
                                data-testid="input-edit-phone"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-email">{t('customers.email')}</Label>
                            <Input
                                id="edit-email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                data-testid="input-edit-email"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-nationalId">{t('customers.nationalId')}</Label>
                            <Input
                                id="edit-nationalId"
                                value={formData.nationalId}
                                onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                                data-testid="input-edit-national-id"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-language">{t('common.language')}</Label>
                            <Select value={formData.language} onValueChange={(value) => setFormData({ ...formData, language: value })}>
                                <SelectTrigger id="edit-language" data-testid="select-edit-language">
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
                            <Label htmlFor="edit-status">{t('customers.status')}</Label>
                            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                                <SelectTrigger id="edit-status" data-testid="select-edit-status">
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
                            <Label htmlFor="edit-whatsapp" className="cursor-pointer">
                                {t('customers.isWhatsAppEnabled')}
                            </Label>
                            <Switch
                                id="edit-whatsapp"
                                checked={formData.isWhatsAppEnabled}
                                onCheckedChange={(checked) => setFormData({ ...formData, isWhatsAppEnabled: checked })}
                                data-testid="switch-edit-whatsapp"
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2 flex-col sm:flex-row">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-edit-cancel">
                            {t('common.cancel')}
                        </Button>
                        <Button type="submit" data-testid="button-edit-submit">
                            {t('common.save')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
