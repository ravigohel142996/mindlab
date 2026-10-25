export const EVENT = {
  date: "2026-10-26",
  displayDate: "Monday, 26 October 2026",
  shortDate: "26 OCT 2026",
  headerDate: "26 Oct 2026",
  eyebrowDate: "MONDAY · 26 OCTOBER 2026",
  dayMonth: "26 Oct",
  weekdayYear: "Monday, 2026",
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
