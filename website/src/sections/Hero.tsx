import { Suspense, lazy, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Scramble } from "../components/Scramble";
import { prefersReducedMotion } from "../lib/motion";
import { BRAND, SOCIALS } from "../lib/content";

// Code-split the three.js bundle so the page paints before it loads.
const HeroCanvas = lazy(() =>
  import("../three/HeroCanvas").then((m) => ({ default: m.HeroCanvas })),
);

export function Hero() {
  const root = useRef<HTMLElement>(null);
  const reduced = prefersReducedMotion();
  const tiktok = SOCIALS.find((s) => s.key === "tiktok")!;
  const [visible, setVisible] = useState(true);

  // Pause the WebGL render loop once the hero scrolls out of view.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.04 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (reduced || !root.current) return;
    const ctx = gsap.context(() => {
      gsap.set("[data-h]", { opacity: 0, y: 26 });
      gsap
        .timeline({ delay: 0.15 })
        .to("[data-h='kick']", { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" })
        .to("[data-h='sub']", { opacity: 1, y: 0, duration: 0.9, ease: "power3.out" }, 0.9)
        .to("[data-h='cta']", { opacity: 1, y: 0, duration: 0.9, ease: "power3.out" }, 1.1)
        .to("[data-h='cue']", { opacity: 1, y: 0, duration: 0.8 }, 1.4);
    }, root);
    return () => ctx.revert();
  }, [reduced]);

  return (
    <section ref={root} className="relative min-h-[100svh] w-full overflow-hidden">
      {/* three.js signal field */}
      <div className="absolute inset-0">
        <Suspense fallback={null}>
          <HeroCanvas reduced={reduced} visible={visible} />
        </Suspense>
      </div>
      {/* readability + atmosphere gradients over the canvas */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_-10%,transparent_40%,#05070d_88%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-void-deep via-void-deep/70 to-transparent" />

      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-[var(--max)] flex-col justify-center px-5 pb-20 pt-28 sm:px-8">
        <p data-h="kick" className="kicker mb-7 flex items-center gap-3">
          <span className="h-px w-8 bg-faint/60" />
          {BRAND.handle} · AI × Cybersecurity
        </p>

        <h1 className="font-display text-[clamp(2.7rem,9vw,6.4rem)] font-bold text-fg">
          <span className="block">
            <Scramble text="Real threats." delay={250} />
          </span>
          <span className="block">
            <Scramble text="Real tools." delay={650} />
          </span>
          <span className="block text-transparent [-webkit-text-stroke:1.5px_var(--color-offensive)]">
            <Scramble text="No fake panic." delay={1050} />
          </span>
        </h1>

        <p data-h="sub" className="mt-8 max-w-xl text-lg leading-relaxed text-muted sm:text-xl">
          {BRAND.positioning}
        </p>

        <div data-h="cta" className="mt-10 flex flex-wrap items-center gap-4">
          <a
            href={tiktok.url}
            target="_blank"
            rel="noreferrer"
            className="group relative inline-flex items-center gap-2.5 rounded-full bg-fg px-7 py-3.5 font-mono text-[0.8rem] font-medium uppercase tracking-[0.14em] text-void-deep no-underline transition-transform duration-300 hover:-translate-y-0.5"
          >
            Follow the work
            <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </a>
          <a
            href="#pipeline"
            className="inline-flex items-center gap-2 rounded-full border border-hairline px-7 py-3.5 font-mono text-[0.8rem] uppercase tracking-[0.14em] text-fg no-underline transition-colors hover:border-fg/40"
          >
            See how it's made
          </a>
        </div>

        <div
          data-h="cue"
          className="absolute bottom-8 left-5 flex items-center gap-3 font-mono text-[0.66rem] uppercase tracking-[0.24em] text-faint sm:left-8"
        >
          <span className="inline-block h-8 w-px animate-pulse bg-gradient-to-b from-faint to-transparent" />
          Scroll
        </div>
      </div>
    </section>
  );
}
