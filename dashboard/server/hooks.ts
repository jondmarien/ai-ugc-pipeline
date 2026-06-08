import fs from "node:fs";
import { CAPTION_BANK } from "./paths";

export type HookSource = "post" | "ingested" | "caption-bank";
export type HookRow = {
  id: string;          // normalized text (stable key for hooks-meta.json tags)
  text: string;        // first-seen original casing
  sources: HookSource[];
  timesUsed: number;   // count of posts with matching normalized coverHook
  lastUsed: string | null;
};

export function normalizeHook(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim().replace(/[.,!?:;]+$/, "");
}

export function parseCaptionBankHooks(file: string = CAPTION_BANK): string[] {
  if (!fs.existsSync(file)) return [];
  const md = fs.readFileSync(file, "utf8");
  const section = md.split(/^## 1\. Cover Hook Formulas\s*$/m)[1]?.split(/^## /m)[0];
  if (!section) return [];
  const hooks: string[] = [];
  for (const line of section.split("\n")) {
    const cells = line.split("|").map((c) => c.trim());
    if (cells.length < 4) continue;                   // not a 2-col table row
    if (/^-+$/.test(cells[1].replace(/\s/g, ""))) continue; // separator row
    if (/^formula$/i.test(cells[1])) continue;        // header row
    if (cells[2]) hooks.push(cells[2]);
  }
  return hooks;
}

type AggInput = {
  posts: { coverHook: string; slug: string; date: string }[];
  ingested: { coverHook: string | null; fileName: string; date: string | null }[];
  captionBank: string[];
};

export function aggregateHooks({ posts, ingested, captionBank }: AggInput): HookRow[] {
  const map = new Map<string, HookRow>();
  const upsert = (text: string, source: HookSource) => {
    const id = normalizeHook(text);
    if (!id) return;
    const row = map.get(id) ?? { id, text, sources: [], timesUsed: 0, lastUsed: null };
    if (!row.sources.includes(source)) row.sources.push(source);
    map.set(id, row);
  };
  for (const p of posts) if (p.coverHook) upsert(p.coverHook, "post");
  for (const d of ingested) if (d.coverHook) upsert(d.coverHook, "ingested");
  for (const h of captionBank) upsert(h, "caption-bank");
  // usage counts come only from posts
  for (const p of posts) {
    const row = map.get(normalizeHook(p.coverHook));
    if (!row) continue;
    row.timesUsed += 1;
    if (!row.lastUsed || p.date > row.lastUsed) row.lastUsed = p.date;
  }
  return [...map.values()].sort((a, b) => b.timesUsed - a.timesUsed || a.text.localeCompare(b.text));
}
