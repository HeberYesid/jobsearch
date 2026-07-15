## Why

The framework needs a candidate profile to power `/scrape` (search queries) and `/apply` (CV/cover drafting, fit evaluation). Without a structured, bilingual (ES+EN) profile, the assistant cannot tailor applications or evaluate job fit. This is the foundation of the entire workflow — `/scrape` and `/apply` depend on it.

## What Changes

- **New `/setup` command** that builds the candidate profile via 3 paths: (A) read `documents/` folder, (B) paste CV in chat, (C) guided interview.
- **Bilingual profile** (Spanish + English) stored in `profile/` (gitignored) — both sections populated in a single `/setup` run.
- **7 skill reference files** under `.opencode/skills/job-application-assistant/` with `[PLACEHOLDER]` tokens (committed as templates):
  - `01-candidate-profile.md` — CV structure (experience, education, skills)
  - `02-behavioral-profile.md` — values, work style, culture preferences
  - `03-writing-style.md` — tone and voice for ES + EN
  - `04-job-evaluation.md` — 7-dimension fit framework
  - `05-cv-templates.md` — moderncv tailoring rules
  - `06-cover-letter-templates.md` — cover letter structure rules
  - `07-language-detection.md` — posting language detection logic
- **Profile output files** in `profile/` (gitignored): `candidate-profile.md`, `behavioral-profile.md`, `writing-style.md`, `job-evaluation.md`, `cv-templates.md`, `cover-letter-templates.md`, `search-queries.md`.
- **Idempotent /setup**: re-running detects existing profile and updates rather than overwrites.
- **Honesty enforcement**: `/setup` identifies gaps (skills/experience the candidate lacks) and marks them explicitly — never fabricates.

## Capabilities

### New Capabilities
- `candidate-profile`: Onboarding, profile generation (3 paths), bilingual ES+EN storage, honesty/gap detection, idempotent updates, search query derivation.

### Modified Capabilities
<!-- None — this is the first capability in the repo. -->

## Impact

- **New files**: `.opencode/commands/setup.md`, `.opencode/skills/job-application-assistant/{SKILL.md,01-07 *.md}`, `profile/*.md` (gitignored).
- **Existing files**: `profile/.gitkeep` (already created, will be replaced by real profile data).
- **Dependencies**: No external dependencies. `/setup` reads `documents/` (if Path A) or chat input; writes to `profile/`.
- **Downstream**: `job-search` (Fase 2) consumes `profile/search-queries.md`; `job-application` (Fase 3) consumes all `profile/*.md` files.
