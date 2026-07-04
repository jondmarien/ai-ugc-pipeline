import fs from "node:fs";
import path from "node:path";

// Source of truth for Meta credentials is renderer/.env (META_APP_ID/META_APP_SECRET)
// + renderer/.secrets/meta.json (page_access_token) — same files
// renderer/scripts/publish/auth/meta.ts reads/writes. This script previously pointed
// at dashboard/.env + IG_APP_ID/IG_APP_SECRET/IG_ACCESS_TOKEN, which were never
// populated there (dead since the app converged on the meta.ts flow).
const ENV_FILE = path.resolve(import.meta.dir, "..", "renderer", ".env");
const SECRETS_FILE = path.resolve(
  import.meta.dir,
  "..",
  "renderer",
  ".secrets",
  "meta.json",
);
const LOG_FILE = path.resolve(
  import.meta.dir,
  "..",
  "dashboard",
  "token_refresh.log",
);

function parseEnv(content: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

export function mergeToken(
  store: Record<string, unknown>,
  newToken: string,
): Record<string, unknown> {
  return { ...store, page_access_token: newToken };
}

async function main() {
  const env = parseEnv(fs.readFileSync(ENV_FILE, "utf8"));
  const store = JSON.parse(fs.readFileSync(SECRETS_FILE, "utf8"));
  if (!store.page_access_token) {
    console.error(
      `No page_access_token in ${SECRETS_FILE}. Run \`bun run publish:auth meta\` in renderer/ first.`,
    );
    process.exit(1);
  }
  // Long-lived token exchange (Facebook Login flow, walkthrough Step 1):
  const url =
    `https://graph.facebook.com/v25.0/oauth/access_token?grant_type=fb_exchange_token` +
    `&client_id=${env.META_APP_ID}&client_secret=${env.META_APP_SECRET}&fb_exchange_token=${store.page_access_token}`;
  const res = await fetch(url);
  const body = await res.json();
  const stamp = new Date().toISOString();
  if (!res.ok || !body.access_token) {
    fs.appendFileSync(
      LOG_FILE,
      `${stamp} FAIL ${JSON.stringify(body?.error ?? body)}\n`,
    );
    console.error("Token refresh failed. See dashboard/token_refresh.log.");
    process.exit(1);
  }
  fs.writeFileSync(
    SECRETS_FILE,
    JSON.stringify(mergeToken(store, body.access_token), null, 2),
  );
  fs.appendFileSync(
    LOG_FILE,
    `${stamp} OK expires_in=${body.expires_in ?? "n/a"}\n`,
  );
  console.log("Token refreshed.");
}

if (import.meta.main) await main();
