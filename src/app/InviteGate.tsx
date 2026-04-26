"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function InviteGate() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError(null);

    const supabase = createClient();

    const { data: invite, error: dbError } = await supabase
      .from("invites")
      .select("id, used_by")
      .eq("code", code.trim().toLowerCase())
      .maybeSingle();

    setLoading(false);

    if (dbError || !invite) {
      setError("Invalid invite code. Check the code and try again.");
      return;
    }

    if (invite.used_by) {
      setError("This invite code has already been used.");
      return;
    }

    router.push(`/register?invite=${encodeURIComponent(code.trim().toLowerCase())}`);
  }

  return (
    <div className="w-full max-w-sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="text-xs text-ink-muted tracking-wider uppercase">
          Enter invite code
        </label>

        <div className="flex gap-0 border border-ink">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. a3f9c2"
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="none"
            className="flex-1 bg-cream font-mono text-sm text-ink px-3 py-3
                       outline-none placeholder:text-ink-faint"
          />
          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="bg-ink text-cream font-mono text-xs font-bold tracking-widest
                       uppercase px-5 py-3 hover:bg-ink-muted transition-colors
                       disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {loading ? "..." : "Enter"}
          </button>
        </div>

        {error && (
          <p className="text-xs text-red-700 font-mono">{error}</p>
        )}
      </form>

      <p className="mt-4 text-xs text-ink-faint text-center">
        Don&apos;t have a code?{" "}
        <span className="text-ink-muted">
          Ask someone already on Culto.
        </span>
      </p>
    </div>
  );
}
