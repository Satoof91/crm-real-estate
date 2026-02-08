import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { useTheme } from "@/components/ThemeProvider";
import i18n from "@/lib/i18n";

export type CalendarType = "gregorian" | "hijri";

interface SettingsContextType {
    calendarType: CalendarType;
    setCalendarType: (type: CalendarType) => void;
    isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const CALENDAR_TYPE_KEY = "crm-calendar-type";

export function SettingsProvider({ children }: { children: ReactNode }) {
    const { user, isAuthenticated } = useAuth();
    const { setTheme } = useTheme();
    const [isLoading, setIsLoading] = useState(false);

    const [calendarType, setCalendarType] = useState<CalendarType>(() => {
        if (typeof window !== "undefined") {
            const stored = localStorage.getItem(CALENDAR_TYPE_KEY);
            if (stored === "hijri" || stored === "gregorian") {
                return stored;
            }
        }
        return "gregorian";
    });

    // Helper to update local state and localStorage without API call (API call happens in the page)
    // OR we could centralize the API call here. For now, let's keep it simple:
    // This provider is responsible for *applying* settings when they load or change.
    const handleSetCalendarType = (type: CalendarType) => {
        setCalendarType(type);
        localStorage.setItem(CALENDAR_TYPE_KEY, type);
    };

    // Fetch settings when user logs in
    useEffect(() => {
        async function fetchSettings() {
            if (!isAuthenticated) return;

            setIsLoading(true);
            try {
                const response = await fetch("/api/settings", { credentials: "include" });
                if (response.ok) {
                    const settings = await response.json();

                    // Apply Theme
                    if (settings.theme === 'dark' || settings.theme === 'light') {
                        setTheme(settings.theme);
                    }

                    // Apply Language
                    if (settings.language === 'en' || settings.language === 'ar') {
                        if (i18n.language !== settings.language) {
                            i18n.changeLanguage(settings.language);
                            document.documentElement.dir = settings.language === 'ar' ? 'rtl' : 'ltr';
                        }
                    }

                    // Apply Calendar
                    if (settings.calendarType === 'hijri' || settings.calendarType === 'gregorian') {
                        handleSetCalendarType(settings.calendarType);
                    }
                }
            } catch (error) {
                console.error("Failed to sync settings:", error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchSettings();
    }, [isAuthenticated, setTheme]);

    return (
        <SettingsContext.Provider value={{ calendarType, setCalendarType: handleSetCalendarType, isLoading }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error("useSettings must be used within a SettingsProvider");
    }
    return context;
}
