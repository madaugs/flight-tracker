import type { YearStats } from '@/types'
import { formatPercent, monthNameFull } from '@/lib/utils'

interface MonthReviewCardProps {
  stats: YearStats
  month: number   // 1–12
  name?: string
}

export default function MonthReviewCard({ stats, month, name }: MonthReviewCardProps) {
  const m = stats.monthly[month - 1]
  const monthlyPct = m ? (m.daysAway / new Date(stats.year, month, 0).getDate()) * 100 : 0

  return (
    <div
      id="month-review-card"
      style={{
        width: 1080,
        height: 1080,
        background: 'linear-gradient(160deg, #0f172a 0%, #1a1040 60%, #0f172a 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px',
        fontFamily: 'Inter, system-ui, sans-serif',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.05,
        backgroundImage: 'radial-gradient(circle at 50% 30%, #818cf8 0%, transparent 60%)',
      }} />

      {/* Top label */}
      <div style={{
        position: 'absolute', top: 60, left: 80, right: 80,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ color: '#64748b', fontSize: 18, fontWeight: 500 }}>flight tracker</span>
        {name && <span style={{ color: '#64748b', fontSize: 18 }}>{name}</span>}
      </div>

      {/* Month + year */}
      <div style={{ color: '#6366f1', fontSize: 22, fontWeight: 600, letterSpacing: '0.12em', marginBottom: 12 }}>
        {stats.year}
      </div>
      <div style={{ color: '#f8fafc', fontSize: 96, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em', marginBottom: 8 }}>
        {monthNameFull(month)}
      </div>
      <div style={{ color: '#94a3b8', fontSize: 28, marginBottom: 64 }}>
        in review
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 64 }}>
        {[
          { value: (m?.flightCount ?? 0).toString(), label: 'flights' },
          { value: (m?.daysAway ?? 0).toString(), label: 'days away' },
          { value: formatPercent(monthlyPct, 0), label: 'of month' },
        ].map(({ value, label }) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <div style={{ color: '#f8fafc', fontSize: 72, fontWeight: 700, lineHeight: 1 }}>{value}</div>
            <div style={{ color: '#64748b', fontSize: 18, marginTop: 8, fontWeight: 500 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Mini year bar */}
      <div style={{ marginTop: 72, width: '100%' }}>
        <div style={{ color: '#475569', fontSize: 13, letterSpacing: '0.1em', marginBottom: 12, textAlign: 'center' }}>
          YEAR SO FAR
        </div>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'flex-end', height: 48 }}>
          {stats.monthly.slice(0, month).map((mo, i) => {
            const h = mo.flightCount > 0 ? Math.max(6, (mo.flightCount / Math.max(...stats.monthly.map((m) => m.flightCount), 1)) * 40) : 4
            return (
              <div
                key={i}
                style={{
                  width: 24,
                  height: h,
                  borderRadius: 3,
                  background: i === month - 1 ? '#6366f1' : 'rgba(99,102,241,0.25)',
                }}
              />
            )
          })}
        </div>
      </div>

      <div style={{
        position: 'absolute', bottom: 48,
        color: '#334155', fontSize: 14, letterSpacing: '0.08em',
      }}>
        flighttracker.app
      </div>
    </div>
  )
}
