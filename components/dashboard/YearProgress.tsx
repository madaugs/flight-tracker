import type { YearStats } from '@/types'
import { formatPercent, daysInYear } from '@/lib/utils'

export default function YearProgress({ stats }: { stats: YearStats }) {
  const pct = Math.min(100, stats.percentOfYear)

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-slate-200">{stats.year} travel</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {stats.totalDaysAway} of {daysInYear(stats.year)} days away
          </p>
        </div>
        <div className="text-2xl font-bold text-indigo-400 tabular-nums">
          {formatPercent(pct)}
        </div>
      </div>

      <div className="relative h-3 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-600 to-violet-500 rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex justify-between text-xs text-slate-600 mt-2">
        <span>Jan</span>
        <span>Jul</span>
        <span>Dec</span>
      </div>
    </div>
  )
}
