'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  inviteCode: string
}

export default function RegisterForm({ inviteCode }: Props) {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [ageConfirmed, setAgeConfirmed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (!ageConfirmed) {
      setError('You must confirm you are 18 or older.')
      return
    }

    setLoading(true)

    // Step 1 — Create user via route handler (service role)
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        username: username.toLowerCase(),
        inviteCode,
        ageConfirmed,
      }),
    })

    const json = await res.json()

    if (!res.ok) {
      setError(json.error ?? 'Registration failed.')
      setLoading(false)
      return
    }

    // Step 2 — Sign in (session cookie set by Supabase SSR)
    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError('Account created but sign-in failed. Please go to the login page.')
      setLoading(false)
      return
    }

    router.push('/feed')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Invite code — locked */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-ink-muted tracking-wider uppercase">
          Invite code
        </label>
        <input
          type="text"
          value={inviteCode}
          readOnly
          tabIndex={-1}
          className="culto-input opacity-50 cursor-not-allowed select-none"
        />
      </div>

      {/* Username */}
      <div className="flex flex-col gap-1">
        <label htmlFor="username" className="text-xs text-ink-muted tracking-wider uppercase">
          Username
        </label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="your_handle"
          required
          minLength={3}
          maxLength={20}
          autoComplete="username"
          pattern="[a-z0-9_]+"
          className="culto-input"
        />
        <span className="text-xs text-ink-faint">
          3–20 chars. Letters, numbers, underscores.
        </span>
      </div>

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
          placeholder="Min. 8 characters"
          required
          minLength={8}
          autoComplete="new-password"
          className="culto-input"
        />
      </div>

      {/* Confirm password */}
      <div className="flex flex-col gap-1">
        <label htmlFor="confirmPassword" className="text-xs text-ink-muted tracking-wider uppercase">
          Confirm password
        </label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Repeat password"
          required
          autoComplete="new-password"
          className="culto-input"
        />
      </div>

      {/* Age confirmation */}
      <label className="flex items-start gap-3 cursor-pointer group">
        <div className="relative mt-0.5 flex-shrink-0">
          <input
            type="checkbox"
            checked={ageConfirmed}
            onChange={(e) => setAgeConfirmed(e.target.checked)}
            className="peer sr-only"
          />
          <div className="w-4 h-4 border border-ink bg-cream peer-checked:bg-ink transition-colors" />
          {ageConfirmed && (
            <span className="absolute inset-0 flex items-center justify-center text-cream text-xs font-bold pointer-events-none">
              ✓
            </span>
          )}
        </div>
        <span className="text-xs text-ink leading-relaxed">
          I confirm I am 18 years of age or older. I understand this platform
          may contain artistic content intended for adults.
        </span>
      </label>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-700 font-mono border border-red-300 bg-red-50 px-3 py-2">
          {error}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading || !ageConfirmed}
        className="culto-btn disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? 'Creating account...' : 'Create account'}
      </button>
    </form>
  )
}
