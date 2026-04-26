import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NavBar from '@/app/feed/NavBar'
import PostCard, { type PostWithAuthor } from '@/components/PostCard'
import CommentSection from './CommentSection'

interface Props {
  params: { id: string }
}

export default async function PostDetailPage({ params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  // Fetch profile for NavBar
  const { data: profile } = await (supabase
    .from('users')
    .select('username')
    .eq('id', user.id)
    .single() as unknown as Promise<{ data: { username: string } | null; error: unknown }>)

  // Fetch post + author
  const { data: postRaw, error: postError } = await (supabase
    .from('posts')
    .select(`
      id, author_id, content, image_urls, link_url, created_at,
      author:users!author_id ( username, display_name, avatar_url )
    `)
    .eq('id', params.id)
    .eq('is_deleted', false)
    .single() as unknown as Promise<{ data: PostWithAuthor | null; error: unknown }>)

  if (postError || !postRaw) notFound()

  // Fetch likes (RLS returns: my likes + likes on my posts)
  const { data: likesRaw } = await (supabase
    .from('likes')
    .select('post_id, user_id')
    .eq('post_id', params.id) as unknown as Promise<{
    data: { post_id: string; user_id: string }[] | null
    error: unknown
  }>)

  const likes = likesRaw ?? []
  const hasLiked = likes.some((l) => l.user_id === user.id)
  const likeCount = postRaw.author_id === user.id ? likes.length : null

  // Fetch comments + authors
  const { data: commentsRaw } = await (supabase
    .from('comments')
    .select('id, content, created_at, author_id, author:users!author_id ( username )')
    .eq('post_id', params.id)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true }) as unknown as Promise<{
    data: {
      id: string
      content: string
      created_at: string
      author_id: string
      author: { username: string } | null
    }[] | null
    error: unknown
  }>)

  const comments = commentsRaw ?? []

  return (
    <div className="min-h-screen bg-cream">
      <NavBar username={profile?.username ?? user.email ?? 'unknown'} />

      <main className="max-w-2xl mx-auto px-6 py-8">
        {/* Back */}
        <a
          href="/feed"
          className="font-mono text-xs text-ink-faint tracking-wider uppercase
                     hover:text-ink transition-colors mb-6 inline-block"
        >
          ← Feed
        </a>

        {/* Post */}
        <PostCard
          post={postRaw}
          currentUserId={user.id}
          hasLiked={hasLiked}
          likeCount={likeCount}
          linkToDetail={false}
        />

        {/* Comments */}
        <CommentSection
          postId={params.id}
          currentUserId={user.id}
          currentUsername={profile?.username ?? user.email ?? 'unknown'}
          initialComments={comments}
        />
      </main>
    </div>
  )
}
