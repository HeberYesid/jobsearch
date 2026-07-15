## Context

The framework has two completed capabilities: `candidate-profile` (`/setup` produces bilingual profile data in `profile/`) and `job-search` (`/scrape` finds and ranks postings). The missing piece is `/apply` — the pipeline that turns a specific job posting into a tailored, reviewed, compiled, and ATS-checked application package.

The original repo (MadsLorentzen/ai-job-search) implements `/apply` as a 6-step inline workflow within a single Claude Code command, spawning a general-purpose reviewer agent inline. Our adaptation differs in five key ways: (1) OpenCode primitives (`.opencode/` paths, dedicated `reviewer.md` subagent), (2) bilingual ES+EN generation driven by posting language detection, (3) 7-dimension fit (original has 5+salary, we add modality), (4) MVP drops the PDF verification loop (compile-and-iterate until layout is clean), (5) MVP drops relevance-weighted CV cutting (simple "oldest first" trim).

External tools: `lualatex` (MiKTeX) for CV, `xelatex` (MiKTeX) for cover letter, `pdftotext` (poppler, optional) for ATS check.

## Goals / Non-Goals

**Goals:**
- Orchestrate a complete `/apply` pipeline: parse → evaluate → draft → review → revise → compile → ATS check → present
- Generate CV and cover letter in the posting's detected language (ES or EN) from the matching profile section
- Use a dedicated reviewer subagent with fresh context for company research and content critique
- Enforce honesty rules: every claim traceable to profile, gaps acknowledged not stuffed
- Produce compiled PDFs and verify ATS compatibility (text-layer extraction, keyword coverage)
- Graceful degradation when optional tools (`pdftotext`) are unavailable

**Non-Goals:**
- PDF verification loop (compile-and-iterate until orphan-free) — tech debt #1, post-MVP OpenSpec change
- Relevance-weighted CV cutting — tech debt #2, post-MVP OpenSpec change
- `salary_lookup.py` external salary benchmarking — salary band dimension evaluates posting data only
- Automated application submission — `/apply` produces documents; the human submits
- Interview prep, outcome tracking, upskill recommendations — separate commands, post-MVP

## Decisions

### D1: Dedicated reviewer subagent vs inline agent prompt
**Decision**: Create `.opencode/agents/reviewer.md` as a `mode: subagent`, `hidden: true` agent.
**Rationale**: The original spawns a general-purpose agent with an inline prompt. OpenCode's agent primitive gives us a named, reusable subagent with its own permission scope (read-only: no edit, no bash). The `/apply` command invokes it via the Task tool, passing drafts inline. This is cleaner, testable, and consistent with OpenCode conventions.
**Alternatives considered**: Inline prompt in `/apply` (original approach) — rejected because it conflates orchestration with review logic and can't be independently configured.

### D2: Reviewer permission scope — read-only
**Decision**: `reviewer.md` has `permission: { edit: deny, bash: deny, read: allow, glob: allow, grep: allow, webfetch: allow, websearch: allow, task: deny }`.
**Rationale**: The reviewer researches and critiques — it must not modify files or run commands. It reads profile files and web content only. This enforces the drafter-reviewer separation: the drafter applies all edits based on reviewer feedback.
**Alternatives**: Allow edit (reviewer fixes directly) — rejected because the drafter must filter suggestions through honesty rules (no fabrication), which requires human-in-the-loop judgment.

### D3: Language detection drives both CV and cover letter
**Decision**: Both CV and cover letter are generated in the posting's detected language. The original always generates the CV in English and the cover letter in the posting language. We generate both in the detected language because the LatAm market has Spanish-language CVs as the norm for local roles.
**Rationale**: A Spanish posting typically expects a Spanish CV. An English posting (international/remote) expects an English CV. The bilingual profile has both sections — `/apply` draws from the matching one.
**Alternatives**: CV always English (original approach) — rejected for LatAm market fit; Spanish-language roles are the majority locally.

