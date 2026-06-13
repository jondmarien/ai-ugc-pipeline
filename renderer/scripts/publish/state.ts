import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export type PublishResult = {
  platform: string;
  status: string;
  id?: string | null;
  url?: string | null;
  privacy?: string;
  at: number;
  error?: string;
};

const STATE_FILE = "publish.state.json";

export function readState(dir: string): Record<string, PublishResult> {
  try {
    const raw = readFileSync(join(dir, STATE_FILE), "utf8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, PublishResult>;
    }
    return {};
  } catch {
    return {};
  }
}

export function recordResult(dir: string, result: PublishResult): void {
  const state = readState(dir);
  state[result.platform] = result;
  writeFileSync(join(dir, STATE_FILE), JSON.stringify(state, null, 2), "utf8");
}

export function shouldSkip(
  state: Record<string, PublishResult>,
  platform: string,
  force: boolean
): boolean {
  return state[platform]?.status === "published" && !force;
}
