"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { EVENT, firstBookableDate, formatBookingDate, isBookableDate } from "@/lib/event";

type DateCalendarProps = {
  selectedDate: string;
  onSelect: (date: string) => void;
  disabled?: boolean;
};

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function monthDate(month: string) {
  return new Date(`${month}-01T12:00:00Z`);
}

function shiftMonth(month: string, amount: number) {
  const date = monthDate(month);
  date.setUTCMonth(date.getUTCMonth() + amount);
  return date.toISOString().slice(0, 7);
}

export function DateCalendar({ selectedDate, onSelect, disabled = false }: DateCalendarProps) {
  // Render the same calendar on server and initial client paint, then advance
  // to the current Indian date after hydration if someone visits later.
  const [firstAvailable, setFirstAvailable] = useState<string | null>(EVENT.firstDate);
  const [visibleMonth, setVisibleMonth] = useState<string>(EVENT.firstDate.slice(0, 7));

  useEffect(() => {
    function updateCurrentDate() {
      const first = firstBookableDate();
      setFirstAvailable(first);
      if (first) setVisibleMonth((month) => month < first.slice(0, 7) ? first.slice(0, 7) : month);
    }
    updateCurrentDate();
    window.addEventListener("focus", updateCurrentDate);
    return () => window.removeEventListener("focus", updateCurrentDate);
  }, []);

  const month = monthDate(visibleMonth);
  const title = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(month);
  const offset = (month.getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0)).getUTCDate();
  const previousMonth = shiftMonth(visibleMonth, -1);
  const nextMonth = shiftMonth(visibleMonth, 1);
  const minMonth = (firstAvailable ?? EVENT.lastDate).slice(0, 7);

  return (
    <div className="date-calendar">
      <div className="date-calendar__toolbar">
        <strong aria-live="polite">{title}</strong>
        <div className="date-calendar__controls">
          <button type="button" aria-label="Previous month" onClick={() => setVisibleMonth(previousMonth)} disabled={disabled || !firstAvailable || previousMonth < minMonth}><ChevronLeft size={19} /></button>
          <button type="button" aria-label="Next month" onClick={() => setVisibleMonth(nextMonth)} disabled={disabled || !firstAvailable || nextMonth > EVENT.lastDate.slice(0, 7)}><ChevronRight size={19} /></button>
        </div>
      </div>
      <div className="date-calendar__weekdays" aria-hidden="true">
        {weekdays.map((day) => <span key={day}>{day}</span>)}
      </div>
      <div className="date-calendar__days" role="group" aria-label={`Counselling dates in ${title}`}>
        {Array.from({ length: offset }, (_, index) => <span key={`blank-${index}`} aria-hidden="true" />)}
        {Array.from({ length: daysInMonth }, (_, index) => {
          const day = String(index + 1).padStart(2, "0");
          const date = `${visibleMonth}-${day}`;
          const bookable = Boolean(firstAvailable && date >= firstAvailable && date <= EVENT.lastDate);
          const selected = date === selectedDate;
          return (
            <button
              key={date}
              type="button"
              aria-label={formatBookingDate(date)}
              aria-pressed={selected}
              className={`date-calendar__day${selected ? " date-calendar__day--selected" : ""}`}
              disabled={disabled || !bookable}
              onClick={() => {
                // Recheck the date in case the page was left open past midnight.
                if (isBookableDate(date)) onSelect(date);
                else setFirstAvailable(firstBookableDate());
              }}
            >{index + 1}</button>
          );
        })}
      </div>
      {firstAvailable
        ? <p className="date-calendar__hint">Every day · 2:00–5:00 PM (IST) · Until 31 Dec 2026</p>
        : <p className="date-calendar__hint">The booking period ended on 31 December 2026.</p>}
    </div>
  );
}
