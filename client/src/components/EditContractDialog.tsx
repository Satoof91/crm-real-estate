import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateContractSchema } from "@shared/schema";
import { z } from "zod";
import { format } from "date-fns";
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

interface EditContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: any;
  onSubmit?: (id: string, data: any) => Promise<void>;
}

const formSchema = updateContractSchema.omit({ startDate: true, endDate: true }).extend({
  rentAmount: z.string().min(1, "Rent amount is required"),
  securityDeposit: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
});

export function EditContractDialog({ open, onOpenChange, contract, onSubmit }: EditContractDialogProps) {
  const { t } = useTranslation();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      startDate: '',
      endDate: '',
      rentAmount: '',
      paymentFrequency: 'monthly',
      securityDeposit: '',
    },
  });

  useEffect(() => {
    if (contract && open) {
      form.reset({
        startDate: format(new Date(contract.startDate), 'yyyy-MM-dd'),
        endDate: format(new Date(contract.endDate), 'yyyy-MM-dd'),
        rentAmount: contract.rentAmount?.toString() || '',
        paymentFrequency: contract.paymentFrequency || 'monthly',
        securityDeposit: contract.securityDeposit?.toString() || '',
      });
    }
  }, [contract, open, form]);

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!contract?.id) return;

    try {
      await onSubmit?.(contract.id, {
        ...values,
        startDate: new Date(values.startDate).toISOString(),
        endDate: new Date(values.endDate).toISOString(),
        rentAmount: parseFloat(values.rentAmount),
        securityDeposit: values.securityDeposit ? parseFloat(values.securityDeposit) : undefined,
      });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Contract update error:', error);
    }
  };

  if (!contract) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>{t('contracts.editContract')}</DialogTitle>
          <DialogDescription>
            {t('contracts.editContractDesc')} - {contract.unit?.unitNumber} - {contract.customer?.fullName}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col flex-1 min-h-0 space-y-4">
            <div className="flex-1 overflow-y-auto pr-2">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                          data-testid="input-edit-start-date"
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
                          data-testid="input-edit-end-date"
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
                          <SelectTrigger>
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
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? t('contracts.updating') : t('contracts.updateContract')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}