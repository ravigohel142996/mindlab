# Mind Lab — counselling bookings

A responsive booking site for **Marwadi University Mind Lab (MB107)**. Students enter their name, enrollment number, department and semester, then choose a date in the calendar and one of four 45-minute counselling slots.

- Dates: **26 October – 31 December 2026**, every day (including weekends).
- Times: **2:00–5:00 PM India time (IST)**, with starts at 2:00, 2:45, 3:30 and 4:15 PM.
- Past dates and already-started slots cannot be booked.
- The header uses the Marwadi University / NAAC A+ image provided for this site.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. In development, without `DATABASE_URL`, bookings use a **local SQLite database** in the gitignored `data/bookings.sqlite`. This is for development only and is never used for Vercel production storage.

## Deploy on Vercel

1. Connect a **Neon Postgres** database to the Vercel project through Storage/Integrations, or supply its connection string as the `DATABASE_URL` environment variable. The integration's `POSTGRES_URL` also works.
2. Build as a **Next.js** project (`npm run build`) and redeploy after connecting the database. The application creates `counselling_bookings` automatically on the first database request. If the database account cannot create tables, run [`db/schema.sql`](db/schema.sql) once with a privileged account.
3. Share the booking URL with students. There is **no public staff portal**; authorised staff can manage registrations through their private Neon database access. Never share database credentials or student records publicly.

**Production bookings require `DATABASE_URL` or `POSTGRES_URL`.** Without a persistent database the site does not enable bookings. Do not expose connection strings in `NEXT_PUBLIC_` variables.

## Booking rules

- Availability is checked for the **selected date**. Each date has four independent slots; the database constraint prevents double-booking a time on the same day, even under simultaneous requests.
- One enrollment number may reserve **one slot per date**. The same student can book a different day. Existing 26 October registrations remain in the same table and keep their original date.
- The date and slot are validated on the server, including India-local current time. The confirmation displays the saved date, time and booking reference.
- The availability endpoint returns only open/closed times, not student details. Keep Neon access restricted and follow your institution's privacy and retention requirements.
- Date range, location and times can be updated in [`lib/event.ts`](lib/event.ts); database uniqueness is scoped by date, so no table migration is needed for the calendar.

## Checks

```bash
npm run typecheck
npm run lint
npm test
npm run build
```
