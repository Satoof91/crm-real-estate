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
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Contact {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  status: string;
  isWhatsAppEnabled: boolean;
}

interface ContactsTableProps {
  contacts: Contact[];
  onEdit?: (contact: Contact) => void;
  onDelete?: (contact: Contact) => void;
}

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  prospect: "outline",
  active: "default",
  past: "secondary",
};

export function ContactsTable({ contacts, onEdit, onDelete }: ContactsTableProps) {
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>WhatsApp</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((contact) => (
            <TableRow key={contact.id} className="hover-elevate" data-testid={`row-contact-${contact.id}`}>
              <TableCell className="font-medium" data-testid={`text-contact-name-${contact.id}`}>{contact.fullName}</TableCell>
              <TableCell data-testid={`text-contact-phone-${contact.id}`}>{contact.phone}</TableCell>
              <TableCell className="text-muted-foreground">{contact.email || '-'}</TableCell>
              <TableCell>
                <Badge variant={statusColors[contact.status] || "outline"} data-testid={`badge-status-${contact.id}`}>
                  {contact.status}
                </Badge>
              </TableCell>
              <TableCell>
                {contact.isWhatsAppEnabled ? (
                  <Badge variant="default">Enabled</Badge>
                ) : (
                  <Badge variant="outline">No</Badge>
                )}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" data-testid={`button-actions-${contact.id}`}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit?.(contact)} data-testid={`button-edit-${contact.id}`}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onDelete?.(contact)} 
                      className="text-destructive"
                      data-testid={`button-delete-${contact.id}`}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
