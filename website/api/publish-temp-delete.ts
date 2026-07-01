import type { VercelRequest, VercelResponse } from "@vercel/node";
import { del } from "@vercel/blob";

// ---------------------------------------------------------------------------
// POST /api/publish-temp-delete
//
// Cleans up a blob previously uploaded via /api/publish-temp, once the pipeline
// confirms Instagram's media container reached FINISHED (or on failure/timeout).
// Same shared-secret auth as publish-temp.ts.
// ---------------------------------------------------------------------------

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const secret = process.env.PUBLISH_TEMP_SECRET;
  const auth = req.headers.authorization;
  if (!secret || auth !== `Bearer ${secret}`) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { pathname } = (req.body ?? {}) as { pathname?: string };
  if (!pathname) {
    res.status(400).json({ error: "Missing pathname" });
    return;
  }

  try {
    await del(pathname);
    res.status(200).json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
}
