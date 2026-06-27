# Sources — 2026-06-11_greatxml-bitlocker-bypass

**Core claim:** GreatXML is a Windows BitLocker bypass exploit released by Chaotic Eclipse that targets the recovery partition via XML files (unattend.xml and ReAgent.xml). Writing to the recovery partition requires administrator rights, so GreatXML is a post-compromise second-stage tool (persistence and data access), not an initial-access or privilege-escalation vector. Works on systems where Defender Offline Scan was used. Second BitLocker bypass from this researcher after YellowKey.
**Claim tags:** reported_fact, practitioner_takeaway

| Source | Link | Supports | Confidence | Claim tag |
| --- | --- | --- | --- | --- |
| The Hacker News: New GreatXML Exploit Bypasses Windows BitLocker via Recovery Partition XML Files | https://thehackernews.com/2026/06/new-greatxml-exploit-bypasses-windows.html | GreatXML release by Chaotic Eclipse; accidental discovery in 4 hours; Defender Offline Scan as trigger; unattend.xml + ReAgent.xml on recovery partition; WinRE boot bypass; second BitLocker bypass after YellowKey (CVE-2026-45585); RoguePlanet Defender LPE context; researcher quote about offline scan state; GitHub MSNightmare repo. | high | reported_fact |
| Chaotic Eclipse Blog: GreatXML BitLocker Bypass | https://deadeclipse666.blogspot.com/2026/06/greatxml-bitlocker-that-seems-to-only.html | Researcher's own technical description; discovery timeline; Offline Scan vulnerability mechanism; WinRE offline scan state possibility; steps to exploit; researcher notes on trigger conditions. | high | reported_fact |
| GitHub: MSNightmare/GreatXML | https://github.com/MSNightmare/GreatXML | Public exploit code repository; XML file samples; exploit documentation; release under MSNightmare account. | high | reported_fact |
| Cyderes Howler Cell: GreatXML Windows Zero-Day Turns Defender Offline Scan Into BitLocker Backdoor | https://www.cyderes.com/howler-cell/greatxml-windows-zero-day | Admin rights required to write to the recovery partition via diskpart; GreatXML is a post-compromise second-stage tool, not an initial-access vector; persistence through credential rotation and OS reinstall; Cyderes verified PoC on fully patched Windows 11. | high | reported_fact |
| The Register: Nightmare Eclipse drops claimed BitLocker bypass for Microsoft Windows (June 11 2026) | https://www.theregister.com/security/2026/06/11/nightmare-eclipse-drops-claimed-bitlocker-bypass-for-microsoft-windows/5254371 | Will Dormann independent analysis: triggering Defender Offline Scan requires login and admin credentials; admin prerequisite corroborates second-stage framing. | high | reported_fact |

> Re-open every link before posting and confirm the claim still matches the source wording.
