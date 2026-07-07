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

export const REPO_URL = "https://github.com/jondmarien/ai-ugc-pipeline";
export const REPO_ZIP_URL = `${REPO_URL}/archive/refs/heads/main.zip`;
export const DISCORD_URL = "https://discord.gg/m9VpNzgtRj";

export const SOCIALS = [
  {
    key: "discord",
    label: "Discord",
    handle: "join the server",
    url: DISCORD_URL,
  },
  {
    key: "youtube",
    label: "YouTube",
    handle: "@SirChronoblaze",
    url: "https://www.youtube.com/@SirChronoblaze",
  },
  {
    key: "instagram",
    label: "Instagram",
    handle: "@chron0s_cyb3r_w0rld.ai",
    url: "https://www.instagram.com/chron0s_cyb3r_w0rld.ai",
  },
] as const;

export function getSocial(key: (typeof SOCIALS)[number]["key"]) {
  const social = SOCIALS.find((s) => s.key === key);
  if (!social) throw new Error(`Unknown social key: ${key}`);
  return social;
}

// The 5-theme content system = the brand's visual identity rule.
export const PILLARS = [
  {
    key: "offensive",
    label: "Offensive",
    color: "var(--color-offensive)",
    hex: "#ef4444",
    when: "Attack tradecraft, threat-actor behavior, offensive AI.",
  },
  {
    key: "defensive",
    label: "Defensive",
    color: "var(--color-defensive)",
    hex: "#3b82f6",
    when: "Detection, response, controls, blue-team workflows.",
  },
  {
    key: "hacking",
    label: "Hacking",
    color: "var(--color-hacking)",
    hex: "#39ff88",
    when: "Hands-on technique, tooling, CTF-adjacent work.",
  },
  {
    key: "team",
    label: "Purple-team",
    color: "var(--color-team)",
    hex: "#a855f7",
    when: "Offense and defense combined in one breakdown.",
  },
  {
    key: "ai",
    label: "AI",
    color: "var(--color-ai)",
    hex: "#f97316",
    when: "Model-centric topics without a clear side.",
  },
] as const;

// How a post is actually made — "I build the tools I post about."
export const PIPELINE = [
  {
    n: "01",
    title: "Research",
    body: "Landscape scan, then triangulate at least two independent sources. Every claim tiered Verified, Emerging, or Scenario. No fabricated CVEs, no uncited victims.",
  },
  {
    n: "02",
    title: "Write",
    body: "Draft the carousel and an independent reel script, then run the copy chain: humanize, strip AI slop, proofread. Voice over hype, always.",
  },
  {
    n: "03",
    title: "Render",
    body: "Map to a schema, generate cinematic key art locally with FLUX.2, narrate with a cloned voice, and cut a synced vertical reel.",
  },
  {
    n: "04",
    title: "Publish",
    body: "Human-approved, then posted. Sourced, defensible, and ending on a concrete defender takeaway every time.",
  },
] as const;

// ── The Skill drop ───────────────────────────────────────────────────────
// The whole pipeline, packaged as an installable Claude skill.

export const SKILL = {
  name: "ai-ugc-pipeline",
  install: "npx skills add jondmarien/ai-ugc-pipeline",
  clone: `git clone ${REPO_URL}\ncd ai-ugc-pipeline/renderer && bun install`,
  pitch:
    "Drop one cybersecurity idea and get a sourced, cinematic 8-slide carousel plus a narrated vertical reel, researched, written, rendered, and gated for human approval, inside Claude Code.",
  badges: ["Sourced", "No slop", "Human-gated"],
  problem: {
    bad: {
      tag: "Generic AI content",
      title: "Hallucinated stats, fake panic",
      body: "Ask a model for a security post and it invents CVEs, rounds fear up, and writes in a cadence every reader now recognizes as AI. One correction in the comments and the account is done.",
    },
    good: {
      tag: "Locked to sources",
      title: "Every claim triangulated and tiered",
      body: "This pipeline researches in a loop: two independent sources per claim, each one tagged Verified, Emerging, or Scenario. Three copy passes strip the AI tells. A human approves before anything posts.",
    },
  },
} as const;

