import { serve } from "bun";

export function envelope<T>(data: T | null, error: string | null = null, fetchedAt: number | null = null) {
  return Response.json({ data, error, fetchedAt });
}

const server = serve({
  port: 4400,
  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === "/api/health") return envelope({ ok: true });
    return envelope(null, `unknown route: ${url.pathname}`);
  },
});

console.log(`[dash] server on http://localhost:${server.port}`);
