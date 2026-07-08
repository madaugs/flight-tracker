'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { MonthlyStats } from '@/types'
import { monthName } from '@/lib/utils'

interface YearComparisonChartProps {
  yearData: { year: number; monthly: MonthlyStats[] }[]
}

const YEAR_COLORS = ['#6366f1', '#38bdf8', '#a78bfa', '#34d399', '#fb923c']

export default function YearComparisonChart({ yearData }: YearComparisonChartProps) {
  // Build data: one row per month, one key per year
  const data = Array.from({ length: 12 }, (_, i) => {
    const row: Record<string, string | number> = { month: monthName(i + 1) }
    for (const { year, monthly } of yearData) {
      row[year.toString()] = monthly[i]?.flightCount ?? 0
    }
    return row
  })

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fill: '#64748b', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#64748b', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px',
            color: '#e2e8f0',
            fontSize: 12,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: '#64748b', paddingTop: 8 }} />
        {yearData.map(({ year }, i) => (
          <Line
            key={year}
            type="monotone"
            dataKey={year.toString()}
            stroke={YEAR_COLORS[i % YEAR_COLORS.length]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
