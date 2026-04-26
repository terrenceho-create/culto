'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError('Invalid email or password.')
      setLoading(false)
      return
    }

    router.push('/feed')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Email */}
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-xs text-ink-muted tracking-wider uppercase">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          autoComplete="email"
          autoFocus
          className="culto-input"
        />
      </div>

      {/* Password */}
      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-xs text-ink-muted tracking-wider uppercase">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          autoComplete="current-password"
          className="culto-input"
        />
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-700 font-mono border border-red-300 bg-red-50 px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="culto-btn disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  )
}
