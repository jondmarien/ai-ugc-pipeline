import { useMemo, useState } from "react";
import { useApi, useStateFile } from "../../lib/api";
import { Panel } from "../../components/Panel";
import { EmptyState } from "../../components/EmptyState";

type HookRow = { id: string; text: string; sources: string[]; timesUsed: number; lastUsed: string | null };
// hooks-meta.json is SHARED: HookVault owns `hooks`, Competitors owns `watchlist`,
// Trending owns `trendTags`. Every save() must spread the full current value.
export type HooksMeta = {
  hooks: Record<string, { type?: string }>;
  watchlist?: string[];
  trendTags?: Record<string, "hook" | "explainer" | "skip">;
};
const TYPES = ["swap", "build", "claim", "list", "contrarian"] as const;
// Repo pillar vocabulary is UNDERSCORED (see DRAFT_POST_REFERENCE.md + posts JSON `pillar` field).
export const PILLARS = ["offensive_ai", "model_security", "data_leakage", "defensive_ai", "governance", "myth_busting"];

export function HookVault() {
  const hooks = useApi<HookRow[]>("/api/repo/hooks");
  const meta = useStateFile<HooksMeta>("hooks-meta.json");
  const [q, setQ] = useState("");
  const [srcFilter, setSrcFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const tags = meta.data?.hooks ?? {};

  const rows = useMemo(() => (hooks.data ?? []).filter((r) =>
    (!q || r.text.toLowerCase().includes(q.toLowerCase())) &&
    (!srcFilter || r.sources.includes(srcFilter)) &&
    (!typeFilter || tags[r.id]?.type === typeFilter)
  ), [hooks.data, q, srcFilter, typeFilter, tags]);

  const setTag = (id: string, type: string) => {
    meta.save({ ...(meta.data ?? { hooks: {} }), hooks: { ...tags, [id]: { ...tags[id], type } } });
  };
  const use = (text: string) => {
    const pillar = window.prompt(`Pillar? (${PILLARS.join(" | ")})`, PILLARS[1]) ?? PILLARS[1];
    navigator.clipboard.writeText(`/draft-post ${text} | ${pillar}`);
  };

  if (!hooks.loading && !hooks.data?.length)
    return <EmptyState title="HOOK VAULT EMPTY" hint="Hooks appear here once posts, ingested docs, or CAPTION_BANK entries exist." />;

  return (
    <>
      <h1 className="page-title">Hook Vault</h1>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search hooks"
          style={{ background: "var(--panel)", border: "1px solid var(--hairline)", borderRadius: 999, padding: "8px 16px", color: "var(--fg)" }} />
        {["post", "ingested", "caption-bank"].map((s) => (
          <button key={s} className={`chip ${srcFilter === s ? "active" : ""}`}
            onClick={() => setSrcFilter(srcFilter === s ? null : s)}>{s}</button>
        ))}
        {TYPES.map((t) => (
          <button key={t} className={`chip ${typeFilter === t ? "active" : ""}`}
            onClick={() => setTypeFilter(typeFilter === t ? null : t)}>{t}</button>
        ))}
      </div>
      {rows.map((r) => (
        <Panel key={r.id}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center" }}>
            <div>
              <div>{r.text}</div>
              <div className="meta-caps">
                {r.sources.join(" · ")} · USED {r.timesUsed}× {r.lastUsed ? `· LAST ${r.lastUsed}` : ""}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <select value={tags[r.id]?.type ?? ""} onChange={(e) => setTag(r.id, e.target.value)}
                style={{ background: "var(--panel)", color: "var(--fg)", border: "1px solid var(--hairline)", borderRadius: 8, padding: 4 }}>
                <option value="">type</option>
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <button className="chip" onClick={() => use(r.text)}>Use this</button>
            </div>
          </div>
        </Panel>
      ))}
    </>
  );
}
