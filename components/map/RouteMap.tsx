'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Sphere,
  Graticule,
} from 'react-simple-maps'
import { geoOrthographic, geoDistance } from 'd3-geo'
import { Pause, Play, Plus, Minus } from 'lucide-react'
import FlightArc from './FlightArc'
import MapLegend from './MapLegend'
import type { RouteFrequency } from '@/types'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

const SIZE = 800
const SCALE = 360 // orthographic radius; globe spans ~80..720 within the 800 box
const ZOOM_MIN = 0.7
const ZOOM_MAX = 5
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))

interface RouteMapProps {
  routes: RouteFrequency[]
}

/** Vector-average centroid of [lng, lat] points (handles the antimeridian). */
function centroid(points: [number, number][]): [number, number] {
  let x = 0, y = 0, z = 0
  for (const [lng, lat] of points) {
    const a = (lng * Math.PI) / 180
    const b = (lat * Math.PI) / 180
    x += Math.cos(b) * Math.cos(a)
    y += Math.cos(b) * Math.sin(a)
    z += Math.sin(b)
  }
  const n = points.length || 1
  x /= n; y /= n; z /= n
  const lng = (Math.atan2(y, x) * 180) / Math.PI
  const lat = (Math.atan2(z, Math.sqrt(x * x + y * y)) * 180) / Math.PI
  return [lng, lat]
}