// What ships inside the skill package. Colors cycle the pillar palette.
export const SKILL_PARTS = [
  {
    name: "ai-ugc-pipeline",
    kind: "skill",
    color: "#f97316",
    role: "The umbrella. Setup, the end-to-end workflow, and the rules that keep every post defensible.",
  },
  {
    name: "ai-cybersecurity-ugc-carousel",
    kind: "skill",
    color: "#ef4444",
    role: "The content brain. Hooks, slide scripts, captions, and QA with practitioner-grade sourcing.",
  },
  {
    name: "react-remotion-instagram-renderer",
    kind: "skill",
    color: "#3b82f6",
    role: "Approved copy in, assets out. Schema-valid JSON, FLUX.2 or cloud key art, carousel PNGs, and a synced reel.",
  },
  {
    name: "humanizer",
    kind: "skill",
    color: "#39ff88",
    role: "Rewrites copy in a calibrated human voice and strips the tells that read as AI.",
  },
  {
    name: "stop-slop",
    kind: "skill",
    color: "#a855f7",
    role: "Scores directness, rhythm, trust, and density. Below 35 out of 50, the copy goes back.",
  },
  {
    name: "professional-proofreader",
    kind: "skill",
    color: "#3b82f6",
    role: "The last pass. Grammar, punctuation, and every line a complete spoken sentence.",
  },
  {
    name: "ig-ingest",
    kind: "skill",
    color: "#ef4444",
    role: "Feeds the machine. Mines inspiration posts for pipeline improvements without ever copying them.",
  },
] as const;

// Per-agent install recipes for the tabbed installer. The skills CLI
// (vercel-labs/skills) writes to each agent's own skills directory.
export const INSTALL_AGENTS = [
  {
    key: "claude-code",
    label: "Claude Code",
    command: "npx skills add jondmarien/ai-ugc-pipeline -a claude-code",
    steps: [
      {
        n: "1",
        title: "Run the command",
        body: "One line in any terminal. The CLI lists every skill in the repo; take them all or cherry-pick with --skill.",
      },
      {
        n: "2",
        title: "Open Claude Code",
        body: "The skills land in .claude/skills and register on the next session. No settings, no restart dance.",
      },
      {
        n: "3",
        title: "Drop an idea",
        body: "Type /draft-post with an idea and a pillar. Research, copy chain, and QA run from the skill alone.",
      },
    ],
  },
  {
    key: "cursor",
    label: "Cursor",
    command: "npx skills add jondmarien/ai-ugc-pipeline -a cursor",
    steps: [
      {
        n: "1",
        title: "Run the command",
        body: "Same CLI, different flag. It writes the skills where Cursor's agent reads them.",
      },
      {
        n: "2",
        title: "Open a Cursor agent chat",
        body: "The skills are picked up automatically the next time the agent plans a task.",
      },
      {
        n: "3",
        title: "Ask for a post",
        body: "Describe the idea and the angle. The skill carries the workflow, the sourcing rules, and the voice.",
      },
    ],
  },
  {
    key: "codex",
    label: "Codex",
    command: "npx skills add jondmarien/ai-ugc-pipeline -a codex",
    steps: [
      {
        n: "1",
        title: "Run the command",
        body: "The CLI installs to Codex's skills directory, symlinked so updates flow through.",
      },
      {
        n: "2",
        title: "Start a Codex session",
        body: "Skills load with the session. Confirm with a quick 'what skills do you have?'.",
      },
      {
        n: "3",
        title: "Drop an idea",
        body: "Same workflow, same gates: sourced claims, three copy passes, human approval.",
      },
    ],
  },
  {
    key: "any",
    label: "Any agent",
    command: "npx skills add jondmarien/ai-ugc-pipeline",
    steps: [
      {
        n: "1",
        title: "Run it interactive",
        body: "No flag needed. The CLI detects the agents on your machine and asks which ones to install to.",
      },
      {
        n: "2",
        title: "Or go manual",
        body: "Every skill is a plain SKILL.md folder in the repo. Copy it wherever your agent reads skills from.",
      },
      {
        n: "3",
        title: "Bring the studio",
        body: "Clone the repo and bun install in renderer/ when you want art, voice, and reels, not just copy.",
      },
    ],
  },
] as const;

