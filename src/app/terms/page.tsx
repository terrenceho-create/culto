import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Use — Culto',
}

export default function TermsPage() {
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
          Terms of Use
        </h1>
        <p className="font-mono text-xs text-ink-faint mb-12">Last updated April 2026</p>

        <div className="flex flex-col gap-10">

          <section>
            <h2 className="font-mono text-xs font-bold tracking-widest uppercase text-ink-muted mb-3">
              01 — Invite-Only Community
            </h2>
            <p className="font-mono text-sm text-ink leading-relaxed">
              Culto is a private, invite-only creative network. Access is granted exclusively
              through an invitation code issued by an existing member. Membership is not
              guaranteed and may be revoked at any time if a user violates these terms.
            </p>
          </section>

          <section>
            <h2 className="font-mono text-xs font-bold tracking-widest uppercase text-ink-muted mb-3">
              02 — Age Requirement
            </h2>
            <p className="font-mono text-sm text-ink leading-relaxed">
              You must be 18 years of age or older to use Culto. By creating an account,
              you confirm that you meet this age requirement. We reserve the right to
              terminate accounts found to belong to minors.
            </p>
          </section>

          <section>
            <h2 className="font-mono text-xs font-bold tracking-widest uppercase text-ink-muted mb-3">
              03 — Artistic Content
            </h2>
            <p className="font-mono text-sm text-ink leading-relaxed">
              Culto is a platform for serious creative work. Artistic nudity and figurative
              imagery — including life drawing, fine art photography, and human-form studies —
              are permitted when presented with clear artistic intent. Explicit pornographic
              content is not allowed. When in doubt, consider context and intent.
            </p>
          </section>

          <section>
            <h2 className="font-mono text-xs font-bold tracking-widest uppercase text-ink-muted mb-3">
              04 — Your Content
            </h2>
            <p className="font-mono text-sm text-ink leading-relaxed">
              You are responsible for everything you post on Culto. You confirm that you
              own or have the right to share any content you publish. Do not post content
              that is hateful, harassing, deceptive, or illegal. Culto does not claim
              ownership of your work.
            </p>
          </section>

          <section>
            <h2 className="font-mono text-xs font-bold tracking-widest uppercase text-ink-muted mb-3">
              05 — Moderation
            </h2>
            <p className="font-mono text-sm text-ink leading-relaxed">
              Culto administrators may remove content or suspend accounts that do not align
              with the platform&apos;s purpose as a curated creative community. Moderation
              decisions are made at the team&apos;s discretion. We aim to be fair but
              operate no formal appeals process.
            </p>
          </section>

          <section>
            <h2 className="font-mono text-xs font-bold tracking-widest uppercase text-ink-muted mb-3">
              06 — Invitation Responsibility
            </h2>
            <p className="font-mono text-sm text-ink leading-relaxed">
              When you invite someone to Culto, you take on shared responsibility for their
              conduct on the platform. Inviting someone who repeatedly violates these terms
              may affect your own standing as a member. Choose who you invite carefully.
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
          <a href="/terms" className="text-xs text-ink font-mono">Terms</a>
          <a href="/privacy" className="text-xs text-ink-faint font-mono hover:text-ink transition-colors">Privacy</a>
        </div>
      </footer>
    </main>
  )
}
