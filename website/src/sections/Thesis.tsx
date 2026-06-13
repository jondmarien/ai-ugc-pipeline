export function Thesis() {
  return (
    <section id="thesis" className="relative mx-auto max-w-[var(--max)] px-5 py-28 sm:px-8 sm:py-40">
      <div data-reveal-group>
        <p data-reveal className="kicker mb-10">// 01 — The thesis</p>

        <h2
          data-reveal
          className="font-display text-[clamp(2rem,5.5vw,4rem)] font-semibold leading-[1.04] text-fg"
        >
          AI changed both sides of security at&nbsp;once.{" "}
          <span className="text-faint line-through decoration-offensive/60 decoration-2">
            Most coverage picked panic.
          </span>{" "}
          <span className="bg-gradient-to-r from-hacking to-defensive bg-clip-text text-transparent">
            I picked evidence.
          </span>
        </h2>

        {/* offense ↔ defense → purple-team duality strip */}
        <div data-reveal className="mt-16 grid gap-px overflow-hidden rounded-xl border border-hairline sm:grid-cols-3">
          {[
            { k: "Attack", c: "var(--color-offensive)", t: "What AI makes faster, cheaper, and harder to spot." },
            { k: "Where they meet", c: "var(--color-team)", t: "Emulate the offense to actually build the defense." },
            { k: "Defense", c: "var(--color-defensive)", t: "The detections and controls that hold up to it." },
          ].map((col) => (
            <div key={col.k} className="bg-fg/[0.015] p-7">
              <div className="mb-3 flex items-center gap-2.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: col.c, boxShadow: `0 0 12px ${col.c}` }}
                />
                <span className="font-mono text-[0.72rem] uppercase tracking-[0.18em] text-fg">{col.k}</span>
              </div>
              <p className="text-[0.95rem] leading-relaxed text-muted">{col.t}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
