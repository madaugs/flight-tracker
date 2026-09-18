import type { Flight, PendingFlight, MatchKind } from '@/types'
import { formatDateShort } from '@/lib/utils'

/** How far apart two same-route flights can sit and still look like a rebooking. */
const REBOOK_WINDOW_DAYS = 10

/**
 * Decide whether a detected reservation is genuinely new, something already in
 * the log, or a change to an existing flight.
 *
 * The 'change' case is the one that matters in practice: airlines send a fresh
 * confirmation email when you move a flight, so a naive importer quietly
 * doubles up every time you reschedule.
 */
export function matchPending(pending: PendingFlight, flights: Flight[]): MatchKind {
  const origin = pending.origin.toUpperCase()
  const destination = pending.destination.toUpperCase()

  // Exact same leg, same day — already logged.
  const exact = flights.find(
    (f) =>
      f.flight_date === pending.flight_date &&
      f.origin.toUpperCase() === origin &&
      f.destination.toUpperCase() === destination
  )
  if (exact) return { kind: 'duplicate', flight: exact }

  // Same booking reference, different details — the airline moved it.
  if (pending.confirmation_code) {
    const code = pending.confirmation_code.toUpperCase()
    const sameBooking = flights.find(
      (f) => f.confirmation_code && f.confirmation_code.toUpperCase() === code
    )
    if (sameBooking) {
      return {
        kind: 'change',
        flight: sameBooking,
        reason: `Same confirmation code (${pending.confirmation_code}) as a flight already logged for ${formatDateShort(sameBooking.flight_date)}.`,
      }
    }
  }

  // Same route within a couple of weeks — probably a reschedule, but we can't
  // be sure, so it's surfaced as a question rather than acted on.
  const nearby = flights.find(
    (f) =>
      f.origin.toUpperCase() === origin &&
      f.destination.toUpperCase() === destination &&
      Math.abs(daysBetween(f.flight_date, pending.flight_date)) <= REBOOK_WINDOW_DAYS
  )
  if (nearby) {
    return {
      kind: 'change',
      flight: nearby,
      reason: `You already have ${origin} → ${destination} on ${formatDateShort(nearby.flight_date)}.`,
    }
  }

  return { kind: 'new' }
}

function daysBetween(a: string, b: string): number {
  return Math.round((parseDate(b).getTime() - parseDate(a).getTime()) / 86_400_000)
}

function parseDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}
