import type { ParsedRow } from './ImportDropzone'
import { CheckCircle, AlertCircle, XCircle, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImportPreviewTableProps {
  rows: ParsedRow[]
}

const statusIcon = {
  valid: <CheckCircle className="w-4 h-4 text-green-400" />,
  warning: <AlertCircle className="w-4 h-4 text-yellow-400" />,
  error: <XCircle className="w-4 h-4 text-red-400" />,
  duplicate: <Copy className="w-4 h-4 text-slate-500" />,
}

const statusBg = {
  valid: '',
  warning: 'bg-yellow-950/20',
  error: 'bg-red-950/20',
  duplicate: 'opacity-50',
}

export default function ImportPreviewTable({ rows }: ImportPreviewTableProps) {
  const counts = {
    valid: rows.filter((r) => r.status === 'valid').length,
    warning: rows.filter((r) => r.status === 'warning').length,
    error: rows.filter((r) => r.status === 'error').length,
    duplicate: rows.filter((r) => r.status === 'duplicate').length,
  }

  return (
    <div className="space-y-3">
      {/* Summary bar */}
      <div className="flex flex-wrap gap-3 text-xs">
        <span className="flex items-center gap-1 text-green-400">
          <CheckCircle className="w-3.5 h-3.5" /> {counts.valid} valid
        </span>
        {counts.warning > 0 && (
          <span className="flex items-center gap-1 text-yellow-400">
            <AlertCircle className="w-3.5 h-3.5" /> {counts.warning} warnings
          </span>
        )}
        {counts.error > 0 && (
          <span className="flex items-center gap-1 text-red-400">
            <XCircle className="w-3.5 h-3.5" /> {counts.error} errors
          </span>
        )}
        {counts.duplicate > 0 && (
          <span className="flex items-center gap-1 text-slate-500">
            <Copy className="w-3.5 h-3.5" /> {counts.duplicate} already exist
          </span>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left text-xs text-slate-500 font-medium px-4 py-2.5 w-8"></th>
              <th className="text-left text-xs text-slate-500 font-medium px-3 py-2.5">Date</th>
              <th className="text-left text-xs text-slate-500 font-medium px-3 py-2.5">From</th>
              <th className="text-left text-xs text-slate-500 font-medium px-3 py-2.5">To</th>
              <th className="text-left text-xs text-slate-500 font-medium px-3 py-2.5">Airline</th>
              <th className="text-left text-xs text-slate-500 font-medium px-3 py-2.5">Note</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={cn('border-b border-slate-800/50 last:border-0', statusBg[row.status])}>
                <td className="px-4 py-2">{statusIcon[row.status]}</td>
                <td className="px-3 py-2 font-mono text-xs text-slate-300">{row.date}</td>
                <td className="px-3 py-2 font-mono text-xs font-semibold text-slate-200">{row.origin}</td>
                <td className="px-3 py-2 font-mono text-xs font-semibold text-slate-200">{row.destination}</td>
                <td className="px-3 py-2 text-xs text-slate-400">{row.airline || '—'}</td>
                <td className="px-3 py-2 text-xs text-slate-500">{row.errorMsg || (row.status === 'duplicate' ? 'already logged' : '')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
