import { useApi } from "../../lib/api";
import { StatCard } from "../../components/StatCard";
import { Panel } from "../../components/Panel";
import { StalenessBanner } from "../../components/StalenessBanner";
import { summarize, type MediaItem } from "../../lib/analytics";

const weekAgo = () => Date.now() - 7 * 86_400_000;

export function Overview() {
  const account = useApi<any>("/api/ig/account");
  const media = useApi<MediaItem[]>("/api/ig/media");
  const posts = useApi<any[]>("/api/repo/posts");
  const hooks = useApi<any[]>("/api/repo/hooks");
  const ingested = useApi<any[]>("/api/repo/ingested");
  const schedule = useApi<{ items: any[] }>("/api/state/schedule.json");
  const meta = useApi<any>("/api/state/hooks-meta.json");
  const trends = useApi<{ items: any[] }>("/api/trends");

  const items = media.data ?? [];
  const recent = items.filter((m) => Date.parse(m.timestamp) > weekAgo());
  const views7d = recent.reduce((a, m) => a + (m.insights.views ?? 0), 0);
  const rendered7d = (posts.data ?? []).filter((p) => Date.parse(p.date) > weekAgo()).length;
  const nextSlots = (schedule.data?.items ?? []).filter((i) => i.status === "queued").slice(0, 3);
  const hooksNew7d = (hooks.data ?? []).filter((h) => h.lastUsed && Date.parse(h.lastUsed) > weekAgo()).length;
  const watchlistCount = (meta.data?.watchlist ?? []).length;
  const hookWorthy = Object.values(meta.data?.trendTags ?? {}).filter((t) => t === "hook").length;
  const s = summarize(items);

  return (
    <>
      <h1 className="page-title">
        Hey Jon. {account.data ? `@${account.data.username} is at ${account.data.followers_count} followers.` : "IG data is loading."}
      </h1>
      <StalenessBanner label="IG DATA" error={media.error} fetchedAt={media.fetchedAt} />
      <div className="grid cols-3" style={{ marginBottom: 16 }}>
        <StatCard label="IG VIEWS · 7D" value={views7d.toLocaleString()} />
        <StatCard label="AVG ENGAGEMENT" value={`${s.avgEngagement.toFixed(1)}%`} />
        <StatCard label="POSTS RENDERED · 7D" value={rendered7d} />
      </div>
      <div className="grid cols-4">
        <Panel><div className="meta-caps">HOOK VAULT</div><div className="num">{hooks.data?.length ?? 0}</div>
          <div className="meta-caps">{hooksNew7d} USED THIS WEEK</div></Panel>
        <Panel><div className="meta-caps">WATCHLIST</div><div className="num">{watchlistCount}</div>
          <div className="meta-caps">{ingested.data?.length ?? 0} INGESTED · LAST {ingested.data?.[0]?.date ?? "NONE"}</div></Panel>
        <Panel><div className="meta-caps">QUEUED SLOTS</div><div className="num">{nextSlots.length}</div>
          {nextSlots.map((i) => <div key={i.id} className="meta-caps">{i.date} {i.time}</div>)}</Panel>
        <Panel><div className="meta-caps">HOOK-WORTHY TRENDS</div><div className="num">{hookWorthy}</div>
          <div className="meta-caps">OF {trends.data?.items?.length ?? 0} ITEMS</div></Panel>
      </div>
    </>
  );
}
