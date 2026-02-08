import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash2, Phone, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "react-i18next";

interface Contact {
  id: number;
  fullName: string;
  phone: string;
  email: string | null;
  isWhatsAppEnabled: number | null;
  type: string;
  emiratesId: string | null;
  notes: string | null;
}

interface ContactsTableProps {
  contacts: Contact[];
  onEdit: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
}

export function ContactsTable({ contacts, onEdit, onDelete }: ContactsTableProps) {
  const { t } = useTranslation();

  return (
    <>
      <div className="hidden md:block border rounded-lg overflow-x-auto">
        <Table className="min-w-[800px]">
          <TableHeader>
            <TableRow>
              <TableHead>{t('customers.table.name')}</TableHead>
              <TableHead>{t('customers.table.type')}</TableHead>
              <TableHead>{t('customers.table.phone')}</TableHead>
              <TableHead>{t('customers.table.email')}</TableHead>
              <TableHead>{t('customers.table.emiratesId')}</TableHead>
              <TableHead className="w-[100px]">{t('common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.map((contact) => (
              <TableRow key={contact.id} className="hover-elevate">
                <TableCell className="font-medium">{contact.fullName}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={contact.type === 'tenant' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-purple-50 text-purple-700 border-purple-200'}>
                    {t(`customers.types.${contact.type}`) || contact.type}
                  </Badge>
                </TableCell>
                <TableCell className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {contact.phone}
                  {contact.isWhatsAppEnabled === 1 && (
                    <div className="h-4 w-4 rounded-full bg-green-500 flex items-center justify-center" title="WhatsApp Enabled">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                </TableCell>
                <TableCell>{contact.email || '-'}</TableCell>
                <TableCell>{contact.emiratesId || '-'}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(contact)}
                      data-testid={`button-edit-${contact.id}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(contact)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      data-testid={`button-delete-${contact.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {contacts.map((contact) => (
          <div key={contact.id} className="bg-card border rounded-lg p-4 shadow-sm space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold text-lg">{contact.fullName}</div>
                <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <Badge variant="outline" className={contact.type === 'tenant' ? 'bg-blue-50 text-blue-700 border-blue-200 scale-90 origin-left' : 'bg-purple-50 text-purple-700 border-purple-200 scale-90 origin-left'}>
                    {t(`customers.types.${contact.type}`) || contact.type}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(contact)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => onDelete(contact)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2 text-sm pt-2 border-t">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t('customers.table.phone')}</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{contact.phone}</span>
                  {contact.isWhatsAppEnabled === 1 && (
                    <div className="h-4 w-4 rounded-full bg-green-500 flex items-center justify-center" title="WhatsApp Enabled">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t('customers.table.email')}</span>
                <span className="font-medium">{contact.email || '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t('customers.table.emiratesId')}</span>
                <span className="font-medium">{contact.emiratesId || '-'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
