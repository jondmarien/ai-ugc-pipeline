# Sources — 2026-06-08_gemma4-12b-local-ai

**Core claim:** Gemma 4 12B is an open (Apache-2.0), encoder-free multimodal model that takes text, image, and audio input and runs locally on consumer hardware — but it only outputs text, and its headline 'near-26B' benchmarks are Google's own.
**Claim tags:** verified, emerging

| Source | Link | Supports | Confidence | Claim tag |
| --- | --- | --- | --- | --- |
| Google — "Introducing Gemma 4 12B: a unified, encoder-free multimodal model" (Jun 2026) | https://blog.google/innovation-and-ai/technology/developers-tools/introducing-gemma-4-12b/ | Encoder-free unified architecture; vision + audio flow directly into the LLM backbone; first mid-sized Gemma with native audio input; runs locally on ~16GB; Apache-2.0; MTP drafters. The 'benchmarks nearing our 26B model' claim is Google's own. | high | verified |
| Google Developers Blog — "Gemma 4 12B: The Developer Guide" (Jun 2026) | https://developers.googleblog.com/gemma-4-12b-the-developer-guide/ | Dense multimodal model; encoder-free (raw 48x48 patches via single matmul; raw 16kHz audio projected linearly); unified fine-tuning via Hugging Face or Unsloth; OpenAI-compatible local serving via litert-lm serve. | high | verified |
| Hugging Face — "Welcome Gemma 4" model blog | https://huggingface.co/blog/gemma4 | Gemma 4 supports image, text and audio inputs and generates text responses; the 12B Unified variant is encoder-free and supports audio. | high | verified |
| Unsloth — "Gemma 4 - How to Run Locally" docs | https://unsloth.ai/docs/models/gemma-4 | Gemma-4-12B Unified runs on ~8GB RAM/VRAM (4-bit) or ~14GB (8-bit); GGUF available; run via Unsloth Studio, llama.cpp, Ollama, or LM Studio; Apache-2.0. | high | verified |

> Re-open every link before posting and confirm the claim still matches the source wording.
