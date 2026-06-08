import { serve } from "bun";
import { getAccount, getMedia } from "./ig";
import { listPosts, listRenders, readRenderFile } from "./repo";
import { listIngested } from "./ingested";
import { aggregateHooks, parseCaptionBankHooks } from "./hooks";
import { getTrends } from "./trends";
import { readState, writeState, ALLOWED_STATE_FILES } from "./store";
import { RENDERS_DIR, DASH_ROOT } from "./paths";
import path from "node:path";
import fs from "node:fs";

function env<T>(data: T | null, error: string | null = null, fetchedAt: number | null = null) {
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

      if (p === "/api/ig/account") { const r = await getAccount(force); return env(r.data, r.error, r.fetchedAt); }
      if (p === "/api/ig/media")   { const r = await getMedia(force);   return env(r.data, r.error, r.fetchedAt); }
      if (p === "/api/ig/token-age") {
        // Token age = time since the last successful refresh (token_refresh.log OK line),
        // falling back to .env mtime when the log does not exist yet.
        const log = path.join(DASH_ROOT, "token_refresh.log");
        const envFile = path.join(DASH_ROOT, ".env");
        let since: number | null = null;
        if (fs.existsSync(log)) {
          const ok = fs.readFileSync(log, "utf8").split("\n").filter((l) => l.includes(" OK ")).at(-1);
          if (ok) since = Date.parse(ok.slice(0, 24)) || null;
        }
        if (!since && fs.existsSync(envFile)) since = fs.statSync(envFile).mtimeMs;
        return env(since ? { ageDays: Math.floor((Date.now() - since) / 86_400_000) } : null,
          since ? null : "no token yet");
      }

      if (p === "/api/repo/posts")    return env(listPosts());
      if (p === "/api/repo/renders")  return env(listRenders());
      if (p === "/api/repo/ingested") return env(listIngested());
      if (p === "/api/repo/hooks") {
        return env(aggregateHooks({
          posts: listPosts(), ingested: listIngested(), captionBank: parseCaptionBankHooks(),
        }));
      }

      // render package text files + slide thumbnails
      const renderFile = p.match(/^\/api\/repo\/renders\/([^/]+)\/(caption\.txt|sources\.md)$/);
      if (renderFile) return env(readRenderFile(decodeURIComponent(renderFile[1]), renderFile[2] as any));
      const thumb = p.match(/^\/api\/repo\/renders\/([^/]+)\/slide\/([^/]+\.png)$/i);
      if (thumb) {
        const dir = decodeURIComponent(thumb[1]); const file = decodeURIComponent(thumb[2]);
        if ([dir, file].some((s) => s.includes("..") || s.includes("/") || s.includes("\\")))
          return env(null, "bad path");
        const full = path.join(RENDERS_DIR, dir, file);
        if (!fs.existsSync(full)) return env(null, "not found");
        return new Response(Bun.file(full));
      }

      if (p === "/api/trends") { const r = await getTrends(force); return env(r.data, r.error, r.fetchedAt); }

      const state = p.match(/^\/api\/state\/([\w.\-]+)$/);
      if (state) {
        const name = state[1];
        if (!ALLOWED_STATE_FILES.has(name)) return env(null, `state file not allowed: ${name}`);
        if (req.method === "GET") return env(readState(name));
        if (req.method === "PUT") { writeState(name, await req.json()); return env({ ok: true }); }
      }

      return env(null, `unknown route: ${p}`);
    } catch (e) {
      return env(null, e instanceof Error ? e.message : String(e));
    }
  },
});

console.log(`[dash] server on http://localhost:${server.port}`);
