export const EVENT = {
  firstDate: "2026-10-26",
  lastDate: "2026-12-31",
  dateRangeLabel: "26 October – 31 December 2026",
  headerRange: "26 Oct – 31 Dec 2026",
  location: "Mind Lab (MB107)",
  room: "MB107",
} as const;

export const SLOTS = [
  { id: "14:00", start: "2:00 PM", end: "2:45 PM", number: "01" },
  { id: "14:45", start: "2:45 PM", end: "3:30 PM", number: "02" },
  { id: "15:30", start: "3:30 PM", end: "4:15 PM", number: "03" },
  { id: "16:15", start: "4:15 PM", end: "5:00 PM", number: "04" },
] as const;

export type SlotId = (typeof SLOTS)[number]["id"];

export function getSlotLabel(slotId: string) {
  const slot = SLOTS.find((item) => item.id === slotId);
  return slot ? `${slot.start} to ${slot.end}` : "Unknown slot";
}

// Calendar dates are strings in YYYY-MM-DD format, not instants. Use UTC
// when formatting them so the selected day never shifts with the browser zone.
export function formatBookingDate(date: string) {
  const calendarDay = new Date(`${date}T12:00:00Z`);
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  }).format(calendarDay);
}

export function isScheduledDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < EVENT.firstDate || value > EVENT.lastDate) return false;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10) === value;
}

// The counselling room is in Gujarat. Both the server and browser use this
// timezone so past dates and already-started slots cannot be booked remotely.
export function todayInIndia(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function firstBookableDate(now: Date = new Date()): string | null {
  const today = todayInIndia(now);
  const first = today > EVENT.firstDate ? today : EVENT.firstDate;
  return first <= EVENT.lastDate ? first : null;
}

export function isBookableDate(value: string, now: Date = new Date()): boolean {
  return isScheduledDate(value) && value >= todayInIndia(now);
}

export function isSlotBookable(date: string, slotId: string, now: Date = new Date()): boolean {
  if (!isBookableDate(date, now) || !SLOTS.some((slot) => slot.id === slotId)) return false;
  if (date !== todayInIndia(now)) return true;
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.hour}:${values.minute}` < slotId;
}
