'use client'

import { useState, useEffect, useRef } from 'react'
import { searchAirports, airportLabel } from '@/lib/airports'
import type { Airport } from '@/types'
import { MapPin, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AirportComboboxProps {
  value: string         // IATA code
  onChange: (iata: string) => void
  placeholder?: string
  id?: string
}

export default function AirportCombobox({
  value,
  onChange,
  placeholder = 'Search airports…',
  id,
}: AirportComboboxProps) {
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<Airport[]>([])
  const [open, setOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)

  // When external value changes (e.g. form reset), sync query
  useEffect(() => {
    setQuery(value)
  }, [value])

  useEffect(() => {
    if (!query || query.length < 1) {
      setResults([])
      return
    }
    let cancelled = false
    searchAirports(query, 8).then((r) => {
      if (!cancelled) setResults(r)
    })
    return () => { cancelled = true }
  }, [query])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function select(airport: Airport) {
    setQuery(airport.iata)
    onChange(airport.iata)
    setOpen(false)
    setActiveIdx(-1)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || results.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault()
      select(results[activeIdx])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value.toUpperCase()
    setQuery(v)
    onChange(v)  // Let parent know of raw input too
    setOpen(true)
    setActiveIdx(-1)
  }

  function handleClear() {
    setQuery('')
    onChange('')
    setResults([])
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
        <input
          id={id}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => query && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className="input pl-9 pr-8 uppercase"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden max-h-56 overflow-y-auto">
          {results.map((airport, i) => (
            <li key={airport.iata}>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); select(airport) }}
                className={cn(
                  'w-full text-left px-3 py-2.5 text-sm transition-colors flex items-center gap-2',
                  i === activeIdx
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-200 hover:bg-slate-700'
                )}
              >
                <span className="font-mono font-semibold text-xs w-8 flex-shrink-0">
                  {airport.iata}
                </span>
                <span className="truncate text-slate-400 text-xs">
                  {airport.city || airport.name}{airport.country ? `, ${airport.country}` : ''}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
