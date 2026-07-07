import { Link } from "react-router-dom";

/** The terminal prompt >_ in the pillar spectrum + wordmark. */
export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      to="/"
      className="group inline-flex items-center gap-3 no-underline"
      aria-label="Chrono's Cyber World of AI — home"
    >
      <span className="relative inline-grid place-items-center">
        <svg
          width="30"
          height="30"
          viewBox="0 0 32 32"
          fill="none"
          aria-hidden="true"
        >
          <rect
            x="1"
            y="1"
            width="30"
            height="30"
            rx="7"
            stroke="#2a3548"
            strokeWidth="1.5"
          />
          <polyline
            points="9.5,11 16.5,16 9.5,21"
            stroke="url(#bm)"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line
            x1="19"
            y1="21.8"
            x2="24.5"
            y2="21.8"
            stroke="#f8fafc"
            strokeWidth="2.4"
            strokeLinecap="round"
            className="group-hover:animate-pulse"
          />
          <defs>
            <linearGradient
              id="bm"
              x1="9"
              y1="11"
              x2="17"
              y2="21"
              gradientUnits="userSpaceOnUse"
            >
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
