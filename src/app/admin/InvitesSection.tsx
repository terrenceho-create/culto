'use client'

import { useState, useTransition } from 'react'
import { formatRelativeTime } from '@/lib/format'
import { adminCreateInvite } from './actions'

export interface AdminInvite {
  id: string
  code: string
  created_at: string
  used_at: string | null
  creator: { username: string } | null
  redeemer: { username: string } | null
}

export interface AdminUserOption {
  id: string
  username: string
}

interface Props {
  invites: AdminInvite[]
  users: AdminUserOption[]
}

export default function InvitesSection({ invites, users }: Props) {
  const [selectedUserId, setSelectedUserId] = useState(users[0]?.id ?? '')
  const [newCode, setNewCode] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleCreate() {
    if (!selectedUserId) return
    setNewCode(null)
    startTransition(async () => {
      const code = await adminCreateInvite(selectedUserId)
      setNewCode(code)
    })
  }

  const used = invites.filter((i) => i.used_at).length
  const available = invites.filter((i) => !i.used_at).length

  return (
    <section>
      <h2 className="font-mono text-xs text-ink-faint tracking-widest uppercase mb-3">
        Invites — {used} used · {available} available
      </h2>

      {/* Create invite */}
      <div className="border border-border p-4 mb-px flex flex-wrap items-center gap-3">
        <span className="font-mono text-xs text-ink-muted uppercase tracking-wider">
          Create invite for:
        </span>
        <select
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          className="font-mono text-xs border border-border bg-cream text-ink px-2 py-1.5 outline-none focus:border-ink"
        >
          {users.map((u) => (
            <option key={u.id} value={u.id}>@{u.username}</option>
          ))}
        </select>
        <button
          onClick={handleCreate}
          disabled={isPending || !selectedUserId}
          className="culto-btn disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isPending ? 'Generating...' : 'Generate code'}
        </button>
        {newCode && (
          <span className="font-mono text-sm font-bold text-ink border border-ink px-3 py-1">
            {newCode}
          </span>
        )}
      </div>

      {/* Invites table */}
      <div className="border border-border overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-cream">
              {['Code', 'Created by', 'Used by', 'Created', 'Status'].map((h) => (
                <th key={h} className="px-4 py-2 text-left font-mono text-xs text-ink-faint tracking-wider uppercase">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invites.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center font-mono text-xs text-ink-faint">
                  No invites yet.
                </td>
              </tr>
            ) : (
              invites.map((inv) => (
                <tr key={inv.id} className="border-b border-border font-mono text-xs last:border-b-0">
                  <td className="px-4 py-3 font-bold text-ink tracking-wider">{inv.code}</td>
                  <td className="px-4 py-3 text-ink-muted">@{inv.creator?.username ?? '—'}</td>
                  <td className="px-4 py-3 text-ink-muted">
                    {inv.redeemer ? `@${inv.redeemer.username}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-ink-faint whitespace-nowrap">
                    {formatRelativeTime(inv.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 border text-xs ${
                      inv.used_at
                        ? 'border-border text-ink-faint'
                        : 'border-ink text-ink'
                    }`}>
                      {inv.used_at ? 'Used' : 'Available'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
