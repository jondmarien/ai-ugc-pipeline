import { z } from "zod";

// Mirrors assets/skills/react-remotion-instagram-renderer/templates/post.render-data.template.json
// and maps from pipeline/content/POST_TEMPLATE.md. Validation fails loud on missing
// required fields — the renderer never invents claims, sources, or copy.

export const Pillar = z.enum([
  "offensive_ai",
  "model_security",
  "data_leakage",
  "defensive_ai",
  "governance",
  "myth_busting",
]);

export const SlideRole = z.enum([
  "cover",
  "context",
  "risk",
  "mechanism",
  "failure_point",
  "defense",
  "takeaway",
  "cta",
  // Generic body slide for posts with more than the named 8-arc (dynamic slide count).
  // Reuses the standard layout/motif; repeatable.
  "point",
]);

// Filename role tokens follow the pipeline convention (note hyphen in failure-point).
export const ROLE_FILENAME: Record<z.infer<typeof SlideRole>, string> = {
  cover: "cover",
  context: "context",
  risk: "risk",
  mechanism: "mechanism",
  failure_point: "failure-point",
  defense: "defense",
  takeaway: "takeaway",
  cta: "cta",
  point: "point",
};

export const ScoreSpec = z.object({
  credibility: z.number().min(0).max(5),
  relevance: z.number().min(0).max(5),
  novelty: z.number().min(0).max(5),
  visual_drama: z.number().min(0).max(5),
  defender_usefulness: z.number().min(0).max(5),
  total: z.number().min(0).max(25),
});

export const CanvasSpec = z.object({
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  safe_margin: z.number().int().nonnegative(),
});

export const BrandSpec = z.object({
  handle: z.string().min(1),
  accent_name: z.string().optional(),
  pillar_accent: Pillar,
  palette: z
    .object({
      bg: z.string().optional(),
      fg: z.string().optional(),
      muted: z.string().optional(),
      accent: z.string().optional(),
      danger: z.string().optional(),
    })
    .optional(),
  font_stack: z.string().optional(),
});

export const SlideData = z.object({
  slide: z.number().int().positive(),
  role: SlideRole,
  kicker: z.string().optional().default(""),
  on_slide_copy: z.string().min(1, "on_slide_copy is required for every slide"),
  subline: z.string().optional().default(""),
  body: z.string().optional().default(""),
  visual_direction: z.string().optional().default(""),
  visual_prompt: z.string().optional().default(""),
  background_asset: z.string().optional().default(""),
  // existing = reuse pipeline asset; needed = generate later; procedural = CSS-only.
  asset_status: z.enum(["existing", "needed", "generated", "stock", "procedural"]).default("procedural"),
  cta: z.string().optional().default(""),
  notes: z.string().optional().default(""),
});

export const SourceNote = z.object({
  source: z.string().min(1),
  link: z.string().min(1),
  supports: z.string().min(1),
  confidence: z.enum(["high", "medium", "low"]),
  claim_tag: z.string().min(1),
});

// Optional per-word timings (absolute seconds). When absent, word/highlight
// caption modes distribute words evenly across the beat window.
export const Word = z.object({
  text: z.string(),
  start: z.number().nonnegative(),
  end: z.number().positive(),
});

export const Beat = z.object({
  start: z.number().nonnegative(),
  end: z.number().positive(),
  slide_ref: z.number().int().positive(),
  purpose: z.string(),
  motion: z.string(),
  caption: z.string(),
  words: z.array(Word).optional(),
});

// How burned-in reel captions animate:
//   block     — full caption per scene (default; current behavior)
//   word      — one word at a time, karaoke style
//   highlight — full line shown, the currently-spoken word lit in the accent
export const CaptionMode = z.enum(["block", "word", "highlight"]);

// Audio options (selectable per post, like caption modes).
//   voice_mode: none (silent) | voxcpm2 (generate locally) | file (you supply a WAV)
//   music_mode: none | free | licensed | generated | file (all resolve to "is there a music file?")
// The mode is metadata that drives LICENSES.md guidance + where files come from;
// the renderer plays whatever audio FILES exist (see render-reel's missing-file guard).
// voice modes (all commercial-safe except where noted):
//   none     — silent
//   voxcpm2       — local python, VoxCPM2 2B (Apache-2.0, 48kHz) — primary, best quality
//   voxcpm2-0.5b  — local python, VoxCPM-0.5B (Apache-2.0, 16kHz) — smaller/faster on low VRAM
//   bark          — local python, Suno Bark (MIT) — expressive fallback
//   http     — OpenAI-compatible /v1/audio/speech server (e.g. Kokoro-FastAPI, Apache-2.0)
//   file     — you supply the WAV (use ANY tool: WhisperSpeech/Piper/etc.)
// NOTE: Coqui XTTS and F5-TTS base weights are NON-commercial — not offered as modes.
export const VoiceMode = z.enum(["none", "voxcpm2", "voxcpm2-0.5b", "bark", "http", "file"]);
export const MusicMode = z.enum(["none", "free", "licensed", "generated", "file"]);

export const AudioSpec = z.object({
  voice_mode: VoiceMode.default("none"),
  voice_file: z.string().optional(), // e.g. /audio/<prefix>/voice.wav (served from public/)
  voice_gain_db: z.number().default(0),
  music_mode: MusicMode.default("none"),
  music_file: z.string().optional(), // e.g. /audio/<prefix>/music.mp3
  music_gain_db: z.number().default(-18), // ducked under narration
});

