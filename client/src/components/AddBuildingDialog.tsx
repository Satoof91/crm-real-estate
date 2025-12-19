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

interface AddBuildingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (data: any) => void;
}

export function AddBuildingDialog({ open, onOpenChange, onSubmit }: AddBuildingDialogProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    totalUnits: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Building form submitted:', formData);
    // Convert totalUnits to number before submitting
    onSubmit?.({
      ...formData,
      totalUnits: parseInt(formData.totalUnits, 10)
    });
    onOpenChange(false);
    setFormData({ name: '', address: '', totalUnits: '' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('properties.addNewBuilding')}</DialogTitle>
          <DialogDescription>
            {t('properties.addNewBuildingDesc')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('properties.buildingName')} *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('properties.buildingNamePlaceholder')}
                required
                data-testid="input-building-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">{t('properties.address')} *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder={t('properties.addressPlaceholder')}
                required
                data-testid="input-building-address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalUnits">{t('properties.totalUnits')} *</Label>
              <Input
                id="totalUnits"
                type="number"
                min="1"
                value={formData.totalUnits}
                onChange={(e) => setFormData({ ...formData, totalUnits: e.target.value })}
                required
                data-testid="input-total-units"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel">
              {t('common.cancel')}
            </Button>
            <Button type="submit" data-testid="button-submit">
              {t('properties.addBuilding')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
