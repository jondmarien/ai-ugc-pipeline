import type { VercelRequest, VercelResponse } from "@vercel/node";
import { put } from "@vercel/blob";

// ---------------------------------------------------------------------------
// POST /api/publish-temp
//
// Temporary public hosting for the ai-ugc-pipeline's Instagram Reels publisher.
// Instagram's Graph API fetches `video_url` from a public server rather than
// accepting a byte upload, so the pipeline uploads the rendered reel here first,
// gets back a public Vercel Blob URL, and calls /api/publish-temp-delete once
// the Instagram container reaches FINISHED (or on any failure/timeout).
//
// Auth: a shared bearer secret (PUBLISH_TEMP_SECRET), not user auth — this route
// is a private handoff between the pipeline and this deployment, never exposed
// to end users.
// ---------------------------------------------------------------------------

export const config = {
  api: {
    bodyParser: false,
  },
};

async function readBody(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

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

  const filename = typeof req.query.filename === "string" ? req.query.filename : "reel.mp4";

  try {
    const bytes = await readBody(req);
    if (bytes.length === 0) {
      res.status(400).json({ error: "Empty request body" });
      return;
    }

    const blob = await put(`publish-temp/${Date.now()}-${filename}`, bytes, {
      access: "public",
      contentType: "video/mp4",
      addRandomSuffix: true,
    });

    res.status(200).json({ url: blob.url, pathname: blob.pathname });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
}
