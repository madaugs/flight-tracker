'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import AppShell from '@/components/layout/AppShell'
import AirportCombobox from '@/components/flights/AirportCombobox'
import { CheckCircle } from 'lucide-react'

export default function SettingsPage() {
  const router = useRouter()
  const [homeAirport, setHomeAirport] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = getSupabase()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/auth/login'); return }
      setUserId(user.id)
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) {
        setHomeAirport(data.home_airport ?? '')
        setDisplayName(data.display_name ?? '')
      }
    })
  }, [router])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) return
    setLoading(true)
    const supabase = getSupabase()
    await supabase.from('profiles').upsert({
      id: userId,
      home_airport: homeAirport.toUpperCase(),
      display_name: displayName.trim() || null,
      updated_at: new Date().toISOString(),
    })
    setLoading(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  async function handleSignOut() {
    const supabase = getSupabase()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <AppShell>
      <div className="max-w-md mx-auto space-y-5">
        <h1 className="text-xl font-bold text-slate-100">Settings</h1>

        <form onSubmit={handleSave} className="card space-y-4">
          <div>
            <label className="label">Home airport</label>
            <p className="text-xs text-slate-500 mb-2">
              Your home airport is used to calculate days out of town automatically.
            </p>
            <AirportCombobox
              value={homeAirport}
              onChange={setHomeAirport}
              placeholder="IATA code"
            />
          </div>

          <div>
            <label className="label" htmlFor="display-name">Display name (optional)</label>
            <input
              id="display-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="input"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
            {saved ? (
              <>
                <CheckCircle className="w-4 h-4" /> Saved!
              </>
            ) : loading ? 'Saving…' : 'Save settings'}
          </button>
        </form>

        <div className="card space-y-3">
          <p className="section-title">Account</p>
          <button onClick={handleSignOut} className="btn-danger w-full text-left">
            Sign out
          </button>
        </div>
      </div>
    </AppShell>
  )
}
