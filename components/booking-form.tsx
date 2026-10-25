"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import {
  AlertCircle, ArrowRight, Building2, CalendarDays, Check, ChevronDown,
  Clock3, Fingerprint, Layers3, LoaderCircle, LockKeyhole, MapPin,
  RefreshCw, UserRound,
} from "lucide-react";
import { DateCalendar } from "@/components/date-calendar";
import { EVENT, formatBookingDate, getSlotLabel, SLOTS } from "@/lib/event";

type SlotStatus = { id: string; available: boolean };
type AvailabilityState = "idle" | "loading" | "ready" | "error";
type Confirmation = {
  id: number;
  date: string;
  fullName: string;
  enrollmentNumber: string;
  department: string;
  semester: number;
  slotId: string;
};

const initialDetails = { fullName: "", enrollmentNumber: "", department: "", semester: "" };

export function BookingForm() {
  const [details, setDetails] = useState(initialDetails);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [slots, setSlots] = useState<SlotStatus[]>([]);
  const [availabilityState, setAvailabilityState] = useState<AvailabilityState>("idle");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const confirmationHeading = useRef<HTMLHeadingElement>(null);
  const slotsRequest = useRef<AbortController | null>(null);

  const refreshSlots = useCallback(async (date: string) => {
    slotsRequest.current?.abort();
    const controller = new AbortController();
    slotsRequest.current = controller;
    setSlots([]);
    setSelectedSlot("");
    setAvailabilityState("loading");
    try {
      const response = await fetch(`/api/slots?date=${encodeURIComponent(date)}`, { cache: "no-store", signal: controller.signal });
      if (!response.ok) throw new Error("Availability couldn't be loaded.");
      const data = await response.json() as { date: string; slots: SlotStatus[] };
      if (controller.signal.aborted || data.date !== date) return;
      setSlots(data.slots);
      setAvailabilityState("ready");
    } catch {
      if (!controller.signal.aborted) setAvailabilityState("error");
    }
  }, []);

  useEffect(() => {
    if (!selectedDate) return;
    void refreshSlots(selectedDate);
    return () => slotsRequest.current?.abort();
  }, [selectedDate, refreshSlots]);

  useEffect(() => {
    if (confirmation) confirmationHeading.current?.focus();
  }, [confirmation]);

  function chooseDate(date: string) {
    if (date === selectedDate) return;
    slotsRequest.current?.abort();
    setSelectedDate(date);
    setSelectedSlot("");
    setSlots([]);
    setAvailabilityState("loading");
    setError("");
  }

  function updateDetail(field: keyof typeof initialDetails, value: string) {
    setDetails((current) => ({ ...current, [field]: value }));
    if (error) setError("");
  }

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || availabilityState !== "ready" || !selectedDate || !selectedSlot) return;
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...details, date: selectedDate, semester: Number(details.semester), slotId: selectedSlot, website: "" }),
      });
      const data = await response.json() as { booking?: Confirmation; error?: string };
      if (!response.ok || !data.booking) {
        setError(data.error || "Something went wrong. Please try again.");
        if (response.status === 400 || response.status === 409) await refreshSlots(selectedDate);
        return;
      }
      setConfirmation(data.booking);
    } catch {
      setError("We couldn't connect right now. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function bookAnother() {
    setConfirmation(null);
    setDetails(initialDetails);
    setSelectedSlot("");
    setError("");
    if (selectedDate) void refreshSlots(selectedDate);
  }

  const availableCount = slots.filter((slot) => slot.available).length;

  return (
    <section className="booking-card" id="booking" aria-labelledby="booking-title">
      <div className="booking-card__header">
        <div className="booking-card__header-rings" aria-hidden="true" />
        <div className="booking-card__eyebrow"><span className="eyebrow-dot" /> CHOOSE YOUR DAY · THROUGH DECEMBER 2026</div>
        <h2 id="booking-title">Counselling slots <span>at Mind Lab (MB107)</span></h2>
        <p>Choose a day and time that works for you. We&apos;ll take care of the rest.</p>
      </div>

      {confirmation ? (
        <div className="confirmation" role="status">
          <div className="confirmation__check"><Check size={27} strokeWidth={2.3} /></div>
          <span className="confirmation__eyebrow">YOUR SLOT IS CONFIRMED</span>
          <h3 ref={confirmationHeading} tabIndex={-1}>You&apos;re all set,<br /><em>{confirmation.fullName.split(" ")[0]}.</em></h3>
          <p className="confirmation__copy">Your time at Mind Lab has been reserved. We look forward to seeing you.</p>
          <div className="ticket">
            <div className="ticket__top"><span>BOOKING DETAILS</span><span>SR. NO. {String(confirmation.id).padStart(2, "0")}</span></div>
            <div className="ticket__main"><Clock3 size={20} strokeWidth={1.8} /><strong>{getSlotLabel(confirmation.slotId)}</strong></div>
            <div className="ticket__line" />
            <div className="ticket__bottom">
              <span><CalendarDays size={16} /> {formatBookingDate(confirmation.date)}</span>
              <span><MapPin size={16} /> {EVENT.location}</span>
            </div>
          </div>
          <p className="confirmation__enrollment">Enrollment no. <strong>{confirmation.enrollmentNumber}</strong></p>
          <button type="button" className="secondary-button" onClick={bookAnother}>Back to booking page <ArrowRight size={17} /></button>
        </div>
      ) : (
        <form className="booking-form" onSubmit={submitBooking}>
          <div className="form-section-heading"><span className="form-section-heading__number">01</span><h3>Student details</h3><span className="form-section-heading__rule" /></div>

          <div className="form-fields">
            <div className="field">
              <label htmlFor="fullName">Full name <span>*</span></label>
              <div className="input-wrap"><UserRound size={18} strokeWidth={1.8} aria-hidden="true" />
                <input id="fullName" name="fullName" type="text" autoComplete="name" placeholder="Your full name" minLength={2} maxLength={100} required value={details.fullName} onChange={(event) => updateDetail("fullName", event.target.value)} />
              </div>
            </div>
            <div className="field">
              <label htmlFor="enrollmentNumber">Enrollment number <span>*</span></label>
              <div className="input-wrap"><Fingerprint size={18} strokeWidth={1.8} aria-hidden="true" />
                <input id="enrollmentNumber" name="enrollmentNumber" type="text" autoCapitalize="characters" autoComplete="off" placeholder="e.g. 24010101001" minLength={4} maxLength={30} pattern="[A-Za-z0-9/\-]+" title="Use letters, numbers, / or - only" required value={details.enrollmentNumber} onChange={(event) => updateDetail("enrollmentNumber", event.target.value.toUpperCase())} />
              </div>
            </div>
            <div className="field-row">
              <div className="field">
                <label htmlFor="department">Department <span>*</span></label>
                <div className="input-wrap"><Building2 size={18} strokeWidth={1.8} aria-hidden="true" />
                  <input id="department" name="department" type="text" placeholder="Enter your department" minLength={2} maxLength={100} required value={details.department} onChange={(event) => updateDetail("department", event.target.value)} />
                </div>
              </div>
              <div className="field">
                <label htmlFor="semester">Semester <span>*</span></label>
                <div className="input-wrap input-wrap--select"><Layers3 size={18} strokeWidth={1.8} aria-hidden="true" />
                  <select id="semester" name="semester" required value={details.semester} onChange={(event) => updateDetail("semester", event.target.value)}>
                    <option value="" disabled>Select semester</option>
                    {Array.from({ length: 12 }, (_, index) => <option value={index + 1} key={index + 1}>Semester {index + 1}</option>)}
                  </select>
                  <ChevronDown className="select-chevron" size={17} strokeWidth={1.8} aria-hidden="true" />
                </div>
              </div>
            </div>
          </div>

          <div className="form-section-heading form-section-heading--date"><span className="form-section-heading__number">02</span><h3>Choose your date</h3><span className="form-section-heading__rule" /></div>
          <DateCalendar selectedDate={selectedDate} onSelect={chooseDate} disabled={submitting} />
          <p className="selected-date" aria-live="polite">{selectedDate ? <>Selected: <strong>{formatBookingDate(selectedDate)}</strong></> : "Select a date to see available times."}</p>

          <div className="form-section-heading form-section-heading--slots"><span className="form-section-heading__number">03</span><h3>Choose your time</h3><span className="form-section-heading__rule" /></div>
          <div className="slots-intro"><span>{selectedDate ? `All times are for ${formatBookingDate(selectedDate)}.` : "Choose your date first."}</span><span className="slots-intro__count" aria-live="polite">{availabilityState === "ready" ? `${availableCount} of ${SLOTS.length} available` : availabilityState === "loading" ? "Checking times…" : availabilityState === "error" ? "Times unavailable" : "Select a date"}</span></div>

          {availabilityState === "error" && (
            <div className="inline-alert" role="alert"><AlertCircle size={18} /><span>We couldn&apos;t check availability. Please try again.</span><button type="button" onClick={() => void refreshSlots(selectedDate)} aria-label="Retry loading slots"><RefreshCw size={17} /></button></div>
          )}

          <div className="slot-grid" role="radiogroup" aria-label="Counselling time">
            {SLOTS.map((slot) => {
              const available = availabilityState === "ready" && slots.find((item) => item.id === slot.id)?.available;
              const chosen = selectedSlot === slot.id;
              return (
                <label key={slot.id} className={`slot-card${chosen ? " slot-card--chosen" : ""}${availabilityState === "ready" && !available ? " slot-card--booked" : ""}`}>
                  <input className="sr-only" type="radio" name="slotId" value={slot.id} checked={chosen} onChange={() => { setSelectedSlot(slot.id); setError(""); }} disabled={!available || submitting} aria-label={`${slot.start} to ${slot.end}${availabilityState === "ready" && !available ? ", fully booked" : ""}`} />
                  <span className="slot-card__top"><span>SLOT {slot.number}</span><span className="slot-card__radio" aria-hidden="true">{chosen && <Check size={12} strokeWidth={3} />}</span></span>
                  <span className="slot-card__time">{slot.start}<span> to {slot.end}</span></span>
                  <span className={`slot-card__status${available ? " slot-card__status--open" : ""}`}><span className="slot-card__status-dot" />{availabilityState === "idle" ? "Choose date" : availabilityState === "loading" ? "Checking" : available ? "Available" : availabilityState === "error" ? "Unavailable" : "Fully booked"}</span>
                </label>
              );
            })}
          </div>

          {availabilityState === "ready" && availableCount === 0 && <div className="full-message" role="status">No times are available for this day. Please choose another date.</div>}
          {error && <div className="form-error" role="alert"><AlertCircle size={18} strokeWidth={2} />{error}</div>}
          <button type="submit" className="submit-button" disabled={submitting || availabilityState !== "ready" || availableCount === 0 || !selectedSlot}>
            {submitting ? <>Reserving your slot <LoaderCircle size={19} className="spin" /></> : <>Confirm my slot <ArrowRight size={19} strokeWidth={2} /></>}
          </button>
          <p className="form-privacy"><LockKeyhole size={14} strokeWidth={1.8} /> Your information stays with the Mind Lab team.</p>
        </form>
      )}
    </section>
  );
}
