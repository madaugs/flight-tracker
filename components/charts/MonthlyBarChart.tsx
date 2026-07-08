'use client'

import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { MonthlyStats } from '@/types'
import { monthName } from '@/lib/utils'

interface MonthlyBarChartProps {
  monthly: MonthlyStats[]
}

export default function MonthlyBarChart({ monthly }: MonthlyBarChartProps) {
  const data = monthly.map((m) => ({
    month: monthName(m.month),
    Flights: m.flightCount,
    'Days Away': m.daysAway,
  }))

  return (
    <ResponsiveContainer width="100%" height={240}>
      <ComposedChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
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
          cursor={{ fill: 'rgba(255,255,255,0.04)' }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, color: '#64748b', paddingTop: 8 }}
        />
        <Bar dataKey="Flights" fill="#6366f1" radius={[3, 3, 0, 0]} barSize={14} />
        <Bar dataKey="Days Away" fill="#38bdf8" radius={[3, 3, 0, 0]} barSize={14} />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
