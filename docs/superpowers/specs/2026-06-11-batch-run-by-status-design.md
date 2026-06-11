# Batch-run posts by status — design

## Context

`bun run pipeline` already loops over multiple positional post keys, but the only way to
select a batch is to type each `<date_slug>` substring. With 30+ posts in
`renderer/content/posts/`, that is a lot of manual chaining and easy to get wrong. We want a
way to render a curated set in one command, idempotently (no re-rendering finished work), so
the operator can "approve a batch and walk away."

## Design

### Status lifecycle
Posts carry a `status` field. The lifecycle becomes:

```
draft  →  approved  →  generated  →  upload_ready
```

- **draft** — written, not yet human-reviewed.
- **approved** — a human has greenlit it for rendering. **Only `approved` posts render in a batch.**
- **generated** — the full pipeline rendered it (auto-set on success).
- **upload_ready** — posted / archived (terminal; set manually).

`generated` is added to the schema enum (`renderer/src/lib/schema.ts`). Nothing else gates on
`status`, so the addition is purely additive.

### Selection: `--status=<value>`
`bun run pipeline --status=approved` selects every post in `renderer/content/posts/` whose JSON
`status === "approved"`, in filename (date) order, and runs the full pipeline on each. The flag
accepts any status value; `approved` is the intended batch. Positional keys still work and
**always run regardless of status** (explicit name = force / regenerate). Status-selected keys
are merged with explicit keys, de-duplicated by resolved full key.

### Auto-flip to `generated`
After a post's **complete** run succeeds, the pipeline writes `status: "generated"` back to its
JSON (targeted single-line replace, preserving formatting). So re-running `--status=approved`
skips finished posts — no duplicates.

Flip rules (honesty):
- Flip only from `draft`/`approved` → `generated`. Leave `generated` (no-op) and `upload_ready`
  (terminal; regenerating a posted item must not un-post it).
- Only on a **complete** run: skip the flip when `--dry-run`, `--no-reel`, `--no-voice`, or
  `--no-package` was passed (those produce an intentionally partial render). `--no-art` is fine
  (art legitimately auto-skips when backgrounds already exist).
- A per-post failure never aborts the batch; only fully-succeeded posts flip. Final tally printed.

### Ergonomics
- `--dry-run --status=approved` lists the matched posts (and would-run stages) without rendering
  or writing status — a batch preview.
- Empty match → friendly `no posts with status=<value>` and clean exit (not the usage error).
- Regenerate one finished post: `bun run pipeline -- <date>_<slug>` (runs despite `generated`,
  re-flips to `generated` on success).

### Scope guard (YAGNI)
No date/glob/manifest selection. The status model + explicit-key override + `--dry-run` preview
covers the workflow. Easy to add a `--since=`/glob later if needed.

## Files touched
- `renderer/src/lib/schema.ts` — add `generated` to the status enum (done).
- `renderer/scripts/pipeline.mjs` — `--status=` selection, `markGenerated()` flip, HELP + empty-match handling.
- (data migration, done) status set on 16 existing posts: 8 → `generated`, 8 → `upload_ready`.

## Verification
- `bun run validate -- <a generated post>` accepts `generated` (done).
- `bun run pipeline --status=generated --dry-run` lists the 8 generated posts, writes nothing.
- `bun run pipeline --status=approved --dry-run` with 0 approved → friendly empty notice.
- Live (operator, GPU): approve 1–2 posts, `bun run pipeline --status=approved`, confirm each
  renders and its JSON flips to `generated`; re-run and confirm they are skipped.
