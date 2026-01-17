import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import moment from "moment-hijri";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface HijriDatePickerProps {
    value: string; // ISO date string or yyyy-MM-dd format
    onChange: (value: string) => void;
    label?: string;
    required?: boolean;
    "data-testid"?: string;
}

// Hijri month names
const hijriMonths = [
    { value: 1, name: "Muharram", nameAr: "محرم" },
    { value: 2, name: "Safar", nameAr: "صفر" },
    { value: 3, name: "Rabi' al-Awwal", nameAr: "ربيع الأول" },
    { value: 4, name: "Rabi' al-Thani", nameAr: "ربيع الثاني" },
    { value: 5, name: "Jumada al-Awwal", nameAr: "جمادى الأولى" },
    { value: 6, name: "Jumada al-Thani", nameAr: "جمادى الآخرة" },
    { value: 7, name: "Rajab", nameAr: "رجب" },
    { value: 8, name: "Sha'ban", nameAr: "شعبان" },
    { value: 9, name: "Ramadan", nameAr: "رمضان" },
    { value: 10, name: "Shawwal", nameAr: "شوال" },
    { value: 11, name: "Dhu al-Qi'dah", nameAr: "ذو القعدة" },
    { value: 12, name: "Dhu al-Hijjah", nameAr: "ذو الحجة" },
];

export function HijriDatePicker({
    value,
    onChange,
    label,
    required,
    "data-testid": testId,
}: HijriDatePickerProps) {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === "ar";

    const [isHijri, setIsHijri] = useState(false);
    const [hijriDay, setHijriDay] = useState("1");
    const [hijriMonth, setHijriMonth] = useState("1");
    const [hijriYear, setHijriYear] = useState("1446");

    // Convert Gregorian to Hijri when value changes (from external source)
    useEffect(() => {
        if (value && !isHijri) {
            const m = moment(value);
            if (m.isValid()) {
                setHijriDay(m.iDate().toString());
                setHijriMonth((m.iMonth() + 1).toString());
                setHijriYear(m.iYear().toString());
            }
        }
    }, [value, isHijri]);

    // Handle Gregorian date input
    const handleGregorianChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        onChange(newValue);

        // Also update Hijri display
        if (newValue) {
            const m = moment(newValue);
            if (m.isValid()) {
                setHijriDay(m.iDate().toString());
                setHijriMonth((m.iMonth() + 1).toString());
                setHijriYear(m.iYear().toString());
            }
        }
    };

    // Handle Hijri date changes
    const updateFromHijri = (day: string, month: string, year: string) => {
        setHijriDay(day);
        setHijriMonth(month);
        setHijriYear(year);

        // Convert Hijri to Gregorian
        const hijriDate = moment(`${year}/${month}/${day}`, "iYYYY/iM/iD");
        if (hijriDate.isValid()) {
            const gregorianDate = hijriDate.format("YYYY-MM-DD");
            onChange(gregorianDate);
        }
    };

    // Generate day options (1-30)
    const dayOptions = Array.from({ length: 30 }, (_, i) => i + 1);

    // Generate year options (1440-1460)
    const currentHijriYear = moment().iYear();
    const yearOptions = Array.from({ length: 21 }, (_, i) => currentHijriYear - 5 + i);

    // Get display values
    const getHijriDisplay = () => {
        if (!value) return "";
        const m = moment(value);
        if (!m.isValid()) return "";
        return isRtl
            ? `${m.iDate()} ${hijriMonths[m.iMonth()]?.nameAr} ${m.iYear()}`
            : `${m.iDate()} ${hijriMonths[m.iMonth()]?.name} ${m.iYear()}`;
    };

    const getGregorianDisplay = () => {
        if (!value) return "";
        const m = moment(value);
        if (!m.isValid()) return "";
        return m.format("DD MMM YYYY");
    };

    return (
        <div className="space-y-2">
            {/* Calendar type toggle */}
            <div className="flex items-center justify-between">
                {label && (
                    <Label>
                        {label} {required && "*"}
                    </Label>
                )}
                <div className="flex items-center gap-2 text-sm">
                    <span className={!isHijri ? "font-medium text-primary" : "text-muted-foreground"}>
                        {t("calendar.gregorian", "Gregorian")}
                    </span>
                    <Switch
                        checked={isHijri}
                        onCheckedChange={setIsHijri}
                        aria-label="Toggle calendar type"
                    />
                    <span className={isHijri ? "font-medium text-primary" : "text-muted-foreground"}>
                        {t("calendar.hijri", "Hijri")}
                    </span>
                </div>
            </div>

            {/* Date input */}
            {!isHijri ? (
                // Gregorian date picker
                <div>
                    <Input
                        type="date"
                        value={value}
                        onChange={handleGregorianChange}
                        data-testid={testId}
                    />
                    {value && (
                        <p className="text-xs text-muted-foreground mt-1">
                            {t("calendar.hijriEquivalent", "Hijri")}: {getHijriDisplay()}
                        </p>
                    )}
                </div>
            ) : (
                // Hijri date picker (dropdowns)
                <div>
                    <div className="grid grid-cols-3 gap-2">
                        {/* Day */}
                        <Select value={hijriDay} onValueChange={(v) => updateFromHijri(v, hijriMonth, hijriYear)}>
                            <SelectTrigger data-testid={`${testId}-day`}>
                                <SelectValue placeholder={t("calendar.day", "Day")} />
                            </SelectTrigger>
                            <SelectContent>
                                {dayOptions.map((day) => (
                                    <SelectItem key={day} value={day.toString()}>
                                        {day}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Month */}
                        <Select value={hijriMonth} onValueChange={(v) => updateFromHijri(hijriDay, v, hijriYear)}>
                            <SelectTrigger data-testid={`${testId}-month`}>
                                <SelectValue placeholder={t("calendar.month", "Month")} />
                            </SelectTrigger>
                            <SelectContent>
                                {hijriMonths.map((month) => (
                                    <SelectItem key={month.value} value={month.value.toString()}>
                                        {isRtl ? month.nameAr : month.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Year */}
                        <Select value={hijriYear} onValueChange={(v) => updateFromHijri(hijriDay, hijriMonth, v)}>
                            <SelectTrigger data-testid={`${testId}-year`}>
                                <SelectValue placeholder={t("calendar.year", "Year")} />
                            </SelectTrigger>
                            <SelectContent>
                                {yearOptions.map((year) => (
                                    <SelectItem key={year} value={year.toString()}>
                                        {year}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {value && (
                        <p className="text-xs text-muted-foreground mt-1">
                            {t("calendar.gregorianEquivalent", "Gregorian")}: {getGregorianDisplay()}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
