import fs from "node:fs";
import path from "node:path";

const ENV_FILE = path.resolve(import.meta.dir, "..", "dashboard", ".env");
const LOG_FILE = path.resolve(import.meta.dir, "..", "dashboard", "token_refresh.log");

export function rewriteEnv(content: string, newToken: string): string {
  if (/^IG_ACCESS_TOKEN=.*$/m.test(content)) {
    return content.replace(/^IG_ACCESS_TOKEN=.*$/m, `IG_ACCESS_TOKEN=${newToken}`);
  }
  return content + `IG_ACCESS_TOKEN=${newToken}\n`;
}

function parseEnv(content: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

async function main() {
  const content = fs.readFileSync(ENV_FILE, "utf8");
  const env = parseEnv(content);
  // Long-lived token exchange (Facebook Login flow, walkthrough Step 1):
  const url = `https://graph.facebook.com/v23.0/oauth/access_token?grant_type=fb_exchange_token` +
    `&client_id=${env.IG_APP_ID}&client_secret=${env.IG_APP_SECRET}&fb_exchange_token=${env.IG_ACCESS_TOKEN}`;
  const res = await fetch(url);
  const body = await res.json();
  const stamp = new Date().toISOString();
  if (!res.ok || !body.access_token) {
    fs.appendFileSync(LOG_FILE, `${stamp} FAIL ${JSON.stringify(body?.error ?? body)}\n`);
    console.error("Token refresh failed. See dashboard/token_refresh.log.");
    process.exit(1);
  }
  fs.writeFileSync(ENV_FILE, rewriteEnv(content, body.access_token));
  fs.appendFileSync(LOG_FILE, `${stamp} OK expires_in=${body.expires_in ?? "n/a"}\n`);
  console.log("Token refreshed.");
}

if (import.meta.main) await main();
