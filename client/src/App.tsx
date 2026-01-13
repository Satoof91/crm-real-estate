import { Switch, Route, Link, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import AdminDashboard from "@/pages/AdminDashboard";
import { Building2, Users as UsersIcon, FileText, DollarSign, LayoutDashboard, LogOut, Shield, Bell, MessageSquare, Calendar as CalendarIcon, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SendNotificationDialog } from "@/components/SendNotificationDialog";
import { useState } from "react";

import Dashboard from "@/pages/Dashboard";
import Customers from "@/pages/Customers";
import Properties from "@/pages/Properties";
import Contracts from "@/pages/Contracts";
import Payments from "@/pages/Payments";
import Users from "@/pages/Users";
import Calendar from "@/pages/Calendar";

// Define nav items for different roles
const managerNavItems = [
  { path: "/", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { path: "/properties", labelKey: "nav.properties", icon: Building2 },
  { path: "/customers", labelKey: "nav.customers", icon: UsersIcon },
  { path: "/contracts", labelKey: "nav.contracts", icon: FileText },
  { path: "/payments", labelKey: "nav.payments", icon: DollarSign },
  { path: "/calendar", labelKey: "nav.calendar", icon: CalendarIcon },
];

const adminNavItems = [
  { path: "/admin-dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { path: "/users", labelKey: "nav.users", icon: Shield },
];

function ProtectedRoute({ component: Component, adminOnly }: { component: () => JSX.Element, adminOnly?: boolean }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  // Role-based access control
  if (adminOnly && user?.role !== 'admin') {
    return <Redirect to="/dashboard" />;
  }

  if (!adminOnly && user?.role === 'admin' && Component === Dashboard) {
    // Redirect admin trying to access manager dashboard to admin dashboard
    return <Redirect to="/admin-dashboard" />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />

      {/* Admin Routes */}
      <Route path="/admin-dashboard">
        {() => <ProtectedRoute component={AdminDashboard} adminOnly={true} />}
      </Route>
      <Route path="/users">
        {() => <ProtectedRoute component={Users} adminOnly={true} />}
      </Route>

      {/* Manager Routes */}
      <Route path="/">
        {() => <ProtectedRoute component={Dashboard} />}
      </Route>
      <Route path="/dashboard">
        {() => <ProtectedRoute component={Dashboard} />}
      </Route>
      <Route path="/customers">
        {() => <ProtectedRoute component={Customers} />}
      </Route>
      <Route path="/properties">
        {() => <ProtectedRoute component={Properties} />}
      </Route>
      <Route path="/contracts">
        {() => <ProtectedRoute component={Contracts} />}
      </Route>
      <Route path="/payments">
        {() => <ProtectedRoute component={Payments} />}
      </Route>
      <Route path="/calendar">
        {() => <ProtectedRoute component={Calendar} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const [location] = useLocation();
  const { t } = useTranslation();
  const { isAuthenticated, user, logout } = useAuth();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
    },
  });

  // Hide nav for auth pages
  const isAuthPage = location === "/login" || location === "/register";

  if (isAuthPage || !isAuthenticated) return <Router />;

  const links = user?.role === 'admin' ? adminNavItems : managerNavItems;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Premium Glass Sidebar */}
      <div className="w-72 glass border-r border-white/20 hidden md:flex flex-col z-20 relative">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow-primary">
              <LayoutDashboard className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
              PropManager
            </h1>
          </div>

          <nav className="space-y-2">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location === link.path;
              return (
                <Link
                  key={link.path}
                  href={link.path}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 translate-x-1"
                      : "text-muted-foreground hover:bg-white/50 hover:text-foreground hover:translate-x-1"
                  )}
                >
                  <Icon className={cn("h-5 w-5 transition-colors", isActive ? "text-white" : "text-muted-foreground group-hover:text-primary")} />
                  <span className="font-medium">{t(link.labelKey)}</span>
                  {isActive && <div className="ml-auto h-2 w-2 rounded-full bg-white animate-pulse" />}
                </Link>
              );
            })}

            {/* Notification Button */}
            <button
              onClick={() => setIsNotificationOpen(true)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group",
                "text-muted-foreground hover:bg-white/50 hover:text-foreground hover:translate-x-1"
              )}
            >
              <Bell className="h-5 w-5 transition-colors text-muted-foreground group-hover:text-primary" />
              <span className="font-medium">{t("nav.notifications")}</span>
            </button>
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-white/10 bg-white/30 backdrop-blur-md space-y-6">
          <div className="flex items-center justify-between gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>

          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border-2 border-white shadow-sm shrink-0">
              <UsersIcon className="h-5 w-5 text-gray-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm text-foreground truncate">{user?.fullName || 'User'}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role || 'Admin'}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl shrink-0"
              onClick={() => logoutMutation.mutate()}
              title={t("nav.logout")}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area with Background Mesh */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Background Mesh Gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-100/40 via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-blue-100/40 via-transparent to-transparent pointer-events-none" />

        <header className="h-20 glass border-b border-white/20 flex items-center justify-between px-8 md:hidden z-10">
          <div className="font-bold text-xl text-primary">PropManager</div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-xl">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 border-r border-white/20 glass">
              <div className="flex flex-col h-full">
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow-primary">
                      <LayoutDashboard className="h-6 w-6 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
                      PropManager
                    </h1>
                  </div>

                  <nav className="space-y-2">
                    {links.map((link) => {
                      const Icon = link.icon;
                      const isActive = location === link.path;
                      return (
                        <Link
                          key={link.path}
                          href={link.path}
                          className={cn(
                            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group",
                            isActive
                              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 translate-x-1"
                              : "text-muted-foreground hover:bg-white/50 hover:text-foreground hover:translate-x-1"
                          )}
                        >
                          <Icon className={cn("h-5 w-5 transition-colors", isActive ? "text-white" : "text-muted-foreground group-hover:text-primary")} />
                          <span className="font-medium">{t(link.labelKey)}</span>
                        </Link>
                      );
                    })}

                    <button
                      onClick={() => {
                        setIsNotificationOpen(true);
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group",
                        "text-muted-foreground hover:bg-white/50 hover:text-foreground hover:translate-x-1"
                      )}
                    >
                      <Bell className="h-5 w-5 transition-colors text-muted-foreground group-hover:text-primary" />
                      <span className="font-medium">{t("nav.notifications")}</span>
                    </button>
                  </nav>
                </div>

                <div className="mt-auto p-6 border-t border-white/10 bg-white/30 backdrop-blur-md space-y-6">
                  <div className="flex items-center justify-between gap-2">
                    <ThemeToggle />
                    <LanguageSwitcher />
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border-2 border-white shadow-sm shrink-0">
                      <UsersIcon className="h-5 w-5 text-gray-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-foreground truncate">{user?.fullName || 'User'}</p>
                      <p className="text-xs text-muted-foreground capitalize">{user?.role || 'Admin'}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl shrink-0"
                      onClick={() => logoutMutation.mutate()}
                      title={t("nav.logout")}
                    >
                      <LogOut className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </header>

        <main className="flex-1 overflow-auto p-8 relative z-0 scroll-smooth">
          <div className="max-w-7xl mx-auto animate-fade-in">
            <Router />
          </div>
        </main>
      </div>

      <SendNotificationDialog
        open={isNotificationOpen}
        onOpenChange={setIsNotificationOpen}
      />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AuthProvider>
            <AppContent />
            <Toaster />
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
