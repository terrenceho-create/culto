import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: profile } = await (supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single() as unknown as Promise<{ data: { is_admin: boolean } | null; error: unknown }>)

  if (!profile?.is_admin) redirect('/feed')

  return <>{children}</>
}
