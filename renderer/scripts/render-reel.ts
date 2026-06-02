import { spawnSync, execFileSync } from "node:child_process";
import { mkdirSync, existsSync, statSync, writeFileSync, rmSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import { loadPost, outputDir, ROOT } from "./lib.ts";

const key = process.argv[2] ?? "2026-06-02_ai-phishing-training";
const post = loadPost(key);
if (!post.video?.enabled) {
  console.log(`Post ${post.post_id} has video.enabled=false — nothing to render.`);
  process.exit(0);
}

const outDir = outputDir(post);
mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, post.video.export_name);
const entry = path.join(ROOT, "remotion", "index.ts");

// Audio guard: only keep audio refs whose files actually exist under public/.
// A mode can be set ("voxcpm2"/"free"/…) before the file is produced — in that
// case we render silent and tell the user how to add it, rather than crashing.
const audio = post.video.audio;
if (audio) {
  const publicDir = path.join(ROOT, "public");
  const check = (file?: string) => (file ? existsSync(path.join(publicDir, file.replace(/^\//, ""))) : false);
  if (audio.voice_mode !== "none" && !check(audio.voice_file)) {
    console.warn(`⚠ voice (${audio.voice_mode}): ${audio.voice_file ?? "no file"} not found in public/ — rendering without narration.`);
    if (audio.voice_mode === "voxcpm2") console.warn(`  → generate it: npm run voice -- ${key}`);
    audio.voice_mode = "none";
  }
  if (audio.music_mode !== "none" && !check(audio.music_file)) {
    console.warn(`⚠ music (${audio.music_mode}): ${audio.music_file ?? "no file"} not found in public/ — rendering without music.`);
    console.warn(`  → drop a commercial-safe track at renderer/public${audio.music_file ?? "/audio/<prefix>/music.mp3"} (see pipeline/media/MUSIC_SFX_GUIDE.md), then re-run.`);
    audio.music_mode = "none";
  }
  const hasVoice = audio.voice_mode !== "none";
  const hasMusic = audio.music_mode !== "none";
  console.log(`Audio: voice=${hasVoice ? "yes" : "—"}  music=${hasMusic ? "yes" : "—"}`);
}

// Pass THIS post to the composition via --props so the reel renders the selected
// post (not Root.tsx's default). calculateMetadata derives duration/fps from it.
const propsFile = path.join(os.tmpdir(), `ai-ugc-reel-props-${post.slug}-${post.date}.json`);
writeFileSync(propsFile, JSON.stringify({ post }), "utf8");

console.log(`Rendering reel ${post.video.export_name} (${post.video.duration_seconds}s @ ${post.video.fps}fps, captions: ${post.video.caption_mode})…`);

// Remotion CLI via bunx. IMPORTANT: use `remotion` (NOT `remotionb`) so the render
// runs on Node — the Bun *runtime* render path has a known Chromium "Session closed"
// bug. bunx just resolves the CLI; the actual render is Node-backed.
const bunxCmd = process.platform === "win32" ? "bunx.exe" : "bunx";
const res = spawnSync(
  bunxCmd,
  ["remotion", "render", entry, "reel", outPath, `--props=${propsFile}`, "--codec=h264", "--timeout=120000", "--log=error"],
  { cwd: ROOT, stdio: "inherit", shell: process.platform === "win32" },
);
rmSync(propsFile, { force: true });

if (res.status !== 0) {
  console.error(`\n✗ Remotion render failed (exit ${res.status}).`);
  process.exit(res.status ?? 1);
}

// Verify output with ffprobe (dimensions, fps, codec).
if (!existsSync(outPath)) {
  console.error(`✗ Expected output not found: ${outPath}`);
  process.exit(1);
}
const sizeKB = (statSync(outPath).size / 1024).toFixed(0);
try {
  const probe = execFileSync(
    "ffprobe",
    ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,codec_name,avg_frame_rate", "-of", "default=nw=1", outPath],
    { encoding: "utf8" },
  );
  console.log(`\n✓ Reel written: ${outPath} (${sizeKB} KB)`);
  console.log(probe.trim().split("\n").map((l) => "  " + l).join("\n"));
} catch {
  console.log(`\n✓ Reel written: ${outPath} (${sizeKB} KB) — ffprobe unavailable, skipped verification.`);
}
