import { Card } from "@/components/ui/card";
import { Building2, Home, DollarSign, Calendar } from "lucide-react";
import { useTranslation } from "react-i18next";

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: string;
}

function MetricCard({ icon, label, value, trend }: MetricCardProps) {
  return (
    <Card className="p-6 card-hover transition-all duration-300 hover:border-primary/30 group">
      <div className="flex items-start gap-4">
        <div className="text-primary p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors duration-200">{icon}</div>
        <div className="flex-1">
          <p className="text-sm text-muted-foreground font-medium">{label}</p>
          <p className="text-3xl font-bold mt-1 transition-transform duration-200 group-hover:scale-105" data-testid={`metric-${label.toLowerCase().replace(/\s+/g, '-')}`}>{value}</p>
          {trend && <p className="text-xs text-muted-foreground mt-1 italic">{trend}</p>}
        </div>
      </div>
    </Card>
  );
}

interface DashboardMetricsProps {
  totalUnits: number;
  occupancyRate: number;
  pendingPayments: number;
  expiringContracts: number;
}

export function DashboardMetrics({
  totalUnits,
  occupancyRate,
  pendingPayments,
  expiringContracts,
}: DashboardMetricsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        icon={<Building2 className="h-6 w-6" />}
        label={t("dashboard.totalUnits")}
        value={totalUnits}
      />
      <MetricCard
        icon={<Home className="h-6 w-6" />}
        label={t("dashboard.occupancyRate")}
        value={`${occupancyRate}%`}
      />
      <MetricCard
        icon={<DollarSign className="h-6 w-6" />}
        label={t("dashboard.pendingPayments")}
        value={pendingPayments}
      />
      <MetricCard
        icon={<Calendar className="h-6 w-6" />}
        label={t("dashboard.expiringContracts")}
        value={expiringContracts}
        trend={t("dashboard.next30Days")}
      />
    </div>
  );
}
