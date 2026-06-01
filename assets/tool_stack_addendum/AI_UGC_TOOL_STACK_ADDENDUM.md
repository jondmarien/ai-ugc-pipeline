# AI UGC Tool Stack Addendum for Claude

Author: **Manus AI**  
Prepared for: **Jon / D-Sports**  
Purpose: **Add tool-stack context to the existing Claude handoff package for building an AI-in-cybersecurity UGC content production pipeline.**

## How to use this addendum

This file should be attached to Claude **in addition to** the earlier AI cybersecurity carousel handoff ZIP. The earlier ZIP explains the content strategy, post formats, carousel structure, captioning style, QA rules, and first production system. This addendum explains the **media-generation tool layer**: voiceovers, background footage, UGC-style videos, music beds, subtitles, and possible open-source alternatives to expensive SaaS tools.

Claude should not treat this as a request to pick one magic tool. The intended outcome is a **modular production pipeline** where Jon can swap tools as budget, quality, API access, and compute availability change.

> **Core instruction for Claude:** Build the pipeline so every media layer is replaceable: script, voiceover, b-roll/background video, music/SFX, subtitles, edit assembly, QA, and final export. Do not hard-code the workflow around ElevenLabs, Higgsfield, or any one SaaS.

## Project context

Jon is building an AI-in-cybersecurity social content operation inspired by dramatic AI/tech UGC carousel and short-form video accounts. Instagram API access is currently blocked by Meta account/developer verification issues, so the immediate objective is to build a **manual-first production machine** that can generate publish-ready assets while API publishing is pending.

The content style should focus on **AI in cybersecurity**, including agentic security workflows, AI-assisted malware analysis, phishing detection, prompt injection, SOC automation, AI red teaming, threat intelligence, firmware/security research, defensive automation, and the operational risks of careless AI adoption.

| Existing handoff package covers | This addendum adds |
| --- | --- |
| Carousel strategy, hooks, captions, QA, and post templates | Tool choices for videos, voiceovers, music, b-roll, and editing |
| Manual publishing while Instagram API access is pending | How to produce Reel/video variants without relying on expensive tools |
| Content pipeline architecture | Open-source and lower-cost replacement candidates |
| First-week post production | Tool evaluation matrix and bake-off instructions |

## Strategic direction

The strongest recommendation is to avoid a fully self-hosted stack at the beginning. A fully local AI video pipeline can consume weeks of setup time before producing useful posts. Claude should help Jon ship content first, then progressively replace expensive components.

| Phase | Goal | Tooling approach |
| --- | --- | --- |
| **Phase 1: Manual-first production** | Create publish-ready carousel/Reel assets quickly | Use Claude/Manus for scripts, Canva/CapCut for assembly, stock footage, free/cheap TTS, and manual upload. |
| **Phase 2: Voiceover replacement** | Reduce ElevenLabs dependency | Test VoxCPM, F5-TTS, Piper, and OpenVoice using the same cybersecurity narration scripts. |
| **Phase 3: Generated b-roll** | Create branded cyber visuals | Test Wan2.1, LTX-Video, ComfyUI workflows, and stock-footage hybrids. |
| **Phase 4: Orchestration** | Make the process agent-repeatable | Use OpenShorts and Open-AI-UGC as inspiration or fork candidates if useful; otherwise build a simpler folder-based pipeline. |
| **Phase 5: API publishing** | Add Instagram automation once Meta access is resolved | Keep a human approval gate before publishing. |

## Recommended tool categories

Claude should organize the production system by media layer, not by vendor. The goal is to make a pipeline that can use paid, free, or open-source tools depending on quality and availability.

| Layer | Primary job | Good starting options | Open-source/self-hosted candidates | Notes |
| --- | --- | --- | --- | --- |
| **Script** | Hook, narration, CTA, caption | Claude, Manus, ChatGPT | Local LLM optional later | Needs fact-checking and cybersecurity nuance. |
| **Voiceover** | Narrate 20–45 second Reel scripts | ElevenLabs free tier, CapCut voices, browser TTS | VoxCPM, F5-TTS, Piper, OpenVoice | Start with a voice bake-off. |
| **Background/b-roll** | Create cyber ambience and visual pacing | Pexels, Pixabay, Mixkit, Canva, CapCut | Wan2.1, LTX-Video, ComfyUI | Stock footage is faster; generated b-roll can become brand style later. |
| **AI UGC actor video** | Talking-head ad/creator delivery | HeyGen, Creatify, Arcads, MakeUGC, BigMotion, Vozo | OpenShorts, Open-AI-UGC, plus swappable TTS/lip-sync | Full open-source actor workflow is possible but rougher; many “open-source” studios still rely on paid generation APIs. |
| **Music/SFX** | Add energy without competing with narration | YouTube Audio Library, Pixabay Music, Mixkit, Beatoven, Mubert | MusicGen, Stable Audio Open, other local models if license permits | Avoid lyrical music under voiceover. |
| **Subtitles/editing** | Build final 9:16 vertical video | CapCut, Canva, Descript, VEED | FFmpeg, faster-whisper, OpenShorts | CapCut first, automation later. |
| **Publishing** | Upload/schedule content | Manual Business Suite while Meta access is pending | Instagram Graph API later | Do not automate posting until credentials and permissions are resolved. |

