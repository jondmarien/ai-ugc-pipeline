import { BRAND, SOCIALS } from "../lib/content";

export function CTA() {
  return (
    <section className="relative overflow-hidden border-t border-hairline px-5 py-32 sm:px-8 sm:py-44">
      {/* faint spectrum wash echoing the hero field */}
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.5] [background:radial-gradient(60%_50%_at_50%_120%,#a855f733,transparent_70%)]" />
      <div className="mx-auto max-w-[var(--max)] text-center" data-reveal-group>
        <p data-reveal className="kicker mb-8">// The standing offer</p>
        <h2 data-reveal className="mx-auto max-w-4xl font-display text-[clamp(2.2rem,7vw,5rem)] font-bold leading-[0.98] text-fg">
          Threats move fast.
          <br />
          <span className="text-faint">Move with evidence.</span>
        </h2>
        <p data-reveal className="mx-auto mt-7 max-w-md text-lg text-muted">
          {BRAND.promise.join(" ")}
        </p>

        <div data-reveal className="mt-12 flex flex-wrap items-center justify-center gap-4">
          {SOCIALS.map((s, i) => (
            <a
              key={s.key}
              href={s.url}
              target="_blank"
              rel="noreferrer"
              className={`group inline-flex items-center gap-2.5 rounded-full px-7 py-4 font-mono text-[0.8rem] uppercase tracking-[0.14em] no-underline transition-transform duration-300 hover:-translate-y-0.5 ${
                i === 0
                  ? "bg-fg text-void-deep"
                  : "border border-hairline text-fg hover:border-fg/40"
              }`}
            >
              {s.label}
              <span className="transition-transform duration-300 group-hover:translate-x-1">↗</span>
            </a>
          ))}
        </div>
        <p data-reveal className="mt-10 font-mono text-[0.72rem] uppercase tracking-[0.18em] text-faint">
          {BRAND.handle}
        </p>
      </div>
    </section>
  );
}
