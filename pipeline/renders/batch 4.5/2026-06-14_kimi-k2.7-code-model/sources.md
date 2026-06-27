# Sources — 2026-06-14_kimi-k2.7-code-model

**Core claim:** Moonshot AI released Kimi K2.7 Code, a 1T parameter Mixture-of-Experts model with 32B activated, purpose-built for agentic coding, expanding the attack surface for workflows that adopt it without independent review.
**Claim tags:** reported_fact, emerging, practitioner_takeaway

| Source | Link | Supports | Confidence | Claim tag |
| --- | --- | --- | --- | --- |
| Kimi K2.7 Code resource page (Moonshot AI) | https://www.kimi.com/resources/kimi-k2-7-code | Kimi K2.7 Code is a 1T parameter MoE model with 32B activated, 384 experts, 8 active, 256K context, mandatory thinking mode, MoonViT vision encoder, Modified MIT license. | high | reported_fact |
| Moonshot AI: kimi-code CLI (GitHub) | https://github.com/MoonshotAI/kimi-code | Kimi Code CLI is a terminal coding agent that loads MCP servers and plugins, runs shell commands, fetches web pages, and can adopt external models for agentic coding. | high | reported_fact |
| Kimi Code documentation: Getting Started | https://moonshotai.github.io/kimi-code/en/guides/getting-started.html | The agent runs read-only actions automatically; file edits and shell commands require confirmation by default; a skip-all-approvals mode exists. | high | reported_fact |
| VM0.ai independent analysis: Kimi K2.7 Code | https://www.vm0.ai/de/models/kimi-k2-7-code | Hallucination rate dropped from 65 percent (K2.6) to 39 percent (K2.7). SWE-bench Verified 80.2, LiveCodeBench v6 89.6, Terminal-Bench 2.0 66.7. | medium | emerging |
| Cline blog: Moonshot Kimi K2 for coding first impressions | https://cline.bot/blog/moonshots-kimi-k2-for-coding-our-first-impressions-in-cline | Production telemetry from thousands of users shows Kimi K2 family achieving 3.3 percent failure rates on real-world diff editing tasks, matching and occasionally outperforming Claude 4 Sonnet. | medium | emerging |
| Geekhaus: Kimi K2.7 Code cuts thinking tokens 30 percent but benchmarks are proprietary | https://geekhaus.club/ko/feed/2026/06/12/kimi-k2-7-code-cuts-thinking-tokens-30-but | Kimi Code Bench v2, MLS Bench Lite, and Kimi Claw 24/7 are Moonshot proprietary benchmarks. Model has not been submitted to DeepSWE independent benchmark. | medium | emerging |
| Cloudflare Workers AI changelog: Kimi K2.7 Code | https://developers.cloudflare.com/changelog/post/2026-06-12-kimi-k2-7-code-workers-ai/ | Kimi K2.7 Code available on Cloudflare Workers AI as @cf/moonshotai/kimi-k2.7-code with pricing at $0.95/M input, $0.19/M cache hit, $4.00/M output. | high | reported_fact |

> Re-open every link before posting and confirm the claim still matches the source wording.