// The unlock vault: follow any one channel and the download is yours.
// Honor system on purpose — the seal is theater, the follow is the ask.
export const UNLOCK_CHANNELS = [
  {
    key: "instagram",
    label: "Instagram",
    handle: "@chron0s_cyb3r_w0rld.ai",
    url: "https://www.instagram.com/chron0s_cyb3r_w0rld.ai",
    color: "#ef4444",
  },
  {
    key: "tiktok",
    label: "TikTok",
    handle: "coming soon",
    url: "",
    color: "#39ff88",
    comingSoon: true,
  },
  {
    key: "youtube",
    label: "YouTube",
    handle: "@SirChronoblaze",
    url: "https://www.youtube.com/@SirChronoblaze",
    color: "#ef4444",
  },
  {
    key: "discord",
    label: "Discord",
    handle: "join the server",
    url: DISCORD_URL,
    color: "#a855f7",
  },
  {
    key: "github",
    label: "GitHub",
    handle: "jondmarien",
    url: "https://github.com/jondmarien",
    color: "#3b82f6",
  },
] as const;

export const FAQ = [
  {
    q: "What do I actually need to run it?",
    a: "Copy mode needs nothing but an agent that reads skills: research, writing, and the copy chain are pure skill work. The full studio needs the repo cloned, bun, and optionally a GPU for local art and voice.",
  },
  {
    q: "Does it work without a GPU?",
    a: "Yes. Without ComfyUI the slides render procedural on-brand backgrounds, or cloud art takes over: point the same pipeline at Higgsfield or FAL.ai with one flag. The whole local stack was built to fit an 8 GB consumer card.",
  },
  {
    q: "Will it post on my behalf?",
    a: "Never on its own. Publishing is a gate, not a ban: only a post you approved and rendered can publish, every run asks for confirmation, and uploads stay private on each platform until you flip them.",
  },
  {
    q: "Is the content actually sourced?",
    a: "Every load-bearing claim needs two independent sources or it gets tagged down to Emerging or Scenario, in the copy. No fabricated CVEs, stats, quotes, or victims. That rule is enforced by the QA checklist, not vibes.",
  },
  {
    q: "Can it use my voice?",
    a: "Yes, VoxCPM2 zero-shot cloning from a 20 to 40 second clip of your own authorized voice, with Whisper matching your cadence. AI audio gets labeled, and Instagram posts carry Meta's AI disclosure flag.",
  },
  {
    q: "What does it cost?",
    a: "The repo is public on GitHub and the default stack is local and free: FLUX.2 klein for art, VoxCPM2 for voice, Remotion for reels. Cloud art and motion (Higgsfield, FAL.ai) are opt-in: the pipeline lists every model's per-image credit cost up front and enforces a budget cap per run, so an expensive model can't surprise you.",
  },
] as const;

// How to use it, madrealty-style: numbered, concrete, short.
export const SKILL_STEPS = [
  {
    n: "01",
    title: "Install",
    body: "One command pulls the skills into Claude Code. Clone the repo too if you want the full renderer: art, voice, and reels.",
  },
  {
    n: "02",
    title: "Drop an idea",
    body: "/draft-post takes an idea and a pillar. The research loop triangulates sources and tiers every claim before a word of copy exists.",
  },
  {
    n: "03",
    title: "Approve",
    body: "You read the post. The copy chain already ran: humanize, de-slop, proofread. Nothing renders until you flip it to approved.",
  },
  {
    n: "04",
    title: "Publish",
    body: "One command renders slides, narrates the reel with a cloned voice, syncs captions, and posts through a gate that only you can open.",
  },
] as const;

export const STORY = [
  "Honors cybersecurity at Sheridan.",
  "Exec at ISSessions, Canada's largest post-secondary infosec club.",
  "Co-Chair of BearHacks 2025, dev lead for BearHacks 2026.",
  "Builds the tools he posts about, plays CTFs, writes up what breaks.",
] as const;
