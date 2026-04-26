import { redirect, notFound } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import NavBar from '@/app/feed/NavBar'
import PostCard, { type PostWithAuthor } from '@/components/PostCard'
import ShareCard, { type ShareFeedItem, type ChainNode } from '@/components/ShareCard'
import ProfileActions from './ProfileActions'
import ProfileStatsFollowArea from './ProfileStatsFollowArea'

type ChainShareRow = {
  id: string
  post_id: string
  shared_from: string | null
  comment: string | null
  sharer: { username: string } | null
}

type ShareQueryRow = {
  id: string
  post_id: string
  shared_by: string
  shared_from: string | null
  comment: string | null
  created_at: string
  sharer: { id: string; username: string; display_name: string | null; avatar_url: string | null } | null
  post: PostWithAuthor | null
}

function buildChain(
  shareId: string,
  sharesMap: Map<string, ChainShareRow>,
  originalAuthorUsername: string
): ChainNode[] {
  const nodes: ChainNode[] = []
  let currentId: string | null = shareId

  while (currentId) {
    const s = sharesMap.get(currentId)
    if (!s) break
    nodes.unshift({
      username: s.sharer?.username ?? 'unknown',
      type: 'share',
      hasComment: !!s.comment,
    })
    currentId = s.shared_from
  }

  nodes.unshift({ username: originalAuthorUsername, type: 'author', hasComment: false })
  return nodes
}

interface Props {
  params: { username: string }
}

