import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertContractSchema } from "@shared/schema";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HijriDatePicker } from "@/components/HijriDatePicker";

interface AddContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (data: any) => Promise<void>;
}

const formSchema = insertContractSchema.omit({ startDate: true, endDate: true }).extend({
  rentAmount: z.string().min(1, "Rent amount is required").transform(val => val),
  securityDeposit: z.string().optional().transform(val => val || "0"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
});

export function AddContractDialog({ open, onOpenChange, onSubmit }: AddContractDialogProps) {
  const { t } = useTranslation();
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('');

  const { data: contactsResponse } = useQuery<any>({
    queryKey: ['/api/contacts'],
  });

  const { data: unitsResponse } = useQuery<any>({
    queryKey: ['/api/units'],
  });

  const { data: buildingsResponse } = useQuery<any>({
    queryKey: ['/api/buildings'],
  });

  // Extract data arrays from paginated responses
  const contacts = contactsResponse?.data || [];
  const units = unitsResponse?.data || [];
  const buildings = buildingsResponse?.data || [];

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      unitId: '',
      contactId: '',
      startDate: '',
      endDate: '',
      rentAmount: '',
      paymentFrequency: 'monthly',
      securityDeposit: '',
    },
  });

  const activeContacts = contacts.filter((c: any) => c.status === 'active' || c.status === 'prospect');
  const vacantUnits = units.filter((u: any) => u.status === 'vacant');

  // Filter units by selected building ('all' or empty means show all)
  const filteredUnits = selectedBuildingId && selectedBuildingId !== 'all'
    ? vacantUnits.filter((u: any) => u.buildingId === selectedBuildingId)
    : vacantUnits;

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await onSubmit?.({
        ...values,
        startDate: new Date(values.startDate).toISOString(),
        endDate: new Date(values.endDate).toISOString(),
        rentAmount: parseFloat(values.rentAmount),
        securityDeposit: parseFloat(values.securityDeposit || '0'),
      });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      // Keep dialog open on error so user can correct issues
      console.error('Contract creation error:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>{t('contracts.createNewContract')}</DialogTitle>
          <DialogDescription>
            {t('contracts.createNewContractDesc')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col flex-1 min-h-0 space-y-4">
            <div className="flex-1 overflow-y-auto pr-2">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="lg:col-span-2">
                  <FormLabel>{t('contracts.buildingFilter')}</FormLabel>
                  <Select onValueChange={setSelectedBuildingId} value={selectedBuildingId}>
                    <SelectTrigger data-testid="select-building">
                      <SelectValue placeholder={t('contracts.allBuildingsPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('contracts.allBuildings')}</SelectItem>
                      {buildings.map((building: any) => (
                        <SelectItem key={building.id} value={building.id}>
                          {building.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <FormField
                  control={form.control}
                  name="unitId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('contracts.unit')} *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-unit">
                            <SelectValue placeholder={t('contracts.selectVacantUnit')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {filteredUnits.length > 0 ? (
                            filteredUnits.map((unit: any) => {
                              const building = buildings.find((b: any) => b.id === unit.buildingId);
                              return (
                                <SelectItem key={unit.id} value={unit.id}>
                                  {building?.name} - {unit.unitNumber} ({unit.type})
                                </SelectItem>
                              );
                            })
                          ) : (
                            <SelectItem value="none" disabled>
                              {selectedBuildingId ? t('contracts.noVacantUnitsInBuilding') : t('contracts.noVacantUnits')}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contactId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('contracts.customer')} *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-contact">
                            <SelectValue placeholder={t('contracts.selectCustomer')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {activeContacts.length > 0 ? (
                            activeContacts.map((contact: any) => (
                              <SelectItem key={contact.id} value={contact.id}>
                                {contact.fullName}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none" disabled>{t('contracts.noContactsAvailable')}</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <HijriDatePicker
                          value={field.value}
                          onChange={field.onChange}
                          label={t('contracts.startDate')}
                          required
                          data-testid="input-start-date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <HijriDatePicker
                          value={field.value}
                          onChange={field.onChange}
                          label={t('contracts.endDate')}
                          required
                          data-testid="input-end-date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rentAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('contracts.rentAmount')} *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="1000.00"
                          {...field}
                          data-testid="input-rent-amount"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="paymentFrequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('contracts.paymentFrequency')} *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-frequency">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="weekly">{t('contracts.weekly')}</SelectItem>
                          <SelectItem value="monthly">{t('contracts.monthly')}</SelectItem>
                          <SelectItem value="semi-annually">{t('contracts.semiAnnually')}</SelectItem>
                          <SelectItem value="quarterly">{t('contracts.quarterly')}</SelectItem>
                          <SelectItem value="yearly">{t('contracts.yearly')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="securityDeposit"
                  render={({ field }) => (
                    <FormItem className="lg:col-span-2">
                      <FormLabel>{t('contracts.securityDeposit')}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          {...field}
                          data-testid="input-security-deposit"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <DialogFooter className="gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel"
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                data-testid="button-submit"
                disabled={vacantUnits.length === 0 || activeContacts.length === 0 || form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? t('contracts.creating') : t('contracts.createContract')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
