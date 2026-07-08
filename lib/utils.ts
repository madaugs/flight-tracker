import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatDateShort(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

export function daysInYear(year: number): number {
  return isLeapYear(year) ? 366 : 365
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

export function monthName(month: number): string {
  return new Date(2000, month - 1, 1).toLocaleString('en-US', { month: 'short' })
}

export function monthNameFull(month: number): string {
  return new Date(2000, month - 1, 1).toLocaleString('en-US', { month: 'long' })
}

/** Parse a date string in YYYY-MM-DD, MM/DD/YYYY, or M/D/YY format → YYYY-MM-DD */
export function normalizeDate(raw: string): string | null {
  const s = raw.trim()

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s

  // MM/DD/YYYY or M/D/YYYY
  const slashFull = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (slashFull) {
    const [, m, d, y] = slashFull
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }

  // M/D/YY
  const slashShort = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/)
  if (slashShort) {
    const [, m, d, y] = slashShort
    const fullYear = parseInt(y) >= 50 ? `19${y}` : `20${y}`
    return `${fullYear}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }

  return null
}

/** Count unique IATA codes in a set of flights (excluding home airport for "cities visited") */
export function uniqueAirports(origins: string[], destinations: string[]): Set<string> {
  return new Set([...origins, ...destinations])
}

export function pluralize(n: number, singular: string, plural: string): string {
  return n === 1 ? singular : plural
}
