import { isStaffAuthenticated } from "@/lib/auth";
import { listBookings } from "@/lib/db";
import { EVENT, getSlotLabel } from "@/lib/event";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function csvCell(value: string | number) {
  let text = String(value);
  // Prevent spreadsheet software from executing values supplied by students.
  if (/^[\s]*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET() {
  if (!(await isStaffAuthenticated())) {
    return Response.json({ error: "Please sign in to access registrations." }, { status: 401 });
  }

  try {
    const bookings = await listBookings();
    const rows = [
      ["Sr. No.", "Name", "Enrollment Number", "Department", "Semester", "Counselling Slot", "Date", "Location", "Registered At (UTC)"],
      ...bookings.map((booking, index) => [
        index + 1,
        booking.fullName,
        booking.enrollmentNumber,
        booking.department,
        booking.semester,
        getSlotLabel(booking.slotId),
        EVENT.displayDate,
        EVENT.location,
        booking.createdAt,
      ]),
    ];
    const csv = "\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="mind-lab-counselling-${EVENT.date}.csv"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("Unable to export counselling bookings:", error);
    return Response.json({ error: "The export is temporarily unavailable." }, { status: 503 });
  }
}