## Specific tools and how Claude should reason about them

### VoxCPM

VoxCPM is the main open-source TTS candidate Jon found as a possible ElevenLabs alternative. Claude should treat it as **promising but unproven for this exact use case** until tested on cybersecurity scripts. The evaluation should focus on clarity, pronunciation of technical terms, emotional tone, background noise, generation speed, and editing burden.

Claude should create a test script containing cybersecurity terms such as **OAuth**, **EDR**, **prompt injection**, **firmware**, **Graph API**, **MFA fatigue**, **credential stuffing**, **SIEM**, **SOC**, and **phishing kit**. If VoxCPM handles these well, it can become the default open-source voiceover route.

### F5-TTS, Piper, and OpenVoice

F5-TTS should be considered for a consistent narrator voice, especially if Jon uses his own authorized voice sample. Piper should be considered for fast local drafts and rough cuts. OpenVoice can be evaluated for voice conversion or branded voice experiments. Claude must include a consent and licensing warning around voice cloning.

### Higgsfield-style tools

Claude should not search for a perfect open-source Higgsfield clone as the core plan. The more accurate framing is that Higgsfield-like output requires a **stack**: image generation, image-to-video, camera-motion prompting, editing presets, and social-native composition. Open-source video models can help, but they are not a drop-in replacement for a polished creator app.

### Wan2.1 and LTX-Video

Wan2.1 and LTX-Video are serious open-source/open-weight video generation ecosystems for cyber b-roll and image-to-video experiments. They are best suited for **abstract, stylized background clips** such as SOC dashboards, glowing terminal rooms, AI agents over network maps, phishing inboxes, cloud breach maps, malware sandboxes, and cyberpunk server rooms.

Claude should not make Jon dependent on these tools immediately unless Jon has GPU access or is willing to use cloud GPU services. The first production path can use stock footage plus motion effects, while the generated-b-roll track can be tested separately.

### OpenShorts

OpenShorts is the closest open-source UGC workflow candidate because it combines clipping, UGC-style generation, subtitles, hooks, and publishing concepts. However, it uses external APIs for some features. Claude should evaluate OpenShorts as either:

| Option | When to choose it |
| --- | --- |
| **Reference architecture only** | If setting it up would slow down content production. |
| **Fork/customize later** | If Jon wants a self-hosted dashboard for repeatable generation. |
| **Immediate test deployment** | If Jon wants to explore Docker-based automation and has time for setup/debugging. |

### Open-AI-UGC

Open-AI-UGC should be included as a **conditional evaluation candidate**, not as the default production dependency. The repository describes itself as a free/open-source alternative to Arcads and MakeUGC for generating AI UGC video ads, with a Next.js studio that supports script input, reference images, model selection, async jobs, generation history, credits, Stripe billing, Google sign-in, and MUAPI-backed models such as Grok Video, Veo 3.1, Seedance 2, and Happy Horse 1.[9]

The useful part for Jon is the **product shape**: it resembles the kind of self-hosted UGC studio that could eventually sit beside the AI cybersecurity content pipeline. It could help Claude reason about a dashboard where Jon pastes a script, attaches an AI-generated actor/product/cyber visual, chooses a model, generates a vertical video, and stores the result for manual review.

However, Claude must not treat Open-AI-UGC as a free local replacement for Higgsfield, Arcads, or MakeUGC. Its environment template requires external services including Postgres, NextAuth, Google OAuth, Stripe, and a `UGC_API_KEY`/webhook setup, which means the core video generation still depends on an external API provider rather than a fully local model.[9] A local inspection also found that the UI references routes such as `/api/generate`, `/api/upload`, and `/api/creations/[id]`, while the cloned source tree did not visibly include the described `src/app/api/*` backend routes. Claude should verify this before recommending a fork.

| Use Open-AI-UGC for | Do not use Open-AI-UGC for |
| --- | --- |
| A reference UI/UX for a future self-hosted UGC studio | A guaranteed plug-and-play free Higgsfield clone |
| A possible fork if the missing backend/API pieces are resolved | Avoiding all generation costs, because it appears MUAPI/API-backed |
| Understanding actor/image-to-video orchestration patterns | Immediate Week 1 publishing if setup slows down output |
| Testing a hosted/open-source SaaS-style workflow | Production use before license, auth, storage, webhook, and billing risks are checked |

