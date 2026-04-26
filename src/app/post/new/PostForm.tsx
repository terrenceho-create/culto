'use client'

import { useState, useRef, FormEvent, ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/Toast'

interface Props {
  userId: string
}

export default function PostForm({ userId }: Props) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [content, setContent] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    if (selected.length === 0) return

    const total = files.length + selected.length
    if (total > 4) {
      showToast('Maximum 4 images per post.')
      return
    }

    setFiles((prev) => [...prev, ...selected])
    const newPreviews = selected.map((f) => URL.createObjectURL(f))
    setPreviews((prev) => [...prev, ...newPreviews])
  }

  function removeImage(index: number) {
    URL.revokeObjectURL(previews[index])
    setFiles((prev) => prev.filter((_, i) => i !== index))
    setPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    const hasContent = content.trim().length > 0
    const hasImages = files.length > 0
    const hasLink = linkUrl.trim().length > 0

    if (!hasContent && !hasImages && !hasLink) {
      showToast('Add some text, an image, or a link.')
      return
    }

    if (hasLink) {
      try {
        new URL(linkUrl.trim())
      } catch {
        showToast('Link must be a valid URL (include https://).')
        return
      }
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const imageUrls: string[] = []

      // Upload images to Supabase Storage
      if (hasImages) {
        for (const file of files) {
          const ext = file.name.split('.').pop()
          const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

          const { error: uploadError } = await supabase.storage
            .from('post-images')
            .upload(path, file, { contentType: file.type })

          if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`)

          const { data: { publicUrl } } = supabase.storage
            .from('post-images')
            .getPublicUrl(path)

          imageUrls.push(publicUrl)
        }
      }

      // Insert post
      const { error: insertError } = await supabase.from('posts').insert({
        author_id: userId,
        content: hasContent ? content.trim() : null,
        image_urls: imageUrls,
        link_url: hasLink ? linkUrl.trim() : null,
      })

      if (insertError) throw new Error(insertError.message)

      // Navigate immediately — App Router re-fetches fresh data on push
      router.push('/feed')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to publish post.'
      showToast(message)
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Text */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-ink-muted tracking-wider uppercase">
          Text
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What are you working on?"
          rows={5}
          className="culto-input resize-none leading-relaxed"
        />
        <span className="text-xs text-ink-faint text-right">{content.length}</span>
      </div>

      {/* Images */}
      <div className="flex flex-col gap-2">
        <label className="text-xs text-ink-muted tracking-wider uppercase">
          Images <span className="text-ink-faint normal-case">(max 4)</span>
        </label>

        {previews.length > 0 && (
          <div className={`grid gap-1 ${previews.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {previews.map((src, i) => (
              <div key={i} className="relative aspect-square border border-border overflow-hidden group">
                <Image src={src} alt="" fill className="object-cover" unoptimized />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 bg-ink text-cream font-mono text-xs
                             px-2 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {files.length < 4 && (
          <>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="culto-btn-ghost text-left"
            >
              + Add image{files.length > 0 ? ' (more)' : ''}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
          </>
        )}
      </div>

      {/* Link */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-ink-muted tracking-wider uppercase">
          Link <span className="text-ink-faint normal-case">(optional)</span>
        </label>
        <input
          type="url"
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          placeholder="https://example.com"
          className="culto-input"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="culto-btn disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? 'Posting...' : 'Publish post'}
        </button>
        <a href="/feed" className="culto-btn-ghost">
          Cancel
        </a>
      </div>
    </form>
  )
}
