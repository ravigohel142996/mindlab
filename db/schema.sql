-- Optional manual setup for Neon/Postgres. The app also creates this table
-- automatically on the first database request.
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
);
