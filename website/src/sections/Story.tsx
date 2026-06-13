import { STORY } from "../lib/content";

export function Story() {
  return (
    <section id="story" className="relative border-t border-hairline px-5 py-28 sm:px-8 sm:py-36">
      <div className="mx-auto grid max-w-[var(--max)] gap-14 lg:grid-cols-[1fr_1.1fr]" data-reveal-group>
        <div>
          <p data-reveal className="kicker mb-5">// 04 — Who's behind it</p>
          <h2 data-reveal className="font-display text-[clamp(1.9rem,5vw,3.6rem)] font-semibold leading-[1.04] text-fg">
            Jon, who goes by{" "}
            <span className="bg-gradient-to-r from-ai to-team bg-clip-text text-transparent">chrono</span>.
          </h2>
          <p data-reveal className="mt-6 max-w-md text-base leading-relaxed text-muted">
            Got into security by doing it. The account exists because AI changed both sides at once and most coverage chose noise. This is the evidence version.
          </p>
        </div>

        <ul className="flex flex-col justify-center gap-px self-center overflow-hidden rounded-xl border border-hairline">
          {STORY.map((line, i) => (
            <li
              key={line}
              data-reveal
              className="flex items-start gap-4 bg-fg/[0.015] px-6 py-5 transition-colors hover:bg-fg/[0.04]"
            >
              <span className="mt-0.5 font-mono text-[0.7rem] text-faint">{String(i + 1).padStart(2, "0")}</span>
              <span className="text-[1.02rem] leading-snug text-fg/90">{line}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
