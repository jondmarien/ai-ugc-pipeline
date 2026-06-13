# Sources — 2026-06-10_rogueplanet-windows-zero-day

**Core claim:** RoguePlanet is a Windows LPE that races Microsoft Defender's quarantine pipeline: an oplock pauses a scan, a junction swap makes Defender write a SYSTEM-owned file into a user-controlled folder, and the Windows Error Reporting scheduled task then runs the planted binary as SYSTEM. No CVE, no patch; Windows 11 Pro confirmed.
**Claim tags:** reported_fact, practitioner_takeaway

| Source | Link | Supports | Confidence | Claim tag |
| --- | --- | --- | --- | --- |
| CYDERES Howler Cell: RoguePlanet Windows zero-day (technical analysis + attack-chain figure) | https://www.cyderes.com/howler-cell/rogueplanet-windows-zero-day | Full chain: named pipe RoguePlanet, Poseidon I/O saturation, embedded ISO mount, EICAR + :WDFOO ADS oplock pausing Defender, junction swap so Defender quarantines a SYSTEM-owned file in an attacker dir, overwrite + junction so the path resolves as C:\Windows\System32\wermgr.exe, WER QueueReporting scheduled task triggerable by an unprivileged user runs it as SYSTEM, conhost.exe in user session; root cause is a design race across Defender quarantine, NTFS reparse points, and VSS; no CVE/patch; Windows 11 Pro confirmed and Server unaffected because standard users cannot mount ISOs; signature Exploit:Win32/DfndrRugPlnt.BB catches only the compiled PoC; the listed detections. | high | reported_fact |
| SecurityWeek: New Windows Zero-Day Exploit 'RoguePlanet' Released | https://www.securityweek.com/new-windows-zero-day-exploit-rogueplanet-released/ | Release June 10; Nightmare Eclipse / MSNightmare; LPE to SYSTEM on fully patched Windows 11; original GitHub account suspended; dropped the same week Microsoft patched GreenPlasma and YellowKey; prior Nightmare Eclipse exploits RedSun, UnDefend, BlueHammer. | high | reported_fact |
| Microsoft Security Response: legal-threat clarification after disclosure backlash | https://www.securityweek.com/microsoft-tries-to-calm-legal-threat-fears-after-zero-day-disclosure-backlash/ | Microsoft statement that it will not pursue security researchers; GitHub account suspension and community backlash context. | high | reported_fact |

> Re-open every link before posting and confirm the claim still matches the source wording.
