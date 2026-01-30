import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { useSettings, type CalendarType } from "@/contexts/SettingsContext";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export function CalendarToggle() {
    const { calendarType, setCalendarType } = useSettings();
    const { t } = useTranslation();

    const toggleCalendar = () => {
        setCalendarType(calendarType === "gregorian" ? "hijri" : "gregorian");
    };

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={toggleCalendar}
                    className="h-9 w-9 rounded-xl border-white/20 bg-white/50 hover:bg-white/80"
                >
                    <Calendar className="h-4 w-4" />
                    <span className="sr-only">{t("settings.calendarType")}</span>
                </Button>
            </TooltipTrigger>
            <TooltipContent>
                <p>
                    {calendarType === "hijri"
                        ? t("settings.hijri", "Hijri")
                        : t("settings.gregorian", "Gregorian")}
                </p>
            </TooltipContent>
        </Tooltip>
    );
}
