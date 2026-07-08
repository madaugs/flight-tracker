import type { Airport } from '@/types'

let airportMap: Map<string, Airport> | null = null
let airportList: Airport[] | null = null

async function loadAirports(): Promise<Airport[]> {
  if (airportList) return airportList
  const res = await fetch('/airports.json')
  const data: Airport[] = await res.json()
  airportList = data
  airportMap = new Map(data.map((a) => [a.iata.toUpperCase(), a]))
  return data
}

export async function getAirportMap(): Promise<Map<string, Airport>> {
  if (airportMap) return airportMap
  await loadAirports()
  return airportMap!
}

export async function getAirport(iata: string): Promise<Airport | null> {
  const map = await getAirportMap()
  return map.get(iata.toUpperCase()) ?? null
}

export async function searchAirports(query: string, limit = 8): Promise<Airport[]> {
  const list = await loadAirports()
  const q = query.trim().toUpperCase()
  if (!q) return []

  const exact: Airport[] = []
  const prefix: Airport[] = []
  const nameMatch: Airport[] = []

  for (const airport of list) {
    if (airport.iata === q) {
      exact.push(airport)
    } else if (airport.iata.startsWith(q)) {
      prefix.push(airport)
    } else if (
      airport.city.toUpperCase().includes(q) ||
      airport.name.toUpperCase().includes(q)
    ) {
      nameMatch.push(airport)
    }
    if (exact.length + prefix.length + nameMatch.length >= limit * 3) break
  }

  return [...exact, ...prefix, ...nameMatch].slice(0, limit)
}

export function airportLabel(airport: Airport): string {
  return `${airport.iata} — ${airport.city || airport.name}, ${airport.country}`
}
