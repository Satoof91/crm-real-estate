declare module 'moment-hijri' {
    import moment from 'moment';

    interface MomentHijri extends moment.Moment {
        iDate(): number;
        iMonth(): number;
        iYear(): number;
        iFormat(format: string): string;
    }

    function momentHijri(inp?: moment.MomentInput, format?: string, strict?: boolean): MomentHijri;

    export = momentHijri;
}
