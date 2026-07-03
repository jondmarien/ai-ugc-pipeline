import type { IgComment } from "@shared/types";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { EmptyState } from "../../components/EmptyState";
import { Panel } from "../../components/Panel";
import { StalenessBanner } from "../../components/StalenessBanner";
import type { MediaItem } from "../../lib/analytics";
import { useApi } from "../../lib/api";

async function action(
  path: string,
  method: "POST" | "DELETE",
  body?: unknown,
): Promise<{ error: string | null }> {
  try {
    const res = await fetch(path, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const j = await res.json();
    return { error: j.error ?? null };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

export function Comments() {
  const media = useApi<MediaItem[]>("/api/ig/media");
  const items = media.data ?? [];
  const [selected, setSelected] = useState<string | null>(null);
  const mediaId = selected ?? items[0]?.id ?? "";
  const qc = useQueryClient();
  const commentsKey = ["api", `/api/comments/${mediaId}`] as const;
  const comments = useApi<IgComment[]>(`/api/comments/${mediaId}`);
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const refresh = () => qc.invalidateQueries({ queryKey: commentsKey });

  const run = async (
    id: string,
    fn: () => Promise<{ error: string | null }>,
  ) => {
    setBusy(id);
    const { error } = await fn();
    setLastError(error);
    setBusy(null);
    if (!error) refresh();
  };

  if (!media.loading && !items.length)
    return (
      <>
        <StalenessBanner
          label="IG DATA"
          error={media.error}
          fetchedAt={media.fetchedAt}
        />
        <EmptyState
          title="NO POSTS YET"
          hint="Publish something first, then moderate comments here."
        />
      </>
    );

  return (
    <>
      <h1 className="page-title">Comments</h1>
      <StalenessBanner
        label="IG DATA"
        error={media.error}
        fetchedAt={media.fetchedAt}
      />
      {lastError && (
        <div className="staleness">ACTION FAILED · {lastError}</div>
      )}

      <div className="grid cols-4" style={{ marginBottom: 16 }}>
        {items.slice(0, 20).map((m) => (
          <button
            key={m.id}
            type="button"
            className={`chip ${m.id === mediaId ? "active" : ""}`}
            onClick={() => setSelected(m.id)}
            style={{ textAlign: "left" }}
          >
            <div className="meta-caps">
              {m.media_type} · {m.timestamp.slice(0, 10)}
            </div>
            <div style={{ fontSize: 12 }}>{(m.caption ?? "").slice(0, 40)}</div>
          </button>
        ))}
      </div>

      {comments.error && !comments.data ? (
        <EmptyState title="COMMENTS UNAVAILABLE" hint={comments.error} />
      ) : !comments.loading && !comments.data?.length ? (
        <EmptyState
          title="NO COMMENTS"
          hint="Nothing to moderate on this post yet."
        />
      ) : (
        <div className="grid cols-2">
          {(comments.data ?? []).map((c) => (
            <Panel key={c.id}>
              <CommentRow
                c={c}
                busy={busy === c.id}
                onHide={(hidden) =>
                  run(c.id, () =>
                    action(`/api/comments/${c.id}/hide`, "POST", { hidden }),
                  )
                }
                onDelete={() =>
                  run(c.id, () => action(`/api/comments/${c.id}`, "DELETE"))
                }
                onLike={() =>
                  run(c.id, () => action(`/api/comments/${c.id}/like`, "POST"))
                }
                onUnlike={() =>
                  run(c.id, () =>
                    action(`/api/comments/${c.id}/like`, "DELETE"),
                  )
                }
                reply={replyDraft[c.id] ?? ""}
                onReplyChange={(v) =>
                  setReplyDraft((d) => ({ ...d, [c.id]: v }))
                }
                onReplySend={() =>
                  run(c.id, () =>
                    action(`/api/comments/${c.id}/reply`, "POST", {
                      message: replyDraft[c.id],
                    }),
                  )
                }
              />
            </Panel>
          ))}
        </div>
      )}
    </>
  );
}

function CommentRow({
  c,
  busy,
  onHide,
  onDelete,
  onLike,
  onUnlike,
  reply,
  onReplyChange,
  onReplySend,
}: {
  c: IgComment;
  busy: boolean;
  onHide: (hidden: boolean) => void;
  onDelete: () => void;
  onLike: () => void;
  onUnlike: () => void;
  reply: string;
  onReplyChange: (v: string) => void;
  onReplySend: () => void;
}) {
  return (
    <div style={{ padding: "6px 0" }}>
      <div className="meta-caps">
        @{c.username ?? "commenter (needs App Review)"} ·{" "}
        {c.timestamp?.slice(0, 10)}
        {c.hidden ? " · HIDDEN" : ""} · L{c.like_count ?? 0}
      </div>
      <div style={{ fontSize: 13, margin: "4px 0" }}>{c.text}</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <button
          type="button"
          className="chip"
          disabled={busy}
          onClick={() => onHide(!c.hidden)}
        >
          {c.hidden ? "Unhide" : "Hide"}
        </button>
        <button
          type="button"
          className="chip"
          disabled={busy}
          onClick={onDelete}
        >
          Delete
        </button>
        <button type="button" className="chip" disabled={busy} onClick={onLike}>
          Like
        </button>
        <button
          type="button"
          className="chip"
          disabled={busy}
          onClick={onUnlike}
        >
          Unlike
        </button>
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
        <input
          value={reply}
          onChange={(e) => onReplyChange(e.target.value)}
          placeholder="Reply…"
          style={{ flex: 1 }}
        />
        <button
          type="button"
          className="chip"
          disabled={busy || !reply}
          onClick={onReplySend}
        >
          Send
        </button>
      </div>
      {c.replies?.length ? (
        <div
          style={{
            marginLeft: 12,
            marginTop: 6,
            borderLeft: "2px solid var(--border)",
            paddingLeft: 8,
          }}
        >
          {c.replies.map((r) => (
            <div key={r.id} className="meta-caps" style={{ marginBottom: 4 }}>
              @{r.username ?? "commenter"}: {r.text}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
