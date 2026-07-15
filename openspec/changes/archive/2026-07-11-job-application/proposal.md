## Why

The framework can build a candidate profile (`/setup`) and find job postings (`/scrape`), but cannot evaluate a specific posting, draft tailored application documents, or verify ATS compatibility. `/apply` closes the loop: it turns a job posting into a tailored, reviewed, compiled, and ATS-checked CV + cover letter — the core value proposition of the framework.

## What Changes

- **New `/apply` command** (`.opencode/commands/apply.md`): orchestrates the full pipeline — parse posting → evaluate fit (7 dimensions) → draft CV + cover letter in LaTeX → spawn reviewer subagent → revise → compile PDFs → ATS check → present results.
- **New reviewer subagent** (`.opencode/agents/reviewer.md`): a fresh-context agent that researches the company, critiques the drafts against the profile, and returns structured + narrative feedback. `mode: subagent`, `hidden: true`, read-only (no edit permission).
- **Language-aware generation**: `/apply` detects the posting's language (ES/EN) using `07-language-detection.md` heuristics and generates both CV and cover letter in that language, drawing from the matching profile section. No claim translation between languages.
- **7-dimension fit evaluation**: uses the framework from `04-job-evaluation.md` (skills, experience, culture, location, career alignment, modality, salary band conditional). Deal-breakers surfaced explicitly; candidate decides whether to proceed.
- **LaTeX compilation**: `lualatex` for CV (moderncv, 2-page target), `xelatex` for cover letter (cover.cls, 1-page target). Single compile pass per document (no PDF verification loop in MVP — marked as tech debt).
- **ATS check**: `pdftotext -layout` extracts the CV's text layer; verifies contact details survive as literal text, reading order is intact, and keyword coverage against the posting (covered / synonym-only / missing-have / missing-gap). Graceful degradation when `pdftotext` is unavailable.
- **Honesty enforcement**: every claim in the CV and cover letter must trace to `profile/`. Unsupported posting keywords are acknowledged gaps, never stuffed. The reviewer subagent enforces the same rule.

## Capabilities

### New Capabilities
- `job-application`: End-to-end job application pipeline — posting parsing, fit evaluation, LaTeX document drafting, reviewer subagent critique, revision, PDF compilation, and ATS compatibility verification.

### Modified Capabilities
_(none — existing `candidate-profile` and `job-search` specs already define the inputs `/apply` consumes)_

## Impact

- **New files**: `.opencode/commands/apply.md`, `.opencode/agents/reviewer.md`
- **Reads existing**: `profile/candidate-profile.md`, `profile/behavioral-profile.md`, `profile/writing-style.md`, `profile/job-evaluation.md`, `profile/cv-templates.md`, `profile/cover-letter-templates.md`, skill files `01`–`07`, `cv/main_example.tex`, `cover_letters/cover_example.tex`, `cover_letters/cover.cls`
- **Writes**: `cv/main_<company>.tex`, `cover_letters/cover_<company>_<role>.tex`, compiled PDFs, temporary `.txt` (ATS, deleted after check)
- **External tools**: `lualatex`, `xelatex` (MiKTeX), `pdftotext` (poppler — optional, graceful degradation)
- **Subagent**: reviewer invoked via Task tool with fresh context; receives drafts inline; returns structured JSON edits + narrative suggestions
- **No changes to existing specs**: `/apply` consumes outputs from `/setup` and `/scrape` but does not alter their contracts
