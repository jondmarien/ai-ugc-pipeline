import { PIPELINE } from "../lib/content";

export function Pipeline() {
  return (
    <section id="pipeline" className="relative border-t border-hairline px-5 py-28 sm:px-8 sm:py-36">
      <div className="mx-auto max-w-[var(--max)]" data-reveal-group>
        <p data-reveal className="kicker mb-5">// 03 — How it's made</p>
        <h2 data-reveal className="mb-4 max-w-3xl font-display text-[clamp(1.8rem,4.5vw,3.2rem)] font-semibold leading-[1.06] text-fg">
          I build the tools I post about.
        </h2>
        <p data-reveal className="mb-16 max-w-xl text-base leading-relaxed text-muted">
          This site, the renderer, the publisher: same pipeline. Every post runs the same four gates before it ships.
        </p>

        <ol className="relative grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline lg:grid-cols-4">
          {PIPELINE.map((step, i) => (
            <li key={step.n} data-reveal className="group relative bg-void p-7 transition-colors hover:bg-void-deep">
              <div className="mb-5 flex items-baseline justify-between">
                <span className="font-display text-5xl font-bold text-fg/10 transition-colors group-hover:text-defensive/30">
                  {step.n}
                </span>
                {i < PIPELINE.length - 1 && (
                  <span className="font-mono text-faint transition-transform duration-300 group-hover:translate-x-1">→</span>
                )}
              </div>
              <h3 className="mb-3 font-mono text-[0.8rem] uppercase tracking-[0.18em] text-fg">{step.title}</h3>
              <p className="text-[0.92rem] leading-relaxed text-muted">{step.body}</p>
            </li>
          ))}
        </ol>

        <p data-reveal className="mt-8 font-mono text-[0.72rem] uppercase tracking-[0.16em] text-faint">
          No fabricated CVEs · sourced or labeled scenario · a concrete defender takeaway, every time.
        </p>
      </div>
    </section>
  );
}
