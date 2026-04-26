import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import InviteGate from "./InviteGate";

export default async function HomePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/feed");

  return (
    <main className="min-h-screen bg-cream flex flex-col">
      {/* Top bar */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <span className="text-xs text-ink-faint tracking-widest uppercase">
          Private Network
        </span>
        <a href="/login" className="text-xs culto-link text-ink-muted">
          Sign in
        </a>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-24">
        {/* Wordmark */}
        <div className="mb-16 text-center">
          <h1
            className="font-mono font-bold text-ink select-none"
            style={{
              fontSize: "clamp(4rem, 15vw, 10rem)",
              lineHeight: 1,
              letterSpacing: "-0.04em",
            }}
          >
            CULTO
          </h1>
          <p className="mt-4 text-xs text-ink-muted tracking-widest uppercase">
            For creators. By invitation only.
          </p>
        </div>

        {/* Invite code gate */}
        <InviteGate />

        {/* Manifesto */}
        <div className="mt-24 max-w-md text-center">
          <p className="text-xs text-ink-faint leading-relaxed">
            No algorithm. No metrics. Chronological feed.
            <br />
            A private space for designers, photographers,
            <br />
            artists, and people with taste.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-4 flex items-center justify-between">
        <span className="text-xs text-ink-faint">
          &copy; {new Date().getFullYear()} Culto
        </span>
        <div className="flex gap-6">
          <a href="/terms" className="text-xs text-ink-faint culto-link">
            Terms
          </a>
          <a href="/privacy" className="text-xs text-ink-faint culto-link">
            Privacy
          </a>
        </div>
      </footer>
    </main>
  );
}
