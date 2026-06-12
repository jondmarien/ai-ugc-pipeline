# Sources — 2026-06-10_fragnesia-linux-lpe

**Core claim:** Fragnesia (CVE-2026-46300) is the third Linux kernel LPE in two weeks using page-cache corruption. It targets XFRM ESP-in-TCP subsystem. Same mitigation as Dirty Frag (blocklist esp4, esp6, rxrpc). No host-level privileges required unlike Dirty Frag. PoC released by V12 Security.
**Claim tags:** reported_fact, practitioner_takeaway

| Source | Link | Supports | Confidence | Claim tag |
| --- | --- | --- | --- | --- |
| The Hacker News: New Fragnesia Linux Kernel LPE Grants Root Access | https://thehackernews.com/2026/05/new-fragnesia-linux-kernel-lpe-grants.html | Fragnesia CVE-2026-46300 CVSS 7.8; XFRM ESP-in-TCP; William Bowling/Zellic/V12; separate from Dirty Frag but same surface/mitigation; deterministic page-cache corruption; no host privileges needed; AppArmor partial mitigation; Customers with Dirty Frag mitigation need no further action; Red Hat assessing; Microsoft urges Dirty Frag mitigations; berz0k advertising LPE for $170k; distro advisories. | high | reported_fact |
| Wiz: Fragnesia Linux Kernel LPE via ESP-in-TCP | https://www.wiz.io/blog/fragnesia-linux-kernel-local-privilege-escalation-via-esp-in-tcp | Technical details on ESP-in-TCP logic bug; arbitrary byte writes into page cache; same outcome as Copy Fail/Dirty Frag; no race condition. | high | reported_fact |
| The Hacker News: Linux Kernel Dirty Frag LPE Exploit | https://thehackernews.com/2026/05/linux-kernel-dirty-frag-lpe-exploit.html | Dirty Frag context; Copy Fail context; three bugs in two weeks pattern; same mitigation blocklist esp4/esp6/rxrpc. | high | reported_fact |

> Re-open every link before posting and confirm the claim still matches the source wording.
