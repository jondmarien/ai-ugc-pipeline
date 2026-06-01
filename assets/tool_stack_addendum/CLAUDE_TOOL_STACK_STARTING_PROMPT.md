# Claude Starting Prompt: Add AI UGC Tool Stack to the Content Pipeline

Use this prompt after attaching the original handoff ZIP and this tool-stack addendum.

```markdown
You are helping me build a manual-first, API-ready content production pipeline for AI-in-cybersecurity UGC content. I have attached the original project handoff package, plus an AI UGC tool-stack addendum.

The original handoff explains the content system: AI-in-cybersecurity carousel posts, short-form video concepts, captions, hooks, QA rules, and manual publishing while Instagram API access is blocked by Meta verification issues.

The new addendum explains the media tool layer: open-source and lower-cost options for voiceover, background footage, AI UGC/talking-head video, music/SFX, subtitles, editing, and future automation.

Your task is to integrate the tool-stack addendum into the existing content pipeline. Do not just list tools. Build a practical production system that lets me ship posts now while testing cheaper/open-source replacements in parallel.

## Core objective

Create a modular AI-in-cybersecurity UGC video and carousel production workflow where every media layer is replaceable:

1. Research and source validation.
2. Hook and script writing.
3. Voiceover generation.
4. B-roll/background footage generation or selection.
5. Music and sound effects.
6. Subtitles and visual assembly.
7. QA and safety review.
8. Export package for manual Instagram upload.
9. Later API publishing integration once Meta access is resolved.

## Tool-stack direction

Use a two-track approach:

| Track | Goal | Starting approach |
| --- | --- | --- |
| Production track | Publish content quickly and reliably | CapCut/Canva, stock footage, simple/cheap TTS, manual upload |
| R&D track | Reduce cost and replace SaaS tools over time | VoxCPM/F5-TTS/Piper/OpenVoice voice tests, Wan2.1/LTX-Video b-roll tests, OpenShorts and Open-AI-UGC architecture reviews |

Do not make the pipeline dependent on ElevenLabs, Higgsfield, HeyGen, or any single SaaS. Those can be fallback options, but the system should be modular.

## Specific open-source candidates to evaluate

Please evaluate and place these into the workflow:

| Tool | Use case |
| --- | --- |
| VoxCPM | Main candidate for replacing ElevenLabs voiceover |
| F5-TTS | Consistent narrator voice, possibly using authorized voice samples |
| Piper | Fast local draft narration |
| OpenVoice | Voice conversion or branded synthetic voice experiments |
| OpenShorts | Self-hosted UGC/short-form orchestration reference or possible fork |
| Open-AI-UGC | Conditional UGC studio/orchestration candidate; evaluate as a possible UI scaffold, not a guaranteed free Higgsfield clone |
| Wan2.1 | Open-source/open-weight video generation for cyber b-roll |
| LTX-Video | Open video-generation ecosystem for image-to-video and cinematic b-roll |
| CapCut/Canva | Immediate manual-first editing and template production |
| Pexels/Pixabay/Mixkit/YouTube Audio Library | Low-cost stock footage, music, and SFX |

## Deliverables

Please create the following Markdown files:

1. `MEDIA_TOOL_STACK.md` — Recommended tool stack by production layer, with free/open-source/paid fallback options.
2. `VOICEOVER_BAKEOFF.md` — A test plan for VoxCPM, F5-TTS, Piper, OpenVoice, and a SaaS baseline. Include one 30-second cybersecurity script that stresses technical pronunciation.
3. `BROLL_PROMPT_BANK.md` — Prompt bank for AI cybersecurity b-roll and background footage, including SOC dashboards, malware sandbox, AI agent terminal, phishing inbox, cloud breach map, and firmware lab scenes.
4. `MUSIC_SFX_GUIDE.md` — Rules and sources for background music, risers, glitch hits, transitions, and cyber ambience.
5. `VIDEO_ASSEMBLY_WORKFLOW.md` — Manual CapCut/Canva workflow first, then an optional FFmpeg/OpenShorts automation path.
6. `OPEN_SOURCE_EVALUATION_MATRIX.md` — Practical comparison matrix for VoxCPM, F5-TTS, Piper, OpenVoice, OpenShorts, Open-AI-UGC, Wan2.1, and LTX-Video. For Open-AI-UGC, mark it as “Evaluate, do not depend on yet” unless you verify the license, API routes, external API requirements, and local run path.
7. `WEEK_1_VIDEO_EXPERIMENTS.md` — Three to five experiment videos using different tool combinations.

## Important constraints

Keep the system practical. The immediate priority is publishing content, not spending weeks on infrastructure. Treat open-source tooling as a parallel R&D track until it proves it can match the production need. For Open-AI-UGC specifically, do not assume it is fully self-contained; evaluate whether it depends on MUAPI or missing backend routes before recommending it.

Preserve cybersecurity quality and safety. Do not produce exploit tutorials, unverified claims, irresponsible malware guidance, or exaggerated AI hype. Every post should be dramatic but defensible.

Avoid unlicensed voice cloning, copyrighted music, stolen footage, or misleading deepfakes. If voice cloning is used, assume it must be Jon’s own authorized voice or a fully synthetic licensed voice.

## Style target

The visual style is dramatic, high-contrast, social-native AI/cyber content: bold hook text, short narration, fast b-roll cuts, subtitles, dark cyber visuals, blue/green/orange glow, and captions designed to drive saves/comments.

The content topic is specifically AI in cybersecurity, not generic AI news.

Start by reading all attached files. Then produce the deliverables as clear Markdown documents.
```
