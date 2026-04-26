import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — Culto',
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-cream flex flex-col">
      {/* Top bar */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <a
          href="/"
          className="font-mono font-bold text-sm tracking-widest text-ink hover:opacity-60 transition-opacity"
        >
          CULTO
        </a>
        <a href="/" className="text-xs text-ink-faint font-mono hover:text-ink transition-colors">
          ← Back
        </a>
      </header>

      {/* Content */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-16">
        <h1 className="font-mono font-bold text-2xl text-ink tracking-tight mb-2">
          Privacy Policy
        </h1>
        <p className="font-mono text-xs text-ink-faint mb-12">Last updated April 2026</p>

        <div className="flex flex-col gap-10">

          <section>
            <h2 className="font-mono text-xs font-bold tracking-widest uppercase text-ink-muted mb-3">
              01 — What We Collect
            </h2>
            <p className="font-mono text-sm text-ink leading-relaxed">
              We collect the minimum necessary to run the platform: your email address,
              chosen username, display name, profile bio and tags, and the content you
              publish (posts, comments, shares). We also store which users you follow
              and who invited you, if you choose to display that.
            </p>
          </section>

          <section>
            <h2 className="font-mono text-xs font-bold tracking-widest uppercase text-ink-muted mb-3">
              02 — How It&apos;s Stored
            </h2>
            <p className="font-mono text-sm text-ink leading-relaxed">
              All data is stored on Supabase, a managed database platform with encryption
              at rest and in transit. Passwords are never stored in plain text — authentication
              is handled securely by Supabase Auth. Uploaded images are stored in
              Supabase Storage with access controls.
            </p>
          </section>

          <section>
            <h2 className="font-mono text-xs font-bold tracking-widest uppercase text-ink-muted mb-3">
              03 — What We Don&apos;t Do
            </h2>
            <p className="font-mono text-sm text-ink leading-relaxed">
              We do not sell your data to anyone. We do not use tracking algorithms
              or build behavioral profiles for advertising. We do not share your information
              with third parties beyond what is required to operate the service (e.g. the
              hosting infrastructure). There are no ads on Culto.
            </p>
          </section>

          <section>
            <h2 className="font-mono text-xs font-bold tracking-widest uppercase text-ink-muted mb-3">
              04 — No Tracking
            </h2>
            <p className="font-mono text-sm text-ink leading-relaxed">
              Culto does not use third-party analytics, pixel trackers, or cookies beyond
              what is strictly necessary for authentication (your session token). Your feed
              is chronological — there is no algorithm observing your behavior to rank content.
            </p>
          </section>

          <section>
            <h2 className="font-mono text-xs font-bold tracking-widest uppercase text-ink-muted mb-3">
              05 — Your Rights
            </h2>
            <p className="font-mono text-sm text-ink leading-relaxed">
              You can request the deletion of your account and all associated data at any
              time by contacting an administrator. Upon request, we will permanently remove
              your profile, posts, comments, and any other personally identifiable information
              from our database within 30 days.
            </p>
          </section>

          <section>
            <h2 className="font-mono text-xs font-bold tracking-widest uppercase text-ink-muted mb-3">
              06 — Changes
            </h2>
            <p className="font-mono text-sm text-ink leading-relaxed">
              If we make meaningful changes to this policy, we will notify members through
              the platform. Continued use of Culto after any update constitutes acceptance
              of the revised terms.
            </p>
          </section>

        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-4 flex items-center justify-between">
        <span className="text-xs text-ink-faint font-mono">
          &copy; {new Date().getFullYear()} Culto
        </span>
        <div className="flex gap-6">
          <a href="/terms" className="text-xs text-ink-faint font-mono hover:text-ink transition-colors">Terms</a>
          <a href="/privacy" className="text-xs text-ink font-mono">Privacy</a>
        </div>
      </footer>
    </main>
  )
}