export default function RouteMap({ routes }: RouteMapProps) {
  // Collect unique visited airports for dots
  const visitedAirports = useMemo(() => {
    const map = new Map<string, { lat: number; lng: number; count: number }>()
    for (const route of routes) {
      for (const ap of [route.originAirport, route.destinationAirport]) {
        if (!ap) continue
        const prev = map.get(ap.iata)
        map.set(ap.iata, { lat: ap.lat, lng: ap.lng, count: (prev?.count ?? 0) + route.count })
      }
    }
    return Array.from(map.entries())
  }, [routes])

  // Frame the globe on the centroid of visited airports, with a gentle tilt.
  const initialRotation = useMemo<[number, number, number]>(() => {
    const pts = visitedAirports.map(([, v]) => [v.lng, v.lat] as [number, number])
    if (!pts.length) return [-10, -20, 0]
    const [lng, lat] = centroid(pts)
    return [-lng, -lat * 0.6, 0]
  }, [visitedAirports])

  const [rotation, setRotation] = useState<[number, number, number]>(initialRotation)
  useEffect(() => setRotation(initialRotation), [initialRotation])

  const [spinning, setSpinning] = useState(true)
  const [zoom, setZoom] = useState(1)
  const rafRef = useRef<number>()
  const lastTsRef = useRef<number | undefined>(undefined)
  const dragRef = useRef<{ x: number; y: number; rot: [number, number, number] } | null>(null)
  const wrapElRef = useRef<HTMLDivElement>(null)

  const effectiveScale = SCALE * zoom

  // Mouse-wheel zoom (native non-passive listener so we can preventDefault page scroll).
  useEffect(() => {
    const el = wrapElRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      setZoom((z) => clamp(z * Math.exp(-e.deltaY * 0.0015), ZOOM_MIN, ZOOM_MAX))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  // Auto-rotate while spinning and not dragging.
  useEffect(() => {
    if (!spinning) return
    const step = (ts: number) => {
      if (lastTsRef.current != null) {
        const dt = ts - lastTsRef.current
        setRotation((r) => [(r[0] + dt * 0.006) % 360, r[1], r[2]]) // ~6°/sec
      }
      lastTsRef.current = ts
      rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      lastTsRef.current = undefined
    }
  }, [spinning])

  // Projection + visibility test for the current rotation.
  const { project, isVisible } = useMemo(() => {
    const proj = geoOrthographic()
      .rotate(rotation)
      .scale(effectiveScale)
      .translate([SIZE / 2, SIZE / 2])
      .clipAngle(90)
    const center: [number, number] = [-rotation[0], -rotation[1]]
    return {
      project: (c: [number, number]) => proj(c),
      isVisible: (c: [number, number]) => geoDistance(c, center) < Math.PI / 2 - 0.001,
    }
  }, [rotation, effectiveScale])

  function onPointerDown(e: React.PointerEvent) {
    setSpinning(false)
    dragRef.current = { x: e.clientX, y: e.clientY, rot: rotation }
    ;(e.currentTarget as Element).setPointerCapture?.(e.pointerId)
  }
  function onPointerMove(e: React.PointerEvent) {
    const d = dragRef.current
    if (!d) return
    const k = 0.25
    const nextLng = d.rot[0] + (e.clientX - d.x) * k
    const nextLat = Math.max(-90, Math.min(90, d.rot[1] - (e.clientY - d.y) * k))
    setRotation([nextLng, nextLat, 0])
  }
  function onPointerUp() {
    dragRef.current = null
  }

  return (
    <div>
      <div
        ref={wrapElRef}
        className="relative mx-auto"
        style={{ maxWidth: 520, touchAction: 'none', cursor: 'grab' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <ComposableMap
          projection="geoOrthographic"
          projectionConfig={{ rotate: rotation, scale: effectiveScale }}
          width={SIZE}
          height={SIZE}
          style={{ width: '100%', height: 'auto' }}
        >
          <Sphere id="globe-sphere" fill="#0b1220" stroke="#1e293b" strokeWidth={0.5} />
          <Graticule stroke="#1e293b" strokeWidth={0.4} />

          <Geographies geography={GEO_URL}>
            {({ geographies }: { geographies: any[] }) =>
              geographies.map((geo: any) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#1e293b"
                  stroke="#0f172a"
                  strokeWidth={0.5}
                  style={{ default: { outline: 'none' }, hover: { outline: 'none' }, pressed: { outline: 'none' } }}
                />
              ))
            }
          </Geographies>

          {/* Flight arcs (clipped to the visible hemisphere) */}
          {routes.map((route) => {
            const o = route.originAirport
            const d = route.destinationAirport
            if (!o || !d) return null
            return (
              <FlightArc
                key={`${route.origin}-${route.destination}`}
                startLat={o.lat}
                startLng={o.lng}
                endLat={d.lat}
                endLng={d.lng}
                count={route.count}
                route={`${route.origin} ↔ ${route.destination}`}
                project={project}
                isVisible={isVisible}
              />
            )
          })}

          {/* Airport dots (hidden when on the back of the globe) */}
          {visitedAirports.map(([iata, { lat, lng, count }]) => {
            if (!isVisible([lng, lat])) return null
            const r = Math.min(5, 2 + Math.log(count + 1))
            return (
              <Marker key={iata} coordinates={[lng, lat]}>
                <circle r={r} fill="#6366f1" fillOpacity={0.85} stroke="#0f172a" strokeWidth={0.5} />
              </Marker>
            )
          })}
        </ComposableMap>

        <div className="absolute right-2 top-2 flex flex-col gap-1">
          <button
            onClick={() => setZoom((z) => clamp(z * 1.3, ZOOM_MIN, ZOOM_MAX))}
            aria-label="Zoom in"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800/80 text-slate-300 backdrop-blur hover:text-white"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            onClick={() => setZoom((z) => clamp(z / 1.3, ZOOM_MIN, ZOOM_MAX))}
            aria-label="Zoom out"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800/80 text-slate-300 backdrop-blur hover:text-white"
          >
            <Minus className="h-4 w-4" />
          </button>
        </div>

        <button
          onClick={() => setSpinning((s) => !s)}
          className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-lg bg-slate-800/80 px-2.5 py-1.5 text-xs font-medium text-slate-300 backdrop-blur hover:text-white"
        >
          {spinning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          {spinning ? 'Pause' : 'Spin'}
        </button>
      </div>

      <p className="mt-2 text-center text-xs text-slate-600">Drag to rotate · scroll or +/− to zoom</p>

      <MapLegend />
    </div>
  )
}
