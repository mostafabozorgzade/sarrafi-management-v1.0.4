/* eslint-disable @typescript-eslint/no-require-imports */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const moment = require("moment-jalaali") as any;

const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

export function toPersianDigits(str: string | number): string {
  return String(str).replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)]);
}

export function gregorianToJalali(dateStr: string): string {
  if (!dateStr) return "";
  return moment(dateStr, "YYYY-MM-DD").format("jYYYY/jMM/jDD");
}

export function jalaliToGregorian(jalaliStr: string): string {
  if (!jalaliStr) return "";
  return moment(jalaliStr, "jYYYY/jMM/jDD").format("YYYY-MM-DD");
}

export function formatJalaliDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  return moment(dateStr, "YYYY-MM-DD").format("jYYYY/jMM/jDD");
}

export function getJalaliParts(dateStr: string): { year: number; month: number; day: number } {
  if (!dateStr) return { year: 1404, month: 1, day: 1 };
  const m = moment(dateStr, "YYYY-MM-DD");
  return { year: m.jYear(), month: m.jMonth() + 1, day: m.jDate() };
}

export function jalaliPartsToGregorian(year: number, month: number, day: number): string {
  return moment().jYear(year).jMonth(month - 1).jDate(day).format("YYYY-MM-DD");
}

export const JALALI_MONTHS = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
];

export const JALALI_DAYS = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];
