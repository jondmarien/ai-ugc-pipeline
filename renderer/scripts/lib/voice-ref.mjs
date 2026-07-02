// Resolve authorized VoxCPM reference WAV (zero-shot voice clone).
//
// Order: --custom-voice flag → $VOICE_REF → repo /_voiceref → renderer public _voiceref
//        → host fallback E:\ai-ugc\_voiceref (when clip is not in the repo).
// Use --no-clone to force a random seeded speaker with no reference clip.
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { RENDERER_ROOT, REPO_ROOT } from "./paths.mjs";

/** Prefer these basenames (Jon’s clips); jon_48.wav and legacy jon_48k.wav. */
export const VOICE_REF_CANDIDATES = ["jon_48.wav", "jon_48k.wav", "jon.wav"];

/** Windows host path when the ref is not checked into the repo (legacy layout). */
export const VOICE_REF_HOST_FALLBACKS = [
  "E:\\ai-ugc\\_voiceref\\jon_48.wav",
  "E:\\ai-ugc\\_voiceref\\jon_48k.wav",
  "E:\\ai-ugc\\_voiceref\\jon.wav",
];

function tryFile(p) {
  if (!p) return null;
  const resolved = path.isAbsolute(p) ? p : path.resolve(p);
  return existsSync(resolved) ? resolved : null;
}

function firstWavInDir(dir) {
  if (!existsSync(dir)) return null;
  for (const name of VOICE_REF_CANDIDATES) {
    const full = path.join(dir, name);
    if (existsSync(full)) return { path: full, source: `_voiceref/${name}` };
  }
  let wavs = [];
  try {
    wavs = readdirSync(dir).filter((f) => /\.wav$/i.test(f));
  } catch {
    return null;
  }
  const jon = wavs.find((f) => /^jon/i.test(f));
  if (jon) return { path: path.join(dir, jon), source: `_voiceref/${jon}` };
  if (wavs.length === 1)
    return { path: path.join(dir, wavs[0]), source: `_voiceref/${wavs[0]}` };
  return null;
}

/**
 * @returns {{ path: string, source: string } | null}
 */
export function resolveVoiceRef({ explicitPath = null, noClone = false } = {}) {
  if (noClone) return null;

  if (explicitPath) {
    const hit = tryFile(explicitPath);
    if (hit) return { path: hit, source: "--custom-voice" };
    console.warn(`⚠ --custom-voice not found: ${explicitPath}`);
  }

  const envRef = process.env.VOICE_REF?.trim();
  if (envRef) {
    const hit = tryFile(envRef);
    if (hit) return { path: hit, source: "VOICE_REF" };
    console.warn(`⚠ VOICE_REF not found: ${envRef}`);
  }

  const repoHit = firstWavInDir(path.join(REPO_ROOT, "_voiceref"));
  if (repoHit) return repoHit;

  const publicHit = firstWavInDir(
    path.join(RENDERER_ROOT, "public", "audio", "_voiceref"),
  );
  if (publicHit) return publicHit;

  for (const hostPath of VOICE_REF_HOST_FALLBACKS) {
    const hit = tryFile(hostPath);
    if (hit) return { path: hit, source: "host:_voiceref" };
  }

  return null;
}

/** CLI args for voice-voxcpm.py: `['--custom-voice', '/path']` or `[]`. Logs when a ref is used. */
export function voiceRefCliArgs({ explicitPath = null, noClone = false } = {}) {
  const resolved = resolveVoiceRef({ explicitPath, noClone });
  if (!resolved) return [];
  console.log(`  🎙 voice clone ref: ${resolved.path} (${resolved.source})`);
  return ["--custom-voice", resolved.path];
}
