import { DashboardMetrics } from '../DashboardMetrics';

export default function DashboardMetricsExample() {
  return (
    <DashboardMetrics
      totalUnits={48}
      occupancyRate={85}
      pendingPayments={12}
      expiringContracts={3}
    />
  );
}
