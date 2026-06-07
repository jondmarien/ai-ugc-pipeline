# BRAND_BRAIN.md — the four pillars, one file

The single brand context every post pulls from, so brand decisions are made once, not per-post. Pillars: **Positioning, Voice, Visual Identity, Story.** Voice and Visual Identity already live elsewhere in this repo; this file adds the two that were undocumented (Positioning, Story) and points at the rest. `/draft-post` loads this file in step 1.

> Origin: ingested from @growithalex's "Master Brand Brain" framework (`pipeline/content/ingested/2026-06-07_growithalex_master-brand-brain.md`, Delta 6), adapted to this account. When all four pillars agree, every surface (carousel, reel, caption, bio) pulls from the same brain.

---

## 1. Positioning

**Who it's for:** practitioners and builders. SOC analysts, detection engineers, AppSec and red-team folks, developers shipping AI features, and security-curious students climbing the same ladder Jon did. They are peers, not an audience to scare.

**What we stand for:** *real threats, real tools, no fake panic.* Every post is sourced or labeled `[Scenario]`, every post ends with a concrete defender takeaway, and offensive depth is allowed when it genuinely teaches authorized work.

**What we're against:** FUD and doom-bait, invented breaches and fake CVEs, "AI will hack everything" hype, engagement tricks that trade credibility for reach, and security content that names no tool, no control, and no next step.

**One-line test:** "I break down how AI actually changes attacks and defenses, with sources, so defenders know what to do about it." A post that doesn't serve that sentence doesn't ship.

## 2. Voice

Lives in `pipeline/content/VOICE_AND_TONE_GUIDE.md` (human-readable) and `.claude/skills/humanizer/references/voice-profile.md` (machine-applied). Short version: sharp, practical, dry, first-person; confidence from having done the thing; curiosity plus a little paranoia, never doom. The words we never use are in the voice guide's kill list. Quick check: the **name-removed test** (voice guide §5).

## 3. Visual Identity

The rule for *when each color shows up*, not just a palette. Theme is chosen per post from the content's nature:

| Theme | Color | Shows up when |
| --- | --- | --- |
| `offensive` | red | Attack tradecraft, threat actor behavior, offensive AI |
| `defensive` | blue | Detection, response, controls, blue-team workflows |
| `hacking` | green | Hands-on technique, tooling, CTF-adjacent content |
| `purple-team` | purple | Combined offense + defense in one post |
| `ai` | orange | Model-centric / generic AI topics without a clear side |

Layout furniture (fonts, header/footer, accent marks `[[…]]`/`{{…}}`) is fixed by the renderer design system; see `renderer/docs/PROJECT_ARCHITECTURE.md`. Carousel 1080×1350, reel 1080×1920.

## 4. Story

The through-line that makes a stranger care before the first fact lands. Reusable for bios, about-slides, CTA sign-offs, and any "why listen to me" moment:

Jon ("chrono") got into security by doing it: honors bachelor in cybersecurity at Sheridan, executive (Club Coordinator + honorary content developer) at ISSessions, Canada's biggest post-secondary infosec club, then Co-Chair of BearHacks 2025 and core organizer + dev lead of BearHacks 2026. He builds the tools he posts about (this pipeline included), plays CTFs, and writes up what breaks. The account exists because AI changed both sides of security at once, and most coverage picked panic over evidence. He picked evidence.

**Belief, one line:** stay curious, and maybe a little paranoid.

---

## Keeping it honest

- Update this file when positioning or story actually changes; don't let it drift into aspiration.
- If a post conflicts with a pillar, fix the post or consciously update the pillar; never both-ways it.
- Voice and visuals stay pointers; do not duplicate their rules here (single source of truth).
