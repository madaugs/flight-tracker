interface ImportProgressProps {
  total: number
  done: number
}

export default function ImportProgress({ total, done }: ImportProgressProps) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-400">Importing…</span>
        <span className="text-slate-300 font-medium tabular-nums">{done} / {total}</span>
      </div>
      <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-indigo-600 rounded-full transition-all duration-200"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-slate-500">{pct}% complete</p>
    </div>
  )
}
