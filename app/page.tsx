import { ArrowDownRight, CalendarDays, Heart, LockKeyhole, MapPin, MoveUpRight } from "lucide-react";
import { BookingForm } from "@/components/booking-form";
import { SiteHeader } from "@/components/site-header";
import { EVENT } from "@/lib/event";

export default function HomePage() {
  return (
    <div className="site-frame">
      <SiteHeader />
      <main className="shell booking-layout">
        <div className="intro-column">
          <div className="eyebrow"><span className="eyebrow__dash" /> STUDENT WELLBEING · MIND LAB</div>
          <h1 className="hero-title">A space to<br />feel <em>heard.</em></h1>
          <p className="hero-copy">
            A conversation can make all the difference. Take a little time for yourself and book a counselling session with Mind Lab.
          </p>

          <div className="event-facts" aria-label="Session details">
            <div className="event-fact">
              <span className="event-fact__icon"><CalendarDays size={21} strokeWidth={1.8} /></span>
              <div><span className="event-fact__label">THE DATE</span><strong>{EVENT.displayDate}</strong></div>
            </div>
            <div className="event-fact">
              <span className="event-fact__icon"><MapPin size={22} strokeWidth={1.8} /></span>
              <div><span className="event-fact__label">THE PLACE</span><strong>{EVENT.location}</strong></div>
            </div>
          </div>

          <div className="intro-note">
            <div className="intro-note__ring intro-note__ring--one" aria-hidden="true" />
            <div className="intro-note__ring intro-note__ring--two" aria-hidden="true" />
            <span className="intro-note__symbol"><Heart size={21} strokeWidth={1.7} /></span>
            <p>It starts with<br /><em>one conversation.</em></p>
            <span className="intro-note__caption">A calm space. Your pace. Your story.</span>
            <ArrowDownRight className="intro-note__arrow" size={24} strokeWidth={1.4} aria-hidden="true" />
          </div>
          <div className="intro-assurance"><LockKeyhole size={15} strokeWidth={1.8} /> Your details are shared only with the Mind Lab team.</div>
        </div>
        <div className="form-column"><BookingForm /></div>
      </main>
      <footer className="site-footer">
        <div className="shell site-footer__inner">
          <span>© 2026 Marwadi University <span className="footer-separator">/</span> Mind Lab</span>
          <span className="footer-message">A little time for what matters. <MoveUpRight size={14} aria-hidden="true" /></span>
        </div>
      </footer>
    </div>
  );
}
