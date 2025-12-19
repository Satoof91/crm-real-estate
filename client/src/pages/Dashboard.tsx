import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { DashboardMetrics } from "@/components/DashboardMetrics";
import { PaymentsTable } from "@/components/PaymentsTable";
import { ContractsTable } from "@/components/ContractsTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Plus, UserPlus, FilePlus, DollarSign, Wrench } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { t } = useTranslation();
  const { toast } = useToast();

  const { data: metrics, isLoading: metricsLoading } = useQuery<any>({
    queryKey: ['/api/dashboard/metrics'],
  });

  const { data: paymentsResponse, isLoading: paymentsLoading } = useQuery<any>({
    queryKey: ['/api/payments'],
  });

  const { data: contractsResponse, isLoading: contractsLoading } = useQuery<any>({
    queryKey: ['/api/contracts'],
  });

  const { data: notifications = [] } = useQuery<any[]>({
    queryKey: ['/api/notifications'],
  });

  const { data: unitsResponse } = useQuery<any>({
    queryKey: ['/api/units'],
  });

  const { data: contactsResponse } = useQuery<any>({
    queryKey: ['/api/contacts'],
  });

  // Extract data arrays from paginated responses
  const payments = paymentsResponse?.data || [];
  const contracts = contractsResponse?.data || [];
  const units = unitsResponse?.data || [];
  const contacts = contactsResponse?.data || [];

  const handleMarkPaid = async (payment: any) => {
    try {
      await apiRequest('PATCH', `/api/payments/${payment.id}`, {
        status: 'paid',
        paidDate: new Date().toISOString(),
      });

      queryClient.invalidateQueries({ queryKey: ['/api/payments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/metrics'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });

      toast({
        title: t("dashboard.paymentMarkedPaid"),
        description: t("dashboard.paymentRecorded", { amount: payment.amount }),
      });
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const enrichedPayments = payments
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()) // Sort by earliest/soonest first
    .slice(0, 5)
    .map(payment => {
      const contract = contracts.find(c => c.id === payment.contractId);
      const unit = contract ? units.find(u => u.id === contract.unitId) : null;
      const contact = contract ? contacts.find(c => c.id === contract.contactId) : null;

      return {
        ...payment,
        unitNumber: unit?.unitNumber || 'N/A',
        tenantName: contact?.fullName || 'N/A',
        dueDate: new Date(payment.dueDate),
        paidDate: payment.paidDate ? new Date(payment.paidDate) : undefined,
      };
    });

  const enrichedContracts = contracts.slice(0, 5).map(contract => {
    const unit = units.find(u => u.id === contract.unitId);
    const contact = contacts.find(c => c.id === contract.contactId);

    return {
      ...contract,
      unitNumber: unit?.unitNumber || 'N/A',
      tenantName: contact?.fullName || 'N/A',
      startDate: new Date(contract.startDate),
      endDate: new Date(contract.endDate),
    };
  });

  if (metricsLoading || paymentsLoading || contractsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin-smooth rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground animate-pulse">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">{t("dashboard.title")}</h1>
        <p className="text-muted-foreground mt-2 text-lg">{t("dashboard.subtitle")}</p>
      </div>

      <DashboardMetrics
        totalUnits={metrics?.totalUnits || 0}
        occupancyRate={metrics?.occupancyRate || 0}
        pendingPayments={metrics?.pendingPayments || 0}
        expiringContracts={metrics?.expiringContracts || 0}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link href="/payments">
          <div className="group relative overflow-hidden rounded-2xl bg-card p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer border border-border/50">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 blur-2xl transition-all group-hover:scale-150" />
            <div className="relative z-10 flex flex-col gap-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-foreground">{t("dashboard.newPayment") || "New Payment"}</h3>
                <p className="text-sm text-muted-foreground">Record a new transaction</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/contracts">
          <div className="group relative overflow-hidden rounded-2xl bg-card p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer border border-border/50">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-500/20 blur-2xl transition-all group-hover:scale-150" />
            <div className="relative z-10 flex flex-col gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                <FilePlus className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-foreground">{t("dashboard.newContract") || "New Contract"}</h3>
                <p className="text-sm text-muted-foreground">Create a new lease</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/customers">
          <div className="group relative overflow-hidden rounded-2xl bg-card p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer border border-border/50">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 blur-2xl transition-all group-hover:scale-150" />
            <div className="relative z-10 flex flex-col gap-4">
              <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                <UserPlus className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-foreground">{t("dashboard.addTenant") || "Add Tenant"}</h3>
                <p className="text-sm text-muted-foreground">Register a new customer</p>
              </div>
            </div>
          </div>
        </Link>

        <div className="group relative overflow-hidden rounded-2xl bg-card/50 p-6 border border-border/50 opacity-60 cursor-not-allowed">
          <div className="relative z-10 flex flex-col gap-4">
            <div className="h-12 w-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400">
              <Wrench className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-muted-foreground">{t("dashboard.maintenance") || "Maintenance"}</h3>
              <p className="text-sm text-muted-foreground">Coming soon</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs defaultValue="payments">
            <TabsList className="mb-4">
              <TabsTrigger value="payments" data-testid="tab-payments">{t("dashboard.recentPayments")}</TabsTrigger>
              <TabsTrigger value="contracts" data-testid="tab-contracts">{t("dashboard.activeContracts")}</TabsTrigger>
            </TabsList>
            <TabsContent value="payments">
              {enrichedPayments.length > 0 ? (
                <PaymentsTable
                  payments={enrichedPayments}
                  onMarkPaid={handleMarkPaid}
                />
              ) : (
                <Card className="p-8 text-center text-muted-foreground">
                  {t("dashboard.noPayments")}
                </Card>
              )}
            </TabsContent>
            <TabsContent value="contracts">
              {enrichedContracts.length > 0 ? (
                <ContractsTable
                  contracts={enrichedContracts}
                  onView={(contract) => console.log('View:', contract)}
                />
              ) : (
                <Card className="p-8 text-center text-muted-foreground">
                  {t("dashboard.noContracts")}
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div>
          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
              <CardTitle className="text-lg">{t("dashboard.notifications")}</CardTitle>
              <Bell className="h-5 w-5 text-muted-foreground transition-colors hover:text-primary" />
            </CardHeader>
            <CardContent>
              {notifications.length > 0 ? (
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <div key={notification.id} className="space-y-1" data-testid={`notification-${notification.id}`}>
                      <div className="flex items-start gap-2">
                        <Badge variant={notification.type === 'payment' ? 'default' : 'outline'} className="mt-0.5">
                          {notification.type}
                        </Badge>
                      </div>
                      <p className="text-sm">{notification.message}</p>
                      <p className="text-xs text-muted-foreground">{notification.time}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t("dashboard.noNotifications")}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
