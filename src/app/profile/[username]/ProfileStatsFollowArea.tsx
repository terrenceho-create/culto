'use client'

import { useState } from 'react'
import FollowButton from '@/components/FollowButton'

interface Props {
  targetUsername: string
  currentUserId: string
  targetUserId: string
  initialIsFollowing: boolean
  initialFollowerCount: number
  followingCount: number
  postCount: number
}

export default function ProfileStatsFollowArea({
  targetUsername,
  currentUserId,
  targetUserId,
  initialIsFollowing,
  initialFollowerCount,
  followingCount,
  postCount,
}: Props) {
  const [followerCount, setFollowerCount] = useState(initialFollowerCount)

  function handleFollowChange(delta: 1 | -1) {
    setFollowerCount((c) => c + delta)
  }

  return (
    <div className="flex items-center justify-between gap-3 mt-3">
      {/* Stats */}
      <div className="flex gap-5">
        <a
          href={`/profile/${targetUsername}/followers`}
          className="font-mono text-xs text-ink-muted hover:text-ink transition-colors"
        >
          <strong className="text-ink">{followerCount}</strong> followers
        </a>
        <a
          href={`/profile/${targetUsername}/following`}
          className="font-mono text-xs text-ink-muted hover:text-ink transition-colors"
        >
          <strong className="text-ink">{followingCount}</strong> following
        </a>
        <span className="font-mono text-xs text-ink-muted">
          <strong className="text-ink">{postCount}</strong> posts
        </span>
      </div>

      {/* Follow / Unfollow button */}
      <FollowButton
        currentUserId={currentUserId}
        targetUserId={targetUserId}
        initialIsFollowing={initialIsFollowing}
        onFollowChange={handleFollowChange}
      />
    </div>
  )
}
