import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type CalendarType = "gregorian" | "hijri";

interface SettingsContextType {
    calendarType: CalendarType;
    setCalendarType: (type: CalendarType) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const CALENDAR_TYPE_KEY = "crm-calendar-type";

export function SettingsProvider({ children }: { children: ReactNode }) {
    const [calendarType, setCalendarTypeState] = useState<CalendarType>(() => {
        // Initialize from localStorage
        if (typeof window !== "undefined") {
            const stored = localStorage.getItem(CALENDAR_TYPE_KEY);
            if (stored === "hijri" || stored === "gregorian") {
                return stored;
            }
        }
        return "gregorian";
    });

    const setCalendarType = (type: CalendarType) => {
        setCalendarTypeState(type);
        localStorage.setItem(CALENDAR_TYPE_KEY, type);
    };

    return (
        <SettingsContext.Provider value={{ calendarType, setCalendarType }}>
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
