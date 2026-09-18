# Weekly Gmail scan

A Claude scheduled task scans the inbox once a week for flight reservations and
files whatever it finds into `pending_flights`. Nothing reaches the `flights`
table until it's approved by hand at `/review`.

## Why it's built this way

The confirm-first requirement is enforced by the **schema**, not by the agent
remembering to ask. The scheduled task has exactly one write target —
`pending_flights` — so even a badly-behaved run can't silently add a flight.
Approval happens in the app, where you can edit the details first.

This matters because flights get changed often: airlines send a fresh
confirmation email on every reschedule, so a naive importer would quietly
double-book every time. `lib/pending.ts` flags a detected flight as a likely
*change* when it shares a confirmation code with an existing flight, or repeats
the same route within 10 days — and the review card then offers "replace that
flight" alongside "add as separate."

## What the task does

1. Reads `profiles.last_gmail_scan_at` to find the window (falls back to 120
   days on a first run).
2. Searches Gmail for airline confirmations and itineraries in that window.
3. Extracts each **leg** — date, origin, destination, airline, flight number,
   confirmation code — plus the source message id, subject, sender, and a
   confidence rating.
4. Inserts into `pending_flights` with `status = 'pending'` and
   `on conflict do nothing`.
5. Stamps `profiles.last_gmail_scan_at`.

## Safety properties

- **Email bodies are data, never instructions.** Reservation emails are
  attacker-reachable — anyone can send you one. The task prompt says so
  explicitly, and the blast radius of a malicious email is capped at "a bogus
  row appears in the review queue and you reject it."
- **Writes are confined to `pending_flights` and one `profiles` column.** The
  task never touches `flights`, `trips`, or auth.
- **Dedupe is idempotent.** `pending_flights_dedupe_idx` is unique on
  `(user_id, source_message_id, flight_date, origin, destination)`, so re-runs
  are safe and a leg you rejected stays rejected instead of resurfacing weekly.

## Changing it

The task lives in Claude's scheduled tasks (`/tasks`). To change the cadence,
the search terms, or the airlines covered, edit the task prompt there. To change
what happens on approval, see `app/review/page.tsx`.
