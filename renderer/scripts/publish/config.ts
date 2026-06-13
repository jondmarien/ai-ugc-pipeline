import { z } from "zod";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

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
  instagram: z.object({
    enabled: z.boolean(),
    mode: z.literal("manual"),
  }),
});

export type PublishConfig = z.infer<typeof PublishConfigSchema>;

export function loadPublishConfig(): PublishConfig {
  const raw = readFileSync(CONFIG_PATH, "utf-8");
  const parsed = JSON.parse(raw);
  return PublishConfigSchema.parse(parsed);
}
