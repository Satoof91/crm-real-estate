import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { ContractsTable } from "@/components/ContractsTable";
import { AddContractDialog } from "@/components/AddContractDialog";
import { ViewContractDialog } from "@/components/ViewContractDialog";
import { EditContractDialog } from "@/components/EditContractDialog";
import { Button } from "@/components/ui/button";
import { Plus, Download } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { exportToCSV } from "@/lib/export";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Contracts() {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { toast } = useToast();

  const { data: contractsResponse, isLoading: contractsLoading } = useQuery<any>({
    queryKey: ['/api/contracts'],
  });

  const { data: unitsResponse } = useQuery<any>({
    queryKey: ['/api/units'],
  });

  const { data: contactsResponse } = useQuery<any>({
    queryKey: ['/api/contacts'],
  });

  const { data: buildingsResponse } = useQuery<any>({
    queryKey: ['/api/buildings'],
  });

  // Extract data arrays from paginated responses
  const contracts = contractsResponse?.data || [];
  const units = unitsResponse?.data || [];
  const contacts = contactsResponse?.data || [];
  const buildings = buildingsResponse?.data || [];

  const enrichedContracts = contracts.map(contract => {
    const unit = units.find(u => u.id === contract.unitId);
    const contact = contacts.find(c => c.id === contract.contactId);
    const building = unit ? buildings.find(b => b.id === unit.buildingId) : null;

    return {
      ...contract,
      unit,
      customer: contact,
      building,
      unitNumber: unit?.unitNumber || t('common.na'),
      tenantName: contact?.fullName || t('common.na'),
      startDate: new Date(contract.startDate),
      endDate: new Date(contract.endDate),
    };
  });

  const filteredContracts = enrichedContracts.filter(contract => {
    const matchesSearch =
      contract.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.unitNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const isActive = new Date(contract.endDate) > new Date();
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && isActive) ||
      (statusFilter === 'expired' && !isActive);

    return matchesSearch && matchesStatus;
  });

  const handleCreateContract = async (data: any) => {
    try {
      await apiRequest('POST', '/api/contracts', data);
      queryClient.invalidateQueries({ queryKey: ['/api/contracts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/payments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/units'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/metrics'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      toast({
        title: t('contracts.contractCreated'),
        description: t('contracts.contractCreatedDesc'),
      });
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUpdateContract = async (id: string, data: any) => {
    try {
      await apiRequest('PATCH', `/api/contracts/${id}`, data);
      queryClient.invalidateQueries({ queryKey: ['/api/contracts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/payments'] });
      toast({
        title: t('contracts.contractUpdated'),
        description: t('contracts.contractUpdatedDesc'),
      });
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message || t('contracts.updateFailed'),
        variant: "destructive",
      });
    }
  };

  const handleView = (contract: any) => {
    setSelectedContract(contract);
    setViewDialogOpen(true);
  };

  const handleEdit = (contract: any) => {
    setSelectedContract(contract);
    setEditDialogOpen(true);
  };

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contractToDelete, setContractToDelete] = useState<any>(null);

  const handleDelete = (contract: any) => {
    setContractToDelete(contract);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!contractToDelete) return;

    try {
      await apiRequest('DELETE', `/api/contracts/${contractToDelete.id}`);
      queryClient.invalidateQueries({ queryKey: ['/api/contracts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/payments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/units'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/metrics'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      toast({
        title: t('contracts.contractDeleted') || 'Contract Deleted',
        description: t('contracts.contractDeletedDesc') || 'The contract has been deleted and the unit is now available.',
      });
      setDeleteDialogOpen(false);
      setContractToDelete(null);
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message || 'Failed to delete contract',
        variant: "destructive",
      });
    }
  };

  if (contractsLoading) {
    return <div className="text-center py-8">{t('common.loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">{t('contracts.title')}</h1>
          <p className="text-muted-foreground mt-2">{t('contracts.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportToCSV(enrichedContracts, 'contracts.csv')}>
            <Download className="h-4 w-4 mr-2" />
            {t("common.exportCSV")}
          </Button>
          <Button onClick={() => setDialogOpen(true)} data-testid="button-add-contract">
            <Plus className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />
            {t('contracts.newContract')}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("common.search") || "Search..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder={t("common.filter")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.all") || "All"}</SelectItem>
            <SelectItem value="active">{t("common.active") || "Active"}</SelectItem>
            <SelectItem value="expired">{t("common.expired") || "Expired"}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredContracts.length > 0 ? (
        <ContractsTable
          contracts={filteredContracts}
          onView={handleView}
          onEdit={handleEdit}
          onRenew={(contract) => {
            // Pre-fill the dialog with the same customer and unit for renewal
            console.log('Renew contract:', contract);
            setDialogOpen(true);
          }}
          onDelete={handleDelete}
        />
      ) : (
        <div className="border rounded-lg p-12 text-center">
          <p className="text-muted-foreground">
            {t('contracts.noContracts')}
          </p>
        </div>
      )}

      <AddContractDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleCreateContract}
      />

      <ViewContractDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        contract={selectedContract}
      />

      <EditContractDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        contract={selectedContract}
        onSubmit={handleUpdateContract}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('contracts.deleteContract') || 'Delete Contract'}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('contracts.deleteConfirmation') || 'Are you sure you want to delete this contract?'}
              {contractToDelete && (
                <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
                  <p className="font-semibold">{t('contracts.table.unit')}: {contractToDelete.unitNumber}</p>
                  <p className="font-semibold">{t('contracts.table.tenant')}: {contractToDelete.tenantName}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {t('contracts.deleteWarning') || 'This will also delete all associated payments and free up the unit.'}
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel') || 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('common.delete') || 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
