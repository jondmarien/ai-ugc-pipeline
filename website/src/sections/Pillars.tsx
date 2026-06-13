import { PILLARS } from "../lib/content";

export function Pillars() {
  return (
    <section id="pillars" className="relative border-t border-hairline px-5 py-28 sm:px-8 sm:py-36">
      <div className="mx-auto max-w-[var(--max)]" data-reveal-group>
        <div className="mb-14 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p data-reveal className="kicker mb-5">// 02 — Coverage</p>
            <h2 data-reveal className="max-w-2xl font-display text-[clamp(1.8rem,4.5vw,3.2rem)] font-semibold leading-[1.06] text-fg">
              Five lanes. Each one wears a color.
            </h2>
          </div>
          <p data-reveal className="max-w-xs text-sm leading-relaxed text-muted">
            The color tells you the angle before you read a word. Chosen per post from the content itself, never to chase a feeling.
          </p>
        </div>

        <div className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map((p) => (
            <article
              key={p.key}
              data-reveal
              className="group relative isolate overflow-hidden bg-void p-7 transition-colors duration-500 hover:bg-void-deep"
              style={{ ["--c" as string]: p.color }}
            >
              {/* color wash on hover */}
              <div
                className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{ background: `radial-gradient(120% 80% at 0% 0%, ${p.hex}22, transparent 60%)` }}
              />
              <div className="mb-6 flex items-center justify-between">
                <span
                  className="font-mono text-[0.72rem] uppercase tracking-[0.2em] transition-colors"
                  style={{ color: p.hex }}
                >
                  {p.label}
                </span>
                <span
                  className="h-2.5 w-2.5 rounded-full transition-shadow duration-500"
                  style={{ background: p.hex, boxShadow: `0 0 0 ${p.hex}` }}
                />
              </div>
              <p className="text-[1.02rem] leading-relaxed text-fg/90">{p.when}</p>
              <div
                className="mt-7 h-px w-full origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100"
                style={{ background: p.hex }}
              />
            </article>
          ))}
          {/* trailing cell: the rule */}
          <div className="flex items-center bg-void p-7">
            <p className="font-display text-xl leading-snug text-faint">
              One accent per idea. The system is the brand.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
