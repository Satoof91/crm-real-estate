import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useSettings } from "@/contexts/SettingsContext";
import { useToast } from "@/hooks/use-toast";
import { Settings as SettingsIcon, Bell, Calendar, MessageSquare, Loader2, Globe, Moon, Sun, Palette } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

interface SystemSettings {
    autoPaymentNotifications: boolean;
    autoMonthlySummary: boolean;
    paymentPaidNotifications: boolean;
}

export default function Settings() {
    const { t, i18n } = useTranslation();
    const { calendarType, setCalendarType } = useSettings();
    const { theme, setTheme } = useTheme();
    const { toast } = useToast();

    const [systemSettings, setSystemSettings] = useState<SystemSettings>({
        autoPaymentNotifications: true,
        autoMonthlySummary: true,
        paymentPaidNotifications: true,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const isArabic = i18n.language === 'ar';
    const isDark = theme === 'dark';

    // Fetch system settings on mount
    useEffect(() => {
        async function fetchSettings() {
            try {
                const response = await fetch("/api/settings", { credentials: "include" });
                if (response.ok) {
                    const data = await response.json();
                    setSystemSettings({
                        autoPaymentNotifications: data.autoPaymentNotifications !== "false",
                        autoMonthlySummary: data.autoMonthlySummary !== "false",
                        paymentPaidNotifications: data.paymentPaidNotifications !== "false",
                    });
                }
            } catch (error) {
                console.error("Failed to fetch settings:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchSettings();
    }, []);

    // Save a single setting
    const saveSetting = async (key: string, value: boolean) => {
        setSaving(true);
        try {
            const response = await fetch("/api/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ key, value: String(value) }),
            });

            if (response.ok) {
                toast({
                    title: t("common.success", "Success"),
                    description: t("settings.saved", "Setting saved successfully"),
                });
            } else {
                throw new Error("Failed to save");
            }
        } catch (error) {
            toast({
                title: t("common.error", "Error"),
                description: t("settings.saveFailed", "Failed to save setting"),
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleNotificationToggle = (key: keyof SystemSettings, value: boolean) => {
        setSystemSettings(prev => ({ ...prev, [key]: value }));
        saveSetting(key, value);
    };

    const toggleLanguage = () => {
        const newLang = isArabic ? 'en' : 'ar';
        i18n.changeLanguage(newLang);
        document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    };

    const toggleTheme = () => {
        setTheme(isDark ? 'light' : 'dark');
    };

    return (
        <div className="space-y-8 p-8">
            {/* Page Header */}
            <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
                    <SettingsIcon className="h-8 w-8 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold gradient-text">{t("settings.title", "Settings")}</h1>
                    <p className="text-muted-foreground">{t("settings.subtitle", "Manage your application preferences")}</p>
                </div>
            </div>

            {/* Appearance Settings */}
            <Card className="glass border-white/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Palette className="h-5 w-5" />
                        {t("settings.appearanceSettings", "Appearance")}
                    </CardTitle>
                    <CardDescription>
                        {t("settings.appearanceSettingsDescription", "Customize the look and feel of the application")}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Theme Toggle */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="theme-toggle" className="flex items-center gap-2">
                                {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                                {t("settings.theme", "Theme")}
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                {t("settings.themeDescription", "Switch between light and dark mode")}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`text-sm ${!isDark ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                                {t("common.light", "Light")}
                            </span>
                            <Switch
                                id="theme-toggle"
                                checked={isDark}
                                onCheckedChange={toggleTheme}
                            />
                            <span className={`text-sm ${isDark ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                                {t("common.dark", "Dark")}
                            </span>
                        </div>
                    </div>

                    <div className="border-t border-white/10" />

                    {/* Language Toggle */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="language-toggle" className="flex items-center gap-2">
                                <Globe className="h-4 w-4" />
                                {t("settings.language", "Language")}
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                {t("settings.languageDescription", "Choose your preferred language")}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`text-sm ${!isArabic ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                                English
                            </span>
                            <Switch
                                id="language-toggle"
                                checked={isArabic}
                                onCheckedChange={toggleLanguage}
                            />
                            <span className={`text-sm ${isArabic ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                                العربية
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Display Settings */}
            <Card className="glass border-white/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        {t("settings.displaySettings", "Display Settings")}
                    </CardTitle>
                    <CardDescription>
                        {t("settings.displaySettingsDescription", "Customize how information is displayed")}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="calendar-type">{t("settings.calendarType", "Calendar Type")}</Label>
                            <p className="text-sm text-muted-foreground">
                                {t("settings.calendarTypeDescription", "Choose between Gregorian or Hijri calendar for dates")}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`text-sm ${calendarType === 'gregorian' ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                                {t("settings.gregorian", "Gregorian")}
                            </span>
                            <Switch
                                id="calendar-type"
                                checked={calendarType === 'hijri'}
                                onCheckedChange={(checked) => setCalendarType(checked ? 'hijri' : 'gregorian')}
                            />
                            <span className={`text-sm ${calendarType === 'hijri' ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                                {t("settings.hijri", "Hijri")}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card className="glass border-white/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        {t("settings.notificationSettings", "Notification Settings")}
                    </CardTitle>
                    <CardDescription>
                        {t("settings.notificationSettingsDescription", "Control automatic WhatsApp notifications")}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="payment-notifications" className="flex items-center gap-2">
                                        <MessageSquare className="h-4 w-4" />
                                        {t("settings.autoPaymentNotifications", "Automatic Payment Reminders")}
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        {t("settings.autoPaymentNotificationsDescription", "Send WhatsApp reminders before payment due dates")}
                                    </p>
                                </div>
                                <Switch
                                    id="payment-notifications"
                                    checked={systemSettings.autoPaymentNotifications}
                                    onCheckedChange={(checked) => handleNotificationToggle('autoPaymentNotifications', checked)}
                                    disabled={saving}
                                />
                            </div>

                            <div className="border-t border-white/10" />

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="monthly-summary" className="flex items-center gap-2">
                                        <MessageSquare className="h-4 w-4" />
                                        {t("settings.autoMonthlySummary", "Monthly Unpaid Summary")}
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        {t("settings.autoMonthlySummaryDescription", "Send monthly summary of unpaid payments at end of month")}
                                    </p>
                                </div>
                                <Switch
                                    id="monthly-summary"
                                    checked={systemSettings.autoMonthlySummary}
                                    onCheckedChange={(checked) => handleNotificationToggle('autoMonthlySummary', checked)}
                                    disabled={saving}
                                />
                            </div>

                            <div className="border-t border-white/10" />

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="payment-paid" className="flex items-center gap-2">
                                        <MessageSquare className="h-4 w-4" />
                                        {t("settings.paymentPaidNotifications", "Payment Confirmation")}
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        {t("settings.paymentPaidNotificationsDescription", "Send WhatsApp confirmation when payment is marked as paid")}
                                    </p>
                                </div>
                                <Switch
                                    id="payment-paid"
                                    checked={systemSettings.paymentPaidNotifications}
                                    onCheckedChange={(checked) => handleNotificationToggle('paymentPaidNotifications', checked)}
                                    disabled={saving}
                                />
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
