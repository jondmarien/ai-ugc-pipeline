import { useEffect, useMemo, useState } from "react";
import { useApi, useStateFile } from "../../lib/api";
import { Panel } from "../../components/Panel";
import { EmptyState } from "../../components/EmptyState";
import type { HooksMeta } from "../hooks/HookVault";

type Doc = { fileName: string; date: string | null; title: string; handle: string | null; sourceUrl: string | null; mtimeMs: number };

export function Competitors() {
  const ingested = useApi<Doc[]>("/api/repo/ingested");
  const meta = useStateFile<HooksMeta>("hooks-meta.json");
  const watchlist = meta.data?.watchlist ?? [];
  const [input, setInput] = useState("");
  const lastVisit = useMemo(() => Number(localStorage.getItem("competitors-last-visit") ?? 0), []);
  useEffect(() => { localStorage.setItem("competitors-last-visit", String(Date.now())); }, []);

  const groups = useMemo(() => {
    const map = new Map<string, Doc[]>();
    for (const d of ingested.data ?? []) {
      const k = d.handle ?? "unattributed";
      map.set(k, [...(map.get(k) ?? []), d]);
    }
    return map;
  }, [ingested.data]);

  const save = (next: string[]) => meta.save({ ...(meta.data ?? { hooks: {} }), watchlist: next });
  const add = () => {
    const h = input.trim().startsWith("@") ? input.trim() : `@${input.trim()}`;
    if (h.length > 1 && !watchlist.includes(h)) save([...watchlist, h]);
    setInput("");
  };
  const queueIngest = () => {
    const url = window.prompt("Instagram post URL to ingest?");
    if (url) navigator.clipboard.writeText(`/ingest-post ${url}`);
  };

  const allHandles = [...new Set([...watchlist, ...groups.keys()])];

  return (
    <>
      <h1 className="page-title">Competitor Tracker</h1>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="@handle"
          onKeyDown={(e) => e.key === "Enter" && add()}
          style={{ background: "var(--panel)", border: "1px solid var(--hairline)", borderRadius: 999, padding: "8px 16px", color: "var(--fg)" }} />
        <button className="chip" onClick={add}>Watch</button>
        <button className="chip" onClick={queueIngest}>Queue ingest</button>
      </div>
      {allHandles.length === 0 && (
        <EmptyState title="NO CREATORS TRACKED" hint="Add a handle to the watchlist, then ingest their posts with /ingest-post." />
      )}
      {allHandles.map((h) => {
        const docs = (groups.get(h) ?? []).sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
        const fresh = docs.filter((d) => d.mtimeMs > lastVisit).length;
        return (
          <Panel key={h}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <strong>{h}</strong>
                <div className="meta-caps">
                  {docs.length} INGESTED {fresh > 0 ? `· ${fresh} NEW` : ""} {docs[0]?.date ? `· LAST ${docs[0].date}` : "· NEVER INGESTED"}
                </div>
              </div>
              {watchlist.includes(h) && (
                <button className="chip" onClick={() => save(watchlist.filter((w) => w !== h))}>Unwatch</button>
              )}
            </div>
            {docs.map((d) => (
              <div key={d.fileName} className="meta-caps" style={{ paddingTop: 6 }}>
                {d.date} · {d.title} {d.sourceUrl ? <a href={d.sourceUrl} target="_blank" rel="noreferrer">SOURCE</a> : null}
              </div>
            ))}
          </Panel>
        );
      })}
    </>
  );
}
