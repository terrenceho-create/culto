'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  username: string
}

export default function NavBar({ username }: Props) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <header className="border-b border-border bg-cream sticky top-0 z-10">
      <div className="max-w-2xl mx-auto px-4 md:px-6">

        {/* ── Mobile: two-row layout ──────────────────────────────────────── */}
        <div className="md:hidden">
          {/* Row 1: logo + @username */}
          <div className="flex items-center justify-between py-3 border-b border-border/40">
            <a
              href="/"
              className="font-mono font-bold text-sm tracking-widest text-ink hover:opacity-60 transition-opacity"
            >
              CULTO
            </a>
            <a
              href={`/profile/${username}`}
              className="text-xs text-ink-muted font-mono hover:text-ink transition-colors"
            >
              @{username}
            </a>
          </div>
          {/* Row 2: nav actions evenly spread */}
          <div className="flex items-center justify-between py-2.5">
            <a
              href="/discover"
              className="text-xs text-ink-muted font-mono tracking-wider uppercase hover:text-ink transition-colors"
            >
              Discover
            </a>
            <a
              href="/post/new"
              className="font-mono text-xs font-bold tracking-wider uppercase border border-ink
                         px-3 py-1 text-ink hover:bg-ink hover:text-cream transition-colors"
            >
              + New
            </a>
            <button
              onClick={handleLogout}
              className="text-xs text-ink-faint font-mono tracking-wider uppercase hover:text-ink transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* ── Desktop: single-row layout (unchanged) ─────────────────────── */}
        <div className="hidden md:flex items-center justify-between py-4">
          <a
            href="/"
            className="font-mono font-bold text-sm tracking-widest text-ink hover:opacity-60 transition-opacity"
          >
            CULTO
          </a>
          <div className="flex items-center gap-5">
            <a
              href="/discover"
              className="text-xs text-ink-muted font-mono tracking-wider uppercase hover:text-ink transition-colors"
            >
              Discover
            </a>
            <a
              href="/post/new"
              className="font-mono text-xs font-bold tracking-wider uppercase border border-ink
                         px-3 py-1 text-ink hover:bg-ink hover:text-cream transition-colors"
            >
              + New post
            </a>
            <a
              href={`/profile/${username}`}
              className="text-xs text-ink-muted font-mono hover:text-ink transition-colors"
            >
              @{username}
            </a>
            <button
              onClick={handleLogout}
              className="text-xs text-ink-faint font-mono tracking-wider uppercase
                         hover:text-ink transition-colors border-b border-transparent
                         hover:border-ink"
            >
              Sign out
            </button>
          </div>
        </div>

      </div>
    </header>
  )
}
