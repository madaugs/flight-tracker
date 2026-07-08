'use client'

import { useState } from 'react'
import { getSupabase } from '@/lib/supabase'
import { Plane } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = getSupabase()
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (authError) {
      setError(authError.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-900/50 rounded-2xl mb-4">
            <Plane className="w-7 h-7 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Flight Tracker</h1>
          <p className="text-slate-500 mt-1 text-sm">Your personal travel log</p>
        </div>

        {sent ? (
          <div className="card text-center py-8">
            <div className="text-4xl mb-3">✉️</div>
            <h2 className="text-lg font-semibold text-slate-200 mb-2">Check your email</h2>
            <p className="text-slate-400 text-sm">
              We sent a magic link to <span className="text-indigo-400">{email}</span>.
              Click it to sign in.
            </p>
            <button
              onClick={() => setSent(false)}
              className="mt-6 text-sm text-slate-500 hover:text-slate-300 transition-colors"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card space-y-4">
            <div>
              <label className="label" htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-900/20 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !email}
              className="btn-primary w-full"
            >
              {loading ? 'Sending…' : 'Send magic link'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
