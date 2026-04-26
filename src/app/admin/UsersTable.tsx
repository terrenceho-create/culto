'use client'

import { useState, useTransition } from 'react'
import { adminToggleUserActive, adminSetInviteQuota, adminToggleUserAdmin } from './actions'

export interface AdminUser {
  id: string
  username: string
  display_name: string | null
  is_admin: boolean
  is_active: boolean
  invite_quota: number
  created_at: string
  email: string
}

interface Props {
  users: AdminUser[]
  currentUserId: string
}

function UserRow({ user, currentUserId }: { user: AdminUser; currentUserId: string }) {
  const [isPending, startTransition] = useTransition()
  const [quota, setQuota] = useState(String(user.invite_quota))
  const isSelf = user.id === currentUserId

  function toggleActive() {
    if (isSelf) return
    startTransition(() => adminToggleUserActive(user.id, !user.is_active))
  }

  function applyQuota() {
    const n = parseInt(quota, 10)
    if (isNaN(n) || n < 0) return
    startTransition(() => adminSetInviteQuota(user.id, n))
  }

  function toggleAdmin() {
    if (isSelf) return
    if (!confirm(`${user.is_admin ? 'Remove' : 'Grant'} admin for @${user.username}?`)) return
    startTransition(() => adminToggleUserAdmin(user.id, !user.is_admin))
  }

  return (
    <tr className={`border-b border-border font-mono text-xs ${isPending ? 'opacity-40' : ''}`}>
      <td className="px-4 py-3 text-ink font-bold">@{user.username}</td>
      <td className="px-4 py-3 text-ink-muted truncate max-w-[160px]">{user.email}</td>
      <td className="px-4 py-3">
        <span className={`px-2 py-0.5 border text-xs ${user.is_active ? 'border-ink text-ink' : 'border-border text-ink-faint'}`}>
          {user.is_active ? 'Active' : 'Suspended'}
        </span>
      </td>
      <td className="px-4 py-3">
        {user.is_admin && <span className="text-ink font-bold">Admin</span>}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <input
            type="number"
            min={0}
            max={99}
            value={quota}
            onChange={(e) => setQuota(e.target.value)}
            className="w-12 border border-border bg-cream text-ink px-1 py-0.5 font-mono text-xs text-center outline-none focus:border-ink"
          />
          <button
            onClick={applyQuota}
            disabled={isPending}
            className="border border-border px-2 py-0.5 text-ink-faint hover:text-ink hover:border-ink transition-colors disabled:opacity-40"
          >
            Set
          </button>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-3">
          {!isSelf && (
            <>
              <button
                onClick={toggleActive}
                disabled={isPending}
                className="text-ink-faint hover:text-ink transition-colors disabled:opacity-40 uppercase tracking-wider"
              >
                {user.is_active ? 'Suspend' : 'Activate'}
              </button>
              <button
                onClick={toggleAdmin}
                disabled={isPending}
                className="text-ink-faint hover:text-ink transition-colors disabled:opacity-40 uppercase tracking-wider"
              >
                {user.is_admin ? '− Admin' : '+ Admin'}
              </button>
            </>
          )}
          {isSelf && <span className="text-ink-faint italic">you</span>}
        </div>
      </td>
    </tr>
  )
}

export default function UsersTable({ users, currentUserId }: Props) {
  return (
    <section>
      <h2 className="font-mono text-xs text-ink-faint tracking-widest uppercase mb-3">
        Users ({users.length})
      </h2>
      <div className="border border-border overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-cream">
              {['Username', 'Email', 'Status', 'Role', 'Invite quota', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-2 text-left font-mono text-xs text-ink-faint tracking-wider uppercase">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <UserRow key={u.id} user={u} currentUserId={currentUserId} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
