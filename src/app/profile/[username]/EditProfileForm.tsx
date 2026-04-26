'use client'

import { useState, useRef, ChangeEvent, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

interface Props {
  userId: string
  initialData: {
    display_name: string | null
    bio: string | null
    tags: string[]
    avatar_url: string | null
    show_invited_by: boolean
    has_inviter: boolean
  }
  onCancel: () => void
}

export default function EditProfileForm({ userId, initialData, onCancel }: Props) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [displayName, setDisplayName] = useState(initialData.display_name ?? '')
  const [bio, setBio] = useState(initialData.bio ?? '')
  const [tags, setTags] = useState<string[]>(initialData.tags)
  const [tagInput, setTagInput] = useState('')
  const [showInvitedBy, setShowInvitedBy] = useState(initialData.show_invited_by)
  const avatarUrl = initialData.avatar_url
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  function addTag() {
    const t = tagInput.trim().toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff\u3040-\u30ff_-]/g, '')
    if (!t || tags.includes(t) || tags.length >= 5) return
    setTags((prev) => [...prev, t])
    setTagInput('')
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag))
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag()
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    let finalAvatarUrl = avatarUrl

    // Upload new avatar if selected
    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop()
      const path = `${userId}/avatar.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, avatarFile, { upsert: true, contentType: avatarFile.type })

      if (uploadError) {
        setError(`Avatar upload failed: ${uploadError.message}`)
        setLoading(false)
        return
      }

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      finalAvatarUrl = publicUrl
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
        tags,
        avatar_url: finalAvatarUrl,
        show_invited_by: showInvitedBy,
      })
      .eq('id', userId)

    if (updateError) {
      setError(`Failed to save: ${updateError.message}`)
      setLoading(false)
      return
    }

    router.refresh()
    onCancel()
  }

  const currentAvatar = avatarPreview ?? avatarUrl

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-4">
      {/* Avatar */}
      <div className="flex flex-col gap-2">
        <label className="text-xs text-ink-muted tracking-wider uppercase">Avatar</label>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 border border-border overflow-hidden flex-shrink-0 relative bg-cream">
            {currentAvatar ? (
              <Image src={currentAvatar} alt="Avatar preview" fill className="object-cover" unoptimized />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-mono text-lg text-ink-faint">
                ?
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="culto-btn-ghost text-xs"
          >
            {currentAvatar ? 'Change avatar' : 'Upload avatar'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>
      </div>

      {/* Display name */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-ink-muted tracking-wider uppercase">Display name</label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={50}
          placeholder="Your name"
          className="culto-input"
        />
      </div>

      {/* Bio */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-ink-muted tracking-wider uppercase">Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={160}
          rows={3}
          placeholder="Tell people what you make..."
          className="culto-input resize-none leading-relaxed"
        />
        <span className="text-xs text-ink-faint text-right">{bio.length}/160</span>
      </div>

      {/* Tags */}
      <div className="flex flex-col gap-2">
        <label className="text-xs text-ink-muted tracking-wider uppercase">
          Tags <span className="text-ink-faint normal-case">(max 5)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="font-mono text-xs border border-ink px-2 py-0.5 flex items-center gap-2"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="text-ink-faint hover:text-ink transition-colors"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
        {tags.length < 5 && (
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder="Type tag + Enter"
              maxLength={20}
              className="culto-input flex-1"
            />
            <button type="button" onClick={addTag} className="culto-btn-ghost px-4">
              Add
            </button>
          </div>
        )}
      </div>

      {/* Show invited by */}
      {initialData.has_inviter && (
        <label className="flex items-center gap-3 cursor-pointer">
          <div className="relative flex-shrink-0">
            <input
              type="checkbox"
              checked={showInvitedBy}
              onChange={(e) => setShowInvitedBy(e.target.checked)}
              className="peer sr-only"
            />
            <div className="w-4 h-4 border border-ink bg-cream peer-checked:bg-ink transition-colors" />
            {showInvitedBy && (
              <span className="absolute inset-0 flex items-center justify-center text-cream text-xs font-bold pointer-events-none">
                ✓
              </span>
            )}
          </div>
          <span className="text-xs text-ink">Show who invited me on my profile</span>
        </label>
      )}

      {error && (
        <p className="text-xs text-red-700 font-mono border border-red-300 bg-red-50 px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="culto-btn disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : 'Save profile'}
        </button>
        <button type="button" onClick={onCancel} className="culto-btn-ghost">
          Cancel
        </button>
      </div>
    </form>
  )
}
