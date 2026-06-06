# QA_CHECKLIST.md — Pre-Publish Gate

The Stage 7 gate in [CONTENT_PIPELINE.md](CONTENT_PIPELINE.md). **A post may not be exported until every required check is Pass.** Applies to carousels and Reels/video. Run it against the filled-in [POST_TEMPLATE.md](POST_TEMPLATE.md).

> One reviewer, one pass, written results. If anything is Fail or unsure, revise and re-run — don't "mostly pass."

---

## Gate 1 — Technical credibility

| # | Check | Pass condition |
| --- | --- | --- |
| 1.1 | Claim tagged | Every factual claim marked **[Verified] / [Emerging] / [Scenario]** |
| 1.2 | No fabrication | No invented CVEs, numbers, %s, dates, company names, quotes, paper titles, or tool capabilities |
| 1.3 | No fake precision | Unsourced numbers removed or replaced with qualifiers (most/many/reported) |
| 1.4 | Mechanism accuracy | The "how it works" slide is correct at a high level; nothing technically wrong |
| 1.5 | Practitioner test | A security pro reading this would not call it misleading or hype |

---

## Gate 2 — Safety / responsible disclosure

| # | Check | Pass condition |
| --- | --- | --- |
| 2.1 | No exploit walkthrough | No payloads, exploit chains, working injection strings, or step-by-step attack instructions |
| 2.2 | No evasion guidance | No detection-evasion, AV/EDR bypass, or anti-forensics how-to |
| 2.3 | No credential/MFA-bypass flow | No operational account-takeover or MFA-defeat steps |
| 2.4 | Defense paired with mechanism | Any mechanism slide is immediately paired with mitigation/defensive context |
| 2.5 | No malware enablement | No malware build/deploy instructions |

---

## Gate 3 — Sources

| # | Check | Pass condition |
| --- | --- | --- |
| 3.1 | Source present | At least one primary/reputable source for each factual claim, in the Source table |
| 3.2 | Source re-checked | Links opened today; claim still matches the source wording |
| 3.3 | Victims | No real victim/company named without a cited, public source |
| 3.4 | Confidence logged | High/Med/Low confidence recorded; Low-confidence claims reframed as scenario |

---

## Gate 4 — Defender value

| # | Check | Pass condition |
| --- | --- | --- |
| 4.1 | Takeaway present | At least one concrete control, process, or behavior change |
| 4.2 | Actionable | A reader could actually do/ask the takeaway this week |

---

## Gate 5 — Accessibility & readability

| # | Check | Pass condition |
| --- | --- | --- |
| 5.1 | Cover legibility | Headline readable as a thumbnail; high contrast; not too many words |
| 5.2 | On-slide copy | ≤ ~12 words per slide; text inside safe margins (not cropped in grid preview) |
| 5.3 | Alt text | Every slide has accessible alt text |
| 5.4 | Captions (video) | Burned-in subtitles present, synced, readable on mobile (Reels) |
| 5.5 | Contrast | Text passes a basic contrast check against its band |

---

## Gate 6 — Brand & platform

| # | Check | Pass condition |
| --- | --- | --- |
| 6.1 | Voice | Direct/practical; matches [VOICE_AND_TONE_GUIDE.md](VOICE_AND_TONE_GUIDE.md); no fear-mongering |
| 6.2 | Style consistency | Pillar accent color, layout, handle, and CTA match the system |
| 6.3 | Canvas | 1080×1350 (carousel) / 1080×1920 (Reel); consistent across slides |
| 6.4 | Filenames | Ordered, convention-correct (`YYYY-MM-DD_slug_NN_role.png`) |
| 6.5 | De-AI scan | Copy passes the humanizer audit / [VOICE_AND_TONE_GUIDE.md](VOICE_AND_TONE_GUIDE.md) pre-publish scan — em-dash overuse, listicle cadence, AI vocab, voice-flat symmetry removed; ≥1 voice-signal line |
| 6.5b | Proofread | `professional-proofreader` pass clean: correct grammar/spelling/punctuation/syntax; **every line is a complete spoken sentence with substance** (not a telegraphic fragment); narration flows as connected speech. Dash hygiene: hyphenated compounds glued (`first-ever`), **no spaced dashes** (`word -space`), **no em-dashes in narration**, no word split across two caption lines |
| 6.6 | CTA + question | One clear CTA and one specific comment question |
| **6.7** | **Hook strength** | **Slide 1 contradicts a common belief in ≤1s (not a generic fact)** |
| **6.8** | **Value density** | **Slide 7 = non-obvious + tactical (saveable), not common knowledge** |
| **6.9** | **Resonance** | **Slide 8 labels a shared feeling 100× unnamed (not generic close)** |

---

## Gate 7 — Media rights (video/audio only)

| # | Check | Pass condition |
| --- | --- | --- |
| 7.1 | Music license | Background music is royalty-free/licensed for commercial social use; license noted |
| 7.2 | Footage license | Stock/generated b-roll is licensed/commercial-safe; no stolen clips |
| 7.3 | Voice rights | Voiceover is synthetic-licensed or Jon's own authorized voice; **no unlicensed cloning of a real person** |
| 7.4 | AI-audio disclosure | If a synthetic/cloned voice is used, an AI-generated-audio disclosure is applied where the tool's terms require it (e.g. VoxCPM2 TOS) |
| 7.5 | Model license honored | Any generative model used permits commercial output (see [OPEN_SOURCE_EVALUATION_MATRIX.md](../media/OPEN_SOURCE_EVALUATION_MATRIX.md)); e.g. **F5-TTS base weights = CC-BY-NC → not for commercial posts** |
| 7.6 | No misleading deepfake | No synthetic media implying a real, identifiable person said/did something they didn't |

---

## Sign-off block (paste into the post's QA Notes)

```
QA reviewer: ____   Date: ____
Gate 1 credibility: PASS/FAIL
Gate 2 safety: PASS/FAIL
Gate 3 sources: PASS/FAIL
Gate 4 defender value: PASS/FAIL
Gate 5 accessibility: PASS/FAIL
Gate 6 brand/platform: PASS/FAIL
Gate 7 media rights (if video): PASS/FAIL/N-A
Overall: APPROVED / REVISE
Notes: ____
```

---

## Fast triage (the 9 questions, if short on time)

1. Verified claim or scenario — and is that obvious from the wording?
2. Could this help someone execute abuse? (Must be **no**.)
3. Would a practitioner call this misleading?
4. Does it give defenders something to do?
5. Is the cover readable on a phone?
6. Are all media assets (music/footage/voice/model) licensed for commercial use?
7. **Does Slide 1 flip a common belief in the first second?**
8. **Is Slide 7 a non-obvious tactical framework (not a generic tip)?**
9. **Does Slide 8 name a feeling the audience has actually had?**

If any answer is wrong, it doesn't ship.