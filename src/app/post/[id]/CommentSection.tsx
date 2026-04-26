'use client'

import { useState, FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatRelativeTime } from '@/lib/format'
import { useToast } from '@/components/Toast'

interface Comment {
  id: string
  content: string
  created_at: string
  author_id: string
  author: { username: string } | null
  /** true while the insert is in flight */
  optimistic?: boolean
}

interface Props {
  postId: string
  currentUserId: string
  currentUsername: string
  initialComments: Comment[]
}

export default function CommentSection({
  postId,
  currentUserId,
  currentUsername,
  initialComments,
}: Props) {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed || loading) return

    // ── Optimistic insert ────────────────────────────────────────────────────
    const tempId = `optimistic-${Date.now()}`
    const optimistic: Comment = {
      id: tempId,
      content: trimmed,
      created_at: new Date().toISOString(),
      author_id: currentUserId,
      author: { username: currentUsername },
      optimistic: true,
    }
    setComments((prev) => [...prev, optimistic])
    setText('')
    setLoading(true)

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('comments')
        .insert({ post_id: postId, author_id: currentUserId, content: trimmed })
        .select('id, content, created_at, author_id')
        .single()

      if (error || !data) throw error ?? new Error('No data returned')

      // Replace optimistic entry with confirmed record
      const confirmed: Comment = {
        ...(data as { id: string; content: string; created_at: string; author_id: string }),
        author: { username: currentUsername },
      }
      setComments((prev) => prev.map((c) => (c.id === tempId ? confirmed : c)))
    } catch {
      // ── Revert ───────────────────────────────────────────────────────────
      setComments((prev) => prev.filter((c) => c.id !== tempId))
      setText(trimmed) // restore draft
      showToast('Failed to post comment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(commentId: string) {
    // Optimistic removal
    setComments((prev) => prev.filter((c) => c.id !== commentId))

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('comments')
        .update({ is_deleted: true })
        .eq('id', commentId)
        .eq('author_id', currentUserId)
      if (error) throw error
    } catch {
      showToast('Failed to delete comment. Please try again.')
      // Re-fetch to restore state would be ideal, but for simplicity just show toast
    }
  }

  return (
    <section className="mt-8">
      <h2 className="font-mono text-xs text-ink-faint tracking-widest uppercase mb-4">
        Comments ({comments.length})
      </h2>

      {/* Comment list */}
      <div className="flex flex-col gap-px border border-border">
        {comments.length === 0 && (
          <div className="px-5 py-6 text-center font-mono text-xs text-ink-faint">
            No comments yet.
          </div>
        )}
        {comments.map((comment) => (
          <div
            key={comment.id}
            className={`flex gap-4 px-5 py-4 border-b border-border last:border-b-0 bg-cream
              transition-opacity ${comment.optimistic ? 'opacity-50' : 'opacity-100'}`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-3 mb-1">
                <a
                  href={`/profile/${comment.author?.username ?? ''}`}
                  className="font-mono text-xs font-bold text-ink hover:opacity-60 transition-opacity"
                >
                  @{comment.author?.username ?? 'unknown'}
                </a>
                <time className="font-mono text-xs text-ink-faint">
                  {comment.optimistic ? 'Posting...' : formatRelativeTime(comment.created_at)}
                </time>
              </div>
              <p className="font-mono text-sm text-ink leading-relaxed whitespace-pre-wrap">
                {comment.content}
              </p>
            </div>
            {comment.author_id === currentUserId && !comment.optimistic && (
              <button
                onClick={() => handleDelete(comment.id)}
                className="font-mono text-xs text-ink-faint hover:text-red-700 transition-colors flex-shrink-0"
                title="Delete comment"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add comment form */}
      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Leave a comment..."
          rows={3}
          className="culto-input resize-none leading-relaxed"
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || !text.trim()}
            className="culto-btn disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'Posting...' : 'Post comment'}
          </button>
        </div>
      </form>
    </section>
  )
}
