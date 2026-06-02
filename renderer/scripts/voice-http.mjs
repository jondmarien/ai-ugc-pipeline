// Generate reel narration from ANY OpenAI-compatible /v1/audio/speech server
// (e.g. Kokoro-FastAPI, openedai-speech, docker-kokoro). No Python, no model download.
//
//   npm run voice -- <post-key>          (when the post's voice_mode is "http")
//   node scripts/voice-http.mjs <post-key>
//
// Configure the endpoint via env (defaults target Kokoro-FastAPI on :8880):
//   TTS_BASE_URL  default http://localhost:8880/v1     (LM Studio is :1234 but does NOT
//                 currently serve /v1/audio/speech — use a TTS server like Kokoro.)
//   TTS_MODEL     default kokoro
//   TTS_VOICE     default af_heart
//   TTS_FORMAT    default wav   (wav recommended so Remotion can use it directly)
//   TTS_API_KEY   optional bearer token
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RENDERER = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const POSTS = path.join(RENDERER, "content", "posts");

const BASE = (process.env.TTS_BASE_URL ?? "http://localhost:8880/v1").replace(/\/$/, "");
const MODEL = process.env.TTS_MODEL ?? "kokoro";
const VOICE = process.env.TTS_VOICE ?? "af_heart";
const FORMAT = process.env.TTS_FORMAT ?? "wav";
const API_KEY = process.env.TTS_API_KEY ?? "";

function findPost(key) {
  if (!key) { console.error("Usage: node scripts/voice-http.mjs <post-key>"); process.exit(1); }
  const f = readdirSync(POSTS).find((x) => x.endsWith(".json") && x.includes(key));
  if (!f) { console.error(`No post JSON in ${POSTS} matching "${key}".`); process.exit(1); }
  return path.join(POSTS, f);
}

const key = process.argv[2];
const post = JSON.parse(readFileSync(findPost(key), "utf8"));
const narration = (post.video?.narration ?? []).map((n) => n.text?.trim()).filter(Boolean);
if (!narration.length) { console.error("Post has no video.narration[] to synthesize."); process.exit(1); }
const script = narration.join(" ");
const prefix = post.upload_package.filename_prefix;
const outDir = path.join(RENDERER, "public", "audio", prefix);
mkdirSync(outDir, { recursive: true });
const outWav = path.join(outDir, "voice.wav");

console.log(`HTTP TTS → ${BASE}/audio/speech  (model=${MODEL}, voice=${VOICE}, format=${FORMAT})`);
console.log(`Script (${script.length} chars): ${script.slice(0, 120)}${script.length > 120 ? "…" : ""}\n`);

const headers = { "Content-Type": "application/json" };
if (API_KEY) headers["Authorization"] = `Bearer ${API_KEY}`;

let res;
try {
  res = await fetch(`${BASE}/audio/speech`, {
    method: "POST",
    headers,
    body: JSON.stringify({ model: MODEL, input: script, voice: VOICE, response_format: FORMAT }),
  });
} catch (e) {
  console.error(`✗ Could not reach ${BASE}/audio/speech — is your TTS server running?`);
  console.error(`  Try Kokoro-FastAPI:  docker run -p 8880:8880 ghcr.io/remsky/kokoro-fastapi-cpu  (or -gpu)`);
  console.error(`  Then: TTS_BASE_URL=http://localhost:8880/v1 npm run voice -- ${key}`);
  console.error(`  (LM Studio on :1234 does NOT serve /v1/audio/speech as of 2026.)\n  ${e}`);
  process.exit(1);
}
if (!res.ok) {
  console.error(`✗ ${res.status} ${res.statusText} from ${BASE}/audio/speech`);
  console.error(await res.text().catch(() => ""));
  process.exit(1);
}
const buf = Buffer.from(await res.arrayBuffer());
writeFileSync(outWav, buf);
console.log(`✓ Wrote ${outWav}  (${(buf.length / 1024).toFixed(0)} KB)`);
console.log(`  Next: npm run reel -- ${key}`);
console.log("  Reminder: label AI-generated audio; confirm the voice/model license allows commercial use.");
