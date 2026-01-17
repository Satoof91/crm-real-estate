import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ViewContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: any;
}

export function ViewContractDialog({ open, onOpenChange, contract }: ViewContractDialogProps) {
  const { t } = useTranslation();

  if (!contract) return null;

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Number(amount));
  };

  const getStatusBadge = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (now < start) {
      return <Badge variant="secondary">{t('contracts.status.upcoming')}</Badge>;
    } else if (now >= start && now <= end) {
      return <Badge variant="default">{t('contracts.status.active')}</Badge>;
    } else {
      return <Badge variant="destructive">{t('contracts.status.expired')}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>{t('contracts.contractDetails')}</DialogTitle>
          <DialogDescription>
            {t('contracts.viewContract')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto flex-1 pr-2">
          {/* Contract Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t('common.status')}</span>
            {getStatusBadge(contract.startDate, contract.endDate)}
          </div>

          <Separator />

          {/* Property & Tenant Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3">{t('contracts.propertyInformation')}</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">{t('contracts.building')}: </span>
                  <span>{contract.building?.name || t('common.na')}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('contracts.unit')}: </span>
                  <span>{contract.unit?.unitNumber || t('common.na')}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('contracts.type')}: </span>
                  <span>{contract.unit?.type || t('common.na')}</span>
                </div>
                {contract.unit?.size && (
                  <div>
                    <span className="text-muted-foreground">{t('contracts.size')}: </span>
                    <span>{contract.unit.size} {t('contracts.sqft')}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">{t('contracts.customerInformation')}</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">{t('contracts.name')}: </span>
                  <span>{contract.customer?.fullName || t('common.na')}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('contracts.phone')}: </span>
                  <span>{contract.customer?.phone || t('common.na')}</span>
                </div>
                {contract.customer?.email && (
                  <div>
                    <span className="text-muted-foreground">{t('contracts.email')}: </span>
                    <span>{contract.customer.email}</span>
                  </div>
                )}
                {contract.customer?.nationalId && (
                  <div>
                    <span className="text-muted-foreground">{t('contracts.nationalId')}: </span>
                    <span>{contract.customer.nationalId}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Contract Terms */}
          <div>
            <h3 className="font-semibold mb-3">{t('contracts.contractTerms')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">{t('contracts.startDate')}: </span>
                <span>{format(new Date(contract.startDate), 'PP')}</span>
              </div>
              <div>
                <span className="text-muted-foreground">{t('contracts.endDate')}: </span>
                <span>{format(new Date(contract.endDate), 'PP')}</span>
              </div>
              <div>
                <span className="text-muted-foreground">{t('contracts.rentAmount')}: </span>
                <span className="font-semibold">{formatCurrency(contract.rentAmount)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">{t('contracts.paymentFrequency')}: </span>
                <span className="capitalize">{contract.paymentFrequency}</span>
              </div>
              {contract.securityDeposit && (
                <div>
                  <span className="text-muted-foreground">{t('contracts.securityDeposit')}: </span>
                  <span>{formatCurrency(contract.securityDeposit)}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Additional Information */}
          <div>
            <h3 className="font-semibold mb-3">{t('contracts.additionalInformation')}</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">{t('contracts.contractId')}: </span>
                <span className="font-mono text-xs">{contract.id}</span>
              </div>
              <div>
                <span className="text-muted-foreground">{t('contracts.created')}: </span>
                <span>{format(new Date(contract.createdAt), 'PPpp')}</span>
              </div>
              {contract.documentUrl && (
                <div>
                  <span className="text-muted-foreground">{t('contracts.document')}: </span>
                  <a
                    href={contract.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {t('contracts.viewDocument')}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}