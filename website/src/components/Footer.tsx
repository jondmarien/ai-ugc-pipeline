import { Link } from "react-router-dom";
import { BrandMark } from "./BrandMark";
import { BRAND, SOCIALS } from "../lib/content";

export function Footer() {
  return (
    <footer className="relative border-t border-hairline px-5 pb-10 pt-16 sm:px-8">
      <div className="mx-auto grid max-w-[var(--max)] gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <BrandMark />
          <p className="mt-5 max-w-xs font-display text-2xl leading-tight text-fg">
            Stay curious, and&nbsp;maybe a&nbsp;little&nbsp;paranoid.
          </p>
          <p className="mt-4 max-w-sm text-sm text-muted">{BRAND.positioning}</p>
        </div>

        <div>
          <p className="kicker mb-4">Follow</p>
          <ul className="space-y-2.5">
            {SOCIALS.map((s) => (
              <li key={s.key}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group inline-flex items-center gap-2 text-fg no-underline transition-colors hover:text-hacking"
                >
                  <span className="font-mono text-xs text-faint transition-colors group-hover:text-hacking">↗</span>
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="kicker mb-4">Site</p>
          <ul className="space-y-2.5">
            <li>
              <Link to="/terms" className="text-fg no-underline transition-colors hover:text-defensive">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link to="/privacy" className="text-fg no-underline transition-colors hover:text-defensive">
                Privacy Policy
              </Link>
            </li>
            <li>
              <a
                href={`mailto:${BRAND.contact}`}
                className="text-fg no-underline transition-colors hover:text-defensive"
              >
                {BRAND.contact}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-14 flex max-w-[var(--max)] flex-col gap-2 border-t border-hairline pt-6 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-faint sm:flex-row sm:items-center sm:justify-between">
        <span>© {new Date().getFullYear()} {BRAND.domain}</span>
        <span className="text-muted/70">Built with the pipeline it documents.</span>
      </div>
    </footer>
  );
}
