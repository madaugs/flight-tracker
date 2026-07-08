'use client'

import { geoInterpolate } from 'd3-geo'
import { useState } from 'react'

interface FlightArcProps {
  startLat: number
  startLng: number
  endLat: number
  endLng: number
  count: number
  route: string   // e.g. "ORD ↔ LAX"
  project: (coord: [number, number]) => [number, number] | null
  isVisible: (coord: [number, number]) => boolean
}

export default function FlightArc({
  startLat, startLng, endLat, endLng, count, route, project, isVisible,
}: FlightArcProps) {
  const [hovered, setHovered] = useState(false)

  // Great-circle path, broken into segments wherever it passes behind the globe.
  const interpolate = geoInterpolate([startLng, startLat], [endLng, endLat])
  const N = 64
  const segments: [number, number][][] = []
  let current: [number, number][] = []
  let midpoint: [number, number] | null = null

  for (let i = 0; i <= N; i++) {
    const p = interpolate(i / N) as [number, number]
    if (isVisible(p)) {
      const xy = project(p)
      if (xy) {
        current.push(xy)
        if (i >= N / 2 && !midpoint) midpoint = xy
      }
    } else if (current.length > 1) {
      segments.push(current)
      current = []
    } else {
      current = []
    }
  }
  if (current.length > 1) segments.push(current)

  if (!segments.length) return null

  const strokeWidth = Math.max(0.6, 1 + Math.log(count + 1) * 1.5)
  const opacity = hovered ? 0.95 : 0.6

  return (
    <g
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ cursor: 'pointer' }}
    >
      {segments.map((seg, idx) => (
        <path
          key={idx}
          d={`M ${seg.map((p) => p.join(',')).join(' L ')}`}
          fill="none"
          stroke={hovered ? '#a5b4fc' : '#6366f1'}
          strokeWidth={strokeWidth}
          strokeOpacity={opacity}
          strokeLinecap="round"
          style={{ transition: 'stroke 0.15s, stroke-opacity 0.15s' }}
        />
      ))}
      {hovered && midpoint && (
        <text
          x={midpoint[0]}
          y={midpoint[1] - 6}
          textAnchor="middle"
          fill="#e2e8f0"
          fontSize={11}
          style={{ pointerEvents: 'none' }}
        >
          {route} · {count}×
        </text>
      )}
    </g>
  )
}
