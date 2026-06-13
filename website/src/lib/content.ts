// Single source for the brand copy shown on the site. Pulled from
// pipeline/content/BRAND_BRAIN.md so the site and the posts speak with one voice.

export const BRAND = {
  name: "Chrono's Cyber World of AI",
  handle: "@chron0s_cyb3r_w0rld.ai",
  domain: "aiugc.chron0.tech",
  positioning:
    "I break down how AI actually changes attacks and defenses, with sources, so defenders know what to do about it.",
  promise: ["Real threats.", "Real tools.", "No fake panic."],
  thesis:
    "AI changed both sides of security at once. Most coverage picked panic. I picked evidence.",
  belief: "Stay curious, and maybe a little paranoid.",
  contact: "contact@chron0.tech",
} as const;

// Fill TikTok + YouTube URLs once the handles are confirmed.
export const SOCIALS = [
  { key: "tiktok", label: "TikTok", handle: "@chron0s_cyb3r_w0rld.ai", url: "https://www.tiktok.com/@chron0s_cyb3r_w0rld.ai" },
  { key: "youtube", label: "YouTube", handle: "Chrono's Cyber World of AI", url: "https://www.youtube.com/@chron0s_cyb3r_w0rld" },
  { key: "instagram", label: "Instagram", handle: "@chron0s_cyb3r_w0rld.ai", url: "https://www.instagram.com/chron0s_cyb3r_w0rld.ai" },
] as const;

// The 5-theme content system = the brand's visual identity rule.
export const PILLARS = [
  { key: "offensive", label: "Offensive", color: "var(--color-offensive)", hex: "#ef4444", when: "Attack tradecraft, threat-actor behavior, offensive AI." },
  { key: "defensive", label: "Defensive", color: "var(--color-defensive)", hex: "#3b82f6", when: "Detection, response, controls, blue-team workflows." },
  { key: "hacking", label: "Hacking", color: "var(--color-hacking)", hex: "#39ff88", when: "Hands-on technique, tooling, CTF-adjacent work." },
  { key: "team", label: "Purple-team", color: "var(--color-team)", hex: "#a855f7", when: "Offense and defense combined in one breakdown." },
  { key: "ai", label: "AI", color: "var(--color-ai)", hex: "#f97316", when: "Model-centric topics without a clear side." },
] as const;

// How a post is actually made — "I build the tools I post about."
export const PIPELINE = [
  { n: "01", title: "Research", body: "Landscape scan, then triangulate at least two independent sources. Every claim tiered Verified, Emerging, or Scenario. No fabricated CVEs, no uncited victims." },
  { n: "02", title: "Write", body: "Draft the carousel and an independent reel script, then run the copy chain: humanize, strip AI slop, proofread. Voice over hype, always." },
  { n: "03", title: "Render", body: "Map to a schema, generate cinematic key art locally with FLUX.2, narrate with a cloned voice, and cut a synced vertical reel." },
  { n: "04", title: "Publish", body: "Human-approved, then posted. Sourced, defensible, and ending on a concrete defender takeaway every time." },
] as const;

export const STORY = [
  "Honors cybersecurity at Sheridan.",
  "Exec at ISSessions, Canada's largest post-secondary infosec club.",
  "Co-Chair of BearHacks 2025, dev lead for BearHacks 2026.",
  "Builds the tools he posts about, plays CTFs, writes up what breaks.",
] as const;
