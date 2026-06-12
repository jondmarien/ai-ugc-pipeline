# Sources — 2026-06-10_copy-fail-linux-lpe

**Core claim:** Copy Fail (CVE-2026-31431) is a Linux kernel LPE in the algif_aead crypto module that lets an unprivileged user write four controlled bytes into any readable file page cache. A 732-byte Python exploit edits a setuid binary and gains root. Portable, tiny, stealthy, cross-container. Same bug class as Dirty Pipe.
**Claim tags:** reported_fact, practitioner_takeaway

| Source | Link | Supports | Confidence | Claim tag |
| --- | --- | --- | --- | --- |
| The Hacker News: New Linux 'Copy Fail' Vulnerability Enables Root Access | https://thehackernews.com/2026/04/new-linux-copy-fail-vulnerability.html | Copy Fail (CVE-2026-31431) CVSS 7.8; 732-byte Python exploit; four steps to root; algif_aead flaw from August 2017 commit; portable across all distros since 2017; cross-container impact; no race condition; same class as Dirty Pipe; distro advisories; Bugcrowd David Brumley analysis. | high | reported_fact |
| Xint.io: Copy Fail Linux Distributions | https://xint.io/blog/copy-fail-linux-distributions | Technical details on algif_aead in-place optimization; page-cache write primitive; four properties (portable, tiny, stealthy, cross-container); exploit reliability; distro coverage. | high | reported_fact |
| The Hacker News: Linux Kernel Dirty Frag LPE Exploit | https://thehackernews.com/2026/05/linux-kernel-dirty-frag-lpe-exploit.html | Dirty Frag bypasses Copy Fail mitigation (algif_aead blacklist); works regardless of algif_aead module; bug class wider than one subsystem. | high | reported_fact |

> Re-open every link before posting and confirm the claim still matches the source wording.
