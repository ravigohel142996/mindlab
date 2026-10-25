import Image from "next/image";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { EVENT } from "@/lib/event";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell site-header__inner">
        <Link href="/" className="brand" aria-label="Marwadi University home">
          <Image
            className="brand__logo"
            src="/marwadi-university-naac.png"
            alt="Marwadi University, Marwadi Chandarana Group, NAAC A+"
            width={750}
            height={222}
            priority
          />
        </Link>
        <span className="header-date"><CalendarDays size={16} strokeWidth={1.8} /> {EVENT.headerRange}</span>
      </div>
    </header>
  );
}
