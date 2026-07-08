'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Plus, Plane } from 'lucide-react'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/log': 'Log Flight',
  '/monthly': 'Monthly',
  '/years': 'Year Stats',
  '/map': 'Route Map',
  '/import': 'Import',
  '/settings': 'Settings',
}

export default function TopBar() {
  const pathname = usePathname()
  const router = useRouter()
  const title = pageTitles[pathname] ?? 'Flight Tracker'
  const showAdd = pathname !== '/log'

  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur border-b border-slate-800 md:hidden">
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-indigo-900/60 rounded-md flex items-center justify-center">
            <Plane className="w-3 h-3 text-indigo-400" />
          </div>
          <h1 className="font-semibold text-slate-200 text-base">{title}</h1>
        </div>
        {showAdd && (
          <button
            onClick={() => router.push('/log')}
            className="w-8 h-8 bg-indigo-600 hover:bg-indigo-500 rounded-lg flex items-center justify-center transition-colors"
          >
            <Plus className="w-4 h-4 text-white" />
          </button>
        )}
      </div>
    </header>
  )
}
