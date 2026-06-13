import { useEffect, useState } from "react";
import { BrandMark } from "./BrandMark";
import { SOCIALS } from "../lib/content";

const LINKS = [
  { href: "#thesis", label: "Thesis" },
  { href: "#pillars", label: "Coverage" },
  { href: "#pipeline", label: "Pipeline" },
  { href: "#story", label: "Who" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const tiktok = SOCIALS.find((s) => s.key === "tiktok")!;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${
        scrolled
          ? "border-b border-hairline bg-void-deep/70 backdrop-blur-xl"
          : "border-b border-transparent"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-[var(--max)] items-center justify-between px-5 sm:px-8">
        <BrandMark />
        <div className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="font-mono text-[0.72rem] uppercase tracking-[0.18em] text-muted no-underline transition-colors hover:text-fg"
            >
              {l.label}
            </a>
          ))}
        </div>
        <a
          href={tiktok.url}
          target="_blank"
          rel="noreferrer"
          className="group relative inline-flex items-center gap-2 rounded-full border border-hairline bg-fg/[0.03] px-4 py-2 font-mono text-[0.72rem] uppercase tracking-[0.16em] text-fg no-underline transition-all hover:border-team/60 hover:bg-team/10"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-hacking shadow-[0_0_8px_var(--color-hacking)]" />
          Follow
        </a>
      </nav>
    </header>
  );
}
