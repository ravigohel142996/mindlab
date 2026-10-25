import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, CalendarDays } from "lucide-react";
import { EVENT } from "@/lib/event";

export function SiteHeader({ admin = false }: { admin?: boolean }) {
  return (
    <header className="site-header">
      <div className="shell site-header__inner">
        <Link href="/" className="brand" aria-label="Marwadi University home">
          <Image className="brand__emblem" src="/marwadi-emblem.webp" alt="Marwadi University emblem" width={48} height={48} priority />
          <span className="brand__university">
            <strong>Marwadi</strong>
            <span>UNIVERSITY</span>
          </span>
        </Link>
        <nav className="header-nav" aria-label="Primary navigation">
          {!admin && (
            <span className="header-date"><CalendarDays size={16} strokeWidth={1.8} /> {EVENT.headerDate}</span>
          )}
          <Link href={admin ? "/" : "/admin"} className="header-link">
            {admin ? "Back to booking" : "Staff portal"} <ArrowUpRight size={16} strokeWidth={1.9} />
          </Link>
        </nav>
      </div>
    </header>
  );
}
