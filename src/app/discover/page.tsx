import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NavBar from '@/app/feed/NavBar'
import SearchForm from './SearchForm'
import UserCard, { type UserResult } from '@/components/UserCard'

interface Props {
  searchParams: { q?: string }
}

export default async function DiscoverPage({ searchParams }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: viewerProfile } = await (supabase
    .from('users')
    .select('username')
    .eq('id', user.id)
    .single() as unknown as Promise<{ data: { username: string } | null; error: unknown }>)

  const query = searchParams.q?.trim() ?? ''

  let results: UserResult[] = []
  let followingIds: string[] = []

  if (query.length >= 1) {
    const { data: found } = await (supabase
      .from('users')
      .select('id, username, display_name, bio, tags, avatar_url')
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
      .eq('is_active', true)
      .neq('id', user.id)
      .order('username')
      .limit(20) as unknown as Promise<{ data: UserResult[] | null; error: unknown }>)

    results = found ?? []

    if (results.length > 0) {
      const { data: follows } = await (supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id)
        .in('following_id', results.map((r) => r.id)) as unknown as Promise<{
        data: { following_id: string }[] | null
        error: unknown
      }>)
      followingIds = (follows ?? []).map((f) => f.following_id)
    }
  }

  const username = viewerProfile?.username ?? user.email ?? 'unknown'

  return (
    <div className="min-h-screen bg-cream">
      <NavBar username={username} />

      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="font-mono font-bold text-2xl text-ink mb-1 tracking-tight">
            Discover
          </h1>
          <p className="font-mono text-xs text-ink-faint">
            Find creators to follow.
          </p>
        </div>

        <SearchForm initialQuery={query} />

        <div className="mt-6">
          {!query && (
            <p className="font-mono text-xs text-ink-faint text-center py-12">
              Type a username above to search.
            </p>
          )}

          {query && results.length === 0 && (
            <div className="border border-border px-6 py-12 text-center">
              <p className="font-mono text-sm text-ink mb-1">No users found.</p>
              <p className="font-mono text-xs text-ink-faint">
                Try a different username.
              </p>
            </div>
          )}

          {results.length > 0 && (
            <div className="border border-border">
              <div className="border-b border-border px-5 py-2">
                <span className="font-mono text-xs text-ink-faint tracking-wider uppercase">
                  {results.length} result{results.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
                </span>
              </div>
              {results.map((u) => (
                <UserCard
                  key={u.id}
                  user={u}
                  currentUserId={user.id}
                  initialIsFollowing={followingIds.includes(u.id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
