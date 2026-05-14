import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Bell, Send, CheckCircle, XCircle, Clock, RefreshCw, Play, AlertTriangle, SkipForward, PlayCircle, Activity } from "lucide-react";
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

    // Split rows: system job logs (type === 'system_alert') vs customer-facing notifications
    const jobLogs = notifications.filter((n) => n.type === 'system_alert');
    const customerNotifications = notifications.filter((n) => n.type !== 'system_alert');

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

    // Metadata is jsonb in PG (object) and text in SQLite (JSON string) — normalize both.
    const parseMetadata = (raw: any): Record<string, any> => {
        if (!raw) return {};
        if (typeof raw === 'string') {
            try { return JSON.parse(raw); } catch { return {}; }
        }
        return raw;
    };

    const getReminderType = (metadata: any) => {
        const meta = parseMetadata(metadata);
        if (!meta.reminderType) return '-';
        switch (meta.reminderType) {
            case '30d': return '30 days';
            case '15d': return '15 days';
            case '5d': return '5 days';
            default: return meta.reminderType;
        }
    };

    // Identify which phase of a job run a system_alert row represents.
    type JobPhase = 'started' | 'completed' | 'failed' | 'skipped';
    const getJobPhase = (message?: string): JobPhase => {
        const m = (message || '').toLowerCase();
        if (m.includes('failed')) return 'failed';
        if (m.includes('skipped')) return 'skipped';
        if (m.includes('completed')) return 'completed';
        return 'started';
    };

    const JOB_LABELS: Record<string, string> = {
        payment_reminders: 'Payment Reminders',
        contract_expiry: 'Contract Expiry Check',
        monthly_summary: 'Monthly Unpaid Summary',
    };

    const getJobLabel = (meta: Record<string, any>, message?: string): string => {
        if (meta.job && JOB_LABELS[meta.job]) return JOB_LABELS[meta.job];
        if (meta.job) return meta.job;
        // Fallback: strip the phase suffix from the message
        return (message || 'Unknown Job')
            .replace(/\s+Job\s+(Started|Completed|Skipped.*|Failed.*)$/i, '')
            .replace(/\s+(Started|Completed|Skipped.*|Failed.*)$/i, '')
            .trim();
    };

    const formatDuration = (ms: unknown): string => {
        if (typeof ms !== 'number') return '-';
        if (ms < 1000) return `${ms} ms`;
        return `${(ms / 1000).toFixed(2)} s`;
    };

    const getPhaseBadge = (phase: JobPhase) => {
        switch (phase) {
            case 'started':
                return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><PlayCircle className="w-3 h-3 mr-1" />Started</Badge>;
            case 'completed':
                return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
            case 'failed':
                return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><AlertTriangle className="w-3 h-3 mr-1" />Failed</Badge>;
            case 'skipped':
                return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200"><SkipForward className="w-3 h-3 mr-1" />Skipped</Badge>;
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Notification Monitor</h1>
                    <p className="text-muted-foreground mt-2 text-base md:text-lg">Monitor payment reminders and notification history</p>
                </div>
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <Button variant="outline" onClick={() => refetch()} className="flex-1 md:flex-none">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                    <Button
                        onClick={() => triggerMutation.mutate()}
                        disabled={triggerMutation.isPending}
                        className="flex-1 md:flex-none"
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

            {/* Job Run History — system_alert rows from the daily cron */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-muted-foreground" />
                        Job Run History
                    </CardTitle>
                    <CardDescription>
                        Audit log of background jobs (payment reminders, contract expiry, monthly summary). Each cron run writes a <b>Started</b> entry, then a <b>Completed</b> / <b>Failed</b> / <b>Skipped</b> entry.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {historyLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : jobLogs.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No job runs recorded yet</p>
                            <p className="text-sm mt-1">The daily cron logs each job's start and completion here.</p>
                        </div>
                    ) : (
                        <>
                            {/* Desktop: detailed table */}
                            <div className="hidden md:block overflow-x-auto border rounded-lg">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Job</TableHead>
                                            <TableHead>Phase</TableHead>
                                            <TableHead className="text-right">Processed</TableHead>
                                            <TableHead className="text-right">Sent</TableHead>
                                            <TableHead className="text-right">Duration</TableHead>
                                            <TableHead>Details</TableHead>
                                            <TableHead>Time</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {jobLogs.map((log) => {
                                            const meta = parseMetadata(log.metadata);
                                            const phase = getJobPhase(log.message);
                                            const jobLabel = getJobLabel(meta, log.message);
                                            return (
                                                <TableRow key={log.id}>
                                                    <TableCell className="font-medium">{jobLabel}</TableCell>
                                                    <TableCell>{getPhaseBadge(phase)}</TableCell>
                                                    <TableCell className="text-right tabular-nums">{typeof meta.processed === 'number' ? meta.processed : '-'}</TableCell>
                                                    <TableCell className="text-right tabular-nums">{typeof meta.sent === 'number' ? meta.sent : '-'}</TableCell>
                                                    <TableCell className="text-right tabular-nums"><span dir="ltr">{formatDuration(meta.durationMs)}</span></TableCell>
                                                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate" title={meta.error || log.message}>
                                                        {phase === 'failed' && meta.error
                                                            ? <span className="text-red-600">{meta.error}</span>
                                                            : log.message || '-'}
                                                    </TableCell>
                                                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                                        {log.createdAt ? format(new Date(log.createdAt), 'MMM d, HH:mm:ss') : '-'}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Mobile: stacked cards */}
                            <div className="md:hidden space-y-3">
                                {jobLogs.map((log) => {
                                    const meta = parseMetadata(log.metadata);
                                    const phase = getJobPhase(log.message);
                                    const jobLabel = getJobLabel(meta, log.message);
                                    return (
                                        <div key={log.id} className="bg-card border rounded-lg p-4 shadow-sm space-y-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <div className="font-semibold text-base truncate">{jobLabel}</div>
                                                    <div className="text-xs text-muted-foreground mt-0.5">
                                                        {log.createdAt ? format(new Date(log.createdAt), 'MMM d, HH:mm:ss') : '-'}
                                                    </div>
                                                </div>
                                                {getPhaseBadge(phase)}
                                            </div>

                                            {(typeof meta.processed === 'number' || typeof meta.sent === 'number' || typeof meta.durationMs === 'number') && (
                                                <div className="grid grid-cols-3 gap-2 text-sm border-t pt-3">
                                                    <div>
                                                        <div className="text-xs text-muted-foreground">Processed</div>
                                                        <div className="font-medium tabular-nums">{typeof meta.processed === 'number' ? meta.processed : '-'}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-muted-foreground">Sent</div>
                                                        <div className="font-medium tabular-nums">{typeof meta.sent === 'number' ? meta.sent : '-'}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-muted-foreground">Duration</div>
                                                        <div className="font-medium tabular-nums" dir="ltr">{formatDuration(meta.durationMs)}</div>
                                                    </div>
                                                </div>
                                            )}

                                            {phase === 'failed' && meta.error && (
                                                <div className="text-sm text-red-600 border-t pt-2 break-words">
                                                    {meta.error}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
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
                    ) : customerNotifications.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No customer notifications yet</p>
                            <p className="text-sm mt-1">Click "Run Reminders Now" to manually trigger the job</p>
                        </div>
                    ) : (
                        <>
                            {/* Desktop View */}
                            <div className="hidden md:block overflow-x-auto border rounded-lg">
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
                                        {customerNotifications.map((notification) => (
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

                            {/* Mobile View */}
                            <div className="md:hidden space-y-4">
                                {customerNotifications.map((notification) => (
                                    <div key={notification.id} className="bg-card border rounded-lg p-4 shadow-sm space-y-4">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="font-semibold text-lg">{notification.recipientName || '-'}</div>
                                                <div className="text-sm text-muted-foreground">{notification.recipientPhone || '-'}</div>
                                            </div>
                                            {getStatusBadge(notification.status)}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="text-muted-foreground block">Type</span>
                                                <Badge variant="secondary" className="mt-1">{notification.type}</Badge>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground block">Reminder</span>
                                                <span className="font-medium mt-1 block">{getReminderType(notification.metadata)}</span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground block">Channel</span>
                                                <Badge variant="outline" className="mt-1">{notification.channel}</Badge>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground block">Created</span>
                                                <span className="font-medium mt-1 block">
                                                    {notification.createdAt ? format(new Date(notification.createdAt), 'MMM d, HH:mm') : '-'}
                                                </span>
                                            </div>
                                            {notification.sentAt && (
                                                <div className="col-span-2 border-t pt-2 mt-1">
                                                    <span className="text-muted-foreground block">Sent At</span>
                                                    <span className="font-medium mt-1 block">
                                                        {format(new Date(notification.sentAt), 'MMM d, HH:mm')}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
