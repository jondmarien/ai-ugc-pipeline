import { spawnSync, execFileSync } from "node:child_process";
import { mkdirSync, existsSync, statSync, writeFileSync, rmSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import { loadPost, outputDir, ROOT } from "./lib.ts";

// Args: <post-key> [--fit-voice] [--tail=<seconds>]
//   --fit-voice  trim the reel to the narration length + rescale beats/narration/word
//                timings so captions stay aligned and there's no silent tail.
//   --tail=N     seconds of breathing room to keep after the voice (default 0.6).
const argv = process.argv.slice(2);
const flags = new Set(argv.filter((a) => a.startsWith("--")));
const tailArg = [...flags].find((f) => f.startsWith("--tail="));
const TAIL = tailArg ? Math.max(0, parseFloat(tailArg.split("=")[1]) || 0) : 0.6;
const key = argv.find((a) => !a.startsWith("--")) ?? "2026-06-02_ai-phishing-training";
const post = loadPost(key);
if (!post.video?.enabled) {
  console.log(`Post ${post.post_id} has video.enabled=false — nothing to render.`);
  process.exit(0);
}

// --captions=<mode> overrides the post's caption_mode for this render (in-memory only).
const capArg = [...flags].find((f) => f.startsWith("--captions="))?.split("=")[1];
if (capArg && ["block", "word", "highlight"].includes(capArg) && post.video) {
  post.video.caption_mode = capArg as typeof post.video.caption_mode;
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

  // Narration is usually shorter than the planned reel (TTS speaks faster than the
  // beat estimates), leaving a silent tail. With --fit-voice we trim the reel to the
  // voice length and rescale beats/narration/words so captions stay aligned; otherwise
  // we just warn. Non-destructive: only the in-memory props are changed, not the JSON.
  if (hasVoice && audio.voice_file) {
    const vp = path.join(ROOT, "public", audio.voice_file.replace(/^\//, ""));
    try {
      const voiceDur = parseFloat(
        execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", vp], { encoding: "utf8" }).trim(),
      );
      const reelDur = post.video.duration_seconds;
      if (Number.isFinite(voiceDur)) {
        if (flags.has("--fit-voice")) {
          const target = Math.round((voiceDur + TAIL) * 10) / 10;
          const scale = target / reelDur;
          for (const b of post.video.beats) {
            b.start *= scale; b.end *= scale;
            for (const w of b.words ?? []) { w.start *= scale; w.end *= scale; }
          }
          for (const n of post.video.narration ?? []) { n.start *= scale; n.end *= scale; }
          post.video.duration_seconds = target;
          console.log(`↳ --fit-voice: voice ~${voiceDur.toFixed(1)}s → reel ${target}s (+${TAIL}s tail), beats×${scale.toFixed(2)}.`);
        } else if (reelDur - voiceDur > 2) {
          console.warn(`⚠ narration is ~${voiceDur.toFixed(1)}s but the reel is ${reelDur}s — the last ~${(reelDur - voiceDur).toFixed(0)}s will be silent.`);
          console.warn(`  Fix: add --fit-voice (auto-trims + realigns), set video.duration_seconds≈${Math.ceil(voiceDur) + 1}, or add a music bed.`);
        }
      }
    } catch { /* ffprobe optional */ }
  }
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
