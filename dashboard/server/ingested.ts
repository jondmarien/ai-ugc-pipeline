import fs from "node:fs";
import path from "node:path";
import { INGESTED_DIR } from "./paths";

export type IngestedDoc = {
  fileName: string; date: string | null; title: string;
  handle: string | null; sourceUrl: string | null; coverHook: string | null;
  mtimeMs: number;
};

const FILE_RE = /^(\d{4}-\d{2}-\d{2})_.+\.md$/;

export function parseHandle(line: string): string | null {
  const m = line.match(/\*\*Handle:\*\*\s*(@[\w.\-]+)/);
  return m ? m[1] : null;
}

export function parseCoverHook(md: string): string | null {
  const section = md.split(/^## Slide map\s*$/m)[1];
  if (!section) return null;
  for (const line of section.split("\n")) {
    const cells = line.split("|").map((c) => c.trim());
    // | # | Role | Idea | -> ["", "#", "Role", "Idea", ""]
    if (cells.length >= 4 && /^cover$/i.test(cells[2])) {
      const m = cells[3].match(/[“"]([^”"]+)[”"]/);
      return m ? m[1] : cells[3] || null;
    }
    if (/^## /.test(line) && !/^## Slide map/.test(line)) break;
  }
  return null;
}

export function listIngested(dir: string = INGESTED_DIR): IngestedDoc[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f) => FILE_RE.test(f)) // excludes INDEX.md and any non-dated file
    .map((fileName) => {
      const full = path.join(dir, fileName);
      const md = fs.readFileSync(full, "utf8");
      const lines = md.split("\n");
      const metaLine = lines.find((l) => l.startsWith("**Source:**")) ?? "";
      const title = (lines[0] ?? "").replace(/^#\s*/, "");
      const url = metaLine.match(/\*\*Source:\*\*\s*(\S+)/)?.[1] ?? null;
      return {
        fileName,
        date: fileName.match(FILE_RE)?.[1] ?? null,
        title,
        handle: parseHandle(metaLine),
        sourceUrl: url && url.startsWith("http") ? url : null,
        coverHook: parseCoverHook(md),
        mtimeMs: fs.statSync(full).mtimeMs,
      };
    })
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
}
