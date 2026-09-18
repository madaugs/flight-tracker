'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getSupabase } from '@/lib/supabase'
import AppShell from '@/components/layout/AppShell'
import PendingFlightCard, { type ApprovePayload } from '@/components/review/PendingFlightCard'
import EmptyState from '@/components/ui/EmptyState'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { matchPending } from '@/lib/pending'
import { recomputeTrips } from '@/lib/sync'
import { formatDate } from '@/lib/utils'
import type { Flight, PendingFlight } from '@/types'
import { Inbox, MailCheck } from 'lucide-react'

export default function ReviewPage() {
  const router = useRouter()
  const qc = useQueryClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [homeAirport, setHomeAirport] = useState('')
  const [lastScan, setLastScan] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = getSupabase()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/auth/login'); return }
      setUserId(user.id)
      const { data } = await supabase
        .from('profiles')
        .select('home_airport, last_gmail_scan_at')
        .eq('id', user.id)
        .single()
      if (data?.home_airport) setHomeAirport(data.home_airport)
      if (data?.last_gmail_scan_at) setLastScan(data.last_gmail_scan_at)
    })
  }, [router])

  const { data: pending = [], isLoading } = useQuery({
    queryKey: ['pending-flights'],
    queryFn: async () => {
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from('pending_flights')
        .select('*')
        .eq('status', 'pending')
        .order('flight_date', { ascending: true })
      if (error) throw error
      return data as PendingFlight[]
    },
  })

  const { data: flights = [] } = useQuery({
    queryKey: ['flights', 'all'],
    queryFn: async () => {
      const supabase = getSupabase()
      const { data, error } = await supabase.from('flights').select('*')
      if (error) throw error
      return data as Flight[]
    },
  })

  async function handleApprove(row: PendingFlight, payload: ApprovePayload) {
    if (!userId) return
    setBusyId(row.id)
    const supabase = getSupabase()

    const fields = {
      flight_date: payload.flight_date,
      origin: payload.origin,
      destination: payload.destination,
      airline: payload.airline,
      flight_number: payload.flight_number,
      confirmation_code: payload.confirmation_code,
    }

    let flightId = payload.replaceFlightId ?? null

    if (payload.replaceFlightId) {
      await supabase.from('flights').update(fields).eq('id', payload.replaceFlightId)
    } else {
      const { data: inserted } = await supabase
        .from('flights')
        .insert({ ...fields, user_id: userId })
        .select('id')
        .single()
      flightId = inserted?.id ?? null
    }

    await supabase
      .from('pending_flights')
      .update({ status: 'approved', flight_id: flightId, reviewed_at: new Date().toISOString() })
      .eq('id', row.id)

    await recomputeTrips(supabase, userId, homeAirport)

    qc.invalidateQueries({ queryKey: ['pending-flights'] })
    qc.invalidateQueries({ queryKey: ['flights'] })
    qc.invalidateQueries({ queryKey: ['trips'] })
    setBusyId(null)
  }

  async function handleReject(row: PendingFlight) {
    setBusyId(row.id)
    const supabase = getSupabase()
    await supabase
      .from('pending_flights')
      .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
      .eq('id', row.id)
    qc.invalidateQueries({ queryKey: ['pending-flights'] })
    setBusyId(null)
  }

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Review</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Flights found in your inbox. Nothing is added to your log until you say so.
          </p>
          {lastScan && (
            <p className="text-xs text-slate-600 mt-1">
              Last inbox scan: {formatDate(lastScan.split('T')[0])}
            </p>
          )}
        </div>

        {isLoading ? (
          <LoadingSpinner />
        ) : pending.length === 0 ? (
          <EmptyState
            icon={MailCheck}
            title="Nothing to review"
            description="The weekly inbox scan hasn't turned up any new reservations. Anything it finds will land here first."
          />
        ) : (
          <>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Inbox className="w-4 h-4" />
              {pending.length} {pending.length === 1 ? 'flight' : 'flights'} waiting
            </div>
            <div className="space-y-3">
              {pending.map((row) => (
                <PendingFlightCard
                  key={row.id}
                  pending={row}
                  match={matchPending(row, flights)}
                  busy={busyId === row.id}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}
