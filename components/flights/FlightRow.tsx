'use client'

import { useState } from 'react'
import { getSupabase } from '@/lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import type { Flight } from '@/types'
import { formatDateShort } from '@/lib/utils'
import { Pencil, Trash2, ArrowRight } from 'lucide-react'
import FlightForm from './FlightForm'

interface FlightRowProps {
  flight: Flight
  homeAirport: string
}

export default function FlightRow({ flight, homeAirport }: FlightRowProps) {
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm('Delete this flight?')) return
    setDeleting(true)
    const supabase = getSupabase()
    await supabase.from('flights').delete().eq('id', flight.id)
    qc.invalidateQueries({ queryKey: ['flights'] })
    qc.invalidateQueries({ queryKey: ['trips'] })
    setDeleting(false)
  }

  if (editing) {
    return (
      <div className="mb-2">
        <FlightForm
          homeAirport={homeAirport}
          editFlight={flight}
          onSuccess={() => setEditing(false)}
        />
        <button
          onClick={() => setEditing(false)}
          className="mt-2 text-sm text-slate-500 hover:text-slate-300 transition-colors"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-800 last:border-0 group">
      <div className="text-xs text-slate-500 w-16 flex-shrink-0 tabular-nums">
        {formatDateShort(flight.flight_date)}
      </div>
      <div className="flex-1 flex items-center gap-1.5 min-w-0">
        <span className="font-mono font-semibold text-sm text-slate-200">{flight.origin}</span>
        <ArrowRight className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
        <span className="font-mono font-semibold text-sm text-slate-200">{flight.destination}</span>
      </div>
      {flight.airline && (
        <span className="badge-indigo hidden sm:inline-flex">{flight.airline}</span>
      )}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => setEditing(true)}
          className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
