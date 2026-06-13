type AnySlide = { slide?: number; role?: string; on_slide_copy?: string; subline?: string; visual_prompt?: string };
type AnyPost = { slides?: AnySlide[] };

const strip = (s: string) => (s ?? "").replace(/\[\[|\]\]|\{\{|\}\}/g, "").trim();
const words = (s: string) => (strip(s) ? strip(s).split(/\s+/).length : 0);
const chars = (s: string) => strip(s).length;

const BODY = new Set(["context", "risk", "mechanism", "failure_point", "defense", "point"]);

export function checkCopyBudget(post: AnyPost): string[] {
  const out: string[] = [];
  for (const s of post.slides ?? []) {
    const where = `slide ${s.slide} [${s.role}]`;
    const copy = s.on_slide_copy ?? "";
    if (s.role === "cover" && words(copy) > 8)
      out.push(`${where} on_slide_copy ${words(copy)} words (cover max 8)`);
    else if (BODY.has(s.role ?? "")) {
      if (words(copy) > 14) out.push(`${where} on_slide_copy ${words(copy)} words (body max 14)`);
      if (chars(copy) > 90) out.push(`${where} on_slide_copy ${chars(copy)} chars (body max 90)`);
    } else if (s.role === "takeaway" && words(copy) > 22)
      out.push(`${where} on_slide_copy ${words(copy)} words (takeaway max 22)`);

    const sub = s.subline ?? "";
    if (words(sub) > 30) out.push(`${where} subline ${words(sub)} words (max 30)`);
    if (chars(sub) > 180) out.push(`${where} subline ${chars(sub)} chars (max 180)`);
  }
  return out;
}

const DENY = ["diff","commit","log","terminal","console","dashboard","panel","label","labeled",
  "marked","logo","snippet","email","thread","code","script","plaintext","version","map"];
const DENY_RE = new RegExp(`\\b(${DENY.join("|")})\\b`, "i");
const CAPS_RUN_RE = /\b[A-Z0-9_]{2,}\b(\s+\b[A-Z0-9_]{2,}\b)+/;

export function lintVisualPrompts(post: AnyPost): string[] {
  const out: string[] = [];
  for (const s of post.slides ?? []) {
    const p = s.visual_prompt ?? "";
    const where = `slide ${s.slide} [${s.role}] visual_prompt`;
    const deny = p.match(DENY_RE);
    if (deny) out.push(`${where}: text-summoning noun "${deny[1]}"`);
    const caps = p.match(CAPS_RUN_RE);
    if (caps) out.push(`${where}: ALL-CAPS run "${caps[0]}"`);
  }
  return out;
}
