'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from './Toast'

interface Props {
  currentUserId: string
  targetUserId: string
  initialIsFollowing: boolean
  /** Called after a successful toggle so parent can update follower count */
  onFollowChange?: (delta: 1 | -1) => void
}

export default function FollowButton({
  currentUserId,
  targetUserId,
  initialIsFollowing,
  onFollowChange,
}: Props) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()

  async function toggle() {
    if (loading) return

    // ── Optimistic update ────────────────────────────────────────────────────
    const wasFollowing = isFollowing
    setIsFollowing(!wasFollowing)
    setLoading(true)

    try {
      const supabase = createClient()
      if (wasFollowing) {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', targetUserId)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('follows')
          .insert({ follower_id: currentUserId, following_id: targetUserId })
        if (error) throw error
      }
      onFollowChange?.(wasFollowing ? -1 : 1)
    } catch {
      // ── Revert ───────────────────────────────────────────────────────────
      setIsFollowing(wasFollowing)
      showToast('Failed to update follow. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`font-mono text-xs font-bold tracking-wider uppercase px-4 py-1.5 border
        transition-colors disabled:opacity-40 flex-shrink-0
        ${isFollowing
          ? 'border-ink bg-ink text-cream hover:bg-cream hover:text-ink'
          : 'border-ink bg-cream text-ink hover:bg-ink hover:text-cream'
        }`}
    >
      {isFollowing ? 'Following' : 'Follow'}
    </button>
  )
}
