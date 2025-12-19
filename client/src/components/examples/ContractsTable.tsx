import { ContractsTable } from '../ContractsTable';

const mockContracts = [
  {
    id: '1',
    unitNumber: 'Apt 101',
    tenantName: 'Sarah Johnson',
    startDate: new Date(2025, 0, 1),
    endDate: new Date(2025, 11, 31),
    rentAmount: '1200.00',
    paymentFrequency: 'Monthly',
  },
  {
    id: '2',
    unitNumber: 'Apt 205',
    tenantName: 'Michael Chen',
    startDate: new Date(2024, 6, 1),
    endDate: new Date(2025, 11, 15),
    rentAmount: '950.00',
    paymentFrequency: 'Monthly',
  },
  {
    id: '3',
    unitNumber: 'Apt 312',
    tenantName: 'Emma Rodriguez',
    startDate: new Date(2025, 2, 1),
    endDate: new Date(2026, 1, 28),
    rentAmount: '1100.00',
    paymentFrequency: 'Monthly',
  },
];

export default function ContractsTableExample() {
  return (
    <ContractsTable
      contracts={mockContracts}
      onView={(contract) => console.log('View contract:', contract)}
      onEdit={(contract) => console.log('Edit contract:', contract)}
    />
  );
}
