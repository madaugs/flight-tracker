export interface Flight {
  id: string
  user_id: string
  flight_date: string     // ISO date string: "2025-01-15"
  origin: string          // IATA code: "ORD"
  destination: string     // IATA code: "LAX"
  airline: string | null
  notes: string | null
  created_at: string
}

export type FlightInsert = Omit<Flight, 'id' | 'user_id' | 'created_at'>

export interface Trip {
  id: string
  user_id: string
  departure_date: string         // ISO date
  return_date: string | null     // null = currently traveling
  days_away: number | null       // null until return logged
  days_away_override: number | null
  origin_airport: string
  created_at: string
}

export interface Airport {
  iata: string
  name: string
  city: string
  country: string
  lat: number
  lng: number
}

export interface MonthlyStats {
  year: number
  month: number           // 1–12
  flightCount: number
  daysAway: number
}

export interface AirportVisit {
  iata: string
  count: number
}

export interface YearStats {
  year: number
  totalFlights: number
  totalDaysAway: number
  percentOfYear: number          // % of full calendar year (0–100)
  percentOfElapsedYear: number   // % of the year elapsed so far (0–100)
  longestTripDays: number
  airportsVisited: number
  topAirports: AirportVisit[]
  topRoute: string | null  // e.g. "ORD → LAX"
  monthly: MonthlyStats[]
}

export interface RouteFrequency {
  origin: string
  destination: string
  count: number
  originAirport: Airport | null
  destinationAirport: Airport | null
}

export interface Profile {
  id: string
  home_airport: string | null
  display_name: string | null
  created_at: string
  updated_at: string
}
