import { useRef, useState } from "react";
import { Footer } from "../components/Footer";
import { Nav } from "../components/Nav";
import { REPO_ZIP_URL, UNLOCK_CHANNELS } from "../lib/content";
import { useReveal } from "../lib/motion";

const STORE_KEY = "unlock.followed";

function loadFollowed(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORE_KEY) ?? "[]"));
  } catch {
    return new Set();
  }
}

export function Unlock() {
  const root = useRef<HTMLDivElement>(null);
  useReveal(root);
  const [followed, setFollowed] = useState<Set<string>>(loadFollowed);
  const unlocked = followed.size > 0;

  // ponytail: honor system, client-side only — the follow is the ask,
  // verifying it server-side isn't worth an API integration.
  function markFollowed(key: string) {
    setFollowed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      localStorage.setItem(STORE_KEY, JSON.stringify([...next]));
      return next;
    });
  }

  return (
    <div ref={root}>
      <Nav />
      <main className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-40 [background:radial-gradient(60%_40%_at_50%_0%,#a855f722,transparent_70%)]" />
        <div className="relative z-10 mx-auto max-w-3xl px-5 pb-28 pt-36 sm:px-8">
          {/* ── Header ─────────────────────────────────────────────────── */}
          <div className="text-center" data-reveal-group>
            <p
              data-reveal
              className="mb-6 font-display text-5xl"
              aria-hidden
            >
              <span className="inline-block text-team drop-shadow-[0_0_18px_var(--color-team)]">
                ⚿
              </span>
            </p>
            <p data-reveal className="kicker mb-6">
              The unlock vault
            </p>
            <h1
              data-reveal
              className="font-display text-[clamp(2.2rem,7vw,4.2rem)] font-bold leading-[0.98] text-fg"
            >
              Follow to unlock
              <br />
              <span className="text-transparent [-webkit-text-stroke:1.5px_var(--color-team)]">
                the skill.
              </span>
            </h1>
            <p data-reveal className="mx-auto mt-7 max-w-xl text-lg text-muted">
              Follow Chrono on any one channel and the download is yours. Just
              one unlocks it, no need to follow them all.
            </p>
          </div>

          {/* ── Progress ───────────────────────────────────────────────── */}
          <div data-reveal className="mt-14">
            <div className="mb-3 flex items-center justify-between font-mono text-[0.72rem] uppercase tracking-[0.18em]">
              <p className="text-muted">
                <span className="text-team">{followed.size}</span> of{" "}
                {
                  UNLOCK_CHANNELS.filter((c) => !("comingSoon" in c)).length
                }{" "}
                followed · any 1 unlocks it
              </p>
              <p className={unlocked ? "text-hacking" : "text-faint"}>
                {unlocked ? "Unlocked" : "Locked"}
              </p>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-hairline">
              <div
                className="h-full rounded-full bg-team transition-all duration-700 [box-shadow:0_0_12px_var(--color-team)]"
                style={{
                  width: `${Math.min(100, (followed.size / 1) * 100)}%`,
                }}
              />
            </div>
          </div>

          {/* ── Channels ───────────────────────────────────────────────── */}
          <div className="mt-8 grid gap-3 sm:grid-cols-2" data-reveal-group>
            {UNLOCK_CHANNELS.map((c) => {
              if ("comingSoon" in c && c.comingSoon) {
                return (
                  <div
                    key={c.key}
                    data-reveal
                    aria-disabled="true"
                    className="flex cursor-not-allowed items-center justify-between gap-4 rounded-xl border border-hairline bg-void p-5 opacity-45 saturate-0"
                  >
                    <span className="flex items-center gap-4">
                      <span
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-hairline font-mono text-[0.8rem] font-bold"
                        style={{ color: c.color }}
                      >
                        {c.label.slice(0, 2).toUpperCase()}
                      </span>
                      <span>
                        <span className="block font-medium text-fg">
                          {c.label}
                        </span>
                        <span className="block font-mono text-[0.72rem] text-faint">
                          {c.handle}
                        </span>
                      </span>
                    </span>
                    <span className="shrink-0 rounded-full border border-hairline px-3 py-1 font-mono text-[0.62rem] uppercase tracking-[0.16em] text-faint">
                      Coming soon
                    </span>
                  </div>
                );
              }
              const done = followed.has(c.key);
              return (
                <a
                  key={c.key}
                  data-reveal
                  href={c.url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => {
                    if (!done) markFollowed(c.key);
                  }}
                  className={`group flex items-center justify-between gap-4 rounded-xl border p-5 no-underline transition-colors ${
                    done
                      ? "border-team/50 bg-team/[0.06]"
                      : "border-hairline bg-void hover:border-fg/30"
                  }`}
                >
                  <span className="flex items-center gap-4">
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-hairline font-mono text-[0.8rem] font-bold"
                      style={{ color: c.color }}
                    >
                      {c.label.slice(0, 2).toUpperCase()}
                    </span>
                    <span>
                      <span className="block font-medium text-fg">
                        {c.label}
                      </span>
                      <span className="block font-mono text-[0.72rem] text-faint">
                        {c.handle}
                      </span>
                    </span>
                  </span>
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[0.7rem] transition-colors ${
                      done
                        ? "border-team bg-team text-void-deep"
                        : "border-hairline text-transparent group-hover:border-fg/40"
                    }`}
                  >
                    ✓
                  </span>
                </a>
              );
            })}
          </div>

          {/* ── Download ───────────────────────────────────────────────── */}
          <div className="mt-12 text-center" data-reveal>
            {unlocked ? (
              <>
                <a
                  href={REPO_ZIP_URL}
                  className="inline-flex items-center gap-3 rounded-full bg-team px-9 py-4 font-mono text-[0.82rem] font-medium uppercase tracking-[0.14em] text-void-deep no-underline transition-transform duration-300 hover:-translate-y-0.5 [box-shadow:0_0_28px_#a855f766]"
                >
                  ↓ Download the skill
                </a>
                <p className="mt-5 font-mono text-[0.72rem] uppercase tracking-[0.18em] text-faint">
                  Seal broken ·{" "}
                  <a
                    href="/skill#install"
                    className="text-muted underline-offset-4 hover:text-fg"
                  >
                    install in 60 seconds →
                  </a>
                </p>
              </>
            ) : (
              <>
                <span className="inline-flex cursor-not-allowed items-center gap-3 rounded-full border border-hairline px-9 py-4 font-mono text-[0.82rem] uppercase tracking-[0.14em] text-faint">
                  ⚿ Follow one channel to break the seal
                </span>
                <p className="mt-5 font-mono text-[0.72rem] uppercase tracking-[0.18em] text-faint">
                  Tap a card, follow, and the vault opens.
                </p>
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
