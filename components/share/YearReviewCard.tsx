import type { YearStats } from '@/types'
import { formatPercent } from '@/lib/utils'
import { Plane } from 'lucide-react'

interface YearReviewCardProps {
  stats: YearStats
  name?: string
}

/**
 * Rendered at 1080×1080 for Instagram feed export.
 * This component is designed to be captured by html-to-image.
 */
export default function YearReviewCard({ stats, name }: YearReviewCardProps) {
  return (
    <div
      id="year-review-card"
      style={{
        width: 1080,
        height: 1080,
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
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
      {/* Background pattern */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.04,
        backgroundImage: 'radial-gradient(circle at 25% 25%, #6366f1 0%, transparent 50%), radial-gradient(circle at 75% 75%, #a78bfa 0%, transparent 50%)',
      }} />

      {/* Top label */}
      <div style={{
        position: 'absolute', top: 60, left: 80, right: 80,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'rgba(99,102,241,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2">
              <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21 4 19.5 2.5S18 2 16.5 3.5L13 7 4.8 5.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
            </svg>
          </div>
          <span style={{ color: '#64748b', fontSize: 18, fontWeight: 500 }}>flight tracker</span>
        </div>
        {name && <span style={{ color: '#64748b', fontSize: 18 }}>{name}</span>}
      </div>

      {/* Year */}
      <div style={{ color: '#6366f1', fontSize: 22, fontWeight: 600, letterSpacing: '0.15em', marginBottom: 16 }}>
        {stats.year} IN REVIEW
      </div>

      {/* Big % stat */}
      <div style={{ color: '#f8fafc', fontSize: 140, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.04em', marginBottom: 8 }}>
        {formatPercent(stats.percentOfYear, 1)}
      </div>
      <div style={{ color: '#94a3b8', fontSize: 28, fontWeight: 400, marginBottom: 64 }}>
        of the year traveling
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 48 }}>
        {[
          { value: stats.totalFlights.toString(), label: 'flights' },
          { value: stats.totalDaysAway.toString(), label: 'days away' },
          { value: stats.longestTripDays > 0 ? `${stats.longestTripDays}d` : '—', label: 'longest trip' },
          { value: stats.airportsVisited.toString(), label: 'airports' },
        ].map(({ value, label }) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <div style={{ color: '#f8fafc', fontSize: 48, fontWeight: 700, lineHeight: 1 }}>{value}</div>
            <div style={{ color: '#64748b', fontSize: 16, marginTop: 6, fontWeight: 500 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Top route */}
      {stats.topRoute && (
        <div style={{
          marginTop: 56,
          padding: '14px 32px',
          borderRadius: 40,
          background: 'rgba(99,102,241,0.15)',
          border: '1px solid rgba(99,102,241,0.3)',
          color: '#a5b4fc',
          fontSize: 20,
          fontWeight: 500,
          letterSpacing: '0.05em',
        }}>
          ✈ {stats.topRoute}
        </div>
      )}

      {/* Bottom watermark */}
      <div style={{
        position: 'absolute', bottom: 48,
        color: '#334155', fontSize: 14, letterSpacing: '0.08em',
      }}>
        flighttracker.app
      </div>
    </div>
  )
}
