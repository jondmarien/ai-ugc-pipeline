import { readFileSync } from "node:fs";
import { basename } from "node:path";

// ---------------------------------------------------------------------------
// Temporary public hosting for Instagram's `video_url` fetch requirement.
//
// Reuses the already-deployed aiugc.chron0.tech Vercel project (website/api/
// publish-temp.ts + publish-temp-delete.ts, backed by Vercel Blob) instead of
// standing up separate S3/R2 infra. See docs/publishing/META_INTEGRATION_SPEC.md
// for the full rationale.
// ---------------------------------------------------------------------------

const TEMP_HOST_BASE =
  process.env.PUBLISH_TEMP_HOST ?? "https://aiugc.chron0.tech";

export type TempUpload = {
  url: string;
  cleanup: () => Promise<void>;
};

export type TempHostingDeps = {
  fetchImpl: typeof fetch;
  readFile: (path: string) => Buffer;
  baseUrl: string;
  secret: string;
};

/** Upload `filePath`'s bytes to the temp-hosting route and return a public URL + cleanup fn. */
export async function uploadTemp(
  filePath: string,
  deps?: Partial<TempHostingDeps>,
): Promise<TempUpload> {
  const fetchImpl = deps?.fetchImpl ?? fetch;
  const readFile = deps?.readFile ?? ((p: string) => readFileSync(p));
  const baseUrl = deps?.baseUrl ?? TEMP_HOST_BASE;
  const secret = deps?.secret ?? process.env.PUBLISH_TEMP_SECRET ?? "";

  if (!secret) {
    throw new Error(
      "PUBLISH_TEMP_SECRET is not set — required to upload the reel to aiugc.chron0.tech for Instagram publishing.",
    );
  }

  const bytes = readFile(filePath);
  const filename = basename(filePath);

  const uploadResp = await fetchImpl(
    `${baseUrl}/api/publish-temp?filename=${encodeURIComponent(filename)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "video/mp4",
      },
      body: new Uint8Array(bytes),
    },
  );

  if (!uploadResp.ok) {
    const text = await uploadResp.text();
    throw new Error(
      `Temp hosting upload failed: ${uploadResp.status} — ${text}`,
    );
  }

  const { url, pathname } = (await uploadResp.json()) as {
    url: string;
    pathname: string;
  };

  const cleanup = async () => {
    try {
      await fetchImpl(`${baseUrl}/api/publish-temp-delete`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pathname }),
      });
    } catch {
      // Best-effort cleanup — a failed delete leaves an orphaned blob, not a broken publish.
    }
  };

  return { url, cleanup };
}
