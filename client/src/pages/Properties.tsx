import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AddBuildingDialog } from "@/components/AddBuildingDialog";
import { AddUnitDialog } from "@/components/AddUnitDialog";
import { EditUnitDialog } from "@/components/EditUnitDialog";
import { Button } from "@/components/ui/button";
import { Plus, ChevronDown, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function Properties() {
  const { t } = useTranslation();
  const [buildingDialogOpen, setBuildingDialogOpen] = useState(false);
  const [unitDialogOpen, setUnitDialogOpen] = useState(false);
  const [editUnitDialogOpen, setEditUnitDialogOpen] = useState(false);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('');
  const [selectedUnit, setSelectedUnit] = useState<any>(null);
  const [expandedBuildings, setExpandedBuildings] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const { data: buildingsResponse, isLoading: buildingsLoading } = useQuery<any>({
    queryKey: ['/api/buildings'],
  });

  const { data: unitsResponse } = useQuery<any>({
    queryKey: ['/api/units'],
  });

  // Extract data arrays from paginated responses
  const buildings = buildingsResponse?.data || [];
  const units = unitsResponse?.data || [];

  const handleAddBuilding = async (data: any) => {
    try {
      await apiRequest('POST', '/api/buildings', {
        ...data,
        totalUnits: parseInt(data.totalUnits),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/buildings'] });
      toast({
        title: t('properties.buildingAdded'),
        description: t('properties.buildingAddedDesc', { name: data.name }),
      });
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAddUnit = async (data: any) => {
    try {
      await apiRequest('POST', '/api/units', data);
      queryClient.invalidateQueries({ queryKey: ['/api/units'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/metrics'] });
      toast({
        title: t('properties.unitAdded'),
        description: t('properties.unitAddedDesc', { number: data.unitNumber }),
      });
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleBuilding = (buildingId: string) => {
    const newExpanded = new Set(expandedBuildings);
    if (newExpanded.has(buildingId)) {
      newExpanded.delete(buildingId);
    } else {
      newExpanded.add(buildingId);
    }
    setExpandedBuildings(newExpanded);
  };

  const handleAddUnitClick = (buildingId: string) => {
    setSelectedBuildingId(buildingId);
    setUnitDialogOpen(true);
  };

  const handleEditUnit = (unit: any) => {
    setSelectedUnit(unit);
    setEditUnitDialogOpen(true);
  };

  const handleUpdateUnit = async (data: any) => {
    if (!selectedUnit) return;

    try {
      await apiRequest('PATCH', `/api/units/${selectedUnit.id}`, data);
      queryClient.invalidateQueries({ queryKey: ['/api/units'] });
      toast({
        title: t('properties.unitUpdated'),
        description: t('properties.unitUpdatedDesc', { number: data.unitNumber || selectedUnit.unitNumber }),
      });
      setEditUnitDialogOpen(false);
      setSelectedUnit(null);
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteUnit = async (unit: any) => {
    if (!confirm(t('properties.confirmDeleteUnit', { number: unit.unitNumber }))) {
      return;
    }

    try {
      await apiRequest('DELETE', `/api/units/${unit.id}`);
      queryClient.invalidateQueries({ queryKey: ['/api/units'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/metrics'] });
      toast({
        title: t('properties.unitDeleted'),
        description: t('properties.unitDeletedDesc', { number: unit.unitNumber }),
      });
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
      vacant: "secondary",
      occupied: "default",
      maintenance: "destructive",
    };
    const statusKey = `properties.${status}`;
    return (
      <Badge variant={variants[status] || "outline"}>
        {t(statusKey)}
      </Badge>
    );
  };

  if (buildingsLoading) {
    return <div className="text-center py-8">{t('common.loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{t('properties.title')}</h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">{t('properties.subtitle')}</p>
        </div>
        <Button onClick={() => setBuildingDialogOpen(true)} data-testid="button-add-building" className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />
          {t('properties.addBuilding')}
        </Button>
      </div>

      {buildings.length > 0 ? (
        <div className="border rounded-lg">
          {buildings.map((building: any) => {
            const buildingUnits = units.filter((u: any) => u.buildingId === building.id);
            const isExpanded = expandedBuildings.has(building.id);

            return (
              <div key={building.id} className="border-b last:border-b-0">
                {/* Building Header */}
                <div className="p-4 hover:bg-accent/50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleBuilding(building.id)}
                        className="p-0 h-auto shrink-0"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronRight className="h-5 w-5" />
                        )}
                      </Button>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-base sm:text-lg truncate">{building.name}</h3>
                        <p className="text-sm text-muted-foreground truncate">{building.address}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 pl-8 sm:pl-0">
                      <div className="text-left sm:text-right rtl:text-right rtl:sm:text-left">
                        <p className="text-sm font-medium">
                          {buildingUnits.length} / {building.totalUnits} {t('properties.units')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {buildingUnits.filter((u: any) => u.status === 'vacant').length} {t('properties.vacant')}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddUnitClick(building.id)}
                      >
                        <Plus className="h-4 w-4 mr-1 sm:mr-2 rtl:mr-0 rtl:ml-1 rtl:sm:ml-2" />
                        <span className="hidden sm:inline">{t('properties.addUnit')}</span>
                        <span className="sm:hidden">Add</span>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Units Table (Expandable) */}
                {isExpanded && (
                  <div className="bg-muted/30 overflow-x-auto">
                    {buildingUnits.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t('properties.unitNumber')}</TableHead>
                            <TableHead>{t('properties.unitType')}</TableHead>
                            <TableHead>{t('properties.size')}</TableHead>
                            <TableHead>{t('properties.status')}</TableHead>
                            <TableHead className="text-right rtl:text-left">{t('common.actions')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {buildingUnits.map((unit: any) => (
                            <TableRow key={unit.id}>
                              <TableCell className="font-medium">{unit.unitNumber}</TableCell>
                              <TableCell>{unit.type}</TableCell>
                              <TableCell>{unit.size || t('common.na')}</TableCell>
                              <TableCell>{getStatusBadge(unit.status)}</TableCell>
                              <TableCell className="text-right rtl:text-left">
                                <div className="flex items-center justify-end rtl:justify-start gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditUnit(unit)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteUnit(unit)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="p-8 text-center text-sm text-muted-foreground">
                        {t('properties.noUnits')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="border rounded-lg p-12 text-center">
          <p className="text-muted-foreground">
            {t('properties.noBuildings')}
          </p>
        </div>
      )}

      <AddBuildingDialog
        open={buildingDialogOpen}
        onOpenChange={setBuildingDialogOpen}
        onSubmit={handleAddBuilding}
      />

      {selectedBuildingId && (
        <AddUnitDialog
          open={unitDialogOpen}
          onOpenChange={setUnitDialogOpen}
          buildingId={selectedBuildingId}
          onSubmit={handleAddUnit}
        />
      )}

      {selectedUnit && (
        <EditUnitDialog
          open={editUnitDialogOpen}
          onOpenChange={setEditUnitDialogOpen}
          unit={selectedUnit}
          onSubmit={handleUpdateUnit}
        />
      )}
    </div>
  );
}
