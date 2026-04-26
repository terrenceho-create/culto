'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from './Toast'

interface Props {
  postId: string
  currentUserId: string
  initialHasLiked: boolean
  initialCount: number | null // null = not the author, don't show count
}

export default function LikeButton({
  postId,
  currentUserId,
  initialHasLiked,
  initialCount,
}: Props) {
  const [hasLiked, setHasLiked] = useState(initialHasLiked)
  const [count, setCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()

  async function toggle() {
    if (loading) return

    // ── Optimistic update ────────────────────────────────────────────────────
    const prevLiked = hasLiked
    const prevCount = count
    setHasLiked(!prevLiked)
    if (count !== null) setCount((c) => (prevLiked ? (c ?? 1) - 1 : (c ?? 0) + 1))
    setLoading(true)

    try {
      const supabase = createClient()
      if (prevLiked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', currentUserId)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('likes')
          .insert({ post_id: postId, user_id: currentUserId })
        if (error) throw error
      }
    } catch {
      // ── Revert ───────────────────────────────────────────────────────────
      setHasLiked(prevLiked)
      setCount(prevCount)
      showToast('Failed to update like. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={toggle}
        disabled={loading}
        className={`font-mono text-xs tracking-wider uppercase border px-3 py-1 transition-colors
          ${hasLiked
            ? 'border-ink bg-ink text-cream'
            : 'border-border text-ink-faint hover:border-ink hover:text-ink'
          } disabled:opacity-40`}
      >
        {hasLiked ? '♥ liked' : '+ like'}
      </button>

      {/* Count only visible to post author */}
      {count !== null && (
        <span className="font-mono text-xs text-ink-faint">
          {count} {count === 1 ? 'like' : 'likes'}
        </span>
      )}
    </div>
  )
}
