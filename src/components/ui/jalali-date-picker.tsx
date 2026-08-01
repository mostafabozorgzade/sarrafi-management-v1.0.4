"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { getJalaliParts, jalaliPartsToGregorian, toPersianDigits, JALALI_MONTHS } from "@/lib/jalali";

interface JalaliDatePickerProps {
  value: string;
  onChange: (gregorianDate: string) => void;
  label?: string;
  className?: string;
}

export function JalaliDatePicker({ value, onChange, label, className }: JalaliDatePickerProps) {
  const parts = getJalaliParts(value);
  const [year, setYear] = useState(parts.year);
  const [month, setMonth] = useState(parts.month);
  const [day, setDay] = useState(parts.day);
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const p = getJalaliParts(value);
    setYear(p.year);
    setMonth(p.month);
    setDay(p.day);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const daysInMonth = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];
  const maxDay = month === 12 && ((year % 4 === 3) || (year % 4 === 0 && year % 100 !== 0)) ? 30 : daysInMonth[month - 1];

  const handleYearChange = (y: number) => {
    setYear(y);
    const newMaxDay = month === 12 && ((y % 4 === 3) || (y % 4 === 0 && y % 100 !== 0)) ? 30 : daysInMonth[month - 1];
    const newDay = Math.min(day, newMaxDay);
    setDay(newDay);
    onChange(jalaliPartsToGregorian(y, month, newDay));
  };

  const handleMonthChange = (m: number) => {
    setMonth(m);
    const newMaxDay = m === 12 && ((year % 4 === 3) || (year % 4 === 0 && year % 100 !== 0)) ? 30 : daysInMonth[m - 1];
    const newDay = Math.min(day, newMaxDay);
    setDay(newDay);
    onChange(jalaliPartsToGregorian(year, m, newDay));
  };

  const handleDayChange = (d: number) => {
    setDay(d);
    onChange(jalaliPartsToGregorian(year, month, d));
  };

  const years = Array.from({ length: 10 }, (_, i) => year - 2 + i);
  const days = Array.from({ length: maxDay }, (_, i) => i + 1);

  const selectClass = "h-11 w-full rounded-[5px] border border-gray-200 bg-white px-3 text-[13px] text-gray-700 focus:outline-none focus:border-gray-400 transition-all appearance-none cursor-pointer";

  return (
    <div className={cn("relative", className)} ref={ref}>
      {label && <label className="text-[11px] font-medium text-gray-500 mb-1.5 block">{label}</label>}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="h-11 w-full rounded-[5px] border border-gray-200 bg-white px-3 text-[13px] text-gray-700 focus:outline-none focus:border-gray-400 transition-all text-left flex items-center justify-between"
      >
        <span>{value ? toPersianDigits(`${year}/${String(month).padStart(2, "0")}/${String(day).padStart(2, "0")}`) : "انتخاب تاریخ"}</span>
        <svg className={cn("h-4 w-4 text-gray-400 transition-transform", isOpen && "rotate-180")} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-[5px] border border-gray-200 bg-white p-3 shadow-lg">
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400">روز</label>
              <select
                value={day}
                onChange={(e) => handleDayChange(Number(e.target.value))}
                className={selectClass}
              >
                {days.map((d) => (
                  <option key={d} value={d}>{toPersianDigits(d)}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400">ماه</label>
              <select
                value={month}
                onChange={(e) => handleMonthChange(Number(e.target.value))}
                className={selectClass}
              >
                {JALALI_MONTHS.map((m, i) => (
                  <option key={i + 1} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400">سال</label>
              <select
                value={year}
                onChange={(e) => handleYearChange(Number(e.target.value))}
                className={selectClass}
              >
                {years.map((y) => (
                  <option key={y} value={y}>{toPersianDigits(y)}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
