import Link from 'next/link'
import type { Flight } from '@/types'
import { formatDateShort } from '@/lib/utils'
import { ArrowRight, ChevronRight } from 'lucide-react'

export default function RecentFlights({ flights }: { flights: Flight[] }) {
  if (!flights.length) return null

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <p className="section-title mb-0">Recent flights</p>
        <Link href="/log" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5">
          See all <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
      <div>
        {flights.map((f) => (
          <div key={f.id} className="flex items-center gap-3 py-2.5 border-b border-slate-800 last:border-0">
            <span className="text-xs text-slate-500 w-14 flex-shrink-0 tabular-nums">
              {formatDateShort(f.flight_date)}
            </span>
            <div className="flex-1 flex items-center gap-1.5">
              <span className="font-mono font-semibold text-sm text-slate-200">{f.origin}</span>
              <ArrowRight className="w-3 h-3 text-slate-600 flex-shrink-0" />
              <span className="font-mono font-semibold text-sm text-slate-200">{f.destination}</span>
            </div>
            {f.airline && <span className="badge-indigo">{f.airline}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
