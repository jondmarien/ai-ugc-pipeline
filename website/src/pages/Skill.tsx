import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Footer } from "../components/Footer";
import { Nav } from "../components/Nav";
import { Scramble } from "../components/Scramble";
import {
  FAQ,
  INSTALL_AGENTS,
  REPO_URL,
  SKILL,
  SKILL_PARTS,
  SKILL_STEPS,
  getSocial,
} from "../lib/content";
import { prefersReducedMotion, useReveal } from "../lib/motion";

// Same code-split three.js field as the landing hero.
const HeroCanvas = lazy(() =>
  import("../three/HeroCanvas").then((m) => ({ default: m.HeroCanvas })),
);

function CodeBlock({ label, code }: { label: string; code: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-hairline bg-void">
      <div className="flex items-center gap-2 border-b border-hairline px-4 py-2.5">
        <span className="h-2 w-2 rounded-full bg-offensive/70" />
        <span className="h-2 w-2 rounded-full bg-ai/70" />
        <span className="h-2 w-2 rounded-full bg-hacking/70" />
        <span className="ml-2 font-mono text-[0.66rem] uppercase tracking-[0.2em] text-faint">
          {label}
        </span>
      </div>
      <pre className="overflow-x-auto px-4 py-4 font-mono text-[0.82rem] leading-relaxed text-fg/90">
        {code.split("\n").map((line) => (
          <div key={line}>
            <span className="select-none text-faint">{"$ "}</span>
            {line}
          </div>
        ))}
      </pre>
    </div>
  );
}

