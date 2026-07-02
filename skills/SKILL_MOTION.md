---
name: motion-design
description: >
  Motion design creation skill for Higgsfield. Trigger this skill whenever the user asks to create motion design, animate a logo, make a video from an image, create an animated ad, turn a product into motion, or says anything like "make a motion", "motion design", "animate this", "make a video from my logo", "animated brand", "motion graphics", "brand motion", "kinetic graphics", "promo video", "ad video". Always use this skill — don't try to handle motion design requests without it.
---

# Motion Design Skill

You are guiding the user through a full motion design creation flow using the Higgsfield connector. Follow each step in order. Be concise and direct. Speak in the same language the user is using.

---

## STEP 0 — Determine the flow type

Before anything else, identify which workflow applies:

**classicMD** — standard ads, brand promos, service presentations, logo reveals, general atmospheric content.
**highMD** — sports promos, tech product launches, music teasers, AI capability demos, fashion drops. Prioritizes extreme camera speed, aggressive cuts, peak dynamics. Realistic people are replaced by silhouettes, chrome elements, or 3D abstract figures.

If the user's request makes the flow obvious — proceed silently. If ambiguous, ask:

> "Which style fits your project better?"

Options:
- **Classic Motion** — smooth transitions, elegant typography, cinematic feel
- **Hyper / Kinetic** — fast cuts, extreme dynamics, aggressive transitions, CGI energy

---

## STEP 1 — Brief intake (single message, all at once)

Ask all intake questions in **one message** using `ask_user_input_v0`. Do not split into multiple questions.

Questions to ask simultaneously:

1. **Do you have existing assets?**
   - Yes — I'll upload a logo / product photo / reference
   - No — help me create the visual

2. **Video duration:**
   - 5 sec — teaser / logo sting
   - 10 sec — standard post / stories
   - 15 sec — promo / product video

3. **Frame format:**
   - 16:9 — horizontal (YouTube, website)
   - 9:16 — vertical (Reels, TikTok, Stories)
   - 1:1 — square (Feed)

4. **Mood / style:** *(free input)*
   Example prompts: energetic, minimalist, luxury, technological, atmospheric, aggressive, cinematic

5. **Brand name / product name and tagline** *(if any)*

6. **Number of storyboard frames:**
   - 6 frames — standard
   - 8 frames — detailed
   - 9 frames — maximum coverage

Save all answers before proceeding.

---

## STEP 2 — Asset handling

### If user HAS assets:

Ask them to upload the file directly in chat. Accept PNG, JPG, SVG, or any image.

Once uploaded, note the file path from `/uploads/`. Use `mcp__higgsfield__media_upload` to register it. Then proceed to **STEP 3**.

### If user has NO assets:

Generate a base visual using **GPT Image 2**. Construct a prompt from their brief: brand name, mood, style, color palette, aspect ratio.

Model priority: `gpt-image-2-pro` → `gpt-image-2-banana` → `gpt-image-2-nano`

Call `mcp__higgsfield__generate_image` with the best available GPT Image 2 variant.
Display result with `mcp__higgsfield__job_display`.

Ask: "Does this image work or would you like changes?" — if changes needed, regenerate with adjusted prompt. Once approved, proceed.

---

## STEP 3 — Generate the Storyboard

This is the core creative step. Generate a storyboard with N frames (where N = the count chosen in Step 1: 6, 8, or 9).

**Each frame must:**
- Be visually consistent with the approved asset / generated image
- Represent a distinct moment in time (opening → build → climax → resolution → logo lock)
- Show camera position, subject state, motion blur / freeze where relevant
- Include a 2–4 word text caption burned into the frame (scene label, not subtitle)

**For classicMD frames:** smooth compositions, elegant typography zones, cinematic lighting.
**For highMD frames:** peak-action freeze frames — frozen splashes, shattered elements, material stretch, aggressive camera angles, neon contrast.

**Generation approach:**

Call `mcp__higgsfield__generate_image` **once** with **GPT Image 2** to generate a **single storyboard sheet** — one image containing all N panels arranged in a grid. Do NOT generate N separate images.

Use the approved asset / generated visual as a reference image in the call.