### D4: Single compile pass, no PDF verification loop (MVP)
**Decision**: `/apply` compiles each document once (`lualatex` for CV, `xelatex` for cover letter) and does not iterate on layout. ATS check runs on the compiled PDF.
**Rationale**: The PDF verification loop (compile → inspect → fix orphans/overflow → recompile) is the most complex part of the original. Dropping it for MVP reduces implementation complexity significantly. The templates (moderncv + cover.cls) are well-tested single-column layouts that produce reasonable output. Tech debt #1 will add the loop as a post-MVP OpenSpec change.
**Trade-off**: PDFs may have orphaned entry titles or minor overflow. Mitigation: templates are simple single-column; smoke-compile in CI catches LaTeX errors.
**Alternatives**: Full PDF verification loop — rejected for MVP scope per grilling decision #10.

### D5: Simple "oldest first" CV cutting (MVP)
**Decision**: If CV content exceeds 2 pages, trim the oldest or least relevant experience entries first (bottom-up). No relevance-weighted scoring.
**Rationale**: Relevance-weighted cutting (score each line by posting keyword match, uniqueness, narrative load) is complex and requires the full posting analysis. Simple cutting is sufficient for MVP. Already documented in `05-cv-templates.md` → "Page Management (MVP)".
**Trade-off**: May cut a relevant older-role bullet that hits posting keywords. Mitigation: the drafter reorders experience to put most relevant first (already in `05-cv-templates.md`), so the bottom entries are least relevant by construction.
**Alternatives**: Relevance-weighted cutting — rejected for MVP scope per grilling decision #10.

### D6: ATS check graceful degradation
**Decision**: Run `pdftotext -v` first. If unavailable, print a warning, do keyword coverage against visual Read of the PDF, and note degraded mode in the final report. If `pdftotext` is available, extract text layer, run parseability checks (contact details, reading order, dates), then keyword coverage.
**Rationale**: `pdftotext` (poppler) is an optional prerequisite. The framework must function without it — degraded ATS check is better than blocking the entire pipeline.
**Alternatives**: Hard requirement on poppler — rejected because it blocks the pipeline on missing optional tool.

### D7: Salary band dimension — posting data only
**Decision**: The salary band dimension evaluates salary data found in the posting text only. No `salary_lookup.py` external benchmarking.
**Rationale**: The original has an optional `salary_lookup.py` that queries a salary index. For the LatAm MVP, this tool doesn't have local data. The dimension is conditional: "N/A — no data" when the posting doesn't disclose salary. This is already specified in `04-job-evaluation.md`.
**Alternatives**: Build a salary lookup tool — rejected for MVP scope; data availability for LatAm is poor.

### D8: Drafts passed inline to reviewer
**Decision**: The `/apply` command passes both draft texts inline in the Task prompt to the reviewer subagent. The reviewer does not read the draft files.
**Rationale**: The reviewer has a fresh context. Passing drafts inline avoids file-read overhead and ensures the reviewer sees exactly what the drafter wrote. The reviewer reads only profile files (01-04) for content critique, not template files (05-06) which govern LaTeX structure.
**Alternatives**: Reviewer reads draft files from disk — rejected because it adds a file-read step and risks the reviewer seeing a different version if the drafter made interim edits.

## Risks / Trade-offs

- **[No PDF verification loop] PDFs may have layout issues (orphaned titles, overflow)** → Mitigation: well-tested single-column templates; CI smoke-compile catches LaTeX errors; tech debt #1 will add the loop. User is told to visually inspect PDFs before submitting.
- **[Simple CV cutting] May cut relevant older experience** → Mitigation: drafter reorders experience by relevance first (most relevant at top), so bottom entries are least relevant by construction.
- **[No salary lookup] Salary band dimension often returns "N/A"** → Mitigation: dimension is conditional and excluded from overall score when data is unavailable (already specified in `04-job-evaluation.md`).
- **[Reviewer web research may be inaccurate] Company claims could be wrong** → Mitigation: `/apply` command instructs the drafter to verify company claims via WebFetch/WebSearch before including them in the cover letter.
- **[LaTeX compilation may fail] Missing packages, font issues** → Mitigation: `IfFontExistsTF` fallback in templates; MiKTeX auto-installs packages on first run; compile errors are surfaced to the user with the error log.
- **[pdftotext unavailable] ATS check degraded** → Mitigation: graceful degradation to visual keyword review; user warned; noted in final report.
