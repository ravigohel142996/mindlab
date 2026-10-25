import assert from "node:assert/strict";
import test from "node:test";
import {
  EVENT, firstBookableDate, formatBookingDate, getSlotLabel,
  isBookableDate, isScheduledDate, isSlotBookable, SLOTS, todayInIndia,
} from "../lib/event";
import { bookingSchema } from "../lib/validation";

const validBooking = {
  date: "2026-10-26",
  fullName: "  Mira Shah  ",
  enrollmentNumber: "  2401ab01  ",
  department: "  Computer Engineering  ",
  semester: "5",
  slotId: "14:45",
  website: "",
};

test("the schedule includes every day through December with four consecutive times", () => {
  assert.equal(EVENT.firstDate, "2026-10-26");
  assert.equal(EVENT.lastDate, "2026-12-31");
  assert.equal(EVENT.location, "Mind Lab (MB107)");
  assert.deepEqual(SLOTS.map(({ id }) => id), ["14:00", "14:45", "15:30", "16:15"]);
  assert.equal(getSlotLabel("14:00"), "2:00 PM to 2:45 PM");
  assert.equal(getSlotLabel("16:15"), "4:15 PM to 5:00 PM");
  assert.equal(formatBookingDate("2026-10-26"), "Monday, 26 October 2026");
  assert.equal(formatBookingDate("2026-12-31"), "Thursday, 31 December 2026");
});

test("calendar date validation checks actual dates and the booking window", () => {
  for (const date of ["2026-10-26", "2026-10-31", "2026-11-15", "2026-12-31"]) {
    assert.equal(isScheduledDate(date), true, date);
  }
  for (const date of ["2026-10-25", "2027-01-01", "2026-11-31", "2026-12-00", "2026-12-1", "2026-12-31T00:00Z"]) {
    assert.equal(isScheduledDate(date), false, date);
  }
});

test("the current day follows India time, not the server's timezone", () => {
  assert.equal(todayInIndia(new Date("2026-10-25T18:29:59Z")), "2026-10-25");
  assert.equal(todayInIndia(new Date("2026-10-25T18:30:00Z")), "2026-10-26");
  assert.equal(firstBookableDate(new Date("2026-10-25T12:00:00Z")), "2026-10-26");
  assert.equal(firstBookableDate(new Date("2026-11-20T12:00:00Z")), "2026-11-20");
  assert.equal(firstBookableDate(new Date("2026-12-31T12:00:00Z")), "2026-12-31");
  assert.equal(firstBookableDate(new Date("2026-12-31T18:30:00Z")), null);
  assert.equal(isBookableDate("2026-10-26", new Date("2026-10-27T00:00:00Z")), false);
});

test("already-started times cannot be booked on the selected day", () => {
  const beforeTwo = new Date("2026-10-26T08:29:00Z"); // 1:59 PM IST
  const exactlyTwo = new Date("2026-10-26T08:30:00Z"); // 2:00 PM IST
  const afterFourThirty = new Date("2026-10-26T11:00:00Z"); // 4:30 PM IST
  assert.equal(isSlotBookable("2026-10-26", "14:00", beforeTwo), true);
  assert.equal(isSlotBookable("2026-10-26", "14:00", exactlyTwo), false);
  assert.equal(isSlotBookable("2026-10-26", "14:45", exactlyTwo), true);
  assert.equal(isSlotBookable("2026-10-26", "16:15", afterFourThirty), false);
  assert.equal(isSlotBookable("2026-10-27", "14:00", exactlyTwo), true);
  assert.equal(isSlotBookable("2026-10-26", "17:00", beforeTwo), false);
});

test("booking validation trims details, normalises enrollment and requires a scheduled date", () => {
  const result = bookingSchema.parse(validBooking);
  assert.equal(result.date, "2026-10-26");
  assert.equal(result.fullName, "Mira Shah");
  assert.equal(result.enrollmentNumber, "2401AB01");
  assert.equal(result.department, "Computer Engineering");
  assert.equal(result.semester, 5);
  assert.equal(bookingSchema.parse({ ...validBooking, date: "2026-12-31" }).date, "2026-12-31");
});

test("booking validation rejects invalid dates, time, enrollment and semester", () => {
  assert.equal(bookingSchema.safeParse({ ...validBooking, date: "2027-01-01" }).success, false);
  assert.equal(bookingSchema.safeParse({ ...validBooking, date: "2026-11-31" }).success, false);
  assert.equal(bookingSchema.safeParse({ ...validBooking, date: undefined }).success, false);
  assert.equal(bookingSchema.safeParse({ ...validBooking, slotId: "17:00" }).success, false);
  assert.equal(bookingSchema.safeParse({ ...validBooking, enrollmentNumber: "ABC 123" }).success, false);
  assert.equal(bookingSchema.safeParse({ ...validBooking, semester: 0 }).success, false);
  assert.equal(bookingSchema.safeParse({ ...validBooking, semester: 13 }).success, false);
});

test("honeypot submissions are rejected", () => {
  assert.equal(bookingSchema.safeParse({ ...validBooking, website: "https://spam.example" }).success, false);
});
