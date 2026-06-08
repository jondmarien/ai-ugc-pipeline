import { useApi, useStateFile } from "../../lib/api";
import { Panel } from "../../components/Panel";
import { StalenessBanner } from "../../components/StalenessBanner";
import { EmptyState } from "../../components/EmptyState";
import { PILLARS, type HooksMeta } from "../hooks/HookVault";

type TrendItem = { title: string; url: string; publishedAt: number; sourceLabel: string };
type Trends = { items: TrendItem[]; deadSources: string[] };
type Tag = "hook" | "explainer" | "skip";

export function Trending() {
  const trends = useApi<Trends>("/api/trends");
  const meta = useStateFile<HooksMeta>("hooks-meta.json");
  const tags = meta.data?.trendTags ?? {};

  const setTag = (url: string, t: Tag) => {
    meta.save({ ...(meta.data ?? { hooks: {} }), trendTags: { ...tags, [url]: t } });
  };
  const hookThis = (title: string) => {
    const pillar = window.prompt(`Pillar? (${PILLARS.join(" | ")})`, PILLARS[1]) ?? PILLARS[1];
    navigator.clipboard.writeText(`/draft-post ${title} | ${pillar}`);
  };

  const items = (trends.data?.items ?? []).filter((i) => tags[i.url] !== "skip");

  return (
    <>
      <h1 className="page-title">What's Trending</h1>
      <StalenessBanner label="TRENDS" error={trends.error} fetchedAt={trends.fetchedAt} />
      {(trends.data?.deadSources?.length ?? 0) > 0 && (
        <p className="meta-caps" style={{ color: "var(--danger)" }}>
          DEAD SOURCES: {trends.data!.deadSources.join(", ")}. EDIT data/sources.json TO FIX OR DISABLE.
        </p>
      )}
      {!trends.loading && items.length === 0 && (
        <EmptyState title="NO TRENDING ITEMS" hint="Enable sources in data/sources.json and press Refresh." />
      )}
      {items.map((i) => (
        <Panel key={i.url}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
            <div>
              <a href={i.url} target="_blank" rel="noreferrer">{i.title}</a>
              <div className="meta-caps">{i.sourceLabel} · {new Date(i.publishedAt).toISOString().slice(0, 10)}</div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {(["hook", "explainer", "skip"] as Tag[]).map((t) => (
                <button key={t} className={`chip ${tags[i.url] === t ? "active" : ""}`} onClick={() => setTag(i.url, t)}>{t}</button>
              ))}
              <button className="chip" onClick={() => hookThis(i.title)}>Hook this</button>
            </div>
          </div>
        </Panel>
      ))}
    </>
  );
}
