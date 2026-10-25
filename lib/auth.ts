import "server-only";

import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const STAFF_COOKIE = "mindlab_staff_session";
export const SESSION_MAX_AGE = 60 * 60 * 8;

export function isStaffAccessConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.SESSION_SECRET);
}

export function verifyStaffPassword(candidate: string) {
  if (!isStaffAccessConfigured()) return false;
  const expected = createHash("sha256").update(process.env.ADMIN_PASSWORD!).digest();
  const actual = createHash("sha256").update(candidate).digest();
  return timingSafeEqual(expected, actual);
}

function sign(payload: string) {
  return createHmac("sha256", process.env.SESSION_SECRET!).update(payload).digest("base64url");
}

export function createStaffSession() {
  if (!isStaffAccessConfigured()) throw new Error("Staff access is not configured.");
  const payload = Buffer.from(`mindlab:${Date.now() + SESSION_MAX_AGE * 1000}`).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export async function isStaffAuthenticated() {
  if (!isStaffAccessConfigured()) return false;
  const token = (await cookies()).get(STAFF_COOKIE)?.value;
  if (!token || token.length > 512) return false;
  const pieces = token.split(".");
  if (pieces.length !== 2) return false;
  const [payload, signature] = pieces;
  try {
    const actual = Buffer.from(signature, "base64url");
    const expected = Buffer.from(sign(payload), "base64url");
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return false;
    const match = /^mindlab:(\d+)$/.exec(Buffer.from(payload, "base64url").toString("utf8"));
    return Boolean(match && Number(match[1]) > Date.now());
  } catch {
    return false;
  }
}
