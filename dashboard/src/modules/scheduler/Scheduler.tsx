import { useApi, useStateFile } from "../../lib/api";
import { Panel } from "../../components/Panel";
import { EmptyState } from "../../components/EmptyState";
import { transition, type ScheduleItem } from "../../lib/schedule";

type RenderPkg = { dirName: string; date: string | null; slug: string; hasCaption: boolean; hasReel: boolean };
const PLATFORMS = ["instagram", "tiktok", "linkedin"];

export function Scheduler() {
  const renders = useApi<RenderPkg[]>("/api/repo/renders");
  const schedule = useStateFile<{ items: ScheduleItem[] }>("schedule.json");
  const items = schedule.data?.items ?? [];

  const persist = (next: ScheduleItem[]) => schedule.save({ items: next });

  const queue = (pkg: RenderPkg) => {
    const date = window.prompt("Date (YYYY-MM-DD)?", pkg.date ?? "") ?? "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
    const time = window.prompt("Time (HH:MM)?", "18:00") ?? "18:00";
    persist([...items, {
      id: `${pkg.dirName}-${Date.now()}`, renderDir: pkg.dirName,
      date, time, platforms: ["instagram"], status: "queued",
    }]);
  };
  const move = (id: string, to: "posted" | "skipped") =>
    persist(items.map((i) => (i.id === id ? transition(i, to) : i)));
  const togglePlatform = (id: string, p: string) =>
    persist(items.map((i) => i.id === id
      ? { ...i, platforms: i.platforms.includes(p) ? i.platforms.filter((x) => x !== p) : [...i.platforms, p] }
      : i));

  const unqueued = (renders.data ?? []).filter((r) => !items.some((i) => i.renderDir === r.dirName && i.status === "queued"));

  return (
    <>
      <h1 className="page-title">Scheduler</h1>
      <p className="meta-caps">PLANNING QUEUE ONLY. NOTHING HERE PUBLISHES ANYWHERE.</p>
      <Panel>
        <div className="meta-caps" style={{ marginBottom: 8 }}>RENDERED PACKAGES</div>
        {unqueued.length === 0 && <span className="meta-caps">ALL PACKAGES QUEUED OR NONE RENDERED.</span>}
        {unqueued.map((r) => (
          <div key={r.dirName} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
            <span>{r.dirName} {r.hasReel ? "· reel" : ""} {r.hasCaption ? "· caption" : ""}</span>
            <button className="chip" onClick={() => queue(r)}>Queue</button>
          </div>
        ))}
      </Panel>
      {items.length === 0
        ? <EmptyState title="QUEUE EMPTY" hint="Queue a rendered package above to plan its posting slot." />
        : items.map((i) => (
          <Panel key={i.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div>
                <strong>{i.renderDir}</strong>
                <div className="meta-caps">{i.date} {i.time} · {i.status.toUpperCase()}{i.postedAt ? ` AT ${i.postedAt.slice(0, 16)}` : ""}</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {PLATFORMS.map((p) => (
                  <button key={p} className={`chip ${i.platforms.includes(p) ? "active" : ""}`}
                    onClick={() => togglePlatform(i.id, p)} disabled={i.status !== "queued"}>{p}</button>
                ))}
                {i.status === "queued" && <>
                  <button className="chip" onClick={() => move(i.id, "posted")}>Mark posted</button>
                  <button className="chip" onClick={() => move(i.id, "skipped")}>Skip</button>
                </>}
              </div>
            </div>
          </Panel>
        ))}
    </>
  );
}
