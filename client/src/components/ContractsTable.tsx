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
import { FileText, MoreHorizontal, RefreshCw, Trash2 } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "react-i18next";

interface Contract {
  id: string;
  unitNumber: string;
  tenantName: string;
  startDate: Date;
  endDate: Date;
  rentAmount: string;
  paymentFrequency: string;
}

interface ContractsTableProps {
  contracts: Contract[];
  onView?: (contract: Contract) => void;
  onEdit?: (contract: Contract) => void;
  onRenew?: (contract: Contract) => void;
  onDelete?: (contract: Contract) => void;
}

export function ContractsTable({ contracts, onView, onEdit, onRenew, onDelete }: ContractsTableProps) {
  const { t } = useTranslation();

  const getContractStatus = (startDate: Date, endDate: Date) => {
    const today = new Date();
    const daysUntilExpiry = differenceInDays(endDate, today);
    const daysUntilStart = differenceInDays(startDate, today);

    // Contract hasn't started yet
    if (daysUntilStart > 0) {
      return { label: t('contracts.status.upcoming'), variant: 'secondary' as const };
    }

    // Contract has expired
    if (daysUntilExpiry < 0) {
      return { label: t('contracts.status.expired'), variant: 'destructive' as const };
    }

    // Contract expiring soon (within 30 days)
    if (daysUntilExpiry <= 30) {
      return { label: t('contracts.status.daysLeft', { days: daysUntilExpiry }), variant: 'outline' as const };
    }

    // Contract is active
    return { label: t('contracts.status.active'), variant: 'default' as const };
  };

  return (
    <div className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold">{t('contracts.table.unit')}</TableHead>
            <TableHead className="font-semibold">{t('contracts.table.tenant')}</TableHead>
            <TableHead className="font-semibold">{t('contracts.table.startDate')}</TableHead>
            <TableHead className="font-semibold">{t('contracts.table.endDate')}</TableHead>
            <TableHead className="font-semibold">{t('contracts.table.rent')}</TableHead>
            <TableHead className="font-semibold">{t('contracts.table.frequency')}</TableHead>
            <TableHead className="font-semibold">{t('common.status')}</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contracts.map((contract) => {
            const contractStatus = getContractStatus(contract.startDate, contract.endDate);
            return (
              <TableRow key={contract.id} className="hover-elevate hover:bg-muted/30 transition-all duration-150" data-testid={`row-contract-${contract.id}`}>
                <TableCell className="font-semibold text-primary" data-testid={`text-unit-${contract.id}`}>{contract.unitNumber}</TableCell>
                <TableCell className="font-medium">{contract.tenantName}</TableCell>
                <TableCell className="text-muted-foreground">{format(contract.startDate, 'MMM dd, yyyy')}</TableCell>
                <TableCell className="text-muted-foreground" data-testid={`text-end-date-${contract.id}`}>{format(contract.endDate, 'MMM dd, yyyy')}</TableCell>
                <TableCell className="font-bold text-green-600 dark:text-green-400">${contract.rentAmount}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="badge-animate">{contract.paymentFrequency}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={contractStatus.variant} className="badge-animate" data-testid={`badge-status-${contract.id}`}>
                    {contractStatus.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" data-testid={`button-actions-${contract.id}`}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onView?.(contract)}>
                        <FileText className="mr-2 h-4 w-4" />
                        {t('common.viewDetails')}
                      </DropdownMenuItem>
                      {differenceInDays(new Date(contract.endDate), new Date()) < 0 && (
                        <DropdownMenuItem onClick={() => onRenew?.(contract)}>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          {t('contracts.renewContract')}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => onEdit?.(contract)}>
                        {t('common.edit')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete?.(contract)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t('common.delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
