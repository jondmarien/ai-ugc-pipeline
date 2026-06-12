# Sources — 2026-06-10_cohere-north-mini-code

**Core claim:** Cohere released North Mini Code, a 30B MoE coding agent open-sourced under Apache 2.0 that runs on a single H100, but it generates three times the output tokens of comparable models, a verbosity cost that compounds silently in high-volume agentic pipelines.
**Claim tags:** reported_fact, practitioner_takeaway

| Source | Link | Supports | Confidence | Claim tag |
| --- | --- | --- | --- | --- |
| VentureBeat: Cohere open-sources a coding agent that runs on a single H100 | https://venturebeat.com/technology/cohere-open-sources-a-coding-agent-that-runs-on-a-single-h100 | Release date June 9; North Mini Code 30B MoE with 3B active; Apache 2.0 on Hugging Face; runs on single H100 or Mac Studio 20GB RAM; 256K context, 64K max generation; agentic coding capabilities; trained on 70K+ verifiable tasks across ~5K repos; multi-harness training (SWE-Agent, Mini-SWE-Agent, OpenCode); 2.8x throughput vs Devstral Small 2; 30% latency advantage; 3x verbosity (75M vs 25M median tokens); Artificial Analysis rankings (8th/127 speed, 18th/127 intelligence); Fable 5 at $50/M output tokens; Frosst quotes on local deployment sovereignty. | high | reported_fact |
| Artificial Analysis: North Mini Code model page | https://artificialanalysis.ai/models/north-mini-code | Independent benchmark rankings: 8th of 127 on output speed (210 tok/s), 18th of 127 on Intelligence Index; TTFT 0.25s vs 1.95s median; 75M output tokens vs 25M median on Intelligence Index. | high | reported_fact |
| Cohere Labs Hugging Face blog: Introducing North Mini Code | https://huggingface.co/blog/CohereLabs/introducing-north-mini-code | Technical details on MoE architecture (128 experts, 8 active); training methodology; verifiable RL tasks; multi-harness evaluation; benchmark claims against larger models. | high | reported_fact |

> Re-open every link before posting and confirm the claim still matches the source wording.
