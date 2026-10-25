import { AdminDashboard } from "@/components/admin-dashboard";
import { AdminLogin } from "@/components/admin-login";
import { SiteHeader } from "@/components/site-header";
import { isStaffAccessConfigured, isStaffAuthenticated } from "@/lib/auth";
import { listBookings } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function AdminPage() {
  const configured = isStaffAccessConfigured();
  const authenticated = await isStaffAuthenticated();
  let bookings: Awaited<ReturnType<typeof listBookings>> = [];
  let databaseError = false;

  if (authenticated) {
    try {
      bookings = await listBookings();
    } catch (error) {
      console.error("Unable to load staff registrations:", error);
      databaseError = true;
    }
  }

  return (
    <div className="site-frame">
      <SiteHeader admin />
      <main className="shell admin-main">
        {authenticated
          ? <AdminDashboard bookings={bookings} databaseError={databaseError} />
          : <AdminLogin configured={configured} />}
      </main>
      <footer className="site-footer"><div className="shell site-footer__inner"><span>© 2026 Marwadi University <span className="footer-separator">/</span> Mind Lab</span><span>Private staff access</span></div></footer>
    </div>
  );
}
