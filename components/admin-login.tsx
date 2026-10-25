"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarDays, Eye, EyeOff, LockKeyhole, MapPin, ShieldCheck } from "lucide-react";
import { EVENT } from "@/lib/event";

export function AdminLogin({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!response.ok) {
        const data = await response.json() as { error?: string };
        setError(data.error || "Couldn't sign in. Please try again.");
        return;
      }
      setPassword("");
      router.refresh();
    } catch {
      setError("Couldn't connect right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="admin-login-layout">
      <div className="admin-login-intro">
        <div className="eyebrow"><span className="eyebrow__dash" /> MIND LAB · STAFF PORTAL</div>
        <h1>Every session,<br /><em>in one place.</em></h1>
        <p>A private overview of student registrations and counselling slots for the day.</p>
        <div className="admin-event-card">
          <span className="admin-event-card__label">UPCOMING SESSION</span>
          <strong>Counselling at Mind Lab</strong>
          <span><CalendarDays size={17} />{EVENT.displayDate}</span>
          <span><MapPin size={17} />{EVENT.location}</span>
          <div className="admin-event-card__decoration" aria-hidden="true" />
        </div>
      </div>
      <div className="admin-login-card">
        <span className="admin-login-card__icon"><ShieldCheck size={27} strokeWidth={1.6} /></span>
        <span className="admin-login-card__eyebrow">PRIVATE ACCESS</span>
        <h2>Welcome back.</h2>
        <p>Sign in to view bookings, check availability, and download the student list.</p>
        {configured ? (
          <form onSubmit={signIn}>
            <label htmlFor="staffPassword">Staff password</label>
            <div className="input-wrap admin-password-wrap">
              <LockKeyhole size={18} strokeWidth={1.8} aria-hidden="true" />
              <input id="staffPassword" type={visible ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" required value={password} onChange={(event) => { setPassword(event.target.value); setError(""); }} />
              <button type="button" className="password-toggle" aria-label={visible ? "Hide password" : "Show password"} onClick={() => setVisible((current) => !current)}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
            {error && <div className="form-error" role="alert">{error}</div>}
            <button className="submit-button" type="submit" disabled={submitting}>{submitting ? "Signing in…" : "Sign in to dashboard"} <ArrowRight size={19} /></button>
          </form>
        ) : (
          <div className="admin-setup-message" role="status"><LockKeyhole size={20} /><span>Staff access isn&apos;t configured yet. Add <code>ADMIN_PASSWORD</code> and <code>SESSION_SECRET</code> to your Vercel environment variables to enable it.</span></div>
        )}
        <div className="admin-login-card__foot"><ShieldCheck size={16} /> Only authorised staff can see student details.</div>
      </div>
    </div>
  );
}
