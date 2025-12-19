import { PaymentsTable } from '../PaymentsTable';

const mockPayments = [
  {
    id: '1',
    unitNumber: 'Apt 101',
    tenantName: 'Sarah Johnson',
    amount: '1200.00',
    dueDate: new Date(2025, 11, 1),
    status: 'pending' as const,
  },
  {
    id: '2',
    unitNumber: 'Apt 205',
    tenantName: 'Michael Chen',
    amount: '950.00',
    dueDate: new Date(2025, 10, 15),
    status: 'paid' as const,
    paidDate: new Date(2025, 10, 14),
  },
  {
    id: '3',
    unitNumber: 'Apt 312',
    tenantName: 'Emma Rodriguez',
    amount: '1100.00',
    dueDate: new Date(2025, 10, 1),
    status: 'overdue' as const,
  },
];

export default function PaymentsTableExample() {
  return (
    <PaymentsTable
      payments={mockPayments}
      onMarkPaid={(payment) => console.log('Mark paid:', payment)}
    />
  );
}
