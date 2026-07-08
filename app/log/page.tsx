import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase-server'
import AppShell from '@/components/layout/AppShell'
import FlightForm from '@/components/flights/FlightForm'

export default async function LogPage() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('home_airport')
    .eq('id', user.id)
    .single()

  const homeAirport = profile?.home_airport ?? 'ORD'

  return (
    <AppShell>
      <div className="max-w-xl mx-auto">
        <FlightForm homeAirport={homeAirport} />
      </div>
    </AppShell>
  )
}
