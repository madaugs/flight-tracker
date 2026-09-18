export interface Flight {
  id: string
  user_id: string
  flight_date: string     // ISO date string: "2025-01-15"
  origin: string          // IATA code: "ORD"
  destination: string     // IATA code: "LAX"
  airline: string | null
  flight_number: string | null
  confirmation_code: string | null
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
  last_gmail_scan_at: string | null
  created_at: string
  updated_at: string
}

export type PendingStatus = 'pending' | 'approved' | 'rejected'
export type Confidence = 'high' | 'medium' | 'low'

/** A flight detected in an email, waiting on manual confirmation. */
export interface PendingFlight {
  id: string
  user_id: string
  flight_date: string
  origin: string
  destination: string
  airline: string | null
  flight_number: string | null
  confirmation_code: string | null
  notes: string | null
  status: PendingStatus
  flight_id: string | null
  reviewed_at: string | null
  source: string
  source_message_id: string | null
  source_subject: string | null
  source_from: string | null
  source_received_at: string | null
  confidence: Confidence | null
  created_at: string
}

/** How a pending flight relates to what's already in the log. */
export type MatchKind =
  | { kind: 'new' }
  | { kind: 'duplicate'; flight: Flight }
  | { kind: 'change'; flight: Flight; reason: string }
