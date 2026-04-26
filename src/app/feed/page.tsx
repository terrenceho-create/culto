import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NavBar from './NavBar'
import PostCard, { type PostWithAuthor } from '@/components/PostCard'
import ShareCard, { type ShareFeedItem, type ChainNode } from '@/components/ShareCard'

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

export default async function FeedPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: profile } = await (supabase
    .from('users')
    .select('username, is_active')
    .eq('id', user.id)
    .single() as unknown as Promise<{ data: { username: string; is_active: boolean } | null; error: unknown }>)

  if (profile && !profile.is_active) {
    await supabase.auth.signOut()
    redirect('/?error=account_suspended')
  }

  const username = profile?.username ?? user.email ?? 'unknown'

  // IDs to include in feed: self + followed users
  const { data: followsRaw } = await (supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', user.id) as unknown as Promise<{
    data: { following_id: string }[] | null
    error: unknown
  }>)

  const followingIds = (followsRaw ?? []).map((f) => f.following_id)
  const feedUserIds = [user.id, ...followingIds]

  // ── Fetch posts ──────────────────────────────────────────────────────────────
  const { data: postsRaw } = await (supabase
    .from('posts')
    .select(`
      id, author_id, content, image_urls, link_url, created_at,
      author:users!author_id ( username, display_name, avatar_url )
    `)
    .in('author_id', feedUserIds)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(50) as unknown as Promise<{ data: PostWithAuthor[] | null; error: unknown }>)

  const posts = postsRaw ?? []

  // ── Fetch shares ─────────────────────────────────────────────────────────────
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
    .in('shared_by', feedUserIds)
    .order('created_at', { ascending: false })
    .limit(50) as unknown as Promise<{ data: ShareQueryRow[] | null; error: unknown }>)

  const validShares = (sharesRaw ?? []).filter(
    (s): s is ShareQueryRow & { sharer: NonNullable<ShareQueryRow['sharer']>; post: PostWithAuthor } =>
      s.sharer !== null && s.post !== null && !s.post.is_deleted
  )

  // Fetch all shares for the posts we got (needed to reconstruct chains)
  const sharedPostIds = Array.from(new Set(validShares.map((s) => s.post_id)))
  let chainSharesMap = new Map<string, ChainShareRow>()

  if (sharedPostIds.length > 0) {
    const { data: chainSharesRaw } = await (supabase
      .from('shares')
      .select(`
        id, post_id, shared_from, comment,
        sharer:users!shared_by ( username )
      `)
      .in('post_id', sharedPostIds) as unknown as Promise<{
      data: ChainShareRow[] | null
      error: unknown
    }>)

    for (const s of chainSharesRaw ?? []) {
      chainSharesMap.set(s.id, s)
    }
  }

  // Build ShareFeedItems with chains
  const shareFeedItems: ShareFeedItem[] = validShares.map((s) => ({
    id: s.id,
    post_id: s.post_id,
    comment: s.comment,
    created_at: s.created_at,
    sharer: s.sharer,
    post: s.post,
    chain: buildChain(s.id, chainSharesMap, s.post.author?.username ?? 'unknown'),
  }))

  // ── Merge + sort ─────────────────────────────────────────────────────────────
  type FeedItem =
    | { kind: 'post'; data: PostWithAuthor; key: string; ts: string }
    | { kind: 'share'; data: ShareFeedItem; key: string; ts: string }

  const feedItems: FeedItem[] = [
    ...posts.map((p) => ({ kind: 'post' as const, data: p, key: p.id, ts: p.created_at })),
    ...shareFeedItems.map((s) => ({ kind: 'share' as const, data: s, key: s.id, ts: s.created_at })),
  ].sort((a, b) => b.ts.localeCompare(a.ts)).slice(0, 60)

  // ── Likes (RLS: my likes + likes on posts I authored) ────────────────────────
  const { data: likesRaw } = await (supabase
    .from('likes')
    .select('post_id, user_id') as unknown as Promise<{
    data: { post_id: string; user_id: string }[] | null
    error: unknown
  }>)
  const likes = likesRaw ?? []

  // ── Comment counts ───────────────────────────────────────────────────────────
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

  // ── My shares (to show initialHasShared state) ───────────────────────────────
  const { data: mySharesRaw } = await (supabase
    .from('shares')
    .select('post_id')
    .eq('shared_by', user.id) as unknown as Promise<{
    data: { post_id: string }[] | null
    error: unknown
  }>)
  const mySharedPostIds = new Set((mySharesRaw ?? []).map((s) => s.post_id))

  return (
    <div className="min-h-screen bg-cream">
      <NavBar username={username} />

      <main className="max-w-2xl mx-auto px-6 py-8">
        {feedItems.length === 0 ? (
          <div className="border border-border px-8 py-16 text-center">
            <p className="font-mono text-sm text-ink mb-1">No posts yet.</p>
            <p className="font-mono text-sm text-ink-faint">
              Follow someone to see their posts here.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-px border border-border">
            {feedItems.map((item) => {
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
      </main>
    </div>
  )
}