export default async function ProfilePage({ params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  // Viewer's own profile (for NavBar)
  const { data: viewerProfile } = await (supabase
    .from('users')
    .select('username')
    .eq('id', user.id)
    .single() as unknown as Promise<{ data: { username: string } | null; error: unknown }>)

  // Target profile
  const { data: profile, error: profileError } = await (supabase
    .from('users')
    .select('id, username, display_name, bio, tags, avatar_url, invited_by, show_invited_by, created_at, is_active')
    .eq('username', params.username)
    .single() as unknown as Promise<{
    data: {
      id: string
      username: string
      display_name: string | null
      bio: string | null
      tags: string[]
      avatar_url: string | null
      invited_by: string | null
      show_invited_by: boolean
      created_at: string
      is_active: boolean
    } | null
    error: unknown
  }>)

  if (profileError || !profile) notFound()

  const isOwnProfile = user.id === profile.id

  // Inviter username (only if show_invited_by and has inviter)
  let inviterUsername: string | null = null
  if (profile.show_invited_by && profile.invited_by) {
    const { data: inviter } = await (supabase
      .from('users')
      .select('username')
      .eq('id', profile.invited_by)
      .single() as unknown as Promise<{ data: { username: string } | null; error: unknown }>)
    inviterUsername = inviter?.username ?? null
  }

  // Follower + following counts
  const [{ count: followerCount }, { count: followingCount }] = await Promise.all([
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', profile.id),
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', profile.id),
  ])

  // Is the viewer following this profile?
  let isFollowing = false
  if (!isOwnProfile) {
    const { data: followRow } = await (supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', profile.id)
      .maybeSingle() as unknown as Promise<{ data: { id: string } | null; error: unknown }>)
    isFollowing = !!followRow
  }

  // Posts by this user
  const { data: postsRaw } = await (supabase
    .from('posts')
    .select(`
      id, author_id, content, image_urls, link_url, created_at,
      author:users!author_id ( username, display_name, avatar_url )
    `)
    .eq('author_id', profile.id)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(30) as unknown as Promise<{ data: PostWithAuthor[] | null; error: unknown }>)

  const posts = postsRaw ?? []

  // Shares by this user
  const { data: sharesRaw } = await (supabase
    .from('shares')
    .select(`
      id, post_id, shared_by, shared_from, comment, created_at,
      sharer:users!shared_by ( id, username, display_name, avatar_url ),
      post:posts!post_id (
        id, author_id, content, image_urls, link_url, created_at,
        author:users!author_id ( username, display_name, avatar_url )
      )
    `)
    .eq('shared_by', profile.id)
    .order('created_at', { ascending: false })
    .limit(30) as unknown as Promise<{ data: ShareQueryRow[] | null; error: unknown }>)

  const validShares = (sharesRaw ?? []).filter(
    (s): s is ShareQueryRow & { sharer: NonNullable<ShareQueryRow['sharer']>; post: PostWithAuthor } =>
      s.sharer !== null && s.post !== null && !s.post.is_deleted
  )

  // Fetch all shares for shared post_ids (for chain building)
  const sharedPostIds = Array.from(new Set(validShares.map((s) => s.post_id)))
  const chainSharesMap = new Map<string, ChainShareRow>()

  if (sharedPostIds.length > 0) {
    const { data: chainSharesRaw } = await (supabase
      .from('shares')
      .select(`id, post_id, shared_from, comment, sharer:users!shared_by ( username )`)
      .in('post_id', sharedPostIds) as unknown as Promise<{
      data: ChainShareRow[] | null
      error: unknown
    }>)
    for (const s of chainSharesRaw ?? []) chainSharesMap.set(s.id, s)
  }

  const shareFeedItems: ShareFeedItem[] = validShares.map((s) => ({
    id: s.id,
    post_id: s.post_id,
    comment: s.comment,
    created_at: s.created_at,
    sharer: s.sharer,
    post: s.post,
    chain: buildChain(s.id, chainSharesMap, s.post.author?.username ?? 'unknown'),
  }))

  // Merge posts + shares sorted by created_at
  type ProfileItem =
    | { kind: 'post'; data: PostWithAuthor; key: string; ts: string }
    | { kind: 'share'; data: ShareFeedItem; key: string; ts: string }

  const profileItems: ProfileItem[] = [
    ...posts.map((p) => ({ kind: 'post' as const, data: p, key: p.id, ts: p.created_at })),
    ...shareFeedItems.map((s) => ({ kind: 'share' as const, data: s, key: s.id, ts: s.created_at })),
  ].sort((a, b) => b.ts.localeCompare(a.ts))

  // Likes (RLS-filtered)
  const { data: likesRaw } = await (supabase
    .from('likes')
    .select('post_id, user_id') as unknown as Promise<{
    data: { post_id: string; user_id: string }[] | null
    error: unknown
  }>)
  const likes = likesRaw ?? []

  // Comment counts (posts + share targets)
  const allPostIds = [
    ...posts.map((p) => p.id),
    ...shareFeedItems.map((s) => s.post_id),
  ]
  const uniquePostIds = Array.from(new Set(allPostIds))

  const { data: commentsRaw } = uniquePostIds.length
    ? await (supabase
        .from('comments')
        .select('post_id')
        .in('post_id', uniquePostIds)
        .eq('is_deleted', false) as unknown as Promise<{
        data: { post_id: string }[] | null
        error: unknown
      }>)
    : { data: [] }

  const commentCountMap: Record<string, number> = {}
  for (const c of commentsRaw ?? []) {
    commentCountMap[c.post_id] = (commentCountMap[c.post_id] ?? 0) + 1
  }

  // Viewer's own shares (for hasShared state)
  const { data: mySharesRaw } = await (supabase
    .from('shares')
    .select('post_id')
    .eq('shared_by', user.id) as unknown as Promise<{
    data: { post_id: string }[] | null
    error: unknown
  }>)
  const mySharedPostIds = new Set((mySharesRaw ?? []).map((s) => s.post_id))

  const displayName = profile.display_name || profile.username
  const initials = displayName.slice(0, 2).toUpperCase()
  const joinYear = new Date(profile.created_at).getFullYear()

  return (
    <div className="min-h-screen bg-cream">
      <NavBar username={viewerProfile?.username ?? user.email ?? 'unknown'} />

      <main className="max-w-2xl mx-auto px-6 py-8">
        {/* Profile header card */}
        <div className="border border-border bg-cream mb-px">
          <div className="px-6 py-6">
            <div className="flex items-start gap-5">
              {/* Avatar */}
              <div className="w-20 h-20 border border-border overflow-hidden flex-shrink-0 relative bg-cream">
                {profile.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={`${displayName} avatar`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-mono text-xl font-bold text-ink-faint">
                    {initials}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h1 className="font-mono font-bold text-lg text-ink leading-tight">
                      {displayName}
                    </h1>
                    <p className="font-mono text-sm text-ink-muted">@{profile.username}</p>
                  </div>

                  {/* Edit button — own profile only */}
                  {isOwnProfile && (
                    <ProfileActions
                      userId={user.id}
                      initialData={{
                        display_name: profile.display_name,
                        bio: profile.bio,
                        tags: profile.tags,
                        avatar_url: profile.avatar_url,
                        show_invited_by: profile.show_invited_by,
                        has_inviter: !!profile.invited_by,
                      }}
                    />
                  )}
                </div>

                {/* Stats (+ Follow button for other profiles) */}
                {isOwnProfile ? (
                  <div className="flex gap-5 mt-3">
                    <a
                      href={`/profile/${profile.username}/followers`}
                      className="font-mono text-xs text-ink-muted hover:text-ink transition-colors"
                    >
                      <strong className="text-ink">{followerCount ?? 0}</strong> followers
                    </a>
                    <a
                      href={`/profile/${profile.username}/following`}
                      className="font-mono text-xs text-ink-muted hover:text-ink transition-colors"
                    >
                      <strong className="text-ink">{followingCount ?? 0}</strong> following
                    </a>
                    <span className="font-mono text-xs text-ink-muted">
                      <strong className="text-ink">{profileItems.length}</strong> posts
                    </span>
                  </div>
                ) : (
                  <ProfileStatsFollowArea
                    targetUsername={profile.username}
                    currentUserId={user.id}
                    targetUserId={profile.id}
                    initialIsFollowing={isFollowing}
                    initialFollowerCount={followerCount ?? 0}
                    followingCount={followingCount ?? 0}
                    postCount={profileItems.length}
                  />
                )}
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="mt-4 font-mono text-sm text-ink leading-relaxed whitespace-pre-wrap">
                {profile.bio}
              </p>
            )}

            {/* Tags */}
            {profile.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {profile.tags.map((tag) => (
                  <span
                    key={tag}
                    className="font-mono text-xs border border-border px-2 py-0.5 text-ink-muted"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Invited by + join date */}
            <div className="flex flex-wrap gap-4 mt-4">
              {inviterUsername && (
                <span className="font-mono text-xs text-ink-faint">
                  invited by{' '}
                  <a href={`/profile/${inviterUsername}`} className="culto-link text-ink-muted">
                    @{inviterUsername}
                  </a>
                </span>
              )}
              <span className="font-mono text-xs text-ink-faint">
                joined {joinYear}
              </span>
            </div>
          </div>
        </div>

        {/* Posts + Shares */}
        <div className="mt-6">
          <h2 className="font-mono text-xs text-ink-faint tracking-widest uppercase mb-3">
            Posts
          </h2>

          {profileItems.length === 0 ? (
            <div className="border border-border px-8 py-12 text-center">
              <p className="font-mono text-sm text-ink-faint">No posts yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-px border border-border">
              {profileItems.map((item) => {
                if (item.kind === 'post') {
                  const post = item.data
                  const hasLiked = likes.some(
                    (l) => l.post_id === post.id && l.user_id === user.id
                  )
                  const likeCount =
                    post.author_id === user.id
                      ? likes.filter((l) => l.post_id === post.id).length
                      : null
                  return (
                    <PostCard
                      key={item.key}
                      post={post}
                      currentUserId={user.id}
                      hasLiked={hasLiked}
                      likeCount={likeCount}
                      commentCount={commentCountMap[post.id] ?? 0}
                      hasShared={mySharedPostIds.has(post.id)}
                      linkToDetail
                    />
                  )
                }

                // kind === 'share'
                const share = item.data
                const hasLiked = likes.some(
                  (l) => l.post_id === share.post_id && l.user_id === user.id
                )
                const likeCount =
                  share.post.author_id === user.id
                    ? likes.filter((l) => l.post_id === share.post_id).length
                    : null
                return (
                  <ShareCard
                    key={item.key}
                    share={share}
                    currentUserId={user.id}
                    hasLiked={hasLiked}
                    likeCount={likeCount}
                    commentCount={commentCountMap[share.post_id] ?? 0}
                    hasShared={mySharedPostIds.has(share.post_id)}
                  />
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
