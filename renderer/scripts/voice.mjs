// bun run voice -- <post-key> [--voice=MODE] [flags]
//
// Dispatcher: reads post video.audio.voice_mode (overridable with --voice= / --http / --voxcpm2).
// Routes to voice-voxcpm.py | voice-bark.py | voice-http.mjs. Strips --voice= before Python
// (argparse would confuse it with --voice-ref).
//
// VoxCPM clone: auto --custom-voice from lib/voice-ref.mjs unless --no-clone.
import { spawnSync } from "node:child_process";
import path from "node:path";
import { RENDERER_ROOT } from "./lib/paths.mjs";
import { loadPostByKey } from "./lib/post-resolve.mjs";
import { flagSet, postKeyFromArgv, showHelpAndExit } from "./lib/cli.mjs";
import { voiceRefCliArgs } from "./lib/voice-ref.mjs";
import { runPythonScript } from "./lib/python-runner.mjs";

const VOICE_MODES = ["none", "voxcpm2", "voxcpm2-0.5b", "bark", "http", "file"];
const VOX_MODEL = { voxcpm2: "openbmb/VoxCPM2", "voxcpm2-0.5b": "openbmb/VoxCPM-0.5B" };

/** Flags consumed by this dispatcher — do not forward to Python (see voice-voxcpm --voice-ref). */
function isDispatchOnlyFlag(a) {
  return (
    a === "--http" ||
    a === "--voxcpm2" ||
    a === "--voxcpm2-0.5b" ||
    a === "--no-clone" ||
    a.startsWith("--voice=")
  );
}

function resolveVoiceMode(key, flags) {
  let mode = "voxcpm2";
  const loaded = loadPostByKey(key);
  if (loaded) mode = loaded.post.video?.audio?.voice_mode ?? "voxcpm2";

  const voiceOverride = [...flags].find((f) => f.startsWith("--voice="))?.split("=")[1];
  if (voiceOverride && VOICE_MODES.includes(voiceOverride)) mode = voiceOverride;
  if (flags.has("--http")) mode = "http";
  if (flags.has("--voxcpm2")) mode = "voxcpm2";
  if (flags.has("--voxcpm2-0.5b")) mode = "voxcpm2-0.5b";
  if (flags.has("--vox2")) mode = "voxcpm2";
  if (flags.has("--vox0.5")) mode = "voxcpm2-0.5b";
  return mode;
}

const HELP = `
bun run voice — generate narration WAV (dispatcher by --voice=MODE)

USAGE
  bun run voice -- <post-key> [--voice=MODE] [flags]

MODES (--voice= or post video.audio.voice_mode)
  voxcpm2        VoxCPM2 2B (default)
  voxcpm2-0.5b   VoxCPM 0.5B
  bark           Suno Bark (voice-bark.py)
  http           OpenAI-compatible /v1/audio/speech (voice-http.mjs)
  file           you supply public/audio/<prefix>/voice.wav yourself
  none           skip generation

ALIASES
  --voxcpm2 | --voxcpm2-0.5b | --http
  --vox2 → voxcpm2   ·   --vox0.5 → voxcpm2-0.5b

VOICE CLONE (voxcpm2 / voxcpm2-0.5b only)
  Auto when a ref exists: $VOICE_REF → <repo>/_voiceref/ → public/audio/_voiceref/
  → E:\\ai-ugc\\_voiceref\\jon_48.wav (host fallback)
  --custom-voice <path>   explicit WAV
  --custom-voice-text     transcript for Hi-Fi clone
  --no-hifi               timbre-only
  --no-clone              seeded speaker, no reference clip
  --seed=N

EXAMPLES
  bun run voice -- my-post
  bun run voice -- my-post --voice=voxcpm2-0.5b --seed=42
  bun run voice -- my-post --voice=bark
`;

const args = process.argv.slice(2);
const flags = flagSet(args);

if (flags.has("--help") || flags.has("-h") || args.includes("-h")) showHelpAndExit(HELP);

const key = postKeyFromArgv(args);
if (!key) {
  console.error(HELP);
  process.exit(1);
}

const mode = resolveVoiceMode(key, flags);
let passArgs = args.filter((a) => !isDispatchOnlyFlag(a));

if (mode === "none") {
  console.log(
    `Post ${key}: voice_mode=none — nothing to generate. Use --voice=voxcpm2|bark|http or edit video.audio.voice_mode.`,
  );
  process.exit(0);
}
if (mode === "file") {
  console.log(
    `voice_mode=file — drop your WAV at renderer/public/audio/<prefix>/voice.wav, then: bun run reel -- ${key}`,
  );
  process.exit(0);
}

if (mode === "http") {
  const runner = process.platform === "win32" ? "bun.exe" : "bun";
  const res = spawnSync(
    runner,
    [path.join(RENDERER_ROOT, "scripts", "voice-http.mjs"), ...passArgs],
    { cwd: RENDERER_ROOT, stdio: "inherit", shell: process.platform === "win32" },
  );
  process.exit(res.status ?? 1);
}

const isVox = mode === "voxcpm2" || mode === "voxcpm2-0.5b";
const cvIdx = passArgs.indexOf("--custom-voice");
const voiceRefIdx = passArgs.indexOf("--voice-ref");
const explicitRef =
  cvIdx >= 0 ? passArgs[cvIdx + 1] : voiceRefIdx >= 0 ? passArgs[voiceRefIdx + 1] : null;
const hasRefFlag = cvIdx >= 0 || voiceRefIdx >= 0;

if (isVox && !flags.has("--no-clone") && !hasRefFlag) {
  const cloneArgs = voiceRefCliArgs({ noClone: false });
  if (cloneArgs.length) passArgs = [...cloneArgs, ...passArgs];
} else if (isVox && !flags.has("--no-clone") && explicitRef) {
  voiceRefCliArgs({ explicitPath: explicitRef, noClone: false });
}

const pyEnv = { PYTHONIOENCODING: "utf-8" };
if (VOX_MODEL[mode] && !process.env.VOXCPM_MODEL) pyEnv.VOXCPM_MODEL = VOX_MODEL[mode];

const scriptBasename = mode === "bark" ? "voice-bark.py" : "voice-voxcpm.py";
const hint =
  mode === "bark"
    ? "`uv pip install bark soundfile` (see renderer/README.md)"
    : "`uv pip install voxcpm soundfile torch` (see renderer/README.md)";

process.exit(
  runPythonScript({
    scriptBasename,
    args: passArgs,
    env: pyEnv,
    packagesHint: hint,
  }),
);