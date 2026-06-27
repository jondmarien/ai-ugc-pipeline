# Sources — 2026-06-11_redsun-windows-lpe

**Core claim:** RedSun (CVE-2026-41091) is a link-following flaw in Microsoft Defender's own file-remediation workflow. Defender runs as SYSTEM and can be redirected via an NTFS junction so its privileged write lands in a protected system directory. Released by Nightmare Eclipse as the second exploit in an April 2026 series; Microsoft patched it out-of-band on May 19–21, 2026 and CISA added it to KEV.
**Claim tags:** reported_fact, practitioner_takeaway

| Source | Link | Supports | Confidence | Claim tag |
| --- | --- | --- | --- | --- |
| NVD: CVE-2026-41091 Detail | https://nvd.nist.gov/vuln/detail/CVE-2026-41091 | CVE identifier; CWE-59 classification (improper link resolution before file access); CVSS 7.8 HIGH; affected engine versions up to 1.1.26030.3008; fixed in 1.1.26040.8; CISA KEV date added May 20, 2026; due date June 3, 2026. | high | reported_fact |
| BleepingComputer: New Microsoft Defender RedSun zero-day PoC grants SYSTEM privileges | https://www.bleepingcomputer.com/news/microsoft/new-microsoft-defender-redsun-zero-day-poc-grants-system-privileges/ | RedSun released April 16, 2026 as second exploit by Nightmare Eclipse; LPE flaw in Microsoft Defender; link-following via NTFS junction in Defender's remediation workflow; confirmed exploitation on fully-patched Windows 10 and 11; no CVE at time of release. | high | reported_fact |
| BleepingComputer: Microsoft warns of new Defender zero-days exploited in attacks | https://www.bleepingcomputer.com/news/security/microsoft-warns-of-new-defender-zero-days-exploited-in-attacks/ | CVE-2026-41091 assigned to RedSun; out-of-band patch released May 21, 2026; CISA KEV addition confirmed; Huntress observed active exploitation of RedSun in the wild. | high | reported_fact |
| Help Net Security: Microsoft Defender vulnerabilities exploited in the wild (CVE-2026-41091, CVE-2026-45498) | https://www.helpnetsecurity.com/2026/05/21/microsoft-defender-vulnerabilities-cve-2026-41091-cve-2026-45498/ | April 3 and 15 release dates for Nightmare Eclipse exploits; RedSun confirmed as second release (April 15); BlueHammer first; CISA KEV June 3 deadline; Huntress incident responder confirmation of exploitation; race-condition class mechanism described. | high | reported_fact |

> Re-open every link before posting and confirm the claim still matches the source wording.
