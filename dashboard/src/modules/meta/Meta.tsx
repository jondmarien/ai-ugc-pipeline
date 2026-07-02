import type { PublishedMetaPost } from "@shared/types";
import { useMemo, useState } from "react";
import { EmptyState } from "../../components/EmptyState";
import { Panel } from "../../components/Panel";
import { StalenessBanner } from "../../components/StalenessBanner";
import { StatCard } from "../../components/StatCard";
import { useApi } from "../../lib/api";

const PLATFORM_FILTERS = ["all", "facebook", "instagram"] as const;
type PlatformFilter = (typeof PLATFORM_FILTERS)[number];

const POST_TYPE_LABEL: Record<PublishedMetaPost["postType"], string> = {
  reel: "Reel",
  carousel: "Carousel",
  fb_video: "Page video",
};

const PLATFORM_LABEL: Record<PublishedMetaPost["platform"], string> = {
  facebook: "Facebook",
  instagram: "Instagram",
};

function formatDate(publishedAt: number): string {
  return new Date(publishedAt * 1000).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function MetricRow({ post }: { post: PublishedMetaPost }) {
  if (post.insightsError && !post.insights) {
    return (
      <div className="meta-caps" style={{ color: "var(--muted)" }}>
        NO METRICS — {post.insightsError}
      </div>
    );
  }
  const i = post.insights;
  if (!i)
    return (
      <div className="meta-caps" style={{ color: "var(--muted)" }}>
        NO METRICS YET
      </div>
    );
  const entries: Array<[string, number | undefined]> = [
    ["Views", i.views],
    ["Reach", i.reach],
    ["Likes", i.likes],
    ["Comments", i.comments],
    ["Saves", i.saves],
    ["Shares", i.shares],
  ].filter(([, v]) => v !== undefined) as Array<[string, number]>;
  if (!entries.length)
    return (
      <div className="meta-caps" style={{ color: "var(--muted)" }}>
        NO METRICS YET
      </div>
    );
  return (
    <div
      className="meta-caps"
      style={{ display: "flex", gap: 12, flexWrap: "wrap" }}
    >
      {entries.map(([label, value]) => (
        <span key={label}>
          {label.toUpperCase()} {value?.toLocaleString()}
        </span>
      ))}
    </div>
  );
}

function MetaPostCard({ post }: { post: PublishedMetaPost }) {
  return (
    <Panel className="stat-card">
      <div
        className="meta-caps"
        style={{ display: "flex", justifyContent: "space-between" }}
      >
        <span>
          {PLATFORM_LABEL[post.platform]} · {POST_TYPE_LABEL[post.postType]}
        </span>
        <span>{formatDate(post.publishedAt)}</span>
      </div>
      <p style={{ margin: "8px 0" }}>
        {post.caption ? (
          post.caption.slice(0, 140)
        ) : (
          <span style={{ color: "var(--muted)" }}>No caption on file</span>
        )}
      </p>
      <div
        className="meta-caps"
        style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 8 }}
      >
        {post.isAiGenerated && <span>AI DISCLOSED</span>}
        {post.privacy && <span>{post.privacy.toUpperCase()}</span>}
        {post.hashtags.length > 0 && <span>{post.hashtags.length} TAGS</span>}
      </div>
      <MetricRow post={post} />
      {post.url && (
        <p style={{ marginTop: 8 }}>
          <a
            href={post.url}
            target="_blank"
            rel="noreferrer"
            className="meta-caps"
          >
            VIEW ON {PLATFORM_LABEL[post.platform].toUpperCase()} →
          </a>
        </p>
      )}
    </Panel>
  );
}

export function Meta() {
  const posts = useApi<PublishedMetaPost[]>("/api/meta/insights");
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("all");

  const items = posts.data ?? [];
  const filtered = useMemo(
    () =>
      items.filter(
        (p) => platformFilter === "all" || p.platform === platformFilter,
      ),
    [items, platformFilter],
  );

  const noCredentials = !!posts.error && /publish:auth meta/i.test(posts.error);

  if (!posts.loading && items.length === 0) {
    return (
      <>
        <StalenessBanner
          label="META DATA"
          error={posts.error}
          fetchedAt={posts.fetchedAt}
        />
        <EmptyState
          title={
            noCredentials
              ? "META NOT CONNECTED YET"
              : "NO PUBLISHED META POSTS YET"
          }
          hint={
            noCredentials
              ? "Run `bun run publish:auth meta` in renderer/ to link your Facebook Page and Instagram account, then press Refresh."
              : "Publish a post to Facebook or Instagram via `bun run publish` — it'll show up here once publish.state.json records it."
          }
        />
      </>
    );
  }

  return (
    <>
      <h1 className="page-title">Meta (Facebook + Instagram)</h1>
      <StalenessBanner
        label="META DATA"
        error={posts.error}
        fetchedAt={posts.fetchedAt}
      />

      <div className="grid cols-3" style={{ marginBottom: 16 }}>
        <StatCard label="PUBLISHED POSTS" value={items.length} />
        <StatCard
          label="FACEBOOK"
          value={items.filter((p) => p.platform === "facebook").length}
        />
        <StatCard
          label="INSTAGRAM"
          value={items.filter((p) => p.platform === "instagram").length}
        />
      </div>

      <div
        className="meta-caps"
        style={{ display: "flex", gap: 8, marginBottom: 16 }}
      >
        {PLATFORM_FILTERS.map((f) => (
          <button
            key={f}
            className={`chip ${f === platformFilter ? "active" : ""}`}
            onClick={() => setPlatformFilter(f)}
            type="button"
          >
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="grid cols-3">
        {filtered.map((post) => (
          <MetaPostCard
            key={`${post.platform}-${post.mediaId ?? post.renderDir}`}
            post={post}
          />
        ))}
      </div>
    </>
  );
}