Construct the prompt as:
```
Storyboard sheet with [N] sequential panels in a grid layout, each panel labeled "Frame 1", "Frame 2", etc. Panel 1: [scene description]. Panel 2: [scene description]. ... Panel N: [logo lock / brand name]. Each panel shows: [camera angle], [motion state], [mood/lighting]. Visual style: [cinematic/kinetic]. Consistent color palette throughout. Clean storyboard design, thin border between panels, [aspect ratio per panel].
```

After the single image is generated, display it with `mcp__higgsfield__job_display`.

Then present the storyboard summary:

---
**Storyboard — [Brand Name]**
🎬 Frame 1: [brief scene description]
✨ Frame 2: [brief scene description]
... (all frames)
🏁 Frame N: [logo lock / CTA]

**Mood:** [mood]
**Motion:** [motion description — e.g. spiral flythrough, match-cut, slow push]
**Ending:** [how the video ends]
---

Ask:
> "How does the storyboard look? Approve or any changes?"

Options:
- **Approve ✅** — proceed to STEP 4
- **Changes needed** — ask what to change, regenerate the storyboard sheet with corrections, repeat approval

---

## STEP 4 — Generate the Video

Once the storyboard is approved, generate the final video using **Seedance 2.0**.

Use `mcp__higgsfield__models_explore` to confirm the exact Seedance 2.0 model ID if needed.

**Construct the video generation prompt** combining:
- Approved storyboard narrative (scene sequence)
- Flow type (classicMD / highMD)
- Duration from Step 1
- Aspect ratio from Step 1
- Mood and style from Step 1
- Brand name / slogan for logo lock at the end

**classicMD prompt template:**
```
[Style]: smooth motion design, [scene flow from storyboard], elegant transitions, [mood] atmosphere, cinematic camera movement, [duration]s, brand reveal at end: [brand name], [aspect ratio]
```

**highMD prompt template:**
```
[Style]: high-intensity kinetic motion, [scene flow from storyboard], extreme camera speed, aggressive match-cuts, peak-action freeze frames, [mood] CGI aesthetic, neon contrast, [duration]s, hard stop logo lock: [brand name], [aspect ratio]
```

**For highMD:** the final seconds must be a static hold on the brand name / logo — build this into the prompt explicitly. Scale proportionally: ~1 sec for 5s clips, ~2 sec for 10s clips, ~2–3 sec for 15s clips.

Pass as `start_image` in medias: the original uploaded asset (if user had one) — otherwise the first approved storyboard frame job ID.

Call `mcp__higgsfield__generate_video` with model `seedance_2_0` (or confirmed ID).
Display result with `mcp__higgsfield__job_display`.

---

## STEP 5 — Review & Iterate

When the video renders, present it and ask:

> "Done! 🎬 What do you think?"

Options:
- **Love it, downloading ✅** — done
- **Want a different edit** — regenerate with adjusted prompt (keep same storyboard)
- **Want a different style** — go back to Step 1 with new style/mood
- **Make another version** — generate a second version in parallel with slight prompt variation

---

## Notes & Rules

- **Always ask all intake questions at once** in Step 1 — never split into multiple rounds
- **Tool names:** use `mcp__higgsfield__generate_image`, `mcp__higgsfield__generate_video`, `mcp__higgsfield__job_display`, `mcp__higgsfield__media_upload`, `mcp__higgsfield__media_confirm`, `mcp__higgsfield__models_explore`, `mcp__higgsfield__balance` — confirm exact IDs with `tool_search` if unsure
- **Image model:** GPT Image 2 only — `gpt-image-2-pro` → `gpt-image-2-banana` → `gpt-image-2-nano`
- **Video model:** Seedance 2.0 only — confirm model ID with `models_explore` if unsure
- **Storyboard = one image** — a single grid sheet with all N panels, generated in one GPT Image 2 call. Never generate N separate images
- **No moodboard step** — go directly from brief to storyboard
- **highMD rule:** no realistic humans — only silhouettes, chrome figures, 3D abstract shapes
- **highMD rule:** logo lock duration is proportional to clip length (~1s / ~2s / ~2–3s for 5s / 10s / 15s clips), built into the prompt
- **classicMD logo:** can appear as opener, closer, or both — ask if not specified
- **Language:** always match the user's language
- Check credits with `mcp__higgsfield__balance` if user seems concerned about usage
- If generation fails — explain briefly and offer retry with adjusted parameters
