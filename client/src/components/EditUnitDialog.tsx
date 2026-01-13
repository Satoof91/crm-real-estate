import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateUnitSchema } from "@shared/schema";
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

interface EditUnitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unit: any;
  onSubmit: (data: any) => Promise<void>;
}

const formSchema = updateUnitSchema.extend({
  size: z.string().optional(),
  electricityNumber: z.string().optional(),
  rentAmount: z.string().optional(),
});

export function EditUnitDialog({ open, onOpenChange, unit, onSubmit }: EditUnitDialogProps) {
  const { t } = useTranslation();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      unitNumber: "",
      type: "apartment",
      size: "",
      electricityNumber: "",
      rentAmount: "",
      status: "vacant",
    },
  });

  useEffect(() => {
    if (unit) {
      form.reset({
        unitNumber: unit.unitNumber || "",
        type: unit.type || "apartment",
        size: unit.size?.toString() || "",
        electricityNumber: unit.electricityNumber || "",
        rentAmount: unit.rentAmount?.toString() || "",
        status: unit.status || "vacant",
      });
    }
  }, [unit, form]);

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const data: any = {
        ...values,
        size: values.size ? parseInt(values.size) : undefined,
        rentAmount: values.rentAmount ? parseFloat(values.rentAmount) : undefined,
      };

      // Remove undefined values
      Object.keys(data).forEach(key => {
        if (data[key] === undefined) delete data[key];
      });

      await onSubmit(data);
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating unit:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('properties.editUnit')}</DialogTitle>
          <DialogDescription>
            {t('properties.editUnitDesc')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="unitNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('properties.unitNumber')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('properties.unitType')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="apartment">{t('properties.apartment')}</SelectItem>
                      <SelectItem value="house">{t('properties.house')}</SelectItem>
                      <SelectItem value="condo">{t('properties.condo')}</SelectItem>
                      <SelectItem value="townhouse">{t('properties.townhouse')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="size"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('properties.size')}</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="electricityNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Electricity Number</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. 123456789" />
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
                  <FormLabel>{t('properties.rentPrice')}</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('properties.status')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="vacant">{t('properties.vacant')}</SelectItem>
                      <SelectItem value="occupied">{t('properties.occupied')}</SelectItem>
                      <SelectItem value="maintenance">{t('properties.maintenance')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit">{t('properties.updateUnit')}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}