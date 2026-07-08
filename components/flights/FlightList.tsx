'use client'

import { useQuery } from '@tanstack/react-query'
import { getSupabase } from '@/lib/supabase'
import type { Flight } from '@/types'
import FlightRow from './FlightRow'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import EmptyState from '@/components/ui/EmptyState'
import { Plane } from 'lucide-react'

interface FlightListProps {
  homeAirport: string
  limit?: number
  year?: number
}

export default function FlightList({ homeAirport, limit, year }: FlightListProps) {
  const { data: flights, isLoading, error } = useQuery({
    queryKey: ['flights', { year, limit }],
    queryFn: async () => {
      const supabase = getSupabase()
      let q = supabase
        .from('flights')
        .select('*')
        .order('flight_date', { ascending: false })
        .order('created_at', { ascending: false })
      if (year) {
        q = q.gte('flight_date', `${year}-01-01`).lte('flight_date', `${year}-12-31`)
      }
      if (limit) q = q.limit(limit)
      const { data, error } = await q
      if (error) throw error
      return data as Flight[]
    },
  })

  if (isLoading) return <div className="flex justify-center py-8"><LoadingSpinner /></div>
  if (error) return <p className="text-sm text-red-400 p-4">Failed to load flights.</p>
  if (!flights?.length) {
    return (
      <EmptyState
        icon={Plane}
        title="No flights yet"
        description="Log your first flight to get started."
      />
    )
  }

  return (
    <div className="card mt-4">
      <p className="section-title mb-3">
        {year ? `${year} flights` : 'All flights'} · {flights.length}
      </p>
      {flights.map((f) => (
        <FlightRow key={f.id} flight={f} homeAirport={homeAirport} />
      ))}
    </div>
  )
}
