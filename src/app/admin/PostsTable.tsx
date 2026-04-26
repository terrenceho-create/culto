'use client'

import { useTransition } from 'react'
import { formatRelativeTime } from '@/lib/format'
import { adminDeletePost } from './actions'

export interface AdminPost {
  id: string
  content: string | null
  image_urls: string[]
  link_url: string | null
  created_at: string
  author: { username: string } | null
}

function PostRow({ post }: { post: AdminPost }) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm(`Delete this post by @${post.author?.username}?`)) return
    startTransition(() => adminDeletePost(post.id))
  }

  const preview = post.content
    ? post.content.slice(0, 80) + (post.content.length > 80 ? '…' : '')
    : post.image_urls.length > 0
    ? `[${post.image_urls.length} image(s)]`
    : post.link_url
    ? `↗ ${post.link_url.slice(0, 60)}`
    : '—'

  return (
    <tr className={`border-b border-border font-mono text-xs ${isPending ? 'opacity-40' : ''}`}>
      <td className="px-4 py-3 font-bold text-ink">@{post.author?.username ?? '—'}</td>
      <td className="px-4 py-3 text-ink-muted max-w-xs truncate">{preview}</td>
      <td className="px-4 py-3 text-ink-faint whitespace-nowrap">
        {formatRelativeTime(post.created_at)}
      </td>
      <td className="px-4 py-3">
        <a
          href={`/post/${post.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-ink-faint hover:text-ink transition-colors uppercase tracking-wider mr-4"
        >
          View
        </a>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="text-red-700 hover:text-red-900 transition-colors uppercase tracking-wider disabled:opacity-40"
        >
          Delete
        </button>
      </td>
    </tr>
  )
}

export default function PostsTable({ posts }: { posts: AdminPost[] }) {
  return (
    <section>
      <h2 className="font-mono text-xs text-ink-faint tracking-widest uppercase mb-3">
        Recent Posts ({posts.length})
      </h2>
      <div className="border border-border overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-cream">
              {['Author', 'Preview', 'Date', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-2 text-left font-mono text-xs text-ink-faint tracking-wider uppercase">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {posts.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center font-mono text-xs text-ink-faint">
                  No posts yet.
                </td>
              </tr>
            ) : (
              posts.map((p) => <PostRow key={p.id} post={p} />)
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
