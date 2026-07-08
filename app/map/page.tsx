'use client'

import dynamic from 'next/dynamic'
import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import AppShell from '@/components/layout/AppShell'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import EmptyState from '@/components/ui/EmptyState'
import { computeRouteFrequencies } from '@/lib/stats'
import { getAirportMap } from '@/lib/airports'
import type { Flight, RouteFrequency } from '@/types'
import { Globe2 } from 'lucide-react'

// SSR must be disabled for react-simple-maps (uses browser APIs)
const RouteMap = dynamic(() => import('@/components/map/RouteMap'), { ssr: false })

export default function MapPage() {
  const router = useRouter()

  useEffect(() => {
    const supabase = getSupabase()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/auth/login')
    })
  }, [router])

  const { data: routes, isLoading } = useQuery({
    queryKey: ['routes'],
    queryFn: async () => {
      const supabase = getSupabase()
      const { data, error } = await supabase.from('flights').select('*')
      if (error) throw error

      const rawRoutes = computeRouteFrequencies(data as Flight[])
      const airportMap = await getAirportMap()

      const enriched: RouteFrequency[] = rawRoutes.map((r) => ({
        ...r,
        originAirport: airportMap.get(r.origin) ?? null,
        destinationAirport: airportMap.get(r.destination) ?? null,
      }))

      return enriched
    },
  })

  const totalRoutes = routes?.length ?? 0
  const totalFlights = routes?.reduce((sum, r) => sum + r.count, 0) ?? 0

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-100">Route map</h1>
          {totalRoutes > 0 && (
            <p className="text-sm text-slate-500">
              {totalFlights} flights · {totalRoutes} routes
            </p>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10"><LoadingSpinner /></div>
        ) : !routes?.length ? (
          <EmptyState
            icon={Globe2}
            title="No routes yet"
            description="Log some flights to see your routes on the map."
          />
        ) : (
          <div className="card">
            <RouteMap routes={routes} />
          </div>
        )}

        {/* Route frequency list */}
        {routes && routes.length > 0 && (
          <div className="card overflow-hidden p-0">
            <div className="px-4 py-3 border-b border-slate-800">
              <p className="section-title mb-0">Most flown routes</p>
            </div>
            <div>
              {routes.slice(0, 10).map((r) => (
                <div
                  key={`${r.origin}-${r.destination}`}
                  className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800/50 last:border-0"
                >
                  <span className="font-mono text-sm text-slate-200">
                    {r.origin} ↔ {r.destination}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 bg-indigo-900 rounded-full overflow-hidden w-20">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${Math.min(100, (r.count / (routes[0]?.count ?? 1)) * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-400 tabular-nums w-8 text-right">
                      {r.count}×
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
