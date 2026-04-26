'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from './Toast'

interface Props {
  postId: string
  currentUserId: string
  // When sharing from a ShareCard, pass the parent share's id so the chain is preserved
  sourceShareId?: string
  initialHasShared?: boolean
}

export default function ShareButton({
  postId,
  currentUserId,
  sourceShareId,
  initialHasShared = false,
}: Props) {
  const [open, setOpen] = useState(false)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  // hasShared tracks the trigger-button state (the "↗ Share" text)
  const [hasShared, setHasShared] = useState(initialHasShared)
  const [dialogStatus, setDialogStatus] = useState<'idle' | 'done' | 'exists'>('idle')
  const { showToast } = useToast()

  function openDialog() {
    // If already shared, just show the "already shared" dialog
    setDialogStatus(hasShared ? 'exists' : 'idle')
    setOpen(true)
  }

  function closeDialog() {
    setOpen(false)
    setComment('')
  }

  async function handleShare() {
    if (loading) return

    // ── Optimistic update ────────────────────────────────────────────────────
    setHasShared(true)
    setDialogStatus('done')
    const commentText = comment.trim()
    setLoading(true)

    // Close dialog quickly after optimistic confirmation
    setTimeout(closeDialog, 500)

    try {
      const supabase = createClient()
      const { error } = await supabase.from('shares').insert({
        post_id: postId,
        shared_by: currentUserId,
        shared_from: sourceShareId ?? null,
        comment: commentText || null,
      })
      if (error) throw error
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code
      if (code === '23505') {
        // Already shared — keep optimistic "shared" state, just inform
        setOpen(false)
        showToast('You\'ve already shared this post.')
      } else {
        // ── Revert ─────────────────────────────────────────────────────────
        setHasShared(false)
        setDialogStatus('idle')
        showToast('Failed to share post. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={openDialog}
        className={`font-mono text-xs tracking-wider uppercase transition-colors
          ${hasShared
            ? 'text-ink-muted'
            : 'text-ink-faint hover:text-ink'
          }`}
      >
        ↗ {hasShared ? 'Shared' : 'Share'}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-ink/20" onClick={closeDialog} />

          {/* Dialog */}
          <div className="relative z-10 bg-cream border border-ink w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border">
              <span className="font-mono text-xs font-bold tracking-widest uppercase text-ink">
                Share Post
              </span>
              <button
                onClick={closeDialog}
                className="font-mono text-xs text-ink-faint hover:text-ink transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="px-5 py-4">
              {dialogStatus === 'done' ? (
                <p className="font-mono text-sm text-ink text-center py-4">
                  Shared to your profile and followers.
                </p>
              ) : dialogStatus === 'exists' ? (
                <p className="font-mono text-sm text-ink-muted text-center py-4">
                  You&apos;ve already shared this post.
                </p>
              ) : (
                <>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add your thoughts..."
                    rows={3}
                    maxLength={280}
                    className="w-full bg-cream border border-border font-mono text-sm text-ink
                               px-4 py-3 outline-none resize-none placeholder:text-ink-faint
                               focus:border-ink transition-colors"
                  />
                  <div className="flex items-center justify-between mt-4">
                    <span className="font-mono text-xs text-ink-faint">
                      {comment.length}/280
                    </span>
                    <button
                      onClick={handleShare}
                      disabled={loading}
                      className="font-mono text-xs font-bold tracking-widest uppercase
                                 bg-ink text-cream px-6 py-2 hover:opacity-80
                                 transition-opacity disabled:opacity-40"
                    >
                      {loading ? '...' : 'Share'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
