import { useState } from "react";
import { API_BASE } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function Login() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const { toast } = useToast();
  const { checkAuth } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Login failed");
      }

      const data = await response.json();

      // Update auth context first, then redirect
      await checkAuth();

      toast({
        title: t("auth.loginSuccess"),
        description: `${t("common.welcome")}, ${data.user.fullName}!`,
      });

      // Small delay to ensure auth state is updated before redirect
      setTimeout(() => {
        if (data.user.role === 'admin') {
          setLocation("/admin-dashboard");
        } else {
          setLocation("/");
        }
      }, 100);
    } catch (error: any) {
      toast({
        title: t("auth.loginError"),
        description: error.message === "Invalid credentials" ? t("auth.invalidCredentials") : error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 relative">
      <div className="absolute top-4 right-4 rtl:left-4 rtl:right-auto">
        <LanguageSwitcher />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">{t("auth.login")}</CardTitle>
          <CardDescription>
            {t("auth.loginTitle")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">{t("auth.username")}</Label>
              <Input
                id="username"
                type="text"
                placeholder={t("auth.username")}
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input
                id="password"
                type="password"
                placeholder={t("auth.password")}
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
                disabled={isLoading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t("common.loading") : t("auth.login")}
            </Button>

            {/* Demo credentials note */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm">
              <p className="font-semibold text-blue-800 mb-1">🎯 Try a free demo</p>
              <p className="text-blue-700">
                <span className="font-medium">Username:</span>{" "}
                <code className="bg-blue-100 px-1 rounded">demo</code>
              </p>
              <p className="text-blue-700">
                <span className="font-medium">Password:</span>{" "}
                <code className="bg-blue-100 px-1 rounded">demo123</code>
              </p>
              <p className="text-blue-600 text-xs mt-1">
                Explore the app before subscribing — no sign-up required.
              </p>
            </div>

            <div className="text-center text-sm">
              <span className="text-gray-600">{t("auth.noAccount")} </span>
              <button
                type="button"
                onClick={() => setLocation("/register")}
                className="text-blue-600 hover:underline"
              >
                {t("auth.register")}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
