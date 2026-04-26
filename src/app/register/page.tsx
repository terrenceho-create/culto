import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import RegisterForm from './RegisterForm'

interface Props {
  searchParams: { invite?: string }
}

export default async function RegisterPage({ searchParams }: Props) {
  // Already logged in → go to feed
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/feed')

  const inviteCode = searchParams.invite?.trim().toLowerCase() ?? ''

  // Validate invite server-side before showing the form
  if (!inviteCode) redirect('/')

  const admin = createAdminClient()
  const { data: invite } = await admin
    .from('invites')
    .select('id, used_by')
    .eq('code', inviteCode)
    .maybeSingle()

  if (!invite || invite.used_by) redirect('/?error=invalid_invite')

  return (
    <main className="min-h-screen bg-cream flex flex-col">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <a href="/" className="font-mono font-bold text-sm tracking-widest text-ink">
          CULTO
        </a>
        <span className="text-xs text-ink-faint tracking-widest uppercase">
          Create account
        </span>
      </header>

      <section className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <h1 className="font-mono font-bold text-2xl text-ink mb-1 tracking-tight">
            Join Culto
          </h1>
          <p className="text-xs text-ink-faint mb-8">
            You were invited. Fill in the details below.
          </p>

          <RegisterForm inviteCode={inviteCode} />

          <p className="mt-6 text-xs text-ink-faint text-center">
            Already have an account?{' '}
            <a href="/login" className="culto-link text-ink-muted">Sign in</a>
          </p>
        </div>
      </section>
    </main>
  )
}
