'use client'

import { useState, useRef } from 'react'
import Papa from 'papaparse'
import { getAirportMap } from '@/lib/airports'
import { normalizeDate } from '@/lib/utils'
import { Upload, FileDown } from 'lucide-react'
import type { Airport } from '@/types'

export interface ParsedRow {
  date: string
  origin: string
  destination: string
  airline: string
  status: 'valid' | 'warning' | 'error' | 'duplicate'
  errorMsg?: string
  originAirport?: Airport
  destinationAirport?: Airport
}

interface ImportDropzoneProps {
  existingFlights: { flight_date: string; origin: string; destination: string }[]
  onParsed: (rows: ParsedRow[]) => void
}

const SAMPLE_CSV = `date,origin,destination,airline
2025-01-08,ORD,LAX,AA
2025-01-12,LAX,ORD,AA
2025-02-14,ORD,JFK,DL
2025-02-17,JFK,ORD,DL`

export default function ImportDropzone({ existingFlights, onParsed }: ImportDropzoneProps) {
  const [dragging, setDragging] = useState(false)
  const [text, setText] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function parseCSV(raw: string) {
    const airportMap = await getAirportMap()
    const existingSet = new Set(
      existingFlights.map((f) => `${f.flight_date}|${f.origin}|${f.destination}`)
    )

    const result = Papa.parse<Record<string, string>>(raw.trim(), {
      header: true,
      skipEmptyLines: true,
    })

    const rows: ParsedRow[] = result.data.map((row) => {
      const rawDate = (row.date || row.Date || '').trim()
      const rawOrigin = (row.origin || row.Origin || '').trim().toUpperCase()
      const rawDest = (row.destination || row.Destination || '').trim().toUpperCase()
      const rawAirline = (row.airline || row.Airline || '').trim().toUpperCase()

      const date = normalizeDate(rawDate)
      if (!date) {
        return { date: rawDate, origin: rawOrigin, destination: rawDest, airline: rawAirline, status: 'error', errorMsg: 'Invalid date' }
      }
      if (!rawOrigin || !rawDest) {
        return { date, origin: rawOrigin, destination: rawDest, airline: rawAirline, status: 'error', errorMsg: 'Missing origin or destination' }
      }

      const originAirport = airportMap.get(rawOrigin)
      const destAirport = airportMap.get(rawDest)

      const isDuplicate = existingSet.has(`${date}|${rawOrigin}|${rawDest}`)
      if (isDuplicate) {
        return { date, origin: rawOrigin, destination: rawDest, airline: rawAirline, status: 'duplicate', originAirport, destinationAirport: destAirport }
      }

      const hasWarning = !originAirport || !destAirport
      return {
        date,
        origin: rawOrigin,
        destination: rawDest,
        airline: rawAirline,
        status: hasWarning ? 'warning' : 'valid',
        errorMsg: hasWarning ? `Unknown airport: ${!originAirport ? rawOrigin : rawDest}` : undefined,
        originAirport,
        destinationAirport: destAirport,
      }
    })

    onParsed(rows)
  }

  function handleTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const v = e.target.value
    setText(v)
    if (v.trim()) parseCSV(v)
  }

  function handleFile(file: File) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setText(content)
      parseCSV(content)
    }
    reader.readAsText(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function downloadSample() {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'flights-template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">
            CSV format: <code className="text-xs bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">date, origin, destination, airline</code>
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Airline is optional. Dates: YYYY-MM-DD, MM/DD/YYYY, or M/D/YY</p>
        </div>
        <button onClick={downloadSample} className="btn-ghost flex items-center gap-1.5 text-xs">
          <FileDown className="w-3.5 h-3.5" />
          Template
        </button>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-4 transition-colors ${
          dragging ? 'border-indigo-500 bg-indigo-950/20' : 'border-slate-700 hover:border-slate-600'
        }`}
      >
        <textarea
          value={text}
          onChange={handleTextChange}
          placeholder={`Paste CSV here or drag a file…\n\ndate,origin,destination,airline\n2025-01-08,ORD,LAX,AA`}
          className="w-full bg-transparent text-sm text-slate-300 placeholder-slate-600 resize-none focus:outline-none font-mono"
          rows={6}
        />
        <div className="flex items-center justify-center mt-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            Or choose a file
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.txt"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          />
        </div>
      </div>
    </div>
  )
}
