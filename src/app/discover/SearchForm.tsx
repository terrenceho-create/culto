'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  initialQuery: string
}

export default function SearchForm({ initialQuery }: Props) {
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (q) {
      router.push(`/discover?q=${encodeURIComponent(q)}`)
    } else {
      router.push('/discover')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-0 border border-ink">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by username..."
        autoFocus
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        className="flex-1 bg-cream font-mono text-sm text-ink px-4 py-3
                   outline-none placeholder:text-ink-faint"
      />
      <button
        type="submit"
        className="bg-ink text-cream font-mono text-xs font-bold tracking-widest
                   uppercase px-5 py-3 hover:bg-ink-muted transition-colors whitespace-nowrap"
      >
        Search
      </button>
    </form>
  )
}
