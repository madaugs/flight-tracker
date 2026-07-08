export default function MapLegend() {
  return (
    <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
      <div className="flex items-center gap-1.5">
        <svg width="24" height="4"><line x1="0" y1="2" x2="24" y2="2" stroke="#6366f1" strokeWidth="1.5" strokeOpacity="0.6" /></svg>
        1 flight
      </div>
      <div className="flex items-center gap-1.5">
        <svg width="24" height="4"><line x1="0" y1="2" x2="24" y2="2" stroke="#6366f1" strokeWidth="3" strokeOpacity="0.7" /></svg>
        5+ flights
      </div>
      <div className="flex items-center gap-1.5">
        <svg width="24" height="4"><line x1="0" y1="2" x2="24" y2="2" stroke="#a5b4fc" strokeWidth="4.5" strokeOpacity="0.8" /></svg>
        10+ flights
      </div>
    </div>
  )
}
