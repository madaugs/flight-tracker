'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Plus,
  Globe2,
  BarChart3,
  TrendingUp,
  Upload,
  Settings,
  Plane,
  LogOut,
  Share2,
  History,
  Inbox,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { getSupabase } from '@/lib/supabase'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { href: '/log', label: 'Log a Flight', Icon: Plus },
  { href: '/review', label: 'Review', Icon: Inbox, badge: 'pending' as const },
  { href: '/history', label: 'History', Icon: History },
  { href: '/monthly', label: 'Monthly', Icon: BarChart3 },
  { href: '/years', label: 'Year Stats', Icon: TrendingUp },
  { href: '/map', label: 'Route Map', Icon: Globe2 },
]

const secondaryItems = [
  { href: '/share', label: 'Share', Icon: Share2 },
  { href: '/import', label: 'Import', Icon: Upload },
  { href: '/settings', label: 'Settings', Icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const pendingCount = usePendingCount()

  async function handleSignOut() {
    const supabase = getSupabase()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <aside className="hidden md:flex flex-col w-56 min-h-screen bg-slate-950 border-r border-slate-800 p-4">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-3 py-2 mb-6">
        <div className="w-8 h-8 bg-indigo-900/60 rounded-lg flex items-center justify-center">
          <Plane className="w-4 h-4 text-indigo-400" />
        </div>
        <span className="font-semibold text-slate-200 text-sm">Flight Tracker</span>
      </div>

      {/* Primary nav */}
      <nav className="flex-1 space-y-0.5">
        {navItems.map(({ href, label, Icon, badge }) => (
          <Link
            key={href}
            href={href}
            className={isActive(href) ? 'nav-item-active' : 'nav-item'}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
            {badge === 'pending' && pendingCount > 0 && (
              <span className="ml-auto badge-indigo">{pendingCount}</span>
            )}
          </Link>
        ))}
      </nav>

      {/* Secondary nav */}
      <div className="divider pt-4 mt-4 space-y-0.5">
        {secondaryItems.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            className={isActive(href) ? 'nav-item-active' : 'nav-item'}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </Link>
        ))}
        <button
          onClick={handleSignOut}
          className="nav-item w-full text-left text-red-500/70 hover:text-red-400 hover:bg-red-950/30"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  )
}

/** Count of inbox-detected flights still waiting on a yes/no. */
function usePendingCount(): number {
  const { data = 0 } = useQuery({
    queryKey: ['pending-flights', 'count'],
    queryFn: async () => {
      const supabase = getSupabase()
      const { count, error } = await supabase
        .from('pending_flights')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
      if (error) throw error
      return count ?? 0
    },
  })
  return data
}
