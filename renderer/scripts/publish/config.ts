import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

// Repo root is three levels up from renderer/scripts/publish/
const CONFIG_PATH = join(__dirname, "..", "..", "..", "publish.config.json");

const PublishConfigSchema = z.object({
  youtube: z.object({
    enabled: z.boolean(),
    privacy: z.enum(["private", "unlisted", "public"]),
    categoryId: z.string(),
  }),
  tiktok: z.object({
    enabled: z.boolean(),
    privacy: z.string(),
    disableComment: z.boolean(),
    disableDuet: z.boolean(),
    disableStitch: z.boolean(),
  }),
  facebook: z.object({
    enabled: z.boolean(),
    privacy: z.enum(["draft", "public"]),
  }),
  instagram: z.object({
    enabled: z.boolean(),
    mode: z.enum(["api", "manual"]),
    postType: z.enum(["reels", "carousel"]).default("reels"),
    // Trial Reels are only postable once the account is approved for the feature by Meta.
    trialReels: z.boolean().default(false),
  }),
});

export type PublishConfig = z.infer<typeof PublishConfigSchema>;

export function loadPublishConfig(): PublishConfig {
  const raw = readFileSync(CONFIG_PATH, "utf-8");
  const parsed = JSON.parse(raw);
  return PublishConfigSchema.parse(parsed);
}
