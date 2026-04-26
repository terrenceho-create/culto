import Image from 'next/image'
import Link from 'next/link'
import { formatRelativeTime } from '@/lib/format'
import type { PostWithAuthor } from './PostCard'
import LikeButton from './LikeButton'
import ShareButton from './ShareButton'

export type ChainNode = {
  username: string
  type: 'author' | 'share'
  hasComment: boolean
}

export type ShareFeedItem = {
  id: string
  post_id: string
  comment: string | null
  created_at: string
  sharer: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
  }
  post: PostWithAuthor
  chain: ChainNode[]
}

interface Props {
  share: ShareFeedItem
  currentUserId: string
  hasLiked: boolean
  likeCount: number | null
  commentCount: number
  hasShared: boolean
}

export default function ShareCard({
  share,
  currentUserId,
  hasLiked,
  likeCount,
  commentCount,
  hasShared,
}: Props) {
  const { post } = share
  const postAuthor = post.author
  const postDisplayName = postAuthor?.display_name || postAuthor?.username || 'unknown'

  return (
    <article className="border border-border bg-cream">
      {/* Share header */}
      <div className="flex items-center justify-between px-5 py-2 border-b border-border bg-cream">
        <span className="font-mono text-xs text-ink-muted">
          <Link
            href={`/profile/${share.sharer.username}`}
            className="font-bold text-ink hover:opacity-60 transition-opacity"
          >
            @{share.sharer.username}
          </Link>{' '}
          shared this
        </span>
        <time className="font-mono text-xs text-ink-faint" dateTime={share.created_at}>
          {formatRelativeTime(share.created_at)}
        </time>
      </div>

      {/* Sharer's comment */}
      {share.comment && (
        <div className="px-5 py-3 border-b border-border">
          <p className="font-mono text-sm text-ink leading-relaxed whitespace-pre-wrap">
            {share.comment}
          </p>
        </div>
      )}

      {/* Original post (nested) */}
      <div className="mx-5 my-4 border border-border">
        {/* Original post header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border">
          <Link
            href={`/profile/${postAuthor?.username ?? ''}`}
            className="font-mono text-sm font-bold text-ink hover:opacity-60 transition-opacity"
          >
            @{postAuthor?.username ?? 'unknown'}
          </Link>
          <time className="font-mono text-xs text-ink-faint" dateTime={post.created_at}>
            {formatRelativeTime(post.created_at)}
          </time>
        </div>

        {/* Original post body */}
        <div className="px-4 py-3">
          {post.content && (
            <p className="font-mono text-sm text-ink leading-relaxed whitespace-pre-wrap">
              {post.content}
            </p>
          )}

          {post.image_urls.length > 0 && (
            <div
              className={`mt-3 grid gap-1 ${
                post.image_urls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
              }`}
            >
              {post.image_urls.map((url, i) => (
                <div
                  key={i}
                  className="relative aspect-square border border-border overflow-hidden"
                >
                  <Image
                    src={url}
                    alt={`Image ${i + 1} by ${postDisplayName}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ))}
            </div>
          )}

          {post.link_url && (
            <a
              href={post.link_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 block border border-border px-3 py-2 font-mono text-xs
                         text-ink-muted hover:border-ink hover:text-ink transition-colors break-all"
            >
              ↗ {post.link_url}
            </a>
          )}
        </div>
      </div>

      {/* Propagation chain */}
      {share.chain.length > 0 && (
        <div className="px-5 pb-3 flex flex-wrap items-center gap-x-1.5 gap-y-1">
          {share.chain.map((node, i) => (
            <span key={`${node.username}-${i}`} className="flex items-center gap-x-1.5">
              {i > 0 && (
                <span className="font-mono text-xs text-ink-faint">→</span>
              )}
              <span className="font-mono text-xs text-ink-muted">
                <Link
                  href={`/profile/${node.username}`}
                  className="font-bold text-ink hover:opacity-60 transition-opacity"
                >
                  @{node.username}
                </Link>{' '}
                {node.type === 'author' ? 'posted' : 'shared'}
                {node.hasComment && (
                  <span className="text-ink-faint"> ✎</span>
                )}
              </span>
            </span>
          ))}
        </div>
      )}

      {/* Footer: actions */}
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
            sourceShareId={share.id}
            initialHasShared={hasShared}
          />
        </div>

        <Link
          href={`/post/${post.id}`}
          className="font-mono text-xs text-ink-faint tracking-wider uppercase
                     hover:text-ink transition-colors"
        >
          {commentCount} comment{commentCount !== 1 ? 's' : ''} →
        </Link>
      </div>
    </article>
  )
}
