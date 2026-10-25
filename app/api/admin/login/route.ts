import { NextRequest, NextResponse } from "next/server";
import { createStaffSession, isStaffAccessConfigured, SESSION_MAX_AGE, STAFF_COOKIE, verifyStaffPassword } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isStaffAccessConfigured()) {
    return NextResponse.json({ error: "Staff access has not been configured yet." }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Please enter your password." }, { status: 400 });
  }

  const password = typeof body === "object" && body !== null && "password" in body
    ? (body as { password: unknown }).password
    : undefined;
  if (typeof password !== "string" || password.length > 256 || !verifyStaffPassword(password)) {
    return NextResponse.json({ error: "Incorrect password. Please try again." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(STAFF_COOKIE, createStaffSession(), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
