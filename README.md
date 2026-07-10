# SignupDingus

A lightweight SignUpGenius-style app for coordinating volunteers. Built for
church host weeks (one Meal Host and one Overnight Host per day) but works for
any volunteer signup list.

- Coordinators log in (Supabase auth) to create and manage signup lists
- Volunteers sign up with just name + email — no account needed
- Custom questions per list (required or optional)
- Share via link or QR code; export volunteers to CSV
- Confirmation emails (via Resend) with a private edit/cancel link

## Stack

- [Next.js](https://nextjs.org) (App Router, TypeScript, Tailwind)
- [Supabase](https://supabase.com) — auth + Postgres with row-level security
- [Resend](https://resend.com) — confirmation emails (optional)
- Deployed on [Railway](https://railway.app)

## Local development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a Supabase project and apply the schema in
   `supabase/migrations/20260708000000_init.sql` (SQL editor or `supabase db push`).

3. Copy `.env.example` to `.env.local` and fill in your Supabase URL and keys.

4. Run the dev server:

   ```bash
   npm run dev
   ```

5. Open http://localhost:3000, create an account, and make your first list.

> Tip: in Supabase Auth settings you may want to disable "Confirm email" so
> coordinator accounts work immediately, or keep it on for extra safety.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-only; powers public signup pages) |
| `NEXT_PUBLIC_SITE_URL` | Public URL of the deployed app (for links, QR codes, emails) |
| `RESEND_API_KEY` | Resend API key; if unset, emails are skipped |
| `EMAIL_FROM` | From address for emails (must be a Resend-verified domain in production) |

## How volunteer privacy works

Volunteers never talk to Supabase directly. The public signup page and the
signup/edit APIs run server-side with the service role key, and the page only
exposes first name + last initial. Full contact details are visible only to
the signed-in coordinator who owns the list (enforced by RLS).
