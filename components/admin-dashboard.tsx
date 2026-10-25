"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle, ArrowDownToLine, CalendarDays, Clock3, LogOut,
  MapPin, RefreshCw, Search, ShieldCheck, UsersRound,
} from "lucide-react";
import { EVENT, getSlotLabel, SLOTS } from "@/lib/event";
import type { BookingRecord } from "@/lib/db";

export function AdminDashboard({ bookings, databaseError }: { bookings: BookingRecord[]; databaseError: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [actionError, setActionError] = useState("");
  const bookedSlots = new Set(bookings.map((booking) => booking.slotId));
  const filtered = useMemo(() => bookings.filter((booking) =>
    [booking.fullName, booking.enrollmentNumber, booking.department].some((value) => value.toLowerCase().includes(query.trim().toLowerCase())),
  ), [bookings, query]);

  async function logout() {
    try {
      const response = await fetch("/api/admin/logout", { method: "POST" });
      if (!response.ok) throw new Error("Sign out failed");
      router.refresh();
    } catch {
      setActionError("Couldn't sign out right now. Please try again.");
    }
  }

  return (
    <div className="dashboard">
      <div className="dashboard-heading">
        <div>
          <div className="eyebrow"><span className="eyebrow__dash" /> STAFF DASHBOARD · {EVENT.shortDate}</div>
          <h1>Session <em>overview.</em></h1>
          <p>Everything you need for counselling day, neatly in one place.</p>
        </div>
        <button type="button" className="logout-button" onClick={logout}><LogOut size={17} /> Sign out</button>
      </div>

      {actionError && <div className="form-error" role="alert">{actionError}</div>}
      {databaseError && <div className="dashboard-alert" role="alert"><AlertCircle size={19} /> The booking database is unavailable. Check DATABASE_URL (or POSTGRES_URL) in Vercel and try again.</div>}

      <div className="dashboard-stats">
        <div className="stat-card"><span className="stat-card__icon"><UsersRound size={21} /></span><span className="stat-card__label">TOTAL BOOKINGS</span><strong>{databaseError ? "—" : String(bookings.length).padStart(2, "0")}</strong><span className="stat-card__foot">students registered</span></div>
        <div className="stat-card"><span className="stat-card__icon"><Clock3 size={21} /></span><span className="stat-card__label">OPEN SLOTS</span><strong>{databaseError ? "—" : String(SLOTS.length - bookings.length).padStart(2, "0")}</strong><span className="stat-card__foot">out of {SLOTS.length} available</span></div>
        <div className="stat-card stat-card--detail"><span className="stat-card__icon"><CalendarDays size={21} /></span><span className="stat-card__label">SESSION DATE</span><strong>{EVENT.dayMonth}</strong><span className="stat-card__foot">{EVENT.weekdayYear}</span></div>
        <div className="stat-card stat-card--detail"><span className="stat-card__icon"><MapPin size={21} /></span><span className="stat-card__label">LOCATION</span><strong>{EVENT.room}</strong><span className="stat-card__foot">Mind Lab</span></div>
      </div>

      <section className="dashboard-section" aria-labelledby="slot-overview-title">
        <div className="dashboard-section__heading"><div><span className="section-kicker">THE SCHEDULE</span><h2 id="slot-overview-title">Slot overview</h2></div><span className="section-side-note">{SLOTS[0].start} — {SLOTS[SLOTS.length - 1].end}</span></div>
        <div className="dashboard-slot-grid">
          {SLOTS.map((slot) => (
            <div className={`dashboard-slot${bookedSlots.has(slot.id) ? " dashboard-slot--booked" : ""}`} key={slot.id}>
              <span className="dashboard-slot__number">{slot.number} / {String(SLOTS.length).padStart(2, "0")}</span>
              <strong>{slot.start} <span>— {slot.end}</span></strong>
              <span className="dashboard-slot__status"><span />{databaseError ? "Unknown" : bookedSlots.has(slot.id) ? "Booked" : "Available"}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="dashboard-section registrations" aria-labelledby="registrations-title">
        <div className="dashboard-section__heading registrations__heading"><div><span className="section-kicker">STUDENT LIST</span><h2 id="registrations-title">Registrations <span className="registration-count">{databaseError ? "—" : bookings.length}</span></h2></div><div className="registration-actions"><button type="button" onClick={() => router.refresh()} className="icon-action" title="Refresh registrations" aria-label="Refresh registrations"><RefreshCw size={18} /></button><a className={`export-button${databaseError ? " export-button--disabled" : ""}`} href={databaseError ? undefined : "/api/admin/export"} aria-disabled={databaseError}><ArrowDownToLine size={17} /> Export CSV</a></div></div>

        <div className="search-wrap"><Search size={18} strokeWidth={1.8} aria-hidden="true" /><input type="search" placeholder="Search by name, enrollment or department…" aria-label="Search registrations" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
        {filtered.length > 0 ? (
          <div className="table-scroll"><table className="registration-table"><thead><tr><th scope="col">Sr. No.</th><th scope="col">Name</th><th scope="col">Enrollment Number</th><th scope="col">Department</th><th scope="col">Semester</th><th scope="col">Counselling Slot</th></tr></thead><tbody>{filtered.map((booking) => (
            <tr key={booking.id}><td className="row-number">{String(bookings.indexOf(booking) + 1).padStart(2, "0")}</td><td className="student-name">{booking.fullName}</td><td className="enrollment-cell">{booking.enrollmentNumber}</td><td>{booking.department}</td><td>Sem {booking.semester}</td><td><span className="table-slot"><span className="table-slot__dot" />{getSlotLabel(booking.slotId)}</span></td></tr>
          ))}</tbody></table></div>
        ) : (
          <div className="empty-state"><span className="empty-state__icon"><UsersRound size={27} strokeWidth={1.5} /></span><h3>{query ? "No matching students" : "No registrations yet"}</h3><p>{query ? "Try another name, enrollment number or department." : "When a student books a slot, their details will appear here."}</p></div>
        )}
        <div className="registrations__foot"><ShieldCheck size={16} /> This student information is visible only to authorised staff.</div>
      </section>
    </div>
  );
}
