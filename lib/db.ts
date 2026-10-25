import "server-only";

import { mkdirSync } from "node:fs";
import path from "node:path";
import { neon } from "@neondatabase/serverless";
import { EVENT } from "@/lib/event";
import type { BookingInput } from "@/lib/validation";

export type BookingRecord = BookingInput & {
  id: number;
  createdAt: string;
};

type RawBooking = {
  id: number | string;
  fullName: string;
  enrollmentNumber: string;
  department: string;
  semester: number;
  slotId: string;
  createdAt: string | Date;
};

export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super("The booking database has not been configured.");
  }
}

export class BookingConflictError extends Error {
  constructor(public readonly reason: "enrollment" | "slot") {
    super(reason === "enrollment" ? "This enrollment number already has a booking for this date." : "That time was just booked. Please choose another slot.");
  }
}

let postgres: ReturnType<typeof neon> | null = null;
let postgresSchemaReady: Promise<void> | null = null;
let localDatabase: import("node:sqlite").DatabaseSync | null = null;

function connectionString() {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL;
}

function mode(): "postgres" | "local" {
  if (connectionString()) return "postgres";
  // SQLite is a local development convenience only. A Vercel deployment
  // must use a persistent Postgres database, never its ephemeral filesystem.
  if (process.env.NODE_ENV === "development") return "local";
  throw new DatabaseNotConfiguredError();
}

function sql() {
  const url = connectionString();
  if (!url) throw new DatabaseNotConfiguredError();
  postgres ??= neon(url);
  return postgres;
}

async function ensurePostgresSchema() {
  if (!postgresSchemaReady) {
    postgresSchemaReady = sql()`
      CREATE TABLE IF NOT EXISTS counselling_bookings (
        id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        event_date text NOT NULL,
        full_name text NOT NULL,
        enrollment_number text NOT NULL,
        department text NOT NULL,
        semester smallint NOT NULL,
        slot_id text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT unique_booking_event_enrollment UNIQUE (event_date, enrollment_number),
        CONSTRAINT unique_booking_event_slot UNIQUE (event_date, slot_id)
      )
    `.then(() => undefined).catch((error: unknown) => {
      postgresSchemaReady = null;
      throw error;
    });
  }
  await postgresSchemaReady;
}

async function sqlite() {
  if (localDatabase) return localDatabase;
  const { DatabaseSync } = await import("node:sqlite");
  const directory = path.join(process.cwd(), "data");
  mkdirSync(directory, { recursive: true });
  const db = new DatabaseSync(path.join(directory, "bookings.sqlite"));
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS counselling_bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_date TEXT NOT NULL,
      full_name TEXT NOT NULL,
      enrollment_number TEXT NOT NULL,
      department TEXT NOT NULL,
      semester INTEGER NOT NULL,
      slot_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      CONSTRAINT unique_booking_event_enrollment UNIQUE (event_date, enrollment_number),
      CONSTRAINT unique_booking_event_slot UNIQUE (event_date, slot_id)
    );
  `);
  localDatabase = db;
  return db;
}

function normalize(row: RawBooking): BookingRecord {
  return {
    id: Number(row.id),
    fullName: row.fullName,
    enrollmentNumber: row.enrollmentNumber,
    department: row.department,
    semester: Number(row.semester),
    slotId: row.slotId,
    createdAt: new Date(row.createdAt).toISOString(),
  };
}

const bookingColumns = `
  id, full_name AS "fullName", enrollment_number AS "enrollmentNumber",
  department, semester, slot_id AS "slotId", created_at AS "createdAt"
`;

export async function getBookedSlotIds(): Promise<string[]> {
  if (mode() === "postgres") {
    await ensurePostgresSchema();
    const rows = await sql()`SELECT slot_id FROM counselling_bookings WHERE event_date = ${EVENT.date}`;
    return (rows as unknown as { slot_id: string }[]).map((row) => String(row.slot_id));
  }
  const db = await sqlite();
  const rows = db.prepare("SELECT slot_id FROM counselling_bookings WHERE event_date = ?").all(EVENT.date);
  return rows.map((row) => String(row.slot_id));
}

export async function listBookings(): Promise<BookingRecord[]> {
  if (mode() === "postgres") {
    await ensurePostgresSchema();
    const rows = await sql()`
      SELECT id, full_name AS "fullName", enrollment_number AS "enrollmentNumber",
             department, semester, slot_id AS "slotId", created_at AS "createdAt"
      FROM counselling_bookings WHERE event_date = ${EVENT.date}
      ORDER BY id ASC
    `;
    return (rows as unknown as RawBooking[]).map(normalize);
  }
  const db = await sqlite();
  const rows = db.prepare(`SELECT ${bookingColumns} FROM counselling_bookings WHERE event_date = ? ORDER BY id ASC`).all(EVENT.date);
  return (rows as unknown as RawBooking[]).map(normalize);
}

async function enrollmentExists(enrollmentNumber: string): Promise<boolean> {
  if (mode() === "postgres") {
    const rows = await sql()`
      SELECT id FROM counselling_bookings
      WHERE event_date = ${EVENT.date} AND enrollment_number = ${enrollmentNumber}
      LIMIT 1
    `;
    return (rows as unknown as { id: number }[]).length > 0;
  }
  const db = await sqlite();
  return Boolean(db.prepare("SELECT id FROM counselling_bookings WHERE event_date = ? AND enrollment_number = ?").get(EVENT.date, enrollmentNumber));
}

function isUniqueViolation(error: unknown) {
  if (!(error instanceof Error)) return false;
  const code = (error as Error & { code?: string }).code;
  return code === "23505" || error.message.includes("UNIQUE constraint failed");
}

export async function createBooking(input: BookingInput): Promise<BookingRecord> {
  try {
    if (mode() === "postgres") {
      await ensurePostgresSchema();
      const rows = await sql()`
        INSERT INTO counselling_bookings
          (event_date, full_name, enrollment_number, department, semester, slot_id)
        VALUES
          (${EVENT.date}, ${input.fullName}, ${input.enrollmentNumber}, ${input.department}, ${input.semester}, ${input.slotId})
        RETURNING id, full_name AS "fullName", enrollment_number AS "enrollmentNumber",
                  department, semester, slot_id AS "slotId", created_at AS "createdAt"
      `;
      return normalize((rows as unknown as RawBooking[])[0]);
    }

    const db = await sqlite();
    const result = db.prepare(`
      INSERT INTO counselling_bookings
        (event_date, full_name, enrollment_number, department, semester, slot_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(EVENT.date, input.fullName, input.enrollmentNumber, input.department, input.semester, input.slotId);
    const row = db.prepare(`SELECT ${bookingColumns} FROM counselling_bookings WHERE id = ?`).get(Number(result.lastInsertRowid));
    return normalize(row as unknown as RawBooking);
  } catch (error) {
    if (isUniqueViolation(error)) {
      const alreadyRegistered = await enrollmentExists(input.enrollmentNumber);
      throw new BookingConflictError(alreadyRegistered ? "enrollment" : "slot");
    }
    throw error;
  }
}
