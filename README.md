# Mind Lab — counselling slot bookings

A responsive booking website for **Marwadi University Mind Lab (MB107)** on **Monday, 26 October 2026**. Students enter their name, enrollment number, department and semester, then choose one of four 45-minute slots from 2:00 PM to 5:00 PM. Staff can view the registrations and download a CSV at `/admin`.

## Run it locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. In development, if `DATABASE_URL` is not set, the app uses a **local SQLite database** at `data/bookings.sqlite` so the complete booking flow works right away. This file is gitignored. The database is **never** used as production storage on Vercel.

To try the staff portal locally, create `.env.local`:

```dotenv
ADMIN_PASSWORD=choose-a-private-password
SESSION_SECRET=choose-a-long-random-secret-at-least-32-characters
```

Restart `npm run dev`, open `/admin`, and use your `ADMIN_PASSWORD` to sign in. Never commit `.env.local`.

## Deploy on Vercel

1. Create a **Neon Postgres** database (you can add Neon via Vercel's Storage/Integrations). Copy its Postgres connection string. A pooled Neon connection string is fine.
2. Import this repository into Vercel as a **Next.js** project; the default build command (`npm run build`) is sufficient.
3. In **Project Settings → Environment Variables**, add:
   - `DATABASE_URL` — the Neon Postgres connection string. If your Vercel integration already supplies `POSTGRES_URL`, that works too; you only need one of them.
   - `ADMIN_PASSWORD` — a strong, unique staff password.
   - `SESSION_SECRET` — a random secret of at least 32 characters. You can generate one with `openssl rand -hex 32`.
4. Apply the variables to Production (and Preview if you want a working Vercel preview), then deploy or redeploy.
5. Share `/` with students. Share `/admin` and its password **only with authorised Mind Lab staff**.

The application creates its table automatically on the first database request. If your database user cannot create tables, run [`db/schema.sql`](db/schema.sql) once with an account that can. **Production bookings require `DATABASE_URL` or `POSTGRES_URL`; the app does not pretend to save them if both are missing.** Never put the database URL or staff password into a `NEXT_PUBLIC_` variable.

## How booking works

- One student can book **one slot for this date**, and each of the four slots accepts **one student**. Database uniqueness constraints prevent double bookings even if two people submit at the same time.
- **Sr. No.** is assigned automatically in the staff registration list; students do not type it. The booking confirmation shows a reference number.
- Only authenticated staff can access student details or export the CSV. The public availability endpoint reveals only which times are open, not student names.
- To change the event date, room or time slots, edit [`lib/event.ts`](lib/event.ts). Bookings are stored with an event date, so a new date starts with fresh availability while old database rows remain. Review database constraints if you want multiple students per slot.
- Because counselling information is sensitive, keep database access limited, rotate shared staff credentials as needed, and avoid sharing exported CSVs publicly. For official university use, confirm your institution's privacy/retention policy and consider replacing the shared password with university SSO.

## Checks

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

The Marwadi shield artwork used in the header is based on the [Marwadi University emblem](https://logosofindia.blogspot.com/2023/11/marwadi-university.html). The interface uses a complementary teal and deep-blue palette.
