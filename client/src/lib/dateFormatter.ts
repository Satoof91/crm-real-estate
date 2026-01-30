import moment from "moment-hijri";
import type { CalendarType } from "@/contexts/SettingsContext";

// Hijri month names
const hijriMonths = {
    en: [
        "Muharram", "Safar", "Rabi' I", "Rabi' II",
        "Jumada I", "Jumada II", "Rajab", "Sha'ban",
        "Ramadan", "Shawwal", "Dhu al-Qi'dah", "Dhu al-Hijjah"
    ],
    ar: [
        "محرم", "صفر", "ربيع الأول", "ربيع الثاني",
        "جمادى الأولى", "جمادى الآخرة", "رجب", "شعبان",
        "رمضان", "شوال", "ذو القعدة", "ذو الحجة"
    ]
};

/**
 * Format a date based on the calendar type preference
 * @param date - Date to format (Date object, string, or timestamp)
 * @param calendarType - 'hijri' or 'gregorian'
 * @param language - 'ar' or 'en' (defaults to 'en')
 * @returns Formatted date string
 */
export function formatDisplayDate(
    date: Date | string | number | null | undefined,
    calendarType: CalendarType,
    language: string = "en"
): string {
    if (!date) return "-";

    const m = moment(date);
    if (!m.isValid()) return "-";

    const isArabic = language === "ar";

    if (calendarType === "hijri") {
        const day = m.iDate();
        const monthIndex = m.iMonth(); // 0-indexed
        const year = m.iYear();
        const monthName = isArabic ? hijriMonths.ar[monthIndex] : hijriMonths.en[monthIndex];

        // Format: "15 Jumada I 1447" or "١٥ جمادى الأولى ١٤٤٧"
        if (isArabic) {
            return `${day} ${monthName} ${year}`;
        }
        return `${day} ${monthName} ${year}`;
    }

    // Gregorian format
    return m.format(isArabic ? "DD MMM YYYY" : "MMM DD, YYYY");
}

/**
 * Format date for export (always includes both calendars for clarity)
 */
export function formatExportDate(
    date: Date | string | number | null | undefined,
    calendarType: CalendarType,
    language: string = "en"
): string {
    if (!date) return "-";

    const m = moment(date);
    if (!m.isValid()) return "-";

    if (calendarType === "hijri") {
        const day = m.iDate();
        const monthIndex = m.iMonth();
        const year = m.iYear();
        const isArabic = language === "ar";
        const monthName = isArabic ? hijriMonths.ar[monthIndex] : hijriMonths.en[monthIndex];
        return `${day} ${monthName} ${year}`;
    }

    return m.format("YYYY-MM-DD");
}
