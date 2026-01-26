import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Bell, Send, CheckCircle, XCircle, Clock, RefreshCw, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

interface NotificationStats {
    pending: number;
    sent: number;
    failed: number;
    total: number;
}

interface Notification {
    id: string;
    type: string;
    channel: string;
    status: string;
    recipientId: string;
    recipientPhone?: string;
    recipientName?: string;
    subject?: string;
    message: string;
    metadata?: any;
    createdAt: string;
    sentAt?: string;
    failureReason?: string;
}

export default function NotificationMonitor() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Fetch notification stats
    const { data: stats, isLoading: statsLoading } = useQuery<NotificationStats>({
        queryKey: ['/api/notifications/stats'],
    });

    // Fetch notification history
    const { data: historyResponse, isLoading: historyLoading, refetch } = useQuery<{ data: Notification[] }>({
        queryKey: ['/api/notifications/history'],
    });

    const notifications = historyResponse?.data || [];

    // Trigger reminder mutation
    const triggerMutation = useMutation({
        mutationFn: async () => {
            return apiRequest('POST', '/api/notifications/trigger-reminders');
        },
        onSuccess: () => {
            toast({
                title: "Payment Reminders Triggered",
                description: "The payment reminder job has been executed. Check the history for results.",
            });
            queryClient.invalidateQueries({ queryKey: ['/api/notifications/stats'] });
            queryClient.invalidateQueries({ queryKey: ['/api/notifications/history'] });
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.message || "Failed to trigger reminders",
                variant: "destructive",
            });
        },
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <Badge variant="outline" className="bg-yellow-50 text-yellow-700"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
            case 'sent':
                return <Badge variant="outline" className="bg-green-50 text-green-700"><CheckCircle className="w-3 h-3 mr-1" />Sent</Badge>;
            case 'failed':
                return <Badge variant="outline" className="bg-red-50 text-red-700"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
            case 'read':
                return <Badge variant="outline" className="bg-blue-50 text-blue-700"><CheckCircle className="w-3 h-3 mr-1" />Read</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getReminderType = (metadata: any) => {
        if (!metadata?.reminderType) return '-';
        switch (metadata.reminderType) {
            case '30d': return '30 days';
            case '15d': return '15 days';
            case '5d': return '5 days';
            default: return metadata.reminderType;
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight">Notification Monitor</h1>
                    <p className="text-muted-foreground mt-2 text-lg">Monitor payment reminders and notification history</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => refetch()}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                    <Button
                        onClick={() => triggerMutation.mutate()}
                        disabled={triggerMutation.isPending}
                    >
                        <Play className="w-4 h-4 mr-2" />
                        {triggerMutation.isPending ? "Running..." : "Run Reminders Now"}
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Notifications</CardTitle>
                        <Bell className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.total || 0}</div>
                        <p className="text-xs text-muted-foreground">All time</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Sent</CardTitle>
                        <Send className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats?.sent || 0}</div>
                        <p className="text-xs text-muted-foreground">Successfully delivered</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending</CardTitle>
                        <Clock className="h-4 w-4 text-yellow-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">{stats?.pending || 0}</div>
                        <p className="text-xs text-muted-foreground">Scheduled/queued</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Failed</CardTitle>
                        <XCircle className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{stats?.failed || 0}</div>
                        <p className="text-xs text-muted-foreground">Delivery failed</p>
                    </CardContent>
                </Card>
            </div>

            {/* Cron Job Info */}
            <Card>
                <CardHeader>
                    <CardTitle>Automated Schedule</CardTitle>
                    <CardDescription>Payment reminders run automatically every day at 9:00 AM</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-muted/50 rounded-lg">
                            <h4 className="font-medium mb-2">Monthly Payments</h4>
                            <p className="text-sm text-muted-foreground">Customers receive 1 reminder:</p>
                            <ul className="text-sm mt-1 list-disc list-inside text-muted-foreground">
                                <li>5 days before due date</li>
                            </ul>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg">
                            <h4 className="font-medium mb-2">Quarterly / Semi-Annual / Yearly</h4>
                            <p className="text-sm text-muted-foreground">Customers receive 3 reminders:</p>
                            <ul className="text-sm mt-1 list-disc list-inside text-muted-foreground">
                                <li>30 days before due date</li>
                                <li>15 days before due date</li>
                                <li>5 days before due date</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Notification History Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Notification History</CardTitle>
                    <CardDescription>Recent payment reminders sent to customers</CardDescription>
                </CardHeader>
                <CardContent>
                    {historyLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No notifications sent yet</p>
                            <p className="text-sm mt-1">Click "Run Reminders Now" to manually trigger the job</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Recipient</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Reminder</TableHead>
                                        <TableHead>Channel</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead>Sent</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {notifications.map((notification) => (
                                        <TableRow key={notification.id}>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">{notification.recipientName || '-'}</div>
                                                    <div className="text-xs text-muted-foreground">{notification.recipientPhone || '-'}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">{notification.type}</Badge>
                                            </TableCell>
                                            <TableCell>{getReminderType(notification.metadata)}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{notification.channel}</Badge>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(notification.status)}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {notification.createdAt ? format(new Date(notification.createdAt), 'MMM d, HH:mm') : '-'}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {notification.sentAt ? format(new Date(notification.sentAt), 'MMM d, HH:mm') : '-'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