export const Narration = z.object({
  start: z.number().nonnegative(),
  end: z.number().positive(),
  text: z.string(),
});

// Transcript-driven captions written by `bun run align` (Whisper). Absolute seconds.
// When present, the reel renders these (perfectly synced to the voice) instead of the
// planned per-beat captions. words[] enables word/highlight karaoke against real timing.
export const CaptionLine = z.object({
  start: z.number().nonnegative(),
  end: z.number().positive(),
  text: z.string(),
  words: z.array(Word).optional(),
});

export const VideoSpec = z.object({
  enabled: z.boolean(),
  duration_seconds: z.number().positive(),
  fps: z.number().positive(),
  export_name: z.string().min(1),
  caption_mode: CaptionMode.default("block"),
  audio: AudioSpec.default({ voice_mode: "none", music_mode: "none", voice_gain_db: 0, music_gain_db: -18 }),
  captions: z.array(CaptionLine).optional(), // written by `bun run align`; voice-synced
  // Optional per-post fixups applied by `bun run align` AFTER Whisper, e.g. {"new":"Nous"} when
  // narration spells a name phonetically. Scoped to THIS post, so it can safely remap a common
  // word (like "new") that would be unsafe to correct globally.
  caption_corrections: z.record(z.string(), z.string()).optional(),
  narration: z.array(Narration).default([]),
  beats: z.array(Beat).min(1),
  subtitle_style: z.string().optional().default(""),
  music: z
    .object({
      prompt: z.string().optional(),
      file: z.string().optional(),
      target_mix: z.string().optional(),
    })
    .nullable()
    .optional(),
  sfx: z.array(z.unknown()).default([]),
  licenses: z.array(z.unknown()).default([]),
});

export const UploadPackage = z.object({
  folder: z.string().min(1),
  filename_prefix: z.string().min(1),
  expected_files: z.array(z.string()).optional(),
  caption_file: z.string().default("caption.txt"),
  alt_text_file: z.string().default("alt_text.txt"),
  sources_file: z.string().default("sources.md"),
  licenses_file: z.string().default("LICENSES.md"),
});

export const PostData = z
  .object({
    post_id: z.string().min(1),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
    slug: z.string().min(1),
    platform: z.string().default("instagram"),
    format: z.string().default("carousel"),
    status: z.enum(["draft", "approved", "upload_ready"]),
    pillar: Pillar,
    // Brand colour theme (drives carousel accent + AI-image colour/mood). Optional —
    // falls back to the pillar→theme map in tokens.ts when omitted.
    theme: z.enum(["offensive", "defensive", "hacking", "purple-team", "ai"]).optional(),
    audience: z.string().min(1),
    core_claim: z.string().min(1),
    claim_tags: z.array(z.string()).min(1),
    score: ScoreSpec,
    canvas: CanvasSpec,
    brand: BrandSpec,
    upload_package: UploadPackage,
    slides: z.array(SlideData).min(1),
    caption: z.string().min(1),
    hashtags: z.array(z.string()).min(1),
    comment_prompt: z.string().optional().default(""),
    alt_text: z.array(z.string()).min(1),
    sources: z.array(SourceNote).min(1, "at least one source is required for factual posts"),
    asset_licenses: z.array(z.unknown()).default([]),
    video: VideoSpec.optional(),
    qa: z.record(z.string(), z.unknown()).default({}),
  })
  .superRefine((post, ctx) => {
    // Slide numbering must be contiguous 1..n and match array order.
    post.slides.forEach((s, i) => {
      if (s.slide !== i + 1) {
        ctx.addIssue({
          code: "custom",
          message: `slide.slide should be ${i + 1} but is ${s.slide}`,
          path: ["slides", i, "slide"],
        });
      }
    });
    // Alt text count must match slide count (QA gate).
    if (post.alt_text.length !== post.slides.length) {
      ctx.addIssue({
        code: "custom",
        message: `alt_text count (${post.alt_text.length}) must match slide count (${post.slides.length})`,
        path: ["alt_text"],
      });
    }
    // Slide 1 must be the cover.
    if (post.slides[0]?.role !== "cover") {
      ctx.addIssue({
        code: "custom",
        message: "slide 1 must have role 'cover'",
        path: ["slides", 0, "role"],
      });
    }
    // Score total should equal the sum of axes.
    const sum =
      post.score.credibility +
      post.score.relevance +
      post.score.novelty +
      post.score.visual_drama +
      post.score.defender_usefulness;
    if (sum !== post.score.total) {
      ctx.addIssue({
        code: "custom",
        message: `score.total (${post.score.total}) must equal sum of axes (${sum})`,
        path: ["score", "total"],
      });
    }
  });

export type TPostData = z.infer<typeof PostData>;
export type TSlideData = z.infer<typeof SlideData>;
export type TVideoSpec = z.infer<typeof VideoSpec>;
export type TBeat = z.infer<typeof Beat>;
export type TCaptionMode = z.infer<typeof CaptionMode>;

export function validatePost(raw: unknown): TPostData {
  return PostData.parse(raw);
}
