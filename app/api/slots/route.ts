import { NextRequest, NextResponse } from "next/server";
import { getBookedSlotIds } from "@/lib/db";
import { isBookableDate, isSlotBookable, SLOTS } from "@/lib/event";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const noStore = { "Cache-Control": "no-store" };

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date");
  if (!date || !isBookableDate(date)) {
    return NextResponse.json({ error: "Please choose an upcoming date before 1 January 2027." }, { status: 400, headers: noStore });
  }

  try {
    const booked = new Set(await getBookedSlotIds(date));
    return NextResponse.json(
      {
        date,
        slots: SLOTS.map((slot) => ({ id: slot.id, available: isSlotBookable(date, slot.id) && !booked.has(slot.id) })),
      },
      { headers: noStore },
    );
  } catch (error) {
    console.error("Unable to load counselling slots:", error);
    return NextResponse.json(
      { error: "Bookings are temporarily unavailable. Please try again later." },
      { status: 503, headers: noStore },
    );
  }
}
