'use client'

import { useState } from 'react'
import EditProfileForm from './EditProfileForm'

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
}

export default function ProfileActions({ userId, initialData }: Props) {
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <EditProfileForm
        userId={userId}
        initialData={initialData}
        onCancel={() => setEditing(false)}
      />
    )
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="culto-btn-ghost text-xs flex-shrink-0"
    >
      Edit profile
    </button>
  )
}
