import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PostForm from './PostForm'

export default async function NewPostPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  return (
    <main className="min-h-screen bg-cream">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <a href="/feed" className="font-mono font-bold text-sm tracking-widest text-ink">
          CULTO
        </a>
        <a href="/feed" className="font-mono text-xs text-ink-faint hover:text-ink transition-colors">
          ← Back to feed
        </a>
      </header>

      <section className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="font-mono font-bold text-2xl text-ink mb-1 tracking-tight">
          New post
        </h1>
        <p className="text-xs text-ink-faint mb-8">
          Text, images, or a link. At least one is required.
        </p>

        <PostForm userId={user.id} />
      </section>
    </main>
  )
}
