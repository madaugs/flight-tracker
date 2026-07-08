'use client'

import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import AppShell from '@/components/layout/AppShell'
import YearComparisonChart from '@/components/charts/YearComparisonChart'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { computeYearStats, fetchFlights, fetchTrips, fetchAllYears } from '@/lib/stats'
import { formatPercent } from '@/lib/utils'
import Link from 'next/link'
import { Share2 } from 'lucide-react'

export default function YearsPage() {
  const router = useRouter()

  useEffect(() => {
    const supabase = getSupabase()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/auth/login')
    })
  }, [router])

  const { data: availableYears, isLoading: yearsLoading } = useQuery({
    queryKey: ['years'],
    queryFn: async () => {
      const supabase = getSupabase()
      const years = await fetchAllYears(supabase)
      return years.length ? years : [new Date().getFullYear()]
    },
  })

  const { data: allStatsData, isLoading: statsLoading } = useQuery({
    queryKey: ['all-year-stats', availableYears],
    enabled: !!availableYears?.length,
    queryFn: async () => {
      const supabase = getSupabase()
      const results = await Promise.all(
        (availableYears ?? []).map(async (year) => {
          const [flights, trips] = await Promise.all([
            fetchFlights(supabase, year),
            fetchTrips(supabase, year),
          ])
          return computeYearStats(flights, trips, year)
        })
      )
      return results
    },
  })

  const loading = yearsLoading || statsLoading

  return (
    <AppShell>
      <div className="max-w-xl mx-auto space-y-5">
        <h1 className="text-xl font-bold text-slate-100">Year stats</h1>

        {loading ? (
          <div className="flex justify-center py-10"><LoadingSpinner /></div>
        ) : (
          <>
            {allStatsData && allStatsData.length >= 2 && (
              <div className="card">
                <p className="section-title mb-4">Flights per month by year</p>
                <YearComparisonChart
                  yearData={allStatsData.map((s) => ({ year: s.year, monthly: s.monthly }))}
                />
              </div>
            )}

            {/* Year summary table */}
            <div className="card overflow-hidden p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left text-xs text-slate-500 font-medium px-4 py-2.5">Year</th>
                    <th className="text-right text-xs text-slate-500 font-medium px-4 py-2.5">Flights</th>
                    <th className="text-right text-xs text-slate-500 font-medium px-4 py-2.5">Days Away</th>
                    <th className="text-right text-xs text-slate-500 font-medium px-4 py-2.5">% of Year</th>
                    <th className="text-right text-xs text-slate-500 font-medium px-4 py-2.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {(allStatsData ?? []).slice().reverse().map((s) => (
                    <tr key={s.year} className="border-b border-slate-800/50 last:border-0">
                      <td className="px-4 py-3 font-semibold text-slate-200">{s.year}</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-300">{s.totalFlights}</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-300">{s.totalDaysAway}</td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-indigo-400">
                        {formatPercent(s.percentOfYear)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/share?year=${s.year}`}
                          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          Share
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}
