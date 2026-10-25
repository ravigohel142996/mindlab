import assert from "node:assert/strict";
import test from "node:test";
import { EVENT, getSlotLabel, SLOTS } from "../lib/event";
import { bookingSchema } from "../lib/validation";

const validBooking = {
  fullName: "  Mira Shah  ",
  enrollmentNumber: "  2401ab01  ",
  department: "  Computer Engineering  ",
  semester: "5",
  slotId: "14:45",
  website: "",
};

test("the event has the requested date, location and four consecutive slots", () => {
  assert.equal(EVENT.date, "2026-10-26");
  assert.equal(EVENT.location, "Mind Lab (MB107)");
  assert.deepEqual(SLOTS.map(({ id }) => id), ["14:00", "14:45", "15:30", "16:15"]);
  assert.equal(getSlotLabel("14:00"), "2:00 PM to 2:45 PM");
  assert.equal(getSlotLabel("16:15"), "4:15 PM to 5:00 PM");
});

test("booking validation trims student details and normalises enrollment", () => {
  const result = bookingSchema.parse(validBooking);
  assert.equal(result.fullName, "Mira Shah");
  assert.equal(result.enrollmentNumber, "2401AB01");
  assert.equal(result.department, "Computer Engineering");
  assert.equal(result.semester, 5);
});

test("booking validation rejects invalid slot, enrollment and semester", () => {
  assert.equal(bookingSchema.safeParse({ ...validBooking, slotId: "17:00" }).success, false);
  assert.equal(bookingSchema.safeParse({ ...validBooking, enrollmentNumber: "ABC 123" }).success, false);
  assert.equal(bookingSchema.safeParse({ ...validBooking, semester: 0 }).success, false);
  assert.equal(bookingSchema.safeParse({ ...validBooking, semester: 13 }).success, false);
});

test("honeypot submissions are rejected", () => {
  assert.equal(bookingSchema.safeParse({ ...validBooking, website: "https://spam.example" }).success, false);
});
