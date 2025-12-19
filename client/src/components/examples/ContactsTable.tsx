import { ContactsTable } from '../ContactsTable';

const mockContacts = [
  {
    id: '1',
    fullName: 'Sarah Johnson',
    phone: '+1 555-0123',
    email: 'sarah.j@email.com',
    status: 'active',
    isWhatsAppEnabled: true,
  },
  {
    id: '2',
    fullName: 'Michael Chen',
    phone: '+1 555-0456',
    email: 'mchen@email.com',
    status: 'active',
    isWhatsAppEnabled: true,
  },
  {
    id: '3',
    fullName: 'Emma Rodriguez',
    phone: '+1 555-0789',
    status: 'prospect',
    isWhatsAppEnabled: false,
  },
];

export default function ContactsTableExample() {
  return (
    <ContactsTable 
      contacts={mockContacts}
      onEdit={(contact) => console.log('Edit contact:', contact)}
      onDelete={(contact) => console.log('Delete contact:', contact)}
    />
  );
}
