import fs from "node:fs";
import path from "node:path";
import { POSTS_DIR, RENDERS_DIR } from "./paths";

export type RepoPost = {
  postId: string; date: string; slug: string; pillar: string; theme: string;
  caption: string; coverHook: string; slideCount: number; fileName: string;
};

export type RenderPackage = {
  dirName: string; date: string | null; slug: string;
  slides: string[]; hasCaption: boolean; hasSources: boolean; hasReel: boolean;
};

const DIR_RE = /^(\d{4}-\d{2}-\d{2})_(.+)$/;

export function parseRenderDirName(dirName: string): { date: string | null; slug: string } {
  const m = dirName.match(DIR_RE);
  return m ? { date: m[1], slug: m[2] } : { date: null, slug: dirName };
}

export function listPosts(dir: string = POSTS_DIR): RepoPost[] {
  if (!fs.existsSync(dir)) return [];
  const out: RepoPost[] = [];
  for (const fileName of fs.readdirSync(dir)) {
    if (!fileName.endsWith(".json")) continue;
    let j: any;
    try {
      // Tolerate a single corrupt/half-written post (e.g. a draft mid-save or a
      // partial-write artifact): skip it instead of throwing and blanking the whole
      // posts endpoint, which would take Overview/Analytics/Hooks down with it.
      j = JSON.parse(fs.readFileSync(path.join(dir, fileName), "utf8"));
    } catch (e) {
      console.warn(`[dash] skipping unparseable post ${fileName}: ${e instanceof Error ? e.message : e}`);
      continue;
    }
    const slides: any[] = Array.isArray(j.slides) ? j.slides : [];
    const cover = slides.find((s) => s.role === "cover");
    out.push({
      postId: j.post_id ?? fileName.replace(/\.json$/, ""),
      date: j.date ?? "", slug: j.slug ?? "", pillar: j.pillar ?? "",
      theme: j.theme ?? "", caption: j.caption ?? "",
      coverHook: cover?.on_slide_copy ?? "",
      slideCount: slides.length, fileName,
    });
  }
  return out.sort((a, b) => b.date.localeCompare(a.date));
}

export function listRenders(dir: string = RENDERS_DIR): RenderPackage[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => {
      const full = path.join(dir, e.name);
      const files = fs.readdirSync(full);
      const { date, slug } = parseRenderDirName(e.name);
      return {
        dirName: e.name, date, slug,
        slides: files.filter((f) => /\.png$/i.test(f)).sort(),
        hasCaption: files.includes("caption.txt"),
        hasSources: files.includes("sources.md"),
        hasReel: files.some((f) => /_reel\.mp4$/i.test(f)), // reels are '<dirName>_reel.mp4'
      };
    })
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
}

export function readRenderFile(dirName: string, file: "caption.txt" | "sources.md", dir: string = RENDERS_DIR): string | null {
  // dirName comes from listRenders output; still refuse separators defensively.
  if (dirName.includes("/") || dirName.includes("\\") || dirName.includes("..")) return null;
  const p = path.join(dir, dirName, file);
  return fs.existsSync(p) ? fs.readFileSync(p, "utf8") : null;
}
