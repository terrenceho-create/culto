'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function assertAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await (supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single() as unknown as Promise<{ data: { is_admin: boolean } | null; error: unknown }>)

  if (!profile?.is_admin) throw new Error('Forbidden')
}

export async function adminDeletePost(postId: string) {
  await assertAdmin()
  const admin = createAdminClient()
  await (admin.from('posts').update({ is_deleted: true }).eq('id', postId) as unknown as Promise<unknown>)
  revalidatePath('/admin')
}

export async function adminToggleUserActive(userId: string, makeActive: boolean) {
  await assertAdmin()
  const admin = createAdminClient()
  await (admin.from('users').update({ is_active: makeActive }).eq('id', userId) as unknown as Promise<unknown>)
  revalidatePath('/admin')
}

export async function adminSetInviteQuota(userId: string, quota: number) {
  await assertAdmin()
  const admin = createAdminClient()
  await (admin.from('users').update({ invite_quota: Math.max(0, quota) }).eq('id', userId) as unknown as Promise<unknown>)
  revalidatePath('/admin')
}

export async function adminCreateInvite(createdBy: string): Promise<string | null> {
  await assertAdmin()
  const admin = createAdminClient()
  const { data } = await (admin
    .from('invites')
    .insert({ created_by: createdBy })
    .select('code')
    .single() as unknown as Promise<{ data: { code: string } | null; error: unknown }>)
  revalidatePath('/admin')
  return data?.code ?? null
}

export async function adminToggleUserAdmin(userId: string, makeAdmin: boolean) {
  await assertAdmin()
  const admin = createAdminClient()
  await (admin.from('users').update({ is_admin: makeAdmin }).eq('id', userId) as unknown as Promise<unknown>)
  revalidatePath('/admin')
}
