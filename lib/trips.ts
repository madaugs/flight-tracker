import type { Flight, Trip } from '@/types'
import { todayISO, daysInYear } from '@/lib/utils'

/** Compute trips from a sorted list of flights + a home airport IATA code. */
export function computeTrips(flights: Flight[], homeAirport: string): Omit<Trip, 'id' | 'user_id' | 'created_at'>[] {
  if (!homeAirport) return []

  const home = homeAirport.toUpperCase()
  const sorted = [...flights].sort((a, b) => a.flight_date.localeCompare(b.flight_date))

  const trips: Omit<Trip, 'id' | 'user_id' | 'created_at'>[] = []
  let awayStart: string | null = null

  for (const flight of sorted) {
    const isFromHome = flight.origin.toUpperCase() === home
    const isToHome = flight.destination.toUpperCase() === home

    if (isFromHome && !awayStart) {
      // Departing home — start a new trip
      awayStart = flight.flight_date
    } else if (isToHome && awayStart) {
      // Returning home — close the current trip
      const daysAway = daysBetween(awayStart, flight.flight_date) + 1
      trips.push({
        departure_date: awayStart,
        return_date: flight.flight_date,
        days_away: daysAway,
        days_away_override: null,
        origin_airport: home,
      })
      awayStart = null
    }
    // Connecting flights (neither from nor to home) don't change trip state
  }

  // Open trip — still traveling
  if (awayStart) {
    const today = todayISO()
    const daysAway = daysBetween(awayStart, today) + 1
    trips.push({
      departure_date: awayStart,
      return_date: null,
      days_away: daysAway,
      days_away_override: null,
      origin_airport: home,
    })
  }

  return trips
}

/** Days between two ISO date strings (inclusive of start, exclusive of end without +1). */
function daysBetween(start: string, end: string): number {
  const a = parseDate(start)
  const b = parseDate(end)
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24))
}

function parseDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Allocate trip days to months. Returns a map of "YYYY-M" → days. */
export function allocateDaysToMonths(
  trip: Pick<Trip, 'departure_date' | 'return_date' | 'days_away' | 'days_away_override'>
): Map<string, number> {
  const result = new Map<string, number>()

  const start = parseDate(trip.departure_date)
  const endDate = trip.return_date ? parseDate(trip.return_date) : parseDate(todayISO())

  const current = new Date(start)
  while (current <= endDate) {
    const key = `${current.getFullYear()}-${current.getMonth() + 1}`
    result.set(key, (result.get(key) ?? 0) + 1)
    current.setDate(current.getDate() + 1)
  }

  // If there's an override, scale proportionally
  const override = trip.days_away_override
  if (override !== null && trip.days_away && trip.days_away > 0) {
    const scale = override / trip.days_away
    for (const [key, val] of result) {
      result.set(key, Math.round(val * scale))
    }
  }

  return result
}

/** Aggregate days away per month across all trips for a given year. */
export function daysAwayByMonth(
  trips: Pick<Trip, 'departure_date' | 'return_date' | 'days_away' | 'days_away_override'>[],
  year: number
): number[] {
  // Returns array[0..11] = days away per month (index 0 = January)
  const monthTotals = new Array(12).fill(0)

  for (const trip of trips) {
    const allocation = allocateDaysToMonths(trip)
    for (const [key, days] of allocation) {
      const [y, m] = key.split('-').map(Number)
      if (y === year) {
        monthTotals[m - 1] += days
      }
    }
  }

  return monthTotals
}

/** Total days away in a year across all trips. */
export function totalDaysAwayInYear(
  trips: Pick<Trip, 'departure_date' | 'return_date' | 'days_away' | 'days_away_override'>[],
  year: number
): number {
  return daysAwayByMonth(trips, year).reduce((sum, d) => sum + d, 0)
}

/** Percentage of the full calendar year spent away (0–100). */
export function percentOfYear(daysAway: number, year: number): number {
  return Math.min(100, (daysAway / daysInYear(year)) * 100)
}

/**
 * Percentage of the year *elapsed so far* spent away (0–100).
 * For past years this equals percentOfYear (full year has elapsed).
 * For the current year it divides by days elapsed (e.g. 54/161 = 33.5%).
 */
export function percentOfElapsedYear(daysAway: number, year: number): number {
  const today = new Date()
  if (year < today.getFullYear()) {
    return Math.min(100, (daysAway / daysInYear(year)) * 100)
  }
  const startOfYear = new Date(year, 0, 1)
  const elapsed =
    Math.floor((today.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)) + 1
  return Math.min(100, (daysAway / elapsed) * 100)
}

/** Longest trip in days across a list of trips. */
export function longestTrip(trips: Pick<Trip, 'days_away' | 'days_away_override'>[]): number {
  return trips.reduce((max, t) => {
    const days = t.days_away_override ?? t.days_away ?? 0
    return Math.max(max, days)
  }, 0)
}
