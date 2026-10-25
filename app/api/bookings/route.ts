import { NextRequest, NextResponse } from "next/server";
import { BookingConflictError, createBooking } from "@/lib/db";
import { bookingSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (Number(request.headers.get("content-length") || 0) > 10_000) {
    return NextResponse.json({ error: "The form submission is too large." }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Please submit a valid form." }, { status: 400 });
  }

  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Please check the form and try again." },
      { status: 400 },
    );
  }

  try {
    const booking = await createBooking(parsed.data);
    return NextResponse.json({ booking }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof BookingConflictError) {
      return NextResponse.json({ error: error.message, reason: error.reason }, { status: 409 });
    }
    console.error("Unable to create counselling booking:", error);
    return NextResponse.json(
      { error: "We couldn't save your booking right now. Please try again later." },
      { status: 503 },
    );
  }
}
