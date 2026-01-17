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
import { CheckCircle2, Clock } from "lucide-react";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

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
}

export function PaymentsTable({ payments, onMarkPaid }: PaymentsTableProps) {
  const { t } = useTranslation();

  const statusConfig = {
    pending: { label: t('payments.status.pending'), variant: 'outline' as const, icon: Clock },
    paid: { label: t('payments.status.paid'), variant: 'default' as const, icon: CheckCircle2 },
    overdue: { label: t('payments.status.overdue'), variant: 'destructive' as const, icon: Clock },
  };

  return (
    <div className="border rounded-lg overflow-x-auto">
      <Table className="min-w-[700px]">
        <TableHeader>
          <TableRow>
            <TableHead>{t('payments.table.unit')}</TableHead>
            <TableHead>{t('payments.table.tenant')}</TableHead>
            <TableHead>{t('payments.table.amount')}</TableHead>
            <TableHead>{t('payments.table.dueDate')}</TableHead>
            <TableHead>{t('common.status')}</TableHead>
            <TableHead>{t('payments.table.paidDate')}</TableHead>
            <TableHead className="w-32">{t('common.actions')}</TableHead>
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
                <TableCell data-testid={`text-due-date-${payment.id}`}>{format(payment.dueDate, 'MMM dd, yyyy')}</TableCell>
                <TableCell>
                  <Badge variant={config.variant} className="gap-1" data-testid={`badge-status-${payment.id}`}>
                    <Icon className="h-3 w-3" />
                    {config.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {payment.paidDate ? format(payment.paidDate, 'MMM dd, yyyy') : '-'}
                </TableCell>
                <TableCell>
                  {payment.status === 'pending' || payment.status === 'overdue' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onMarkPaid?.(payment)}
                      data-testid={`button-mark-paid-${payment.id}`}
                    >
                      {t('payments.markPaid')}
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
