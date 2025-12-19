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

interface AddUnitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  buildingId: string;
  onSubmit?: (data: any) => void;
}

export function AddUnitDialog({ open, onOpenChange, buildingId, onSubmit }: AddUnitDialogProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    unitNumber: '',
    type: '2-bedroom',
    size: '',
    status: 'vacant',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Unit form submitted:', formData);
    onSubmit?.({
      ...formData,
      buildingId,
      size: formData.size ? parseInt(formData.size) : null,
    });
    onOpenChange(false);
    setFormData({
      unitNumber: '',
      type: '2-bedroom',
      size: '',
      status: 'vacant',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('properties.addNewUnit')}</DialogTitle>
          <DialogDescription>
            {t('properties.addNewUnitDesc')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="unitNumber">{t('properties.unitNumber')} *</Label>
              <Input
                id="unitNumber"
                value={formData.unitNumber}
                onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })}
                placeholder={t('properties.unitNumberPlaceholder')}
                required
                data-testid="input-unit-number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">{t('properties.unitType')} *</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger id="type" data-testid="select-unit-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="studio">{t('properties.studio')}</SelectItem>
                  <SelectItem value="1-bedroom">{t('properties.bedroom1')}</SelectItem>
                  <SelectItem value="2-bedroom">{t('properties.bedroom2')}</SelectItem>
                  <SelectItem value="3-bedroom">{t('properties.bedroom3')}</SelectItem>
                  <SelectItem value="4-bedroom">{t('properties.bedroom4')}</SelectItem>
                  <SelectItem value="penthouse">{t('properties.penthouse')}</SelectItem>
                  <SelectItem value="retail">{t('properties.retail')}</SelectItem>
                  <SelectItem value="office">{t('properties.office')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="size">{t('properties.size')}</Label>
              <Input
                id="size"
                type="number"
                min="1"
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                placeholder={t('properties.sizePlaceholder')}
                data-testid="input-unit-size"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">{t('properties.status')}</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger id="status" data-testid="select-unit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vacant">{t('properties.vacant')}</SelectItem>
                  <SelectItem value="occupied">{t('properties.occupied')}</SelectItem>
                  <SelectItem value="maintenance">{t('properties.underMaintenance')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel">
              {t('common.cancel')}
            </Button>
            <Button type="submit" data-testid="button-submit">
              {t('properties.addUnit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
