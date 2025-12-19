import { PropertiesGrid } from '../PropertiesGrid';

const mockBuildings = [
  {
    id: '1',
    name: 'Plaza Tower',
    address: '123 Main Street, Downtown',
    totalUnits: 24,
    vacantUnits: 3,
  },
  {
    id: '2',
    name: 'Garden Apartments',
    address: '456 Oak Avenue, Riverside',
    totalUnits: 18,
    vacantUnits: 0,
  },
  {
    id: '3',
    name: 'Sunset View',
    address: '789 Hill Road, Westside',
    totalUnits: 12,
    vacantUnits: 2,
  },
];

export default function PropertiesGridExample() {
  return (
    <PropertiesGrid
      buildings={mockBuildings}
      onViewUnits={(building) => console.log('View units for:', building)}
      onEdit={(building) => console.log('Edit building:', building)}
    />
  );
}
