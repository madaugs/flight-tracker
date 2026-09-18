'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getSupabase } from '@/lib/supabase'
import AppShell from '@/components/layout/AppShell'
import ImportDropzone, { type ParsedRow } from '@/components/import/ImportDropzone'
import ImportPreviewTable from '@/components/import/ImportPreviewTable'
import ImportProgress from '@/components/import/ImportProgress'
import { recomputeTrips } from '@/lib/sync'
import { CheckCircle } from 'lucide-react'

const BATCH_SIZE = 50

export default function ImportPage() {
  const router = useRouter()
  const qc = useQueryClient()
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([])
  const [importing, setImporting] = useState(false)
  const [importDone, setImportDone] = useState(0)
  const [importTotal, setImportTotal] = useState(0)
  const [complete, setComplete] = useState(false)
  const [homeAirport, setHomeAirport] = useState('')
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = getSupabase()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/auth/login'); return }
      setUserId(user.id)
      const { data } = await supabase.from('profiles').select('home_airport').eq('id', user.id).single()
      if (data?.home_airport) setHomeAirport(data.home_airport)
    })
  }, [router])

  const { data: existingFlights = [] } = useQuery({
    queryKey: ['flights', 'all'],
    queryFn: async () => {
      const supabase = getSupabase()
      const { data, error } = await supabase.from('flights').select('flight_date, origin, destination')
      if (error) throw error
      return data as { flight_date: string; origin: string; destination: string }[]
    },
  })

  const importable = parsedRows.filter((r) => r.status === 'valid' || r.status === 'warning')

  async function handleImport() {
    if (!userId || importable.length === 0) return
    setImporting(true)
    setImportTotal(importable.length)
    setImportDone(0)

    const supabase = getSupabase()
    let done = 0

    for (let i = 0; i < importable.length; i += BATCH_SIZE) {
      const batch = importable.slice(i, i + BATCH_SIZE).map((r) => ({
        user_id: userId,
        flight_date: r.date,
        origin: r.origin,
        destination: r.destination,
        airline: r.airline || null,
      }))
      await supabase.from('flights').insert(batch)
      done += batch.length
      setImportDone(done)
    }

    await recomputeTrips(supabase, userId, homeAirport)

    qc.invalidateQueries({ queryKey: ['flights'] })
    qc.invalidateQueries({ queryKey: ['trips'] })
    setImporting(false)
    setComplete(true)
  }

  if (complete) {
    return (
      <AppShell>
        <div className="max-w-xl mx-auto flex flex-col items-center py-16 text-center">
          <div className="w-14 h-14 bg-green-900/30 rounded-2xl flex items-center justify-center mb-4">
            <CheckCircle className="w-7 h-7 text-green-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-100 mb-1">Import complete!</h2>
          <p className="text-slate-400 text-sm mb-6">{importTotal} flights added.</p>
          <div className="flex gap-3">
            <button onClick={() => router.push('/dashboard')} className="btn-primary">
              Go to dashboard
            </button>
            <button
              onClick={() => { setComplete(false); setParsedRows([]) }}
              className="btn-secondary"
            >
              Import more
            </button>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Import flights</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Bulk-import your historical flight data from a CSV file.
          </p>
        </div>

        <ImportDropzone existingFlights={existingFlights} onParsed={setParsedRows} />

        {importing && (
          <ImportProgress total={importTotal} done={importDone} />
        )}

        {parsedRows.length > 0 && !importing && (
          <>
            <ImportPreviewTable rows={parsedRows} />
            <div className="flex items-center gap-3">
              <button
                onClick={handleImport}
                disabled={importable.length === 0}
                className="btn-primary"
              >
                Import {importable.length} {importable.length === 1 ? 'flight' : 'flights'}
              </button>
              <button onClick={() => setParsedRows([])} className="btn-ghost text-sm">
                Clear
              </button>
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}
