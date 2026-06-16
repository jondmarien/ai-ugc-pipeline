# Sources — 2026-06-11_undefend-defender-dos

**Core claim:** UnDefend (CVE-2026-45498) is a user-mode denial-of-service tool that holds Defender's signature-update files open so new definitions cannot load, leaving Defender stale while its status display still appears healthy. Released by Nightmare Eclipse in April 2026 as the third in a series of three Defender exploits; patched May 21, 2026.
**Claim tags:** reported_fact, practitioner_takeaway

| Source | Link | Supports | Confidence | Claim tag |
| --- | --- | --- | --- | --- |
| NVD: CVE-2026-45498 Detail | https://nvd.nist.gov/vuln/detail/CVE-2026-45498 | CVE identifier, NVD published date 05/20/2026, CWE-400 (Uncontrolled Resource Consumption), Microsoft CVSS 4.0, affected platform Microsoft Defender Antimalware Platform, fixed in v4.18.26040.7, CISA KEV listing with June 3 2026 remediation deadline. | high | reported_fact |
| Huntress: Nightmare-Eclipse Tooling Seen in Real-World Intrusion | https://www.huntress.com/blog/nightmare-eclipse-intrusion | User-mode file-locking mechanism (directory change notifications, file handle races on definition and backup files); no kernel driver involved; release as third exploit after BlueHammer and RedSun in April 2026; active exploitation observed April 2026; tamper-protection spoofing code was withheld by the researcher. | high | reported_fact |
| Help Net Security: Microsoft Defender vulnerabilities exploited in the wild (CVE-2026-41091, CVE-2026-45498) | https://www.helpnetsecurity.com/2026/05/21/microsoft-defender-vulnerabilities-cve-2026-41091-cve-2026-45498/ | CVE-2026-45498 described as DoS flaw that prevents Defender from working; UnDefend released April 3 and 15 by Nightmare Eclipse; patch in Antimalware Platform v4.18.26040.7; CISA KEV addition; Huntress observed real exploitation. | high | reported_fact |
| SecurityWeek: Microsoft Patches Exploited UnDefend and RedSun Defender Zero-Days | https://www.securityweek.com/microsoft-patches-exploited-undefend-and-redsun-defender-zero-days/ | CVE-2026-45498 CVSS 4.0 denial-of-service flaw; patched in Antimalware Platform v4.18.26040.7 on May 21 2026; both CVEs publicly disclosed and exploited in the wild; UnDefend and RedSun described as variants of Nightmare Eclipse series. | high | reported_fact |

> Re-open every link before posting and confirm the claim still matches the source wording.
