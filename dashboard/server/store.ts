import path from "node:path";
import fs from "node:fs";
import { DATA_DIR } from "./paths";

export const ALLOWED_STATE_FILES = new Set([
  "schedule.json",
  "hooks-meta.json",
  "sources.json",
]);

const DEFAULTS: Record<string, unknown> = {
  "schedule.json": { items: [] },
  "hooks-meta.json": { hooks: {} },
  "sources.json": [],
};

function resolveStateFile(name: string, dir: string): string {
  if (!ALLOWED_STATE_FILES.has(name)) {
    throw new Error(`state file not allowed: ${name}`);
  }
  return path.join(dir, name);
}

export function readState(name: string, dir: string = DATA_DIR): unknown {
  const file = resolveStateFile(name, dir);
  if (!fs.existsSync(file)) return DEFAULTS[name];
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function writeState(name: string, value: unknown, dir: string = DATA_DIR): void {
  const file = resolveStateFile(name, dir);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2));
}
