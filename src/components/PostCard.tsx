import Image from 'next/image'
import Link from 'next/link'
import { formatRelativeTime } from '@/lib/format'
import LikeButton from './LikeButton'
import ShareButton from './ShareButton'

export interface PostWithAuthor {
  id: string
  author_id: string
  content: string | null
  image_urls: string[]
  link_url: string | null
  is_deleted?: boolean
  created_at: string
  author: {
    username: string
    display_name: string | null
    avatar_url: string | null
  } | null
}

interface Props {
  post: PostWithAuthor
  currentUserId: string
  hasLiked: boolean
  likeCount: number | null  // null = not the author, don't show
  commentCount?: number
  linkToDetail?: boolean    // false on the detail page itself
  hasShared?: boolean
}

export default function PostCard({
  post,
  currentUserId,
  hasLiked,
  likeCount,
  commentCount,
  linkToDetail = true,
  hasShared = false,
}: Props) {
  const author = post.author
  const displayName = author?.display_name || author?.username || 'unknown'

  return (
    <article className="border border-border bg-cream">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <Link
          href={`/profile/${author?.username ?? ''}`}
          className="font-mono text-sm font-bold text-ink hover:opacity-60 transition-opacity"
        >
          @{author?.username ?? 'unknown'}
        </Link>
        <time className="font-mono text-xs text-ink-faint" dateTime={post.created_at}>
          {formatRelativeTime(post.created_at)}
        </time>
      </div>

      {/* Body */}
      <div className="px-5 py-4">
        {post.content && (
          <p className="font-mono text-sm text-ink leading-relaxed whitespace-pre-wrap">
            {post.content}
          </p>
        )}

        {/* Images */}
        {post.image_urls.length > 0 && (
          <div
            className={`mt-4 grid gap-1 ${
              post.image_urls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
            }`}
          >
            {post.image_urls.map((url, i) => (
              <div key={i} className="relative aspect-square border border-border overflow-hidden">
                <Image
                  src={url}
                  alt={`Image ${i + 1} by ${displayName}`}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ))}
          </div>
        )}

        {/* Link */}
        {post.link_url && (
          <a
            href={post.link_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 block border border-border px-4 py-3 font-mono text-xs text-ink-muted
                       hover:border-ink hover:text-ink transition-colors break-all"
          >
            ↗ {post.link_url}
          </a>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-border">
        <div className="flex items-center gap-5">
          <LikeButton
            postId={post.id}
            currentUserId={currentUserId}
            initialHasLiked={hasLiked}
            initialCount={likeCount}
          />
          <ShareButton
            postId={post.id}
            currentUserId={currentUserId}
            initialHasShared={hasShared}
          />
        </div>

        {linkToDetail && (
          <Link
            href={`/post/${post.id}`}
            className="font-mono text-xs text-ink-faint tracking-wider uppercase
                       hover:text-ink transition-colors"
          >
            {commentCount !== undefined ? `${commentCount} comment${commentCount !== 1 ? 's' : ''}` : 'Reply'} →
          </Link>
        )}
      </div>
    </article>
  )
}
