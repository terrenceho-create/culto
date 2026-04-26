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
    <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between md:gap-3">
      {/* Stats */}
      <div className="flex gap-5 flex-wrap">
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

      {/* Follow / Unfollow button — full width on mobile, auto on desktop */}
      <FollowButton
        currentUserId={currentUserId}
        targetUserId={targetUserId}
        initialIsFollowing={initialIsFollowing}
        onFollowChange={handleFollowChange}
        className="w-full md:w-auto"
      />
    </div>
  )
}
