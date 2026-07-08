'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Plus, Globe2, BarChart3, TrendingUp, History } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { href: '/dashboard', label: 'Home', Icon: LayoutDashboard },
  { href: '/history', label: 'History', Icon: History },
  { href: '/log', label: 'Log', Icon: Plus, primary: true },
  { href: '/monthly', label: 'Monthly', Icon: BarChart3 },
  { href: '/map', label: 'Map', Icon: Globe2 },
  { href: '/years', label: 'Years', Icon: TrendingUp },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950 border-t border-slate-800 md:hidden">
      <div className="flex items-center justify-around px-2 pb-safe">
        {tabs.map(({ href, label, Icon, primary }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-1 py-3 px-3 rounded-xl transition-colors min-w-0',
                primary
                  ? 'bg-indigo-600 text-white px-4 -mt-3 shadow-lg shadow-indigo-900/50 rounded-2xl'
                  : active
                  ? 'text-indigo-400'
                  : 'text-slate-500 hover:text-slate-300'
              )}
            >
              <Icon className={cn('flex-shrink-0', primary ? 'w-5 h-5' : 'w-5 h-5')} />
              {!primary && (
                <span className="text-[10px] font-medium truncate">{label}</span>
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
