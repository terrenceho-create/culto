import Image from 'next/image'
import FollowButton from './FollowButton'

export interface UserResult {
  id: string
  username: string
  display_name: string | null
  bio: string | null
  tags: string[]
  avatar_url: string | null
}

interface Props {
  user: UserResult
  currentUserId: string
  initialIsFollowing: boolean
}

export default function UserCard({ user, currentUserId, initialIsFollowing }: Props) {
  const initials = (user.display_name || user.username).slice(0, 2).toUpperCase()

  return (
    <div className="flex items-start gap-4 px-5 py-4 bg-cream border-b border-border last:border-b-0">
      {/* Avatar */}
      <a href={`/profile/${user.username}`} className="flex-shrink-0">
        <div className="w-12 h-12 border border-border overflow-hidden relative bg-cream">
          {user.avatar_url ? (
            <Image src={user.avatar_url} alt="" fill className="object-cover" unoptimized />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-mono text-sm font-bold text-ink-faint">
              {initials}
            </div>
          )}
        </div>
      </a>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <a
              href={`/profile/${user.username}`}
              className="font-mono text-sm font-bold text-ink hover:opacity-60 transition-opacity block"
            >
              @{user.username}
            </a>
            {user.display_name && (
              <span className="font-mono text-xs text-ink-muted">{user.display_name}</span>
            )}
          </div>
          <FollowButton
            currentUserId={currentUserId}
            targetUserId={user.id}
            initialIsFollowing={initialIsFollowing}
          />
        </div>

        {user.bio && (
          <p className="font-mono text-xs text-ink-muted mt-1 leading-relaxed line-clamp-2">
            {user.bio}
          </p>
        )}

        {user.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {user.tags.map((tag) => (
              <span key={tag} className="font-mono text-xs border border-border px-1.5 py-0.5 text-ink-faint">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
