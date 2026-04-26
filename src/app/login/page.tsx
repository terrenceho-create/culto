import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LoginForm from './LoginForm'

export default async function LoginPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/feed')

  return (
    <main className="min-h-screen bg-cream flex flex-col">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <a href="/" className="font-mono font-bold text-sm tracking-widest text-ink">
          CULTO
        </a>
        <span className="text-xs text-ink-faint tracking-widest uppercase">
          Sign in
        </span>
      </header>

      <section className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <h1 className="font-mono font-bold text-2xl text-ink mb-1 tracking-tight">
            Welcome back
          </h1>
          <p className="text-xs text-ink-faint mb-8">
            Sign in to your Culto account.
          </p>

          <LoginForm />

          <p className="mt-6 text-xs text-ink-faint text-center">
            Don&apos;t have an account?{' '}
            <a href="/" className="culto-link text-ink-muted">Get an invite</a>
          </p>
        </div>
      </section>
    </main>
  )
}
