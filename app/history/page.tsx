import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase-server'
import AppShell from '@/components/layout/AppShell'
import FlightList from '@/components/flights/FlightList'

export default async function HistoryPage() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('home_airport')
    .eq('id', user.id)
    .single()

  const homeAirport = profile?.home_airport ?? ''

  return (
    <AppShell>
      <div className="max-w-xl mx-auto">
        <h1 className="text-xl font-bold text-slate-100 mb-4">Flight history</h1>
        <FlightList homeAirport={homeAirport} />
      </div>
    </AppShell>
  )
}
