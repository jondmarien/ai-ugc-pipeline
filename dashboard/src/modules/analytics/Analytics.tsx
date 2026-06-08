import { useMemo, useState } from "react";
import { useApi } from "../../lib/api";
import { Panel } from "../../components/Panel";
import { StatCard } from "../../components/StatCard";
import { StalenessBanner } from "../../components/StalenessBanner";
import { EmptyState } from "../../components/EmptyState";
import { Bars } from "../../components/Bars";
import {
  engagementRate, tierFor, summarize, reelWatchStats,
  dayOfWeekBuckets, hourBuckets, hashtagStats, type MediaItem,
} from "../../lib/analytics";

const SORTS = ["recent", "likes", "comments", "reach", "engagement", "saves", "views"] as const;
type Sort = (typeof SORTS)[number];

const sortFn: Record<Sort, (a: MediaItem, b: MediaItem) => number> = {
  recent: (a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp),
  likes: (a, b) => b.like_count - a.like_count,
  comments: (a, b) => b.comments_count - a.comments_count,
  reach: (a, b) => (b.insights.reach ?? 0) - (a.insights.reach ?? 0),
  engagement: (a, b) => engagementRate(b) - engagementRate(a),
  saves: (a, b) => (b.insights.saved ?? 0) - (a.insights.saved ?? 0),
  views: (a, b) => (b.insights.views ?? 0) - (a.insights.views ?? 0),
};

const tierColor: Record<string, string> = {
  green: "var(--theme-hacking)", accent: "var(--accent)", muted: "var(--muted)",
};

