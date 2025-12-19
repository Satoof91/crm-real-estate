import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, Shield } from "lucide-react";
import { Link } from "wouter";

export default function AdminDashboard() {
    const { t } = useTranslation();

    const { data: response } = useQuery<any>({
        queryKey: ['/api/users'],
    });

    const users = response?.data || [];

    // We might want to add a dedicated endpoint for admin stats later, 
    // but for now we can derive some simple stats if we have access to data.
    // Since /api/users is available to admins, we can show user count.

    const managersCount = users.filter((u: any) => u.role === 'manager').length;
    const adminsCount = users.filter((u: any) => u.role === 'admin').length;

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-4xl font-bold tracking-tight">Admin Dashboard</h1>
                <p className="text-muted-foreground mt-2 text-lg">Platform Administration & Overview</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{users.length}</div>
                        <p className="text-xs text-muted-foreground">Registered accounts</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Managers</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{managersCount}</div>
                        <p className="text-xs text-muted-foreground">Property managers</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Admins</CardTitle>
                        <Shield className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{adminsCount}</div>
                        <p className="text-xs text-muted-foreground">System administrators</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Link href="/users">
                    <div className="group relative overflow-hidden rounded-2xl bg-card p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer border border-border/50">
                        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-500/20 blur-2xl transition-all group-hover:scale-150" />
                        <div className="relative z-10 flex flex-col gap-4">
                            <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                <Users className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg text-foreground">User Management</h3>
                                <p className="text-sm text-muted-foreground">Manage users and roles</p>
                            </div>
                        </div>
                    </div>
                </Link>
            </div>
        </div>
    );
}
