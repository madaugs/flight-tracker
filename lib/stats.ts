import type { SupabaseClient } from '@supabase/supabase-js'
import type { Flight, Trip, MonthlyStats, YearStats } from '@/types'
import {
  daysAwayByMonth,
  totalDaysAwayInYear,
  percentOfYear,
  percentOfElapsedYear,
  longestTrip,
} from '@/lib/trips'
import { monthName } from '@/lib/utils'

export async function fetchFlights(
  supabase: SupabaseClient,
  year?: number
): Promise<Flight[]> {
  let query = supabase
    .from('flights')
    .select('*')
    .order('flight_date', { ascending: false })

  if (year !== undefined) {
    query = query
      .gte('flight_date', `${year}-01-01`)
      .lte('flight_date', `${year}-12-31`)
  }

  const { data, error } = await query
  if (error) throw error
  return data as Flight[]
}

export async function fetchTrips(
  supabase: SupabaseClient,
  year?: number
): Promise<Trip[]> {
  let query = supabase.from('trips').select('*')

  if (year !== undefined) {
    // Include trips that overlap with the year
    query = query
      .or(
        `departure_date.lte.${year}-12-31,return_date.gte.${year}-01-01,return_date.is.null`
      )
  }

  const { data, error } = await query
  if (error) throw error
  return data as Trip[]
}

export async function fetchAllYears(supabase: SupabaseClient): Promise<number[]> {
  const { data, error } = await supabase
    .from('flights')
    .select('flight_date')
    .order('flight_date', { ascending: true })
  if (error) throw error
  const years = new Set<number>(
    (data as { flight_date: string }[]).map((f) =>
      parseInt(f.flight_date.split('-')[0])
    )
  )
  return Array.from(years).sort()
}

export function computeYearStats(
  flights: Flight[],
  trips: Trip[],
  year: number
): YearStats {
  const yearFlights = flights.filter((f) => f.flight_date.startsWith(`${year}`))
  const monthlyDays = daysAwayByMonth(trips, year)
  const totalDays = totalDaysAwayInYear(trips, year)
  const pct = percentOfYear(totalDays, year)

  // Flights per month
  const flightsPerMonth = new Array(12).fill(0)
  for (const f of yearFlights) {
    const month = parseInt(f.flight_date.split('-')[1]) - 1
    flightsPerMonth[month]++
  }

  const monthly: MonthlyStats[] = flightsPerMonth.map((count, i) => ({
    year,
    month: i + 1,
    flightCount: count,
    daysAway: monthlyDays[i],
  }))

  // Top route
  const routeCounts = new Map<string, number>()
  for (const f of yearFlights) {
    const key = `${f.origin} → ${f.destination}`
    routeCounts.set(key, (routeCounts.get(key) ?? 0) + 1)
  }
  let topRoute: string | null = null
  let topCount = 0
  for (const [route, count] of routeCounts) {
    if (count > topCount) {
      topCount = count
      topRoute = route
    }
  }

  // Airport visits — count distinct days at each airport so same-day layovers
  // count once (e.g. ORD→LAX then LAX→NAN on one day = a single LAX visit).
  const airportDays = new Map<string, Set<string>>()
  for (const f of yearFlights) {
    for (const code of [f.origin, f.destination]) {
      let days = airportDays.get(code)
      if (!days) {
        days = new Set<string>()
        airportDays.set(code, days)
      }
      days.add(f.flight_date)
    }
  }
  const airportVisits = new Map<string, number>()
  for (const [code, days] of airportDays) {
    airportVisits.set(code, days.size)
  }
  const topAirports = Array.from(airportVisits.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([iata, count]) => ({ iata, count }))

  const yearTrips = trips.filter((t) => {
    if (t.departure_date.startsWith(`${year}`)) return true
    if (t.return_date?.startsWith(`${year}`)) return true
    return false
  })

  return {
    year,
    totalFlights: yearFlights.length,
    totalDaysAway: totalDays,
    percentOfYear: pct,
    percentOfElapsedYear: percentOfElapsedYear(totalDays, year),
    longestTripDays: longestTrip(yearTrips),
    airportsVisited: airportVisits.size,
    topAirports,
    topRoute,
    monthly,
  }
}

/** Get route frequencies across all flights */
export function computeRouteFrequencies(
  flights: Flight[]
): { origin: string; destination: string; count: number }[] {
  const map = new Map<string, number>()
  for (const f of flights) {
    // Normalize direction: always store alphabetically so ORD→LAX and LAX→ORD merge
    const [a, b] = [f.origin, f.destination].sort()
    const key = `${a}|${b}`
    map.set(key, (map.get(key) ?? 0) + 1)
  }
  return Array.from(map.entries())
    .map(([key, count]) => {
      const [origin, destination] = key.split('|')
      return { origin, destination, count }
    })
    .sort((a, b) => b.count - a.count)
}
