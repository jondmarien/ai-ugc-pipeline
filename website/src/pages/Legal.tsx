import { Link } from "react-router-dom";
import { Nav } from "../components/Nav";
import { Footer } from "../components/Footer";
import { LEGAL } from "../lib/legal";
import { BRAND } from "../lib/content";

export function Legal({ doc }: { doc: "terms" | "privacy" }) {
  const d = LEGAL[doc];
  return (
    <div>
      <Nav />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-36 sm:px-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 font-mono text-[0.72rem] uppercase tracking-[0.16em] text-faint no-underline transition-colors hover:text-fg"
        >
          ← Back
        </Link>

        <p className="kicker mt-10 mb-4">{BRAND.name}</p>
        <h1 className="font-display text-[clamp(2.2rem,6vw,3.4rem)] font-bold leading-tight text-fg">
          {d.title}
        </h1>
        <p className="mt-3 font-mono text-[0.72rem] uppercase tracking-[0.16em] text-faint">
          Last updated {d.updated}
        </p>

        <div className="rule-glow my-9" />

        <p className="text-[1.05rem] leading-relaxed text-muted">{d.intro}</p>

        <div className="mt-12 space-y-11">
          {d.blocks.map((b) => (
            <section key={b.h}>
              <h2 className="mb-4 font-mono text-[0.78rem] uppercase tracking-[0.18em] text-fg">{b.h}</h2>
              {b.p?.map((para) => (
                <p key={para} className="mb-3 leading-relaxed text-muted">
                  {para}
                </p>
              ))}
              {b.ul && (
                <ul className="mt-2 space-y-2.5">
                  {b.ul.map((li) => (
                    <li key={li} className="flex gap-3 leading-relaxed text-muted">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-team" />
                      <span>{li}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
