'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import AppShell from '@/components/layout/AppShell'
import MonthlyBarChart from '@/components/charts/MonthlyBarChart'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { computeYearStats, fetchFlights, fetchTrips, fetchAllYears } from '@/lib/stats'
import { monthName, formatPercent } from '@/lib/utils'
import { cn } from '@/lib/utils'

export default function MonthlyPage() {
  const router = useRouter()
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)

  useEffect(() => {
    const supabase = getSupabase()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/auth/login')
    })
  }, [router])

  const { data: availableYears = [currentYear] } = useQuery({
    queryKey: ['years'],
    queryFn: async () => {
      const supabase = getSupabase()
      const years = await fetchAllYears(supabase)
      return years.length ? years : [currentYear]
    },
  })

  const { data: flights } = useQuery({
    queryKey: ['flights', { year }],
    queryFn: async () => fetchFlights(getSupabase(), year),
  })

  const { data: trips } = useQuery({
    queryKey: ['trips', { year }],
    queryFn: async () => fetchTrips(getSupabase(), year),
  })

  const stats = flights && trips ? computeYearStats(flights, trips, year) : null

  return (
    <AppShell>
      <div className="max-w-xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-100">Monthly breakdown</h1>
          <div className="flex gap-1">
            {availableYears.map((y) => (
              <button
                key={y}
                onClick={() => setYear(y)}
                className={cn(
                  'px-3 py-1 rounded-lg text-sm font-medium transition-colors',
                  y === year
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                )}
              >
                {y}
              </button>
            ))}
          </div>
        </div>

        {!stats ? (
          <div className="flex justify-center py-10"><LoadingSpinner /></div>
        ) : (
          <>
            <div className="card">
              <p className="section-title mb-4">Flights & days away per month</p>
              <MonthlyBarChart monthly={stats.monthly} />
            </div>

            {/* Monthly table */}
            <div className="card overflow-hidden p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left text-xs text-slate-500 font-medium px-4 py-2.5">Month</th>
                    <th className="text-right text-xs text-slate-500 font-medium px-4 py-2.5">Flights</th>
                    <th className="text-right text-xs text-slate-500 font-medium px-4 py-2.5">Days Away</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.monthly.map((m) => (
                    <tr key={m.month} className="border-b border-slate-800/50 last:border-0">
                      <td className="px-4 py-2.5 text-slate-300">{monthName(m.month)}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-slate-200">
                        {m.flightCount > 0 ? m.flightCount : <span className="text-slate-600">—</span>}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-slate-200">
                        {m.daysAway > 0 ? m.daysAway : <span className="text-slate-600">—</span>}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t border-slate-700 bg-slate-800/30">
                    <td className="px-4 py-2.5 font-semibold text-slate-200">Total</td>
                    <td className="px-4 py-2.5 text-right font-mono font-semibold text-slate-200">{stats.totalFlights}</td>
                    <td className="px-4 py-2.5 text-right font-mono font-semibold text-slate-200">{stats.totalDaysAway}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="card flex items-center justify-between">
              <p className="text-sm text-slate-400">% of {year} traveling</p>
              <p className="text-2xl font-bold text-indigo-400 tabular-nums">
                {formatPercent(stats.percentOfYear)}
              </p>
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}
