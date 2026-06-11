# Sources — 2026-06-08_chatbot-log-leak

**Core claim:** Pasting production logs and code into unsanctioned chatbots moves secrets, customer data, and internal paths outside your controlled systems, and a clipboard paste slips past file-based data-loss tools.
**Claim tags:** reported_fact, emerging, practitioner_takeaway

| Source | Link | Supports | Confidence | Claim tag |
| --- | --- | --- | --- | --- |
| OWASP Top 10 for LLM Applications (2025): LLM02 Sensitive Information Disclosure | https://genai.owasp.org/llmrisk/llm022025-sensitive-information-disclosure/ | Sensitive information disclosure (credentials, confidential business data, PII) is a top LLM-app risk; user-supplied input is a named vector. | high | reported_fact |
| The Register: Samsung bans generative AI after staff leak | https://www.theregister.com/2023/05/02/samsung_generative_ai_ban/ | Samsung engineers pasted internal source code and a recorded meeting into ChatGPT (April 2023); Samsung banned generative AI on company devices. | high | reported_fact |
| TechCrunch: Samsung bans ChatGPT after internal data leak | https://techcrunch.com/2023/05/02/samsung-bans-use-of-generative-ai-tools-like-chatgpt-after-april-internal-data-leak/ | Independent confirmation of the Samsung source-code paste incident and the generative-AI ban. | high | reported_fact |
| Cyberhaven: workers pasting company data into ChatGPT | https://www.cyberhaven.com/blog/4-2-of-workers-have-pasted-company-data-into-chatgpt | As of June 2023, 8.6% of employees had pasted company data and 4.7% had pasted confidential data into ChatGPT; clipboard paste evades file-based DLP. | high | reported_fact |

> Re-open every link before posting and confirm the claim still matches the source wording.
