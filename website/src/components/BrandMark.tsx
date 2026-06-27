import { Link } from "react-router-dom";

/** chron0s = chronos = time. A minimal chrono-ring glyph + wordmark. */
export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      to="/"
      className="group inline-flex items-center gap-3 no-underline"
      aria-label="Chrono's Cyber World of AI — home"
    >
      <span className="relative inline-grid place-items-center">
        <svg width="30" height="30" viewBox="0 0 32 32" fill="none" aria-hidden>
          <circle cx="16" cy="16" r="13" stroke="#2a3548" strokeWidth="1.5" />
          <circle
            cx="16"
            cy="16"
            r="13"
            stroke="url(#bm)"
            strokeWidth="1.5"
            strokeDasharray="22 60"
            strokeLinecap="round"
            className="origin-center transition-transform duration-700 group-hover:rotate-[80deg]"
          />
          <line x1="16" y1="16" x2="16" y2="8" stroke="#f8fafc" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="16" y1="16" x2="21" y2="18" stroke="#a855f7" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="16" cy="16" r="1.6" fill="#f8fafc" />
          <defs>
            <linearGradient id="bm" x1="3" y1="3" x2="29" y2="29">
              <stop stopColor="#ef4444" />
              <stop offset="0.5" stopColor="#39ff88" />
              <stop offset="1" stopColor="#a855f7" />
            </linearGradient>
          </defs>
        </svg>
      </span>
      {!compact && (
        <span className="font-mono text-[0.78rem] uppercase tracking-[0.2em] text-fg">
          chron0s<span className="text-faint">_cyb3r</span>
        </span>
      )}
    </Link>
  );
}