export function Analytics() {
  const account = useApi<any>("/api/ig/account");
  const media = useApi<MediaItem[]>("/api/ig/media");
  const [sort, setSort] = useState<Sort>("recent");
  const items = media.data ?? [];
  const s = useMemo(() => summarize(items), [items]);
  const watch = useMemo(() => reelWatchStats(items), [items]);
  const byEng = useMemo(() => [...items].sort(sortFn.engagement), [items]);
  const days = useMemo(() => dayOfWeekBuckets(items), [items]);
  const hours = useMemo(() => hourBuckets(items), [items]);
  const tags = useMemo(() => hashtagStats(items), [items]);
  const sorted = useMemo(() => [...items].sort(sortFn[sort]), [items, sort]);
  const last20 = useMemo(() => [...items].sort(sortFn.recent).slice(0, 20).reverse(), [items]);

  if (!media.loading && !items.length)
    return (<>
      <StalenessBanner label="IG DATA" error={media.error} fetchedAt={media.fetchedAt} />
      <EmptyState title="NO IG DATA YET" hint="Set up dashboard/.env per the spec prerequisites, then press Refresh." />
    </>);

  return (
    <>
      <h1 className="page-title">Analytics{account.data ? ` · @${account.data.username}` : ""}</h1>
      <StalenessBanner label="IG DATA" error={media.error} fetchedAt={media.fetchedAt} />

      <div className="grid cols-3" style={{ marginBottom: 16 }}>
        <StatCard label="AVG LIKES" value={s.avgLikes.toFixed(0)} />
        <StatCard label="AVG COMMENTS" value={s.avgComments.toFixed(0)} />
        <StatCard label="AVG REACH" value={s.avgReach.toFixed(0)} />
        <StatCard label="AVG SAVES" value={s.avgSaves.toFixed(0)} />
        <StatCard label="ENGAGEMENT RATE" value={`${s.avgEngagement.toFixed(1)}%`} />
        <StatCard label="TOTAL REEL VIEWS" value={s.totalReelViews.toLocaleString()} />
      </div>

      {watch && (
        <div className="grid cols-4" style={{ marginBottom: 16 }}>
          <StatCard label="AVG WATCH TIME" value={`${(watch.avgWatchMs / 1000).toFixed(1)}s`} />
          <StatCard label="TOTAL WATCH TIME" value={`${(watch.totalWatchMs / 60000).toFixed(0)}m`} />
          <StatCard label="REEL VIEWS" value={watch.totalViews.toLocaleString()} />
          <StatCard label="BEST WATCH-TIME REEL" value={`${((watch.best.insights.ig_reels_avg_watch_time ?? 0) / 1000).toFixed(1)}s`}
            sub={watch.best.caption?.slice(0, 40)} />
        </div>
      )}

      <div className="grid cols-3" style={{ marginBottom: 16 }}>
        <Panel>
          <div className="meta-caps">SAVES RATE (BENCHMARK 2%)</div>
          <div className="num">{s.savesRate.toFixed(2)}%</div>
          <p className="meta-caps">SAVES DIVIDED BY REACH. ABOVE 2% MEANS THE ALGORITHM PUSHES IT.</p>
        </Panel>
        <Panel>
          <div className="meta-caps">SHARES RATE (BENCHMARK 1%)</div>
          <div className="num">{s.sharesRate.toFixed(2)}%</div>
          <p className="meta-caps">SHARES DIVIDED BY REACH. ABOVE 1% IS A STRONG DISTRIBUTION SIGNAL.</p>
        </Panel>
        <Panel>
          <div className="meta-caps">ENGAGEMENT · LAST {last20.length} POSTS</div>
          <Bars values={last20.map((m) => m.like_count + m.comments_count)}
            labels={last20.map((m) => m.timestamp.slice(0, 10))} />
        </Panel>
      </div>

      <div className="grid cols-3" style={{ marginBottom: 16 }}>
        <Panel>
          <div className="meta-caps">TOP 3</div>
          {byEng.slice(0, 3).map((m) => <PostRow key={m.id} m={m} />)}
        </Panel>
        <Panel>
          <div className="meta-caps">BOTTOM 3</div>
          {byEng.slice(-3).map((m) => <PostRow key={m.id} m={m} />)}
        </Panel>
        <Panel>
          <div className="meta-caps">BEST DAY / TIME</div>
          <Bars values={Object.values(days).map((v) => v.avgEngagement)}
            labels={Object.entries(days).map(([d, v]) => `${d} · ${v.avgEngagement.toFixed(1)}% · ${v.count} posts`)}
            height={64} />
          <div className="meta-caps">{Object.keys(days).join(" · ")}</div>
          <Bars values={Object.values(hours).map((v) => v.avgEngagement)}
            labels={Object.entries(hours).map(([h, v]) => `${h} · ${v.avgEngagement.toFixed(1)}% · ${v.count} posts`)}
            height={64} />
          <div className="meta-caps">{Object.keys(hours).join(" · ")}</div>
        </Panel>
      </div>

      {tags.length > 0 && (
        <Panel>
          <div className="meta-caps" style={{ marginBottom: 8 }}>HASHTAGS (USED 2+)</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {tags.map((t) => <span key={t.tag} className="chip">{t.tag} · {t.avgEngagement.toFixed(1)}% · {t.count}×</span>)}
          </div>
        </Panel>
      )}

      <div style={{ display: "flex", gap: 8, margin: "16px 0" }}>
        {SORTS.map((k) => (
          <button key={k} className={`chip ${sort === k ? "active" : ""}`} onClick={() => setSort(k)}>{k}</button>
        ))}
      </div>
      <div className="grid cols-4">
        {sorted.map((m) => <Panel key={m.id}><PostRow m={m} full /></Panel>)}
      </div>
    </>
  );
}

function PostRow({ m, full = false }: { m: MediaItem; full?: boolean }) {
  const rate = engagementRate(m);
  return (
    <div style={{ padding: "6px 0" }}>
      <div className="meta-caps">{m.media_type} · {m.timestamp.slice(0, 10)}</div>
      <div style={{ fontSize: 13 }}>{(m.caption ?? "").slice(0, 60)}</div>
      <div className="meta-caps">
        L{m.like_count} C{m.comments_count} {full ? `· R${m.insights.reach ?? 0} · S${m.insights.saved ?? 0} · V${m.insights.views ?? 0}` : ""}
        <span className="chip" style={{ color: tierColor[tierFor(rate)], marginLeft: 8 }}>{rate.toFixed(1)}%</span>
      </div>
      {full && <a href={m.permalink} target="_blank" rel="noreferrer" className="meta-caps">OPEN ON IG</a>}
    </div>
  );
}
