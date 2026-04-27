import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Search, Shield, User as UserIcon, Settings2, Eye, EyeOff, Loader2 } from "lucide-react";
import { apiRequest, queryClient, API_BASE } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface NotificationConfig {
  wasenderApiKey: string;
  wasenderPhone: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Notification Config Dialog
// ─────────────────────────────────────────────────────────────────────────────
function NotificationConfigDialog({
  user,
  open,
  onClose,
}: {
  user: any;
  open: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<NotificationConfig | null>(null);
  const [loading, setLoading] = useState(true);

  // Load config when dialog opens
  const loadConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${user.id}/notification-config`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Load config whenever dialog opens
  useEffect(() => {
    if (open) {
      loadConfig();
    } else {
      // Reset when closed externally
      setConfig(null);
      setLoading(true);
      setShowKey(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleClose = () => {
    onClose();
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${user.id}/notification-config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(config),
      });
      if (res.ok) {
        toast({ title: "Saved", description: `Notification config updated for ${user.fullName}.` });
        handleClose();
      } else {
        throw new Error("Failed to save");
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => { if (!o) handleClose(); }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" />
            WhatsApp Config — {user?.fullName}
          </DialogTitle>
          <DialogDescription>
            Set this customer's Wasender API key and notification preferences. Notifications will be sent from their own WhatsApp number.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : config ? (
          <div className="space-y-5 pt-2">
            {/* API Key */}
            <div className="space-y-2">
              <Label htmlFor="api-key">Wasender API Key</Label>
              <div className="relative">
                <Input
                  id="api-key"
                  type={showKey ? "text" : "password"}
                  placeholder="Enter Wasender API key..."
                  value={config.wasenderApiKey}
                  onChange={(e) => setConfig({ ...config, wasenderApiKey: e.target.value })}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Found in your Wasender account settings.
              </p>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="wa-phone">WhatsApp Sender Number</Label>
              <Input
                id="wa-phone"
                type="text"
                placeholder="+966500000000"
                value={config.wasenderPhone}
                onChange={(e) => setConfig({ ...config, wasenderPhone: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                The number linked to this Wasender account (for reference).
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving…</> : "Save Config"}
              </Button>
              <Button variant="outline" onClick={handleClose} disabled={saving}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">Failed to load config.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Users Page
// ─────────────────────────────────────────────────────────────────────────────
export default function Users() {
  const [searchTerm, setSearchTerm] = useState('');
  const [configUser, setConfigUser] = useState<any | null>(null);
  const { toast } = useToast();

  const { data: usersResponse, isLoading, error } = useQuery<any>({
    queryKey: ['/api/users'],
  });

  const users = usersResponse?.data || [];

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await apiRequest('PATCH', `/api/users/${userId}`, { role: newRole });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "Role Updated",
        description: "User role has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (user: any) => {
    if (!confirm(`Are you sure you want to delete ${user.fullName}? This action cannot be undone.`)) {
      return;
    }

    try {
      await apiRequest('DELETE', `/api/users/${user.id}`);
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "User Deleted",
        description: `${user.fullName} has been removed.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredUsers = users.filter((user: any) =>
    user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    const variants: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
      admin: "destructive",
      manager: "default",
      user: "secondary",
    };

    const icons: Record<string, any> = {
      admin: Shield,
      manager: UserIcon,
      user: UserIcon,
    };

    const Icon = icons[role] || UserIcon;

    return (
      <Badge variant={variants[role] || "outline"} className="gap-1">
        <Icon className="h-3 w-3" />
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 font-semibold">Error loading users</p>
        <p className="text-sm text-muted-foreground mt-2">{(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground mt-2">Manage system users, roles, and notification settings</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, username, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {filteredUsers.length > 0 ? (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Full Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user: any) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.fullName}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Select
                      value={user.role}
                      onValueChange={(value) => handleRoleChange(user.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue>{getRoleBadge(user.role)}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">
                          <div className="flex items-center gap-2">
                            <UserIcon className="h-4 w-4" />
                            User
                          </div>
                        </SelectItem>
                        <SelectItem value="manager">
                          <div className="flex items-center gap-2">
                            <UserIcon className="h-4 w-4" />
                            Manager
                          </div>
                        </SelectItem>
                        <SelectItem value="admin">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Admin
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setConfigUser(user)}
                        className="gap-1 text-primary border-primary/30 hover:bg-primary/10"
                      >
                        <Settings2 className="h-3.5 w-3.5" />
                        Configure
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteUser(user)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="border rounded-lg p-12 text-center">
          <p className="text-muted-foreground">
            {searchTerm ? 'No users match your search.' : 'No users found.'}
          </p>
        </div>
      )}

      {/* Notification Config Dialog */}
      {configUser && (
        <NotificationConfigDialog
          user={configUser}
          open={!!configUser}
          onClose={() => setConfigUser(null)}
        />
      )}
    </div>
  );
}
