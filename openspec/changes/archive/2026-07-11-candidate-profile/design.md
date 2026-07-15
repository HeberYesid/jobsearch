## Context

The repo has base scaffolding (AGENTS.md, opencode.json, LaTeX templates, directory structure) but no functional commands or skills yet. This change introduces the first capability: building a candidate profile via `/setup`. The profile is the foundation for `/scrape` (Fase 2) and `/apply` (Fase 3).

Current state: `profile/` exists with only `.gitkeep`. `.opencode/skills/job-application-assistant/` is an empty directory. `documents/` has subfolders with `.gitkeep` files and a README.

## Goals / Non-Goals

**Goals:**
- Three onboarding paths (documents/ folder, paste CV, guided interview) with auto-detection
- Bilingual ES+EN profile populated in a single `/setup` run
- Profile stored in gitignored `profile/`; skill reference files remain committed templates with `[PLACEHOLDER]` tokens
- Idempotent updates — re-running `/setup` merges, not overwrites
- Gap detection (honesty enforcement) — never fabricate skills/experience
- Search query derivation for downstream `/scrape`

**Non-Goals:**
- Profile encryption or access control (local tool, single user)
- Multi-user or multi-candidate profiles
- Profile export to external formats (post-MVP)
- Auto-translation of claims between ES and EN (explicitly forbidden by language rules)

## Decisions

1. **Profile data in `profile/` (gitignored), skill files as committed templates**
   - Original ai-job-search stores profile data in CLAUDE.md (committed). We split: skill files (committed, `[PLACEHOLDER]` tokens) vs `profile/` (gitignored, real data).
   - **Why**: Shareable framework — forks get clean templates, not someone's personal data.

2. **Bilingual in one pass, not two runs**
   - `/setup` generates both ES and EN sections simultaneously from the same source materials.
   - **Why**: Reduces user effort, avoids section drift. Alternative (two separate runs) rejected because it doubles friction and encourages translation-based filling.

3. **No claim translation between languages**
   - If a claim exists only in ES, the system finds the EN equivalent from source materials or marks it as a gap.
   - **Why**: Translated claims may introduce inaccuracies that fail interview scrutiny. The CV must be defensible.

4. **Three paths, auto-detected — not user-selected**
   - `/setup` checks `documents/` first (Path A), accepts pasted CV text (Path B), falls back to guided interview (Path C).
   - **Why**: Meets users where they are. A user with a PDF CV in `documents/` shouldn't need to answer interview questions.

5. **Idempotency via merge, not overwrite**
   - Re-running `/setup` reads existing `profile/` files, asks what to update, and merges new information.
   - **Why**: Users iterate on their profile over time. Overwriting would destroy manual edits.

6. **7 skill reference files (01-07)**
   - 01-candidate-profile, 02-behavioral-profile, 03-writing-style, 04-job-evaluation, 05-cv-templates, 06-cover-letter-templates, 07-language-detection.
   - **Why**: The original has 7 files (01-07 interview-prep). We adapt: keep 01-06, replace 07 with language detection (critical for bilingual). The job-evaluation file (04) includes 7 dimensions (5 original + modality + salary band).

## Risks / Trade-offs

- **[Bilingual duplication effort]** → Mitigation: single-pass generation from same source; both sections derived together, not independently authored.
- **[Gap detection false positives]** → Mitigation: gaps surfaced as "acknowledged gaps" in profile; user reviews and corrects during `/setup`.
- **[Search queries too narrow or too wide]** → Mitigation: `/scrape` (Fase 2) accepts manual query overrides; derived queries are a starting point, not a constraint.
- **[Path A file format diversity]** → Mitigation: `/setup` handles common formats (.pdf, .tex, .md, .docx, .txt); unrecognized formats are skipped with a warning.
