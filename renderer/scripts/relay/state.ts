import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { RelayWatchState } from "./types.ts";

export const STATE_FILENAME = "instagram-watch.json";

export function defaultStatePath(rendererRoot: string): string {
  return join(rendererRoot, ".relay", STATE_FILENAME);
}

export function readWatchState(path: string): RelayWatchState | null {
  try {
    const raw = readFileSync(path, "utf8");
    const parsed = JSON.parse(raw) as RelayWatchState;
    if (parsed && typeof parsed.igUserId === "string") return parsed;
    return null;
  } catch {
    return null;
  }
}

export function writeWatchState(path: string, state: RelayWatchState): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(state, null, 2), "utf8");
}