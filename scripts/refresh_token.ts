import fs from "node:fs";
import path from "node:path";
import { debugToken } from "../renderer/scripts/publish/auth/meta";

// Meta gives no refresh_token for Page access tokens (see renderer/scripts/publish/auth/meta.ts
// and docs/publishing/PUBLISHING.md) — the fb_exchange_token grant this script used to attempt
// always fails ("...permission(s) must be granted before impersonating a user's page"). The only
// thing a scheduled job can do is the same /debug_token liveness check meta.ts itself does at
// publish time, so a dead token is caught here instead of failing a real publish run.
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

export function logLine(
  stamp: string,
  check: { is_valid: boolean; expires_at?: number },
): string {
  return check.is_valid
    ? `${stamp} OK expires_at=${check.expires_at ?? "n/a"}\n`
    : `${stamp} FAIL token invalid — run \`bun run publish:auth meta\` in renderer/ to re-authenticate\n`;
}

async function main() {
  const env = parseEnv(fs.readFileSync(ENV_FILE, "utf8"));
  const store = JSON.parse(fs.readFileSync(SECRETS_FILE, "utf8"));
  const stamp = new Date().toISOString();
  if (!store.page_access_token) {
    fs.appendFileSync(
      LOG_FILE,
      `${stamp} FAIL no page_access_token — run \`bun run publish:auth meta\` first\n`,
    );
    console.error(`No page_access_token in ${SECRETS_FILE}.`);
    process.exit(1);
  }
  const check = await debugToken(
    store.page_access_token,
    env.META_APP_ID ?? "",
    env.META_APP_SECRET ?? "",
  );
  fs.appendFileSync(LOG_FILE, logLine(stamp, check));
  if (!check.is_valid) {
    console.error(
      "Meta Page token is dead. Re-run `bun run publish:auth meta` in renderer/.",
    );
    process.exit(1);
  }
  console.log(
    `Meta Page token still valid (expires_at=${check.expires_at ?? "n/a"}).`,
  );
}

if (import.meta.main) await main();
