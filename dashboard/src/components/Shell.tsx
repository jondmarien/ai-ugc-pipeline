import { useQueryClient } from "@tanstack/react-query";
import type { ModuleKey } from "@shared/types";
import { BrandMark } from "../design/primitives/BrandMark";
import { ageLabel, refreshAll, useApi } from "../lib/api";

export const MODULES: { key: ModuleKey; label: string; theme: string }[] = [
  { key: "overview",    label: "Overview",        theme: "theme-defensive" },
  { key: "hooks",       label: "Hook Vault",      theme: "theme-hacking" },
  { key: "analytics",   label: "Analytics",       theme: "theme-defensive" },
  { key: "competitors", label: "Competitors",     theme: "theme-offensive" },
  { key: "scheduler",   label: "Scheduler",       theme: "theme-purple-team" },
  { key: "calendar",    label: "Calendar",        theme: "theme-purple-team" },
  { key: "trending",    label: "What's Trending", theme: "theme-ai" },
];

export function Shell({ active, onNav, children }: {
  active: ModuleKey; onNav: (m: ModuleKey) => void; children: React.ReactNode;
}) {
  const qc = useQueryClient();
  const account = useApi<any>("/api/ig/account");
  const tokenAge = useApi<{ ageDays: number }>("/api/ig/token-age");
  const theme = MODULES.find((m) => m.key === active)!.theme;
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand"><BrandMark style={{ fontSize: 13, letterSpacing: "0.12em" }} /></div>
        {MODULES.map((m) => (
          <button key={m.key} className={`nav-item ${m.theme} ${m.key === active ? "active" : ""}`}
            onClick={() => onNav(m.key)}>{m.label}</button>
        ))}
        <div className="sidebar-footer">
          <button className="chip" onClick={() => refreshAll(qc)}>Refresh</button>
          <span className="meta-caps">IG {ageLabel(account.fetchedAt)}</span>
          <span className="meta-caps" style={tokenAge.data && tokenAge.data.ageDays > 50 ? { color: "var(--danger)" } : undefined}>
            TOKEN {tokenAge.data ? `${tokenAge.data.ageDays}D OLD` : "NOT SET"}
          </span>
        </div>
      </aside>
      <main className={`main ${theme}`}>{children}</main>
    </div>
  );
}
