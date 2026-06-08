import { useMemo, useState } from "react";
import { useApi } from "../../lib/api";
import { Panel } from "../../components/Panel";
import type { ScheduleItem } from "../../lib/schedule";

type RenderPkg = { dirName: string; date: string | null; slug: string; slides: string[] };

function monthDays(year: number, month: number): string[] {
  const out: string[] = [];
  const last = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= last; d++) out.push(`${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  return out;
}

export function CalendarView() {
  const renders = useApi<RenderPkg[]>("/api/repo/renders");
  const schedule = useApi<{ items: ScheduleItem[] }>("/api/state/schedule.json");
  const now = new Date();
  const [ym, setYm] = useState<[number, number]>([now.getFullYear(), now.getMonth()]);
  const [openDir, setOpenDir] = useState<string | null>(null);
  // The conditional URL points the hooks at /api/health when closed so hook order stays
  // stable (Rules of Hooks); the typeof guard below stops the health object rendering.
  const caption = useApi<string>(openDir ? `/api/repo/renders/${encodeURIComponent(openDir)}/caption.txt` : "/api/health");
  const sources = useApi<string>(openDir ? `/api/repo/renders/${encodeURIComponent(openDir)}/sources.md` : "/api/health");

  const byDate = useMemo(() => {
    type Slot = { label: string; dir: string | null; kind: "queued" | "posted" | "rendered"; platform: string | null };
    const map = new Map<string, Slot[]>();
    for (const i of schedule.data?.items ?? []) {
      if (i.status === "skipped") continue;
      map.set(i.date, [...(map.get(i.date) ?? []), {
        label: i.renderDir, dir: i.renderDir,
        kind: i.status === "posted" ? "posted" : "queued",
        platform: i.platforms[0] ?? null,
      }]);
    }
    for (const r of renders.data ?? []) {
      if (!r.date) continue; // 'week 1' etc: no grid placement
      if ((map.get(r.date) ?? []).some((s) => s.dir === r.dirName)) continue;
      map.set(r.date, [...(map.get(r.date) ?? []), { label: r.slug, dir: r.dirName, kind: "rendered", platform: null }]);
    }
    return map;
  }, [schedule.data, renders.data]);

  // Platform-colored slot chips: platform picks the hue, posted dims it, rendered-only is muted.
  const platformColor: Record<string, string> = {
    instagram: "var(--theme-purple-team)", tiktok: "var(--theme-hacking)", linkedin: "var(--theme-defensive)",
  };
  const slotColor = (s: { kind: string; platform: string | null }) =>
    s.kind === "rendered" ? "var(--muted)" : (platformColor[s.platform ?? ""] ?? "var(--accent)");

  const openPkg = (renders.data ?? []).find((r) => r.dirName === openDir);

  return (
    <>
      <h1 className="page-title">Content Calendar</h1>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button className="chip" onClick={() => setYm(([y, m]) => (m === 0 ? [y - 1, 11] : [y, m - 1]))}>Prev</button>
        <span className="meta-caps">{ym[0]}-{String(ym[1] + 1).padStart(2, "0")}</span>
        <button className="chip" onClick={() => setYm(([y, m]) => (m === 11 ? [y + 1, 0] : [y, m + 1]))}>Next</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
        {monthDays(ym[0], ym[1]).map((date) => (
          <Panel key={date}>
            <div className="meta-caps">{date.slice(8)}</div>
            {(byDate.get(date) ?? []).map((s, i) => (
              <button key={i} className="chip" style={{ color: slotColor(s), borderColor: slotColor(s), display: "block", marginTop: 4, opacity: s.kind === "posted" ? 0.6 : 1 }}
                onClick={() => s.dir && setOpenDir(s.dir)}>{s.label.slice(0, 18)}</button>
            ))}
          </Panel>
        ))}
      </div>
      {openDir && (
        <Panel>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <strong>{openDir}</strong>
            <button className="chip" onClick={() => setOpenDir(null)}>Close</button>
          </div>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", margin: "12px 0" }}>
            {openPkg?.slides.map((f) => (
              <img key={f} src={`/api/repo/renders/${encodeURIComponent(openDir)}/slide/${encodeURIComponent(f)}`}
                style={{ height: 160, borderRadius: 8 }} alt={f} />
            ))}
          </div>
          <div className="meta-caps">CAPTION</div>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>{typeof caption.data === "string" ? caption.data : ""}</pre>
          <div className="meta-caps">SOURCES</div>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>{typeof sources.data === "string" ? sources.data : ""}</pre>
        </Panel>
      )}
    </>
  );
}
