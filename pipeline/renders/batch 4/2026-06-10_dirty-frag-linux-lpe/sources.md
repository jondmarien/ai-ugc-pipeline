# Sources — 2026-06-10_dirty-frag-linux-lpe

**Core claim:** Dirty Frag chains two Linux kernel page-cache write primitives (xfrm-ESP and RxRPC) to achieve deterministic local root on most distributions. Unlike race-condition exploits, it requires no timing window and has very high success rate. It bypasses the Copy Fail mitigation (algif_aead blacklist).
**Claim tags:** reported_fact, practitioner_takeaway

| Source | Link | Supports | Confidence | Claim tag |
| --- | --- | --- | --- | --- |
| The Hacker News: Linux Kernel Dirty Frag LPE Exploit Enables Root Access | https://thehackernews.com/2026/05/linux-kernel-dirty-frag-lpe-exploit.html | Dirty Frag chains xfrm-ESP and RxRPC page-cache writes; reported April 30; embargo broken; deterministic, no race condition; hits Ubuntu 24.04.4, RHEL 10.1, openSUSE Tumbleweed, CentOS Stream 10, AlmaLinux 10, Fedora 44; xfrm-ESP from 2017 commit, RxRPC from 2023; Ubuntu AppArmor blocks namespace; RxRPC module in Ubuntu by default; Copy Fail mitigation (algif_aead blacklist) does not stop Dirty Frag; CVE-2026-43284 and CVE-2026-43500; CloudLinux blocklist mitigation; Microsoft observed in-the-wild exploitation. | high | reported_fact |
| Wiz: Dirty Frag Linux Kernel LPE via ESP and RxRPC | https://www.wiz.io/blog/dirty-frag-linux-kernel-local-privilege-escalation-via-esp-and-rxrpc | Vulnerability chain combining two page-cache write primitives; both allow modification of page-cache-backed memory not exclusively owned by kernel; deterministic and highly reliable like Copy Fail and Dirty Pipe; requires CAP_NET_ADMIN; less likely in hardened containers with seccomp. | high | reported_fact |
| Microsoft: Active Attack Dirty Frag Linux Vulnerability Expands Post-Compromise Risk | https://www.microsoft.com/en-us/security/blog/2026/05/08/active-attack-dirty-frag-linux-vulnerability-expands-post-compromise-risk/ | Limited in-the-wild activity; SSH access then ELF binary triggers su privilege escalation; GLPI LDAP auth file modification; reconnaissance; PHP session file wiping. | high | reported_fact |

> Re-open every link before posting and confirm the claim still matches the source wording.
