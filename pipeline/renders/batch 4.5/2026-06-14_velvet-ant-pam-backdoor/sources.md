# Sources — 2026-06-14_velvet-ant-pam-backdoor

**Core claim:** China-nexus group Velvet Ant backdoored PAM and OpenSSH on Linux systems for nearly a decade, harvesting credentials and maintaining persistence in an air-gapped network by replacing trusted authentication binaries.
**Claim tags:** reported_fact, emerging, practitioner_takeaway

| Source | Link | Supports | Confidence | Claim tag |
| --- | --- | --- | --- | --- |
| Sygnia: Operation Highland — Velvet Ant PAM Backdoor | https://thehackernews.com/2026/06/china-linked-hackers-backdoored-linux.html?m=1 | Velvet Ant modified PAM and OpenSSH binaries for credential harvesting and master password access. Nine versions found, earliest traces 2016. Target network air-gapped, bridged via web servers. Also hit F5 BIG-IP and Cisco NX-OS (CVE-2024-20399). Remediation: compare binaries against known-good, remove backdoor before password reset. | high | reported_fact |
| Group-IB DFIR: PAM Backdoor Analysis | https://www.group-ib.com/blog/pam-backdoor-linux | PAM transmits credentials in plaintext through its stack; malicious module sits directly in stream. pam_exec module allows arbitrary commands at login — untracked technique not in MITRE ATT&CK. | high | reported_fact |
| Nextron Systems: Plague PAM Backdoor | https://www.nextron-systems.com/plague-pam-backdoor | Plague PAM-based backdoor evaded AV detection for over a year. Technique broadly applicable against any Linux using standard PAM. | medium | emerging |
| Flare.io: PamDOORa Sold on Cybercrime Forums | https://flare.io/pamdoora-pam-backdoor | Complete PAM backdoor source code package (PamDOORa) sold on Russian cybercrime forums for $1,600, indicating commoditization at criminal level. | medium | emerging |
| AhnLab EDR: PAM Module Injection Technical Breakdown | https://ahnlab.com/en/pam-module-injection-analysis | Technical breakdown of PAM module injection at libpam library level, used to develop detection signatures. | medium | emerging |
| CyberArk: Plague PAM Malware Analysis | https://www.cyberark.com/resources/threat-research/plague-pam-malware | PAM-exploiting malware bypasses traditional AV because malicious code lives inside trusted authentication library, not standalone executable. | medium | emerging |
| Broadcom: Linux-PAM Critical CVEs February 2025 | https://www.broadcom.com/support/security-advisories/linux-pam-cves-2025 | Three critical CVEs in Linux-PAM (CVE-2025-24032, CVE-2025-24531, CVE-2025-24031). PAM-PKCS#11 default cert_policy=none allows authentication with public certificate and known PIN, no private key required. | high | reported_fact |
| MITRE ATT&CK: Velvet Ant Technique Mapping | https://attack.mitre.org/groups/G1033/ | T1078 Valid Accounts, T1190 Exploit Public-Facing Application, T1003.001 OS Credential Dumping, T1547.001 Boot/Logon Autostart Execution, T1059 Command and Scripting Interpreter. | high | reported_fact |

> Re-open every link before posting and confirm the claim still matches the source wording.
