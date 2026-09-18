'use client'

import { useState } from 'react'
import type { Flight, PendingFlight, MatchKind } from '@/types'
import { formatDate, formatDateShort } from '@/lib/utils'
import AirportCombobox from '@/components/flights/AirportCombobox'
import {
  ArrowRight,
  Check,
  X,
  Pencil,
  Mail,
  AlertTriangle,
  RefreshCw,
  CopyCheck,
} from 'lucide-react'

export interface ApprovePayload {
  flight_date: string
  origin: string
  destination: string
  airline: string | null
  flight_number: string | null
  confirmation_code: string | null
  /** When set, update this existing flight instead of inserting a new one. */
  replaceFlightId?: string
}

interface Props {
  pending: PendingFlight
  match: MatchKind
  busy: boolean
  onApprove: (pending: PendingFlight, payload: ApprovePayload) => void
  onReject: (pending: PendingFlight) => void
}

export default function PendingFlightCard({ pending, match, busy, onApprove, onReject }: Props) {
  const [editing, setEditing] = useState(false)
  const [date, setDate] = useState(pending.flight_date)
  const [origin, setOrigin] = useState(pending.origin)
  const [destination, setDestination] = useState(pending.destination)
  const [airline, setAirline] = useState(pending.airline ?? '')

  function payload(replaceFlightId?: string): ApprovePayload {
    return {
      flight_date: date,
      origin: origin.toUpperCase(),
      destination: destination.toUpperCase(),
      airline: airline.trim() || null,
      flight_number: pending.flight_number,
      confirmation_code: pending.confirmation_code,
      replaceFlightId,
    }
  }

  const edited =
    date !== pending.flight_date ||
    origin.toUpperCase() !== pending.origin.toUpperCase() ||
    destination.toUpperCase() !== pending.destination.toUpperCase()

  return (
    <div className="card space-y-3">
      {/* The parsed flight */}
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono font-semibold text-slate-100">{origin.toUpperCase()}</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="font-mono font-semibold text-slate-100">
              {destination.toUpperCase()}
            </span>
            <span className="text-sm text-slate-400">{formatDate(date)}</span>
            {edited && <span className="badge-sky">edited</span>}
          </div>
          <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500">
            {airline && <span className="badge-indigo">{airline}</span>}
            {pending.flight_number && <span className="font-mono">{pending.flight_number}</span>}
            {pending.confirmation_code && (
              <span className="font-mono">conf {pending.confirmation_code}</span>
            )}
            {pending.confidence && pending.confidence !== 'high' && (
              <span className="badge-yellow">{pending.confidence} confidence</span>
            )}
          </div>
        </div>
        <button
          onClick={() => setEditing((v) => !v)}
          className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0"
          aria-label="Edit details"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Where it came from — always visible, so nothing is approved blind */}
      {pending.source_subject && (
        <div className="flex items-start gap-2 text-xs text-slate-500 bg-slate-950/60 rounded-lg px-3 py-2">
          <Mail className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
            <div className="truncate text-slate-400">{pending.source_subject}</div>
            <div className="truncate">
              {pending.source_from}
              {pending.source_received_at &&
                ` · ${formatDateShort(pending.source_received_at.split('T')[0])}`}
            </div>
          </div>
        </div>
      )}

      {/* Relationship to what's already logged */}
      {match.kind === 'duplicate' && (
        <div className="flex items-start gap-2 text-xs text-slate-400 bg-slate-800/50 rounded-lg px-3 py-2">
          <CopyCheck className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-slate-500" />
          <span>Already in your log — you can safely skip this one.</span>
        </div>
      )}
      {match.kind === 'change' && (
        <div className="flex items-start gap-2 text-xs text-yellow-300/90 bg-yellow-900/20 rounded-lg px-3 py-2">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <span>{match.reason} Is this a change to that flight, or a separate one?</span>
        </div>
      )}

      {editing && (
        <div className="space-y-3 pt-1">
          <div>
            <label className="label">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">From</label>
              <AirportCombobox value={origin} onChange={setOrigin} />
            </div>
            <div>
              <label className="label">To</label>
              <AirportCombobox value={destination} onChange={setDestination} />
            </div>
          </div>
          <div>
            <label className="label">Airline</label>
            <input
              value={airline}
              onChange={(e) => setAirline(e.target.value)}
              className="input"
              placeholder="Optional"
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap pt-1">
        {match.kind === 'change' && (
          <button
            onClick={() => onApprove(pending, payload(match.flight.id))}
            disabled={busy}
            className="btn-secondary text-sm inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Replace {formatDateShort(match.flight.flight_date)} flight
          </button>
        )}
        <button
          onClick={() => onApprove(pending, payload())}
          disabled={busy}
          className="btn-primary text-sm inline-flex items-center gap-1.5"
        >
          <Check className="w-3.5 h-3.5" />
          {match.kind === 'change' ? 'Add as separate flight' : 'Add to log'}
        </button>
        <button
          onClick={() => onReject(pending)}
          disabled={busy}
          className="btn-ghost text-sm inline-flex items-center gap-1.5"
        >
          <X className="w-3.5 h-3.5" />
          {match.kind === 'duplicate' ? 'Skip' : 'Not a flight I took'}
        </button>
      </div>
    </div>
  )
}
