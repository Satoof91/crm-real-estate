import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { PaymentsTable } from "@/components/PaymentsTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Search, Filter, Users } from "lucide-react";
import { exportToCSV } from "@/lib/export";
import { useState } from "react";

export default function Payments() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [customerFilter, setCustomerFilter] = useState('all');

  const { data: paymentsResponse, isLoading: paymentsLoading } = useQuery<any>({
    queryKey: ['/api/payments'],
  });

  const { data: contractsResponse } = useQuery<any>({
    queryKey: ['/api/contracts'],
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

  const enrichedPayments = payments.map(payment => {
    const contract = contracts.find(c => c.id === payment.contractId);
    const unit = contract ? units.find(u => u.id === contract.unitId) : null;
    const contact = contract ? contacts.find(c => c.id === contract.contactId) : null;

    // Determine status based on due date and current status
    let status = payment.status;
    if (payment.status === 'pending' && new Date(payment.dueDate) < new Date()) {
      status = 'overdue';
    }

    return {
      ...payment,
      status,
      unitNumber: unit?.unitNumber || 'N/A',
      tenantName: contact?.fullName || 'N/A',
      contactId: contract?.contactId || null,
      dueDate: new Date(payment.dueDate),
      paidDate: payment.paidDate ? new Date(payment.paidDate) : undefined,
    };
  });

  const filteredPayments = enrichedPayments.filter(payment => {
    const matchesSearch =
      payment.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.unitNumber.toLowerCase().includes(searchTerm) ||
      payment.amount.toString().includes(searchTerm);

    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    const matchesCustomer = customerFilter === 'all' || payment.contactId === customerFilter;

    return matchesSearch && matchesStatus && matchesCustomer;
  }).sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime()); // Sort by earliest/soonest first

  const allPayments = filteredPayments;
  const pendingPayments = filteredPayments.filter(p => p.status === 'pending');
  const overduePayments = filteredPayments.filter(p => p.status === 'overdue');
  const paidPayments = filteredPayments.filter(p => p.status === 'paid');

  if (paymentsLoading) {
    return <div className="text-center py-8">{t("common.loading")}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{t("payments.title")}</h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">{t("payments.subtitle")}</p>
        </div>
        <Button variant="outline" onClick={() => exportToCSV(allPayments, 'payments.csv')} className="w-full sm:w-auto">
          <Download className="h-4 w-4 mr-2" />
          {t("common.exportCSV")}
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("common.search") || "Search..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder={t("common.filter")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("payments.tabs.allPayments")}</SelectItem>
              <SelectItem value="pending">{t("payments.tabs.pending")}</SelectItem>
              <SelectItem value="overdue">{t("payments.tabs.overdue")}</SelectItem>
              <SelectItem value="paid">{t("payments.tabs.paid")}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={customerFilter} onValueChange={setCustomerFilter}>
            <SelectTrigger className="w-full sm:w-[220px]">
              <Users className="h-4 w-4 mr-2" />
              <SelectValue placeholder={t("payments.filterByCustomer") || "Filter by Customer"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("payments.allCustomers") || "All Customers"}</SelectItem>
              {contacts.map((contact: any) => (
                <SelectItem key={contact.id} value={contact.id}>
                  {contact.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {allPayments.length > 0 ? (
        <Tabs defaultValue="all">
          <TabsList className="rtl:flex-row-reverse">
            <TabsTrigger value="all" data-testid="tab-all">{t("payments.tabs.allPayments")}</TabsTrigger>
            <TabsTrigger value="pending" data-testid="tab-pending">{t("payments.tabs.pending")} ({pendingPayments.length})</TabsTrigger>
            <TabsTrigger value="overdue" data-testid="tab-overdue">{t("payments.tabs.overdue")} ({overduePayments.length})</TabsTrigger>
            <TabsTrigger value="paid" data-testid="tab-paid">{t("payments.tabs.paid")} ({paidPayments.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-6">
            <PaymentsTable
              payments={allPayments}
              onMarkPaid={handleMarkPaid}
            />
          </TabsContent>
          <TabsContent value="pending" className="mt-6">
            <PaymentsTable
              payments={pendingPayments}
              onMarkPaid={handleMarkPaid}
            />
          </TabsContent>
          <TabsContent value="overdue" className="mt-6">
            <PaymentsTable
              payments={overduePayments}
              onMarkPaid={handleMarkPaid}
            />
          </TabsContent>
          <TabsContent value="paid" className="mt-6">
            <PaymentsTable
              payments={paidPayments}
              onMarkPaid={handleMarkPaid}
            />
          </TabsContent>
        </Tabs>
      ) : (
        <div className="border rounded-lg p-12 text-center">
          <p className="text-muted-foreground">
            {t("payments.noPayments")}
          </p>
        </div>
      )}
    </div>
  );
}
