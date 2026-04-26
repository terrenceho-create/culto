import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NavBar from '@/app/feed/NavBar'
import UserCard, { type UserResult } from '@/components/UserCard'

interface Props {
  params: { username: string }
}

export default async function FollowersPage({ params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: viewerProfile } = await (supabase
    .from('users')
    .select('username')
    .eq('id', user.id)
    .single() as unknown as Promise<{ data: { username: string } | null; error: unknown }>)

  // Resolve target username → id
  const { data: target } = await (supabase
    .from('users')
    .select('id, username')
    .eq('username', params.username)
    .single() as unknown as Promise<{ data: { id: string; username: string } | null; error: unknown }>)

  if (!target) notFound()

  // Followers: users who follow target
  const { data: followRows } = await (supabase
    .from('follows')
    .select('follower:users!follower_id ( id, username, display_name, bio, tags, avatar_url )')
    .eq('following_id', target.id) as unknown as Promise<{
    data: { follower: UserResult }[] | null
    error: unknown
  }>)

  const followers: UserResult[] = (followRows ?? []).map((r) => r.follower)

  // Which of these does the viewer follow?
  const { data: viewerFollows } = await (supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', user.id)
    .in('following_id', followers.map((f) => f.id)) as unknown as Promise<{
    data: { following_id: string }[] | null
    error: unknown
  }>)

  const viewerFollowingIds = new Set((viewerFollows ?? []).map((f) => f.following_id))
  const username = viewerProfile?.username ?? user.email ?? 'unknown'

  return (
    <div className="min-h-screen bg-cream">
      <NavBar username={username} />

      <main className="max-w-2xl mx-auto px-6 py-8">
        <a
          href={`/profile/${target.username}`}
          className="font-mono text-xs text-ink-faint tracking-wider uppercase
                     hover:text-ink transition-colors mb-6 inline-block"
        >
          ← @{target.username}
        </a>

        <h1 className="font-mono font-bold text-xl text-ink mb-6 tracking-tight">
          Followers ({followers.length})
        </h1>

        {followers.length === 0 ? (
          <div className="border border-border px-6 py-12 text-center">
            <p className="font-mono text-sm text-ink-faint">No followers yet.</p>
          </div>
        ) : (
          <div className="border border-border">
            {followers.map((u) => (
              <UserCard
                key={u.id}
                user={u}
                currentUserId={user.id}
                initialIsFollowing={viewerFollowingIds.has(u.id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
