import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, Undo2, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSettings } from "@/contexts/SettingsContext";
import { formatDisplayDate } from "@/lib/dateFormatter";

interface Payment {
  id: string;
  unitNumber: string;
  tenantName: string;
  amount: string;
  dueDate: Date;
  status: 'pending' | 'paid' | 'overdue';
  paidDate?: Date;
}

interface PaymentsTableProps {
  payments: Payment[];
  onMarkPaid?: (payment: Payment) => void;
  onMarkUnpaid?: (payment: Payment) => void;
  onDelete?: (payment: Payment) => void;
}

export function PaymentsTable({ payments, onMarkPaid, onMarkUnpaid, onDelete }: PaymentsTableProps) {
  const { t, i18n } = useTranslation();
  const { calendarType } = useSettings();

  const statusConfig = {
    pending: { label: t('payments.status.pending'), variant: 'outline' as const, icon: Clock },
    paid: { label: t('payments.status.paid'), variant: 'default' as const, icon: CheckCircle2 },
    overdue: { label: t('payments.status.overdue'), variant: 'destructive' as const, icon: Clock },
  };

  return (
    <>
      {/* Desktop View */}
      <div className="hidden md:block border rounded-lg overflow-x-auto">
        <Table className="min-w-[800px]">
          <TableHeader>
            <TableRow>
              <TableHead>{t('payments.table.unit')}</TableHead>
              <TableHead>{t('payments.table.tenant')}</TableHead>
              <TableHead>{t('payments.table.amount')}</TableHead>
              <TableHead>{t('payments.table.dueDate')}</TableHead>
              <TableHead>{t('common.status')}</TableHead>
              <TableHead>{t('payments.table.paidDate')}</TableHead>
              <TableHead className="w-48">{t('common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => {
              const config = statusConfig[payment.status];
              const Icon = config.icon;
              return (
                <TableRow key={payment.id} className="hover-elevate" data-testid={`row-payment-${payment.id}`}>
                  <TableCell className="font-medium" data-testid={`text-unit-${payment.id}`}>{payment.unitNumber}</TableCell>
                  <TableCell>{payment.tenantName}</TableCell>
                  <TableCell className="font-medium" data-testid={`text-amount-${payment.id}`}>${payment.amount}</TableCell>
                  <TableCell data-testid={`text-due-date-${payment.id}`}>{formatDisplayDate(payment.dueDate, calendarType, i18n.language)}</TableCell>
                  <TableCell>
                    <Badge variant={config.variant} className="gap-1" data-testid={`badge-status-${payment.id}`}>
                      <Icon className="h-3 w-3" />
                      {config.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {payment.paidDate ? formatDisplayDate(payment.paidDate, calendarType, i18n.language) : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {(payment.status === 'pending' || payment.status === 'overdue') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onMarkPaid?.(payment)}
                          data-testid={`button-mark-paid-${payment.id}`}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          {t('payments.markPaid')}
                        </Button>
                      )}
                      {payment.status === 'paid' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onMarkUnpaid?.(payment)}
                          data-testid={`button-mark-unpaid-${payment.id}`}
                        >
                          <Undo2 className="h-4 w-4 mr-1" />
                          {t('payments.markUnpaid') || 'Mark Unpaid'}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDelete?.(payment)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        data-testid={`button-delete-${payment.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile View */}
      <div className="md:hidden space-y-4">
        {payments.map((payment) => {
          const config = statusConfig[payment.status];
          const Icon = config.icon;
          return (
            <div key={payment.id} className="bg-card border rounded-lg p-4 shadow-sm space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-lg">{payment.unitNumber}</div>
                  <div className="text-sm text-muted-foreground">{payment.tenantName}</div>
                </div>
                <Badge variant={config.variant} className="gap-1">
                  <Icon className="h-3 w-3" />
                  {config.label}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground block">{t('payments.table.amount')}</span>
                  <span className="font-medium text-lg">${payment.amount}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">{t('payments.table.dueDate')}</span>
                  <span className="font-medium">{formatDisplayDate(payment.dueDate, calendarType, i18n.language)}</span>
                </div>
                {payment.paidDate && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground block">{t('payments.table.paidDate')}</span>
                    <span className="font-medium">{formatDisplayDate(payment.paidDate, calendarType, i18n.language)}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2 border-t">
                {(payment.status === 'pending' || payment.status === 'overdue') && (
                  <Button
                    size="sm"
                    variant="default"
                    className="flex-1"
                    onClick={() => onMarkPaid?.(payment)}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {t('payments.markPaid')}
                  </Button>
                )}
                {payment.status === 'paid' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => onMarkUnpaid?.(payment)}
                  >
                    <Undo2 className="h-4 w-4 mr-2" />
                    {t('payments.markUnpaid')}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDelete?.(payment)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 px-3"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

