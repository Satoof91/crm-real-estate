import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ContactsTable } from "@/components/ContactsTable";
import { AddContactDialog } from "@/components/AddContactDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Download } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { exportToCSV } from "@/lib/export";

export default function Customers() {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const { data: contactsResponse, isLoading } = useQuery<any>({
    queryKey: ['/api/contacts'],
  });

  const contacts = contactsResponse?.data || [];

  const handleAddContact = async (data: any) => {
    try {
      // Convert boolean to integer for SQLite compatibility
      const contactData = {
        ...data,
        isWhatsAppEnabled: data.isWhatsAppEnabled ? 1 : 0,
      };
      await apiRequest('POST', '/api/contacts', contactData);
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      toast({
        title: t('customers.contactAdded'),
        description: t('customers.contactAddedDesc', { name: data.fullName }),
      });
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (contact: any) => {
    if (!confirm(t('customers.confirmDelete', { name: contact.fullName }))) {
      return;
    }

    try {
      await apiRequest('DELETE', `/api/contacts/${contact.id}`);
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      toast({
        title: t('customers.contactDeleted'),
        description: t('customers.contactDeletedDesc', { name: contact.fullName }),
      });
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone.includes(searchTerm)
  );

  if (isLoading) {
    return <div className="text-center py-8">{t('common.loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">{t('customers.title')}</h1>
          <p className="text-muted-foreground mt-2">{t('customers.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportToCSV(contacts, 'customers.csv')}>
            <Download className="h-4 w-4 mr-2" />
            {t("common.exportCSV")}
          </Button>
          <Button onClick={() => setDialogOpen(true)} data-testid="button-add-contact">
            <Plus className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />
            {t('customers.addContact')}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('customers.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 rtl:pl-3 rtl:pr-9"
            data-testid="input-search-contacts"
          />
        </div>
      </div>

      {filteredContacts.length > 0 ? (
        <ContactsTable
          contacts={filteredContacts}
          onEdit={(contact) => console.log('Edit:', contact)}
          onDelete={handleDelete}
        />
      ) : (
        <div className="border rounded-lg p-12 text-center">
          <p className="text-muted-foreground">
            {searchTerm ? t('customers.noContactsSearch') : t('customers.noContacts')}
          </p>
        </div>
      )}

      <AddContactDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleAddContact}
      />
    </div>
  );
}
