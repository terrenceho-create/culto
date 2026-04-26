import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const { email, password, username, inviteCode, ageConfirmed } =
      await request.json()

    if (!email || !password || !username || !inviteCode) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
    }

    if (!ageConfirmed) {
      return NextResponse.json({ error: 'Age confirmation required.' }, { status: 400 })
    }

    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
      return NextResponse.json(
        { error: 'Username must be 3–20 characters: letters, numbers, underscores only.' },
        { status: 400 }
      )
    }

    const admin = createAdminClient()

    // 1. Validate invite code
    const { data: invite, error: inviteError } = await admin
      .from('invites')
      .select('id, created_by, used_by')
      .eq('code', inviteCode.toLowerCase())
      .single()

    if (inviteError || !invite) {
      return NextResponse.json({ error: 'Invalid invite code.' }, { status: 400 })
    }
    if (invite.used_by) {
      return NextResponse.json({ error: 'Invite code already used.' }, { status: 400 })
    }

    // 2. Check username uniqueness
    const { data: existingUser } = await admin
      .from('users')
      .select('id')
      .eq('username', username)
      .maybeSingle()

    if (existingUser) {
      return NextResponse.json({ error: 'Username already taken.' }, { status: 400 })
    }

    // 3. Create auth user (auto-confirm since invite validates identity)
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError || !authData.user) {
      if ((authError?.message ?? '').includes('already registered')) {
        return NextResponse.json({ error: 'Email already registered.' }, { status: 400 })
      }
      return NextResponse.json({ error: authError?.message ?? 'Signup failed.' }, { status: 500 })
    }

    const userId = authData.user.id

    // 4. Create user profile
    const { error: profileError } = await admin.from('users').insert({
      id: userId,
      username,
      invited_by: invite.created_by,
      age_confirmed: true,
      invite_quota: 0,
    })

    if (profileError) {
      await admin.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: 'Failed to create profile.' }, { status: 500 })
    }

    // 5. Mark invite as used
    await admin
      .from('invites')
      .update({ used_by: userId, used_at: new Date().toISOString() })
      .eq('id', invite.id)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Unexpected error. Please try again.' }, { status: 500 })
  }
}
