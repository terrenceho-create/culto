import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import UsersTable, { type AdminUser } from './UsersTable'
import PostsTable, { type AdminPost } from './PostsTable'
import InvitesSection, { type AdminInvite, type AdminUserOption } from './InvitesSection'

export default async function AdminPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const admin = createAdminClient()

  // Fetch all users from DB
  const { data: dbUsers } = await (admin
    .from('users')
    .select('id, username, display_name, is_admin, is_active, invite_quota, created_at')
    .order('created_at', { ascending: false }) as unknown as Promise<{
    data: Omit<AdminUser, 'email'>[] | null
    error: unknown
  }>)

  // Fetch emails from Supabase Auth
  const { data: { users: authUsers } } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const emailMap: Record<string, string> = {}
  for (const au of authUsers) {
    emailMap[au.id] = au.email ?? ''
  }

  const users: AdminUser[] = (dbUsers ?? []).map((u) => ({
    ...u,
    email: emailMap[u.id] ?? '',
  }))

  // Fetch recent posts (not deleted)
  const { data: postsRaw } = await (admin
    .from('posts')
    .select('id, content, image_urls, link_url, created_at, author:users!author_id ( username )')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(30) as unknown as Promise<{ data: AdminPost[] | null; error: unknown }>)

  const posts = postsRaw ?? []

  // Fetch all invites with creator + redeemer usernames
  const { data: invitesRaw } = await (admin
    .from('invites')
    .select(`
      id, code, created_at, used_at,
      creator:users!created_by ( username ),
      redeemer:users!used_by ( username )
    `)
    .order('created_at', { ascending: false })
    .limit(50) as unknown as Promise<{ data: AdminInvite[] | null; error: unknown }>)

  const invites = invitesRaw ?? []

  // Stats
  const activeUsers = users.filter((u) => u.is_active).length
  const usedInvites = invites.filter((i) => i.used_at).length
  const availableInvites = invites.filter((i) => !i.used_at).length

  const userOptions: AdminUserOption[] = users.map((u) => ({ id: u.id, username: u.username }))

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="border-b border-border bg-cream sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/feed" className="font-mono font-bold text-sm tracking-widest text-ink hover:opacity-60 transition-opacity">
              CULTO
            </a>
            <span className="font-mono text-xs text-ink-faint tracking-widest uppercase border border-border px-2 py-0.5">
              Admin
            </span>
          </div>
          <a href="/feed" className="font-mono text-xs text-ink-faint hover:text-ink transition-colors">
            ← Back to feed
          </a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 flex flex-col gap-10">
        {/* Stats bar */}
        <div className="border border-border flex divide-x divide-border">
          {[
            { label: 'Total users', value: users.length },
            { label: 'Active users', value: activeUsers },
            { label: 'Total posts', value: posts.length },
            { label: 'Invites used', value: usedInvites },
            { label: 'Invites available', value: availableInvites },
          ].map(({ label, value }) => (
            <div key={label} className="flex-1 px-5 py-4 text-center">
              <div className="font-mono text-2xl font-bold text-ink">{value}</div>
              <div className="font-mono text-xs text-ink-faint tracking-wider uppercase mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        <UsersTable users={users} currentUserId={user!.id} />
        <PostsTable posts={posts} />
        <InvitesSection invites={invites} users={userOptions} />
      </main>
    </div>
  )
}