Claude’s action item is to add Open-AI-UGC to `OPEN_SOURCE_EVALUATION_MATRIX.md` under **UGC studio/orchestration**, with the status **“Evaluate, do not depend on yet.”** The first test should be: clone it, check license status, confirm whether API routes exist, install dependencies, run locally, and determine whether MUAPI can be swapped for Jon’s preferred tool chain. If that takes more than one focused session, Claude should defer it and keep the manual CapCut/Canva production track moving.

## What Claude should produce next

Claude should update or extend the previous handoff output with a **media-production tool layer**. The expected deliverables are:

| Deliverable | Purpose |
| --- | --- |
| `MEDIA_TOOL_STACK.md` | Final recommended stack with free, paid, and open-source options by layer. |
| `VOICEOVER_BAKEOFF.md` | Script and evaluation rubric for VoxCPM, F5-TTS, Piper, OpenVoice, and any SaaS baseline. |
| `BROLL_PROMPT_BANK.md` | Cybersecurity video/background prompts for stock search and AI video generation. |
| `MUSIC_SFX_GUIDE.md` | Background music and sound-effect rules for cyber UGC videos. |
| `VIDEO_ASSEMBLY_WORKFLOW.md` | Manual CapCut/Canva workflow first, then optional FFmpeg/OpenShorts automation path. |
| `OPEN_SOURCE_EVALUATION_MATRIX.md` | Practical comparison of VoxCPM, F5-TTS, OpenVoice, Piper, OpenShorts, Open-AI-UGC, Wan2.1, and LTX-Video. |
| `WEEK_1_VIDEO_EXPERIMENTS.md` | Three to five test videos using different combinations of voice, b-roll, subtitles, and music. |

## Tool evaluation rubric

Claude should use this rubric instead of only listing tools.

| Criterion | Voiceover | Video/b-roll | Music/SFX | Editing/orchestration |
| --- | --- | --- | --- | --- |
| **Output quality** | Naturalness, clarity, technical pronunciation | Motion quality, artifact rate, cyber credibility | Non-distracting, loopable, mood fit | Clean export, readable captions |
| **Cost** | Per minute or local compute | Per clip or GPU time | License/subscription cost | Subscription or local maintenance |
| **Setup complexity** | Install, model size, GPU/CPU needs | GPU needs, ComfyUI complexity | Simple download vs generation | Manual editor vs automation |
| **Commercial safety** | Voice rights, cloning consent | Model and asset license | Music license clarity | Platform terms and export rights |
| **Repeatability** | Consistent voice preset | Reusable prompt style | Reusable audio bed | Template-based workflow |

## Guardrails

Claude should preserve the existing cybersecurity QA rules. Videos should not become exploit tutorials or exaggerated misinformation. A good post can be dramatic without being false or irresponsible.

The workflow should also avoid unlicensed cloning of real voices, stolen footage, copyrighted music, misleading deepfakes, or claims that cannot be verified. Any AI-generated person or voice should be treated as synthetic unless Jon explicitly supplies authorized source material.

## Practical recommendation to Claude

Claude should recommend a **two-track build**:

| Track | Description | Immediate action |
| --- | --- | --- |
| **Production track** | Uses the fastest reliable tools to publish content now. | CapCut/Canva, stock footage, simple TTS, manual upload. |
| **R&D track** | Tests open-source replacements without blocking publishing. | VoxCPM/F5-TTS voice bake-off, Wan/LTX b-roll tests, OpenShorts and Open-AI-UGC architecture reviews. |

This separation matters because Jon needs output, not just infrastructure. If the open-source stack works, it can gradually replace SaaS pieces. If it does not, the production track still continues.

## References

[1]: https://github.com/OpenBMB/VoxCPM "OpenBMB/VoxCPM GitHub Repository"  
[2]: https://github.com/swivid/F5-TTS "F5-TTS GitHub Repository"  
[3]: https://github.com/rhasspy/piper "Piper Text-to-Speech GitHub Repository"  
[4]: https://github.com/myshell-ai/OpenVoice "OpenVoice GitHub Repository"  
[5]: https://github.com/mutonby/openshorts "OpenShorts GitHub Repository"  
[6]: https://openshorts.app/ "OpenShorts — Free Open Source Clip Generator & AI UGC Video Creator"  
[7]: https://github.com/Wan-Video/Wan2.1 "Wan2.1 GitHub Repository"  
[8]: https://github.com/Lightricks/LTX-Video "LTX-Video GitHub Repository"  
[9]: https://github.com/Anil-matcha/Open-AI-UGC "Open-AI-UGC GitHub Repository"
