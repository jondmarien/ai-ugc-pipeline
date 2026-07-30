import fs from "node:fs";
import path from "node:path";
import { serve } from "bun";
import {
  deleteComment,
  likeComment,
  listComments,
  replyToComment,
  setCommentHidden,
  unlikeComment,
} from "./comments";
import { aggregateHooks, parseCaptionBankHooks } from "./hooks";
import { getAccount, getMedia } from "./ig";
import { listIngested } from "./ingested";
import {
  attachMetaInsights,
  listPublishedMeta,
  readCurrentInstagramPostType,
} from "./meta";
import { META_SECRETS_PATH, RENDERS_DIR } from "./paths";
import { listPosts, listRenders, readRenderFile } from "./repo";
import { ALLOWED_STATE_FILES, readState, writeState } from "./store";
import { getTrends } from "./trends";

function env<T>(
  data: T | null,
  error: string | null = null,
  fetchedAt: number | null = null,
) {
  return Response.json({ data, error, fetchedAt });
}

const server = serve({
  port: 4400,
  async fetch(req) {
    const url = new URL(req.url);
    const p = url.pathname;
    const force = url.searchParams.get("refresh") === "1"; // Refresh button bypasses fresh cache
    try {
      if (p === "/api/health") return env({ ok: true });

      if (p === "/api/ig/account") {
        const r = await getAccount(force);
        return env(r.data, r.error, r.fetchedAt);
      }
      if (p === "/api/ig/media") {
        const r = await getMedia(force);
        return env(r.data, r.error, r.fetchedAt);
      }
      if (p === "/api/ig/token-age") {
        // Token age = time since renderer/.secrets/meta.json was last written
        // by `bun run publish:auth meta` (the only thing that writes it).
        const since = fs.existsSync(META_SECRETS_PATH)
          ? fs.statSync(META_SECRETS_PATH).mtimeMs
          : null;
        return env(
          since
            ? { ageDays: Math.floor((Date.now() - since) / 86_400_000) }
            : null,
          since ? null : "no token yet",
        );
      }

      if (p === "/api/repo/posts") return env(listPosts());
      if (p === "/api/repo/renders") return env(listRenders());
      if (p === "/api/repo/ingested") return env(listIngested());
      if (p === "/api/repo/hooks") {
        return env(
          aggregateHooks({
            posts: listPosts(),
            ingested: listIngested(),
            captionBank: parseCaptionBankHooks(),
          }),
        );
      }

      // render package text files + slide thumbnails
      const renderFile = p.match(
        /^\/api\/repo\/renders\/([^/]+)\/(caption\.txt|sources\.md)$/,
      );
      if (renderFile)
        return env(
          readRenderFile(
            decodeURIComponent(renderFile[1]),
            renderFile[2] as any,
          ),
        );
      const thumb = p.match(
        /^\/api\/repo\/renders\/([^/]+)\/slide\/([^/]+\.png)$/i,
      );
      if (thumb) {
        const dir = decodeURIComponent(thumb[1]);
        const file = decodeURIComponent(thumb[2]);
        if (
          [dir, file].some(
            (s) => s.includes("..") || s.includes("/") || s.includes("\\"),
          )
        )
          return env(null, "bad path");
        const full = path.join(RENDERS_DIR, dir, file);
        if (!fs.existsSync(full)) return env(null, "not found");
        return new Response(Bun.file(full));
      }

      if (p === "/api/meta/published") {
        return env(
          listPublishedMeta({
            instagramPostType: readCurrentInstagramPostType(),
          }),
        );
      }

      if (p === "/api/meta/insights") {
        const posts = listPublishedMeta({
          instagramPostType: readCurrentInstagramPostType(),
        });
        const withInsights = await attachMetaInsights(posts, force);
        return env(withInsights);
      }

      if (p === "/api/trends") {
        const r = await getTrends(force);
        return env(r.data, r.error, r.fetchedAt);
      }

      // GET lists comments on a media id; DELETE deletes a comment id — same
      // path shape, disambiguated by method (see comments.ts for the Graph
      // API endpoints this maps to).
      const commentsRoot = p.match(/^\/api\/comments\/([^/]+)$/);
      if (commentsRoot && req.method === "GET") {
        return env(await listComments(decodeURIComponent(commentsRoot[1])));
      }
      if (commentsRoot && req.method === "DELETE") {
        return env(await deleteComment(decodeURIComponent(commentsRoot[1])));
      }

      const commentHide = p.match(/^\/api\/comments\/([^/]+)\/hide$/);
      if (commentHide && req.method === "POST") {
        const { hidden } = await req.json();
        return env(
          await setCommentHidden(
            decodeURIComponent(commentHide[1]),
            Boolean(hidden),
          ),
        );
      }

      const commentReply = p.match(/^\/api\/comments\/([^/]+)\/reply$/);
      if (commentReply && req.method === "POST") {
        const { message } = await req.json();
        if (!message || typeof message !== "string")
          return env(null, "message required");
        return env(
          await replyToComment(decodeURIComponent(commentReply[1]), message),
        );
      }

      const commentLike = p.match(/^\/api\/comments\/([^/]+)\/like$/);
      if (commentLike) {
        const id = decodeURIComponent(commentLike[1]);
        if (req.method === "POST") return env(await likeComment(id));
        if (req.method === "DELETE") return env(await unlikeComment(id));
      }

      const state = p.match(/^\/api\/state\/([\w.-]+)$/);
      if (state) {
        const name = state[1];
        if (!ALLOWED_STATE_FILES.has(name))
          return env(null, `state file not allowed: ${name}`);
        if (req.method === "GET") return env(readState(name));
        if (req.method === "PUT") {
          writeState(name, await req.json());
          return env({ ok: true });
        }
      }

      return env(null, `unknown route: ${p}`);
    } catch (e) {
      return env(null, e instanceof Error ? e.message : String(e));
    }
  },
});

console.log(`[dash] server on http://localhost:${server.port}`);
