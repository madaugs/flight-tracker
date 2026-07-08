'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { getSupabase } from '@/lib/supabase'
import YearReviewCard from '@/components/share/YearReviewCard'
import MonthReviewCard from '@/components/share/MonthReviewCard'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { computeYearStats, fetchFlights, fetchTrips } from '@/lib/stats'
import { monthNameFull, cn } from '@/lib/utils'
import { Download, Loader2 } from 'lucide-react'

type CardType = 'year' | 'month'

export default function ShareContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const yearParam = searchParams.get('year')
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1

  const [cardType, setCardType] = useState<CardType>('year')
  const [selectedYear, setSelectedYear] = useState(yearParam ? parseInt(yearParam) : currentYear)
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [exporting, setExporting] = useState(false)
  const [displayName, setDisplayName] = useState('')

  useEffect(() => {
    const supabase = getSupabase()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/auth/login'); return }
      const { data } = await supabase.from('profiles').select('display_name').eq('id', user.id).single()
      if (data?.display_name) setDisplayName(data.display_name)
    })
  }, [router])

  const { data: flights } = useQuery({
    queryKey: ['flights', { year: selectedYear }],
    queryFn: async () => fetchFlights(getSupabase(), selectedYear),
  })

  const { data: trips } = useQuery({
    queryKey: ['trips', { year: selectedYear }],
    queryFn: async () => fetchTrips(getSupabase(), selectedYear),
  })

  const stats = flights && trips ? computeYearStats(flights, trips, selectedYear) : null

  async function handleExport() {
    setExporting(true)
    try {
      const { toPng } = await import('html-to-image')
      const id = cardType === 'year' ? 'year-review-card' : 'month-review-card'
      const el = document.getElementById(id)
      if (!el) return
      const png = await toPng(el, { pixelRatio: 1 })
      const a = document.createElement('a')
      a.href = png
      a.download = cardType === 'year'
        ? `flights-${selectedYear}.png`
        : `flights-${selectedYear}-${selectedMonth}.png`
      a.click()
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <h1 className="text-xl font-bold text-slate-100">Share</h1>

      {/* Controls */}
      <div className="card space-y-4">
        <div className="flex gap-2">
          {(['year', 'month'] as CardType[]).map((t) => (
            <button
              key={t}
              onClick={() => setCardType(t)}
              className={cn(
                'px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize',
                cardType === t ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              )}
            >
              {t} in review
            </button>
          ))}
        </div>

        <div className="flex gap-3 flex-wrap">
          <div>
            <label className="label">Year</label>
            <input
              type="number"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="input w-28"
              min={2020}
              max={2030}
            />
          </div>
          {cardType === 'month' && (
            <div>
              <label className="label">Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="input w-40"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{monthNameFull(i + 1)}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <button
          onClick={handleExport}
          disabled={!stats || exporting}
          className="btn-primary flex items-center gap-2"
        >
          {exporting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Exporting…</>
          ) : (
            <><Download className="w-4 h-4" /> Download PNG</>
          )}
        </button>
        <p className="text-xs text-slate-500">
          Downloads a 1080×1080 PNG — perfect for Instagram. Share to Stories from your camera roll.
        </p>
      </div>

      {/* Card preview — scaled down to fit screen */}
      {!stats ? (
        <div className="flex justify-center py-10"><LoadingSpinner /></div>
      ) : (
        <div className="card overflow-hidden p-3">
          <p className="section-title mb-2">Preview</p>
          <div
            style={{
              transform: 'scale(0.33)',
              transformOrigin: 'top left',
              width: 1080,
              height: 1080,
              marginBottom: -718,
            }}
          >
            {cardType === 'year' ? (
              <YearReviewCard stats={stats} name={displayName} />
            ) : (
              <MonthReviewCard stats={stats} month={selectedMonth} name={displayName} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
