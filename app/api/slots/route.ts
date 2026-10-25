import { NextResponse } from "next/server";
import { getBookedSlotIds } from "@/lib/db";
import { EVENT, SLOTS } from "@/lib/event";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const booked = new Set(await getBookedSlotIds());
    return NextResponse.json(
      {
        date: EVENT.date,
        slots: SLOTS.map((slot) => ({ id: slot.id, available: !booked.has(slot.id) })),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Unable to load counselling slots:", error);
    return NextResponse.json(
      { error: "Bookings are temporarily unavailable. Please try again later." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
