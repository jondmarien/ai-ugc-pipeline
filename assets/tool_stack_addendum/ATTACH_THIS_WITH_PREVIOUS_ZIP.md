# Attach This With the Previous Claude Handoff ZIP

Jon should give Claude the original handoff ZIP first, then attach the files in this addendum folder. The goal is to help Claude understand not only the content strategy, but also the practical tool stack for creating short-form AI UGC videos with lower-cost and open-source components.

## Attachment order

| Order | File | Why Claude needs it |
| --- | --- | --- |
| 1 | Original `claude_ai_cyber_ugc_handoff.zip` | Contains the main project handoff, content system, templates, carousel guide, and original starting prompt. |
| 2 | `AI_UGC_TOOL_STACK_ADDENDUM.md` | Explains how voiceover, b-roll, music, subtitles, editing, OpenShorts, Open-AI-UGC, VoxCPM, Wan2.1, and LTX-Video fit into the production pipeline. |
| 3 | `CLAUDE_TOOL_STACK_STARTING_PROMPT.md` | Copy-paste prompt that tells Claude exactly what to produce next. |
| 4 | `ai_ugc_tool_stack_recommendations.md` | The original recommendation memo with the broader tool matrix and rationale. |
| 5 | `open_ai_ugc_evaluation_notes.md` | Specific evaluation notes for Open-AI-UGC, including why it is useful but should be treated as an evaluation candidate rather than a default dependency. |

## Copy-paste instruction for Claude

Use the full prompt from `CLAUDE_TOOL_STACK_STARTING_PROMPT.md`. If Claude asks what to prioritize, tell it this:

> Prioritize a manual-first production track that lets me publish now, while creating a separate R&D track for open-source replacements like VoxCPM, F5-TTS, Piper, OpenVoice, OpenShorts, Open-AI-UGC, Wan2.1, and LTX-Video. Do not make the whole system depend on any one paid SaaS. Treat Open-AI-UGC as “evaluate, do not depend on yet” until its license, backend routes, external API assumptions, and local run path are verified.

## Expected Claude output

Claude should produce these files:

| Output file | Purpose |
| --- | --- |
| `MEDIA_TOOL_STACK.md` | Final recommended media tool stack. |
| `VOICEOVER_BAKEOFF.md` | Voiceover testing plan for VoxCPM and alternatives. |
| `BROLL_PROMPT_BANK.md` | AI cybersecurity b-roll and background prompt bank. |
| `MUSIC_SFX_GUIDE.md` | Rules and source list for music and sound effects. |
| `VIDEO_ASSEMBLY_WORKFLOW.md` | CapCut/Canva workflow plus optional automation path. |
| `OPEN_SOURCE_EVALUATION_MATRIX.md` | Comparison matrix for open-source and low-cost tools. |
| `WEEK_1_VIDEO_EXPERIMENTS.md` | First set of short-form video experiments. |

## What not to let Claude do

Claude should not turn this into a research-only document. It should produce an actionable production kit. It should not spend the whole plan on installing open-source video models before defining how Jon can publish content immediately. It should also avoid making unverified claims about cybersecurity incidents, using copyrighted media without permission, or cloning anyone’s voice without explicit authorization. For Open-AI-UGC, Claude should not assume it is a fully free or fully local Higgsfield clone; it should verify the repository before recommending adoption.
