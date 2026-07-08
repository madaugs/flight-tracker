'use client'

import { useQuery } from '@tanstack/react-query'
import { getSupabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import StatCards from '@/components/dashboard/StatCards'
import YearProgress from '@/components/dashboard/YearProgress'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import EmptyState from '@/components/ui/EmptyState'
import { computeYearStats, fetchFlights, fetchTrips } from '@/lib/stats'
import { Plane } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const router = useRouter()
  const [year] = useState(new Date().getFullYear())
  const [homeAirport, setHomeAirport] = useState('ORD')

  // Auth check
  useEffect(() => {
    const supabase = getSupabase()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/auth/login')
    })
    // Load profile
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase.from('profiles').select('home_airport').eq('id', user.id).single()
      if (data?.home_airport) setHomeAirport(data.home_airport)
    })
  }, [router])

  const { data: flights, isLoading: flightsLoading } = useQuery({
    queryKey: ['flights', { year }],
    queryFn: async () => {
      const supabase = getSupabase()
      return fetchFlights(supabase, year)
    },
  })

  const { data: trips, isLoading: tripsLoading } = useQuery({
    queryKey: ['trips', { year }],
    queryFn: async () => {
      const supabase = getSupabase()
      return fetchTrips(supabase, year)
    },
  })

  const loading = flightsLoading || tripsLoading

  if (loading) {
    return (
      <AppShell>
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner className="w-7 h-7" />
        </div>
      </AppShell>
    )
  }

  if (!flights?.length) {
    return (
      <AppShell>
        <EmptyState
          icon={Plane}
          title="No flights logged yet"
          description="Start tracking your travel by logging your first flight."
          action={
            <Link href="/log" className="btn-primary">
              Log a flight
            </Link>
          }
        />
      </AppShell>
    )
  }

  const stats = computeYearStats(flights ?? [], trips ?? [], year)

  return (
    <AppShell>
      <div className="max-w-xl mx-auto space-y-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100">{year} overview</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {stats.totalFlights} flights · {stats.airportsVisited} airports
          </p>
        </div>

        <StatCards stats={stats} />
        <YearProgress stats={stats} />

        {stats.topRoute && (
          <div className="card flex items-center justify-between">
            <div>
              <p className="section-title mb-0.5">Top route</p>
              <p className="font-mono font-semibold text-slate-200">{stats.topRoute}</p>
            </div>
            <span className="badge-indigo text-sm px-3 py-1">
              Most flown
            </span>
          </div>
        )}

        {stats.topAirports.length > 0 && (
          <div className="card">
            <p className="section-title mb-3">Most visited airports</p>
            {stats.topAirports.map((a, i) => (
              <div
                key={a.iata}
                className="flex items-center gap-3 py-2 border-b border-slate-800/50 last:border-0"
              >
                <span className="text-xs text-slate-600 w-4">{i + 1}</span>
                <span className="font-mono font-semibold text-sm text-slate-200 w-10">{a.iata}</span>
                <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{ width: `${(a.count / stats.topAirports[0].count) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-slate-400 tabular-nums">{a.count}×</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
