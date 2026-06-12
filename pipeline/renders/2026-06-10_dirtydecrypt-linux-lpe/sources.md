# Sources — 2026-06-10_dirtydecrypt-linux-lpe

**Core claim:** DirtyDecrypt (CVE-2026-31635) is an LPE in rxgk_decrypt_skb missing copy-on-write guard. Impacts only distros with CONFIG_RXGK enabled (Fedora, Arch, openSUSE). Discovered by Zellic/V12, reported as duplicate of already-patched bug. Silent patch meant no coordintated disclosure.
**Claim tags:** reported_fact, practitioner_takeaway

| Source | Link | Supports | Confidence | Claim tag |
| --- | --- | --- | --- | --- |
| The Hacker News: DirtyDecrypt PoC Released for Linux Kernel CVE-2026-31635 LPE | https://thehackernews.com/2026/05/dirtydecrypt-poc-released-for-linux.html | DirtyDecrypt CVE-2026-31635 CVSS 7.5; rxgk_decrypt_skb missing COW guard; Zellic/V12 reported May 9, told duplicate; CONFIG_RXGK distros (Fedora, Arch, openSUSE); writes to /etc/shadow, /etc/sudoers, SUID binaries; container worker node escape path; Hyunwoo Kim forced disclosure after embargo break; independent researcher analyzed public commit; kernel killswitch proposal (Sasha Levin); Rocky Linux security repository. | high | reported_fact |
| Moselwal: DirtyDecrypt Linux Kernel rxgk CVE-2026-31635 | https://moselwal.com/blog/dirtydecrypt-linux-kernel-rxgk-cve-2026-31635 | Technical details on rxgk_decrypt_skb COW guard missing; page cache shared with other processes; normal Linux COW optimization; LPE via privileged file corruption. | high | reported_fact |
| V12 Security: DirtyDecrypt PoC | https://github.com/v12-security/pocs/tree/main/dirtydecrypt | PoC release; Luna Tong (cts/gf_256) description; rxgk pagecache write due to missing COW guard. | high | reported_fact |

> Re-open every link before posting and confirm the claim still matches the source wording.
