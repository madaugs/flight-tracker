import type { Flight } from '@/types'
import { computeTrips } from '@/lib/trips'

type Supabase = ReturnType<typeof import('@/lib/supabase').getSupabase>

/**
 * Rebuild the trips table from the current set of flights.
 *
 * Trips are derived data — every path that changes `flights` has to call this
 * or the day counts drift. Shared by CSV import and the review queue.
 */
export async function recomputeTrips(
  supabase: Supabase,
  userId: string,
  homeAirport: string
): Promise<void> {
  const { data: allFlights } = await supabase
    .from('flights')
    .select('*')
    .eq('user_id', userId)
    .order('flight_date', { ascending: true })

  if (!allFlights) return

  const computed = computeTrips(allFlights as Flight[], homeAirport)
  await supabase.from('trips').delete().eq('user_id', userId)
  if (computed.length > 0) {
    await supabase.from('trips').insert(computed.map((t) => ({ ...t, user_id: userId })))
  }
}
