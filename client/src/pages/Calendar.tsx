import { useQuery } from "@tanstack/react-query";
import { Calendar as BigCalendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { Loader2, DollarSign, FileText, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource?: any;
  type: 'payment' | 'contract_start' | 'contract_end';
}

export default function Calendar() {
  const { t } = useTranslation();

  const { data: paymentsResponse, isLoading: paymentsLoading } = useQuery<any>({
    queryKey: ['/api/payments'],
  });

  const { data: contractsResponse, isLoading: contractsLoading } = useQuery<any>({
    queryKey: ['/api/contracts'],
  });

  const { data: contactsResponse } = useQuery<any>({
    queryKey: ['/api/contacts'],
  });

  const payments = paymentsResponse?.data || [];
  const contracts = contractsResponse?.data || [];
  const contacts = contactsResponse?.data || [];

  if (paymentsLoading || contractsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const events: CalendarEvent[] = [];

  // Map payments to events
  payments.forEach((payment: any) => {
    const contract = contracts.find((c: any) => c.id === payment.contractId);
    const contact = contract ? contacts.find((c: any) => c.id === contract.contactId) : null;
    const title = contact ? `${t("dashboard.payment")}: ${contact.fullName} ($${payment.amount})` : `${t("dashboard.payment")} ($${payment.amount})`;

    events.push({
      id: `payment-${payment.id}`,
      title,
      start: new Date(payment.dueDate),
      end: new Date(payment.dueDate),
      allDay: true,
      type: 'payment',
      resource: payment,
    });
  });

  // Map contracts to events
  contracts.forEach((contract: any) => {
    const contact = contacts.find((c: any) => c.id === contract.contactId);
    const name = contact ? contact.fullName : 'Unknown';

    events.push({
      id: `contract-start-${contract.id}`,
      title: `${t("nav.contracts")}: ${name} (${t("common.start")})`,
      start: new Date(contract.startDate),
      end: new Date(contract.startDate),
      allDay: true,
      type: 'contract_start',
      resource: contract,
    });

    events.push({
      id: `contract-end-${contract.id}`,
      title: `${t("nav.contracts")}: ${name} (${t("common.end")})`,
      start: new Date(contract.endDate),
      end: new Date(contract.endDate),
      allDay: true,
      type: 'contract_end',
      resource: contract,
    });
  });

  const components = {
    event: ({ event }: any) => {
      const Icon = event.type === 'payment' ? DollarSign : FileText;

      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 p-1 h-full w-full overflow-hidden">
                <Icon className="h-3 w-3 shrink-0" />
                <span className="text-xs truncate font-medium">{event.title}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1">
                <p className="font-semibold">{event.title}</p>
                <p className="text-xs text-muted-foreground">
                  {format(event.start, 'PPP')}
                </p>
                {event.resource && (
                  <div className="text-xs">
                    {event.type === 'payment' && (
                      <>
                        <p>{t("common.status")}: {event.resource.status}</p>
                        <p>{t("dashboard.amount")}: ${event.resource.amount}</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
    agenda: {
      event: ({ event }: any) => {
        const Icon = event.type === 'payment' ? DollarSign : FileText;
        return (
          <div className="flex items-center gap-3 py-1">
            <div className="flex items-center gap-2 min-w-[120px] text-muted-foreground">
              <span className="text-sm font-medium">{format(event.start, 'EEE MMM dd')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-primary" />
              <span className="font-medium">{event.title}</span>
            </div>
          </div>
        );
      },
    },
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    let backgroundColor = '';
    let borderColor = '';
    let color = '';

    if (event.type === 'payment') {
      if (event.resource.status === 'paid') {
        backgroundColor = 'hsl(var(--primary) / 0.1)';
        borderColor = 'hsl(var(--primary))';
        color = 'hsl(var(--primary))';
      } else if (event.resource.status === 'overdue') {
        backgroundColor = 'hsl(var(--destructive) / 0.1)';
        borderColor = 'hsl(var(--destructive))';
        color = 'hsl(var(--destructive))';
      } else {
        backgroundColor = 'hsl(var(--muted))';
        borderColor = 'hsl(var(--muted-foreground))';
        color = 'hsl(var(--foreground))';
      }
    } else if (event.type === 'contract_start') {
      backgroundColor = 'hsl(var(--chart-1) / 0.1)';
      borderColor = 'hsl(var(--chart-1))';
      color = 'hsl(var(--chart-1))';
    } else if (event.type === 'contract_end') {
      backgroundColor = 'hsl(var(--chart-2) / 0.1)';
      borderColor = 'hsl(var(--chart-2))';
      color = 'hsl(var(--chart-2))';
    }

    return {
      style: {
        backgroundColor,
        borderColor,
        color,
        borderWidth: '1px',
        borderStyle: 'solid',
        borderRadius: '6px',
        opacity: 1,
        display: 'block',
        padding: '0px',
      }
    };
  };

  const messages = {
    allDay: t('calendar.allDay'),
    previous: t('calendar.previous'),
    next: t('calendar.next'),
    today: t('calendar.today'),
    month: t('calendar.month'),
    week: t('calendar.week'),
    day: t('calendar.day'),
    agenda: t('calendar.agenda'),
    date: t('calendar.date'),
    time: t('calendar.time'),
    event: t('calendar.event'),
    noEventsInRange: t('calendar.noEventsInRange'),
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("nav.calendar") || "Calendar"}</h1>
        <p className="text-muted-foreground mt-2">
          {t("dashboard.subtitle") || "Manage your schedule and upcoming events"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("nav.calendar") || "Calendar"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[600px]">
            <BigCalendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              eventPropGetter={eventStyleGetter}
              components={components}
              views={['month', 'agenda']}
              messages={messages}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
