# Sources — 2026-06-27_pedit-cow-lpe

**Core claim:** A partial copy-on-write bug in Linux net/sched act_pedit lets an unprivileged local user corrupt the page cache of setuid binaries like /bin/su and obtain root.
**Claim tags:** verified

| Source | Link | Supports | Confidence | Claim tag |
| --- | --- | --- | --- | --- |
| cybersecuritynews.com | https://cybersecuritynews.com/linux-pedit-cow-exploit/ | Overview, mechanism, affected distributions table, PoC name packet_edit_meme, mitigation steps. | high | verified |
| thecybersecguru.com | https://thecybersecguru.com/news/linux-lpe-pedit-cow-dirtyclone-cve-2026-46331-cve-2026-43503/ | Detailed root cause in tcf_pedit_act, DirtyClone sibling CVE, workarounds including module blacklist and sysctl. | high | verified |
| GitHub sgkdev/packet_edit_meme | https://github.com/sgkdev/packet_edit_meme | Public PoC code, build instructions, verified targets table (RHEL 10, Debian 13, Ubuntu 24.04 with --ubuntu flag). | high | verified |
| NVD / kernel.org | https://nvd.nist.gov/vuln/detail/CVE-2026-46331 | Official CVE description, commit 899ee91156e5 culprit, fix in v7.1-rc7. | high | verified |
| Red Hat CVE entry | https://access.redhat.com/security/cve/CVE-2026-46331 | Flaw description in tcf_pedit_act and skb_ensure_writable COW range calculation. | high | verified |

> Re-open every link before posting and confirm the claim still matches the source wording.
