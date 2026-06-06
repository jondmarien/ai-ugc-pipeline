# Ingested: Instagram Carousel — "When to Post for MAX REACH"
**Source:** Carousel from @_techy.boy (Instagram)
**Ingested:** 2026-06-06
**Format:** 8-slide carousel (appears to be 9 slides total, slide 1/9 = cover)
**OCR Method:** Tesseract 5.3.4

---

## Slide-by-Slide OCR Results

### Slide 1/9 — Cover
```
When to post
for MAX REACH
```

### Slide 2/9 — Monday
```
MONDAY
3PM 5PM 7PM
Peak engagement
after work hours
```

### Slide 3/9 — Tuesday
```
TUESDAY
Consistency builds
stronger reach
```

### Slide 4/9 — Wednesday
```
WEDNESDAY
Mid-week scroll
time is real
```

### Slide 5/9 — Thursday
```
THURSDAY
2PM 4PM
Pre-weekend
energy kicks in
```

### Slide 6/9 — Friday
```
FRIDAY
Post before the
weekend wind-down
```

### Slide 7/9 — Saturday
```
SATURDAY
10AM 2PM
Morning browsers &
lunch scrollers
```

### Slide 8/9 — Sunday
```
SUNDAY
Lazy morning +
evening wind-down
```

**Note:** Slide 9/9 not captured in attached images.

---

## Visual Consistency (All Slides)
- **Account tag:** `Your story i_zik_lonestar jon.marien O6rarai` (OCR noise on handle)
- **Watermark/stats bar:** `© 5,353 340 568 17.8K` (likely: 5,353 likes, 340 comments, 568 shares, 17.8K views)
- **Source attribution:** `_techy.boy Still wondering why your posts a... more`
- **UI elements:** Instagram carousel nav dots, share/save icons

---

## Adaptation to AI-Cybersecurity Pipeline

This carousel is **general Instagram growth content**. For our pipeline, we can:

1. **Extract the posting schedule** as a reusable reference for our own content calendar
2. **Adapt the format** for cybersecurity-specific posting windows (e.g., "When to post AI security content for MAX REACH")
3. **Add to CAPTION_BANK** as a scheduling template

---

## Proposed Daily Posting Schedule (Cleaned)

| Day | Optimal Times | Rationale |
|-----|---------------|-----------|
| **Monday** | 3 PM, 5 PM, 7 PM | Peak engagement after work hours |
| **Tuesday** | (Consistent daily slot) | Consistency builds stronger reach |
| **Wednesday** | (Consistent daily slot) | Mid-week scroll time is real |
| **Thursday** | 2 PM, 4 PM | Pre-weekend energy kicks in |
| **Friday** | Before 5 PM | Post before weekend wind-down |
| **Saturday** | 10 AM, 2 PM | Morning browsers & lunch scrollers |
| **Sunday** | Morning + Evening | Lazy morning + evening wind-down |

---

## Integration Options for Pipeline

### Option A: Add to `CAPTION_BANK.md` as scheduling reference
```markdown
## Posting Schedule Template (from @_techy.boy carousel)
Mon: 15:00, 17:00, 19:00 | Tue: [consistent] | Wed: [consistent] | Thu: 14:00, 16:00 | Fri: <17:00 | Sat: 10:00, 14:00 | Sun: AM + PM
```

### Option B: Create `POSTING_SCHEDULE.md` in `pipeline/content/`
Dedicated reference for optimal posting windows per platform.

### Option C: Use in `/draft-week` calendar generation
When the skill generates a weekly posting calendar, weight days/times per this schedule.

### Option D: Adapt as cybersecurity carousel
"WHEN TO POST AI SECURITY CONTENT FOR MAX REACH" — same format, cybersecurity-specific rationale (e.g., "Tuesday: CISO newsletter reads", "Thursday: Pre-weekend threat intel drops").

---

## Next Steps

1. [ ] Decide integration option (A/B/C/D)
2. [ ] If D: Add row to `IDEA_BACKLOG.md` under a new "Growth/Meta" pillar or as Myth-busting
3. [ ] Update `CAPTION_BANK.md` with schedule template
4. [ ] If using for weekly calendar: modify `ai-cybersecurity-ugc-carousel` skill or `draft-week` command