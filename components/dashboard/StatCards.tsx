import type { YearStats } from '@/types'
import { Plane, CalendarDays, Percent, Route, MapPin } from 'lucide-react'
import { formatPercent } from '@/lib/utils'

export default function StatCards({ stats }: { stats: YearStats }) {
  const cards = [
    {
      label: 'Flights',
      value: stats.totalFlights.toString(),
      sub: `in ${stats.year}`,
      Icon: Plane,
      color: 'text-indigo-400',
      bg: 'bg-indigo-900/20',
    },
    {
      label: 'Days Away',
      value: stats.totalDaysAway.toString(),
      sub: 'days out of town',
      Icon: CalendarDays,
      color: 'text-sky-400',
      bg: 'bg-sky-900/20',
    },
    {
      label: '% Traveling',
      value: formatPercent(stats.percentOfElapsedYear),
      sub: `of year so far · ${formatPercent(stats.percentOfYear)} of full year`,
      Icon: Percent,
      color: 'text-violet-400',
      bg: 'bg-violet-900/20',
    },
    {
      label: 'Longest Trip',
      value: stats.longestTripDays > 0 ? `${stats.longestTripDays}d` : '—',
      sub: stats.longestTripDays > 0 ? 'days away' : 'no trips yet',
      Icon: Route,
      color: 'text-emerald-400',
      bg: 'bg-emerald-900/20',
    },
    {
      label: 'Airports',
      value: stats.airportsVisited.toString(),
      sub: 'unique visited',
      Icon: MapPin,
      color: 'text-amber-400',
      bg: 'bg-amber-900/20',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map(({ label, value, sub, Icon, color, bg }) => (
        <div key={label} className="stat-card">
          <div className={`inline-flex w-8 h-8 rounded-lg items-center justify-center ${bg} mb-2`}>
            <Icon className={`w-4 h-4 ${color}`} />
          </div>
          <div className="text-2xl font-bold text-slate-100 tabular-nums">{value}</div>
          <div className="text-xs text-slate-500 mt-0.5">{sub}</div>
          <div className="text-xs font-medium text-slate-400 mt-1">{label}</div>
        </div>
      ))}
    </div>
  )
}
