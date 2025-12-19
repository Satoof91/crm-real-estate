import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Building {
  id: string;
  name: string;
  address: string;
  totalUnits: number;
  vacantUnits: number;
}

interface PropertiesGridProps {
  buildings: Building[];
  onViewUnits?: (building: Building) => void;
  onEdit?: (building: Building) => void;
}

export function PropertiesGrid({ buildings, onViewUnits, onEdit }: PropertiesGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {buildings.map((building) => (
        <Card key={building.id} className="hover-elevate" data-testid={`card-building-${building.id}`}>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <div className="flex items-center gap-2 min-w-0">
              <Building2 className="h-5 w-5 text-primary flex-shrink-0" />
              <CardTitle className="text-lg truncate" data-testid={`text-building-name-${building.id}`}>{building.name}</CardTitle>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" data-testid={`button-building-actions-${building.id}`}>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit?.(building)}>
                  Edit
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{building.address}</span>
              </div>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="text-sm">
                  <span className="font-medium">{building.totalUnits}</span>
                  <span className="text-muted-foreground"> total units</span>
                </div>
                {building.vacantUnits > 0 && (
                  <Badge variant="outline" data-testid={`badge-vacant-${building.id}`}>
                    {building.vacantUnits} vacant
                  </Badge>
                )}
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => onViewUnits?.(building)}
                data-testid={`button-view-units-${building.id}`}
              >
                View Units
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
