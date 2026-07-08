'use client'

import { useState } from 'react'
import { getSupabase } from '@/lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import AirportCombobox from './AirportCombobox'
import { computeTrips } from '@/lib/trips'
import type { Flight } from '@/types'
import { todayISO } from '@/lib/utils'

const COMMON_AIRLINES = ['AA', 'DL', 'UA', 'WN', 'B6', 'AS', 'NK', 'F9']

interface FlightFormProps {
  homeAirport: string
  editFlight?: Flight
  onSuccess?: () => void
}

export default function FlightForm({ homeAirport, editFlight, onSuccess }: FlightFormProps) {
  const qc = useQueryClient()
  const [date, setDate] = useState(editFlight?.flight_date ?? todayISO())
  const [origin, setOrigin] = useState(editFlight?.origin ?? '')
  const [destination, setDestination] = useState(editFlight?.destination ?? '')
  const [airline, setAirline] = useState(editFlight?.airline ?? '')
  const [notes, setNotes] = useState(editFlight?.notes ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!origin || !destination) { setError('Origin and destination are required'); return }
    setLoading(true)
    setError(null)

    const supabase = getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not authenticated'); setLoading(false); return }

    const payload = {
      user_id: user.id,
      flight_date: date,
      origin: origin.toUpperCase(),
      destination: destination.toUpperCase(),
      airline: airline.trim() || null,
      notes: notes.trim() || null,
    }

    let flightError
    if (editFlight) {
      const { error } = await supabase.from('flights').update(payload).eq('id', editFlight.id)
      flightError = error
    } else {
      const { error } = await supabase.from('flights').insert(payload)
      flightError = error
    }

    if (flightError) { setError(flightError.message); setLoading(false); return }

    // Recompute trips
    await recomputeTrips(supabase, user.id, homeAirport)

    qc.invalidateQueries({ queryKey: ['flights'] })
    qc.invalidateQueries({ queryKey: ['trips'] })

    if (!editFlight) {
      setDate(todayISO())
      setOrigin('')
      setDestination('')
      setAirline('')
      setNotes('')
    }
    setLoading(false)
    onSuccess?.()
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <h2 className="font-semibold text-slate-200 text-base">
        {editFlight ? 'Edit flight' : 'Log a flight'}
      </h2>

      <div>
        <label className="label" htmlFor="flight-date">Date</label>
        <input
          id="flight-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="input"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="flight-origin">From</label>
          <AirportCombobox
            id="flight-origin"
            value={origin}
            onChange={setOrigin}
            placeholder="ORD"
          />
        </div>
        <div>
          <label className="label" htmlFor="flight-dest">To</label>
          <AirportCombobox
            id="flight-dest"
            value={destination}
            onChange={setDestination}
            placeholder="LAX"
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="flight-airline">Airline (optional)</label>
        <input
          id="flight-airline"
          type="text"
          value={airline}
          onChange={(e) => setAirline(e.target.value.toUpperCase())}
          placeholder="AA, DL, UA…"
          className="input uppercase"
          list="airline-suggestions"
        />
        <datalist id="airline-suggestions">
          {COMMON_AIRLINES.map((a) => <option key={a} value={a} />)}
        </datalist>
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-900/20 px-3 py-2 rounded-lg">{error}</p>
      )}

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? 'Saving…' : editFlight ? 'Save changes' : 'Log flight'}
      </button>
    </form>
  )
}

async function recomputeTrips(
  supabase: ReturnType<typeof getSupabase>,
  userId: string,
  homeAirport: string
) {
  const { data: flights, error } = await supabase
    .from('flights')
    .select('*')
    .eq('user_id', userId)
    .order('flight_date', { ascending: true })
  if (error || !flights) return

  const computed = computeTrips(flights as Flight[], homeAirport)

  // Delete existing trips for user, then re-insert
  await supabase.from('trips').delete().eq('user_id', userId)

  if (computed.length > 0) {
    await supabase.from('trips').insert(
      computed.map((t) => ({ ...t, user_id: userId }))
    )
  }
}