function Installer() {
  const [agent, setAgent] = useState<(typeof INSTALL_AGENTS)[number]>(
    INSTALL_AGENTS[0],
  );
  return (
    <div className="overflow-hidden rounded-2xl border border-hairline bg-void">
      {/* header: chooser */}
      <div className="flex flex-col gap-4 border-b border-hairline px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-mono text-[0.72rem] uppercase tracking-[0.24em] text-faint">
          Choose your agent
        </p>
        <div className="flex flex-wrap gap-1 rounded-full border border-hairline bg-void-deep p-1">
          {INSTALL_AGENTS.map((a) => (
            <button
              key={a.key}
              type="button"
              onClick={() => setAgent(a)}
              className={`rounded-full px-4 py-1.5 font-mono text-[0.72rem] uppercase tracking-[0.12em] transition-colors ${
                agent.key === a.key
                  ? "bg-ai text-void-deep"
                  : "text-muted hover:text-fg"
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* bundle row */}
      <div className="flex flex-col gap-4 border-b border-hairline px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium text-fg">The skill bundle</p>
          <p className="mt-1 font-mono text-[0.72rem] text-faint">
            7 × SKILL.md + slash commands · straight from the repo
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-fg px-5 py-2.5 font-mono text-[0.74rem] uppercase tracking-[0.12em] text-void-deep no-underline transition-transform duration-300 hover:-translate-y-0.5"
          >
            Get it on GitHub ↗
          </a>
          <Link
            to="/unlock"
            className="inline-flex items-center gap-2 rounded-full border border-hairline px-5 py-2.5 font-mono text-[0.74rem] uppercase tracking-[0.12em] text-fg no-underline transition-colors hover:border-ai/60"
          >
            Follow to unlock
          </Link>
        </div>
      </div>

      {/* command + steps for the chosen agent */}
      <div className="px-6 py-6">
        <CodeBlock label={`${agent.label} — one line`} code={agent.command} />
        <div className="mt-8 grid gap-8 md:grid-cols-3">
          {agent.steps.map((s) => (
            <div key={s.n}>
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-ai/50 font-mono text-[0.74rem] text-ai">
                {s.n}
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold text-fg">
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="border-t border-hairline px-6 py-4 text-center font-mono text-[0.7rem] uppercase tracking-[0.18em] text-faint">
        Skills work anywhere · clone the repo for art, voice, and reels
      </p>
    </div>
  );
}

export function Skill() {
  const root = useRef<HTMLDivElement>(null);
  useReveal(root);
  const hero = useRef<HTMLElement>(null);
  const reduced = prefersReducedMotion();
  const [heroVisible, setHeroVisible] = useState(true);
  const instagram = getSocial("instagram");

  // Pause the WebGL loop once the hero scrolls out of view (same as Home).
  useEffect(() => {
    const el = hero.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setHeroVisible(entry.isIntersecting),
      { threshold: 0.04 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={root}>
      <Nav />
      <main>
        {/* ── Hero: the skill drop ─────────────────────────────────────── */}
        <section ref={hero} className="relative overflow-hidden">
          <div className="absolute inset-0">
            <Suspense fallback={null}>
              <HeroCanvas reduced={reduced} visible={heroVisible} />
            </Suspense>
          </div>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_-10%,transparent_40%,#05070d_88%)]" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-void-deep via-void-deep/70 to-transparent" />
          <div className="pointer-events-none absolute inset-0 opacity-40 [background:radial-gradient(70%_50%_at_50%_-10%,#f9731622,transparent_70%)]" />

          <div className="relative z-10 mx-auto flex min-h-[92svh] max-w-[var(--max)] flex-col justify-center px-5 pb-16 pt-28 sm:px-8">
            <p data-reveal className="kicker mb-7 flex items-center gap-3">
              <span className="h-px w-8 bg-faint/60" />A Chrono skill drop
            </p>
            <h1 className="font-display text-[clamp(2.5rem,8vw,5.8rem)] font-bold text-fg">
              <span className="block">
                <Scramble text="One idea in." delay={250} />
              </span>
              <span className="block text-transparent [-webkit-text-stroke:1.5px_var(--color-ai)]">
                <Scramble text="A finished post out." delay={650} />
              </span>
            </h1>
            <p
              data-reveal
              className="mt-8 max-w-2xl text-lg leading-relaxed text-muted sm:text-xl"
            >
              {SKILL.pitch}
            </p>
            <div data-reveal className="mt-10 flex flex-wrap items-center gap-4">
              <a
                href="#install"
                className="group inline-flex items-center gap-2.5 rounded-full bg-fg px-7 py-3.5 font-mono text-[0.8rem] font-medium uppercase tracking-[0.14em] text-void-deep no-underline transition-transform duration-300 hover:-translate-y-0.5"
              >
                Install the skill
                <span className="transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </a>
              <Link
                to="/unlock"
                className="inline-flex items-center gap-2 rounded-full border border-hairline px-7 py-3.5 font-mono text-[0.8rem] uppercase tracking-[0.14em] text-fg no-underline transition-colors hover:border-ai/60"
              >
                Follow to unlock
              </Link>
            </div>
            <p
              data-reveal
              className="mt-12 flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-[0.68rem] uppercase tracking-[0.24em] text-faint"
            >
              {SKILL.badges.map((b, i) => (
                <span key={b} className="flex items-center gap-3">
                  {i > 0 && <span aria-hidden>·</span>}
                  {b}
                </span>
              ))}
              <span aria-hidden>·</span>
              Runs inside Claude Code
            </p>
          </div>
        </section>

        {/* ── The problem ──────────────────────────────────────────────── */}
        <section className="border-t border-hairline px-5 py-28 sm:px-8 sm:py-36">
          <div className="mx-auto max-w-[var(--max)]" data-reveal-group>
            <p data-reveal className="kicker mb-5">
              {"// 01 — The problem"}
            </p>
            <h2
              data-reveal
              className="max-w-3xl font-display text-[clamp(1.9rem,5vw,3.4rem)] font-semibold leading-[1.04] text-fg"
            >
              AI security content hallucinates.
              <br />
              <span className="text-faint">This pipeline cites.</span>
            </h2>
            <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline md:grid-cols-2">
              <article data-reveal className="bg-void p-8 sm:p-10">
                <p className="mb-5 font-mono text-[0.72rem] uppercase tracking-[0.2em] text-offensive">
                  ⚠ {SKILL.problem.bad.tag}
                </p>
                <h3 className="font-display text-2xl font-semibold text-fg">
                  {SKILL.problem.bad.title}
                </h3>
                <p className="mt-4 leading-relaxed text-muted">
                  {SKILL.problem.bad.body}
                </p>
              </article>
              <article data-reveal className="relative isolate bg-void p-8 sm:p-10">
                <div className="pointer-events-none absolute inset-0 -z-10 [background:radial-gradient(120%_80%_at_0%_0%,#39ff8814,transparent_60%)]" />
                <p className="mb-5 font-mono text-[0.72rem] uppercase tracking-[0.2em] text-hacking">
                  ✦ {SKILL.problem.good.tag}
                </p>
                <h3 className="font-display text-2xl font-semibold text-fg">
                  {SKILL.problem.good.title}
                </h3>
                <p className="mt-4 leading-relaxed text-muted">
                  {SKILL.problem.good.body}
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* ── What's inside ────────────────────────────────────────────── */}
        <section
          id="inside"
          className="border-t border-hairline px-5 py-28 sm:px-8 sm:py-36"
        >
          <div className="mx-auto max-w-[var(--max)]" data-reveal-group>
            <div className="mb-14 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p data-reveal className="kicker mb-5">
                  {"// 02 — What's inside"}
                </p>
                <h2
                  data-reveal
                  className="max-w-2xl font-display text-[clamp(1.8rem,4.5vw,3.2rem)] font-semibold leading-[1.06] text-fg"
                >
                  Seven skills. One pipeline.
                </h2>
              </div>
              <p data-reveal className="max-w-xs text-sm leading-relaxed text-muted">
                Install once and Claude picks the right skill per step. Or drive
                the whole thing with a single command: /draft-post.
              </p>
            </div>
            <div className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-3">
              {SKILL_PARTS.map((s) => (
                <article
                  key={s.name}
                  data-reveal
                  className="group relative isolate overflow-hidden bg-void p-7 transition-colors duration-500 hover:bg-void-deep"
                >
                  <div
                    className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    style={{
                      background: `radial-gradient(120% 80% at 0% 0%, ${s.color}22, transparent 60%)`,
                    }}
                  />
                  <div className="mb-6 flex items-center justify-between gap-3">
                    <span
                      className="truncate font-mono text-[0.72rem] tracking-[0.06em]"
                      style={{ color: s.color }}
                    >
                      /{s.name}
                    </span>
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: s.color }}
                    />
                  </div>
                  <p className="text-[1.02rem] leading-relaxed text-fg/90">
                    {s.role}
                  </p>
                  <div
                    className="mt-7 h-px w-full origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100"
                    style={{ background: s.color }}
                  />
                </article>
              ))}
              <div className="flex items-center bg-void p-7 sm:col-span-2 lg:col-span-2">
                <p className="font-display text-xl leading-snug text-faint">
                  Plus the renderer: FLUX.2 key art locally, or Higgsfield and
                  FAL.ai in the cloud with per-model cost detection. Remotion
                  reels, cloned-voice narration, word-synced captions, and a
                  gated publisher for YouTube, TikTok, Facebook, and Instagram.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── How to use ───────────────────────────────────────────────── */}
        <section className="border-t border-hairline px-5 py-28 sm:px-8 sm:py-36">
          <div className="mx-auto max-w-[var(--max)]" data-reveal-group>
            <p data-reveal className="kicker mb-5">
              {"// 03 — How to use it"}
            </p>
            <h2
              data-reveal
              className="max-w-2xl font-display text-[clamp(1.8rem,4.5vw,3.2rem)] font-semibold leading-[1.06] text-fg"
            >
              Four moves, start to post.
            </h2>
            <div className="mt-14 grid gap-10 md:grid-cols-2 lg:grid-cols-4">
              {SKILL_STEPS.map((s) => (
                <div key={s.n} data-reveal>
                  <p className="font-mono text-[0.72rem] tracking-[0.2em] text-faint">
                    {s.n}
                  </p>
                  <div className="rule-glow my-5" />
                  <h3 className="font-display text-xl font-semibold text-fg">
                    {s.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted">
                    {s.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Install ──────────────────────────────────────────────────── */}
        <section
          id="install"
          className="border-t border-hairline px-5 py-28 sm:px-8 sm:py-36"
        >
          <div className="mx-auto max-w-[var(--max)]" data-reveal-group>
            <p data-reveal className="kicker mb-5">
              {"// 04 — Install in 60 seconds"}
            </p>
            <h2
              data-reveal
              className="max-w-3xl font-display text-[clamp(1.9rem,5vw,3.4rem)] font-semibold leading-[1.04] text-fg"
            >
              Plug it into <span className="text-ai">your agent.</span>
            </h2>
            <p data-reveal className="mt-6 max-w-xl text-lg text-muted">
              Works in Claude Code, Cursor, Codex, and anything else that reads
              SKILL.md. Pick your setup and follow the three steps.
            </p>
            <div data-reveal className="mt-12">
              <Installer />
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div data-reveal className="flex flex-col gap-4">
                <CodeBlock
                  label="full pipeline — art, voice, reels"
                  code={SKILL.clone}
                />
                <p className="text-sm leading-relaxed text-muted">
                  The whole studio: FLUX.2 backgrounds on an 8 GB consumer GPU,
                  or one flag swaps art to Higgsfield or FAL.ai, with every
                  model's credit cost detected up front and a budget cap per
                  run. VoxCPM2 narration and Remotion reels either way.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────────────── */}
        <section className="border-t border-hairline px-5 py-28 sm:px-8 sm:py-36">
          <div className="mx-auto max-w-[var(--max)]" data-reveal-group>
            <p data-reveal className="kicker mb-5">
              {"// 05 — FAQ"}
            </p>
            <h2
              data-reveal
              className="max-w-2xl font-display text-[clamp(1.8rem,4.5vw,3.2rem)] font-semibold leading-[1.06] text-fg"
            >
              Questions, answered.
            </h2>
            <div
              data-reveal
              className="mt-12 overflow-hidden rounded-2xl border border-hairline"
            >
              {FAQ.map((item) => (
                <details
                  key={item.q}
                  className="group border-b border-hairline bg-void last:border-b-0 open:bg-void-deep"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 px-6 py-5 font-display text-lg font-medium text-fg transition-colors hover:text-ai [&::-webkit-details-marker]:hidden">
                    {item.q}
                    <span className="shrink-0 font-mono text-faint transition-transform duration-300 group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="px-6 pb-6 leading-relaxed text-muted">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden border-t border-hairline px-5 py-32 text-center sm:px-8 sm:py-44">
          <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.5] [background:radial-gradient(60%_50%_at_50%_120%,#f9731633,transparent_70%)]" />
          <div className="mx-auto max-w-[var(--max)]" data-reveal-group>
            <p data-reveal className="kicker mb-8">
              {"// The Mad-Prompter energy, the practitioner standard"}
            </p>
            <h2
              data-reveal
              className="mx-auto max-w-4xl font-display text-[clamp(2.2rem,7vw,5rem)] font-bold leading-[0.98] text-fg"
            >
              We don't chase panic.
              <br />
              <span className="text-faint">We ship evidence.</span>
            </h2>
            <div
              data-reveal
              className="mt-12 flex flex-wrap items-center justify-center gap-4"
            >
              <a
                href={REPO_URL}
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center gap-2.5 rounded-full bg-fg px-7 py-4 font-mono text-[0.8rem] uppercase tracking-[0.14em] text-void-deep no-underline transition-transform duration-300 hover:-translate-y-0.5"
              >
                Star it on GitHub
                <span className="transition-transform duration-300 group-hover:translate-x-1">
                  ↗
                </span>
              </a>
              <a
                href={instagram.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2.5 rounded-full border border-hairline px-7 py-4 font-mono text-[0.8rem] uppercase tracking-[0.14em] text-fg no-underline transition-colors hover:border-fg/40"
              >
                Watch it work
                <span>↗</span>
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
