## Context

The framework has 3 implemented capabilities (candidate-profile, job-search, job-application) with shared infrastructure: 3 slash commands, 4 skills (job-application-assistant with 7 reference files, job-scraper, linkedin-search CLI, freehire-search CLI), 1 subagent (reviewer), LaTeX templates (moderncv CV + cover.cls), and `opencode.json` permissions. Every fork user executes this code. The original repo (MadsLorentzen/ai-job-search) ships CI with 6 jobs adapted for Claude Code's `.claude/`/`.agents/` paths and `settings.json` format. Our adaptation needs to use `.opencode/` paths and `opencode.json`'s glob-based permission format.

## Goals / Non-Goals

**Goals:**
- Lint all SKILL.md files for valid YAML frontmatter (name + description)
- Lint all command files for frontmatter presence
- Validate `opencode.json` is well-formed JSON with expected permission structure
- Guard against permission widening in `opencode.json` (allowlist approach)
- Guard against `.gitignore` personal-data rule removal
- Guard against forbidden npm/bun lifecycle scripts in CLI package.json files
- Smoke-compile LaTeX templates (CV with lualatex, cover letter with xelatex)
- Typecheck both CLI scrapers (linkedin-search, freehire-search) with Bun
- Verify placeholder tokens remain in upstream template files (upstream-only job)
- Provide setup and contributing documentation

**Non-Goals:**
- Live CLI smoke tests (hit real portals — network-flaky, LinkedIn ToS violation for automated requests)
- PDF page-count assertions (our templates use placeholder tokens, not real data — page counts are meaningless until personalized)
- Dependency review job (optional, can be added later if repo enables dependency graph)
- Python tool unit tests (the tools are simple lint scripts, tested by running them)

## Decisions

### D1: Adapt paths from `.claude/`/`.agents/` to `.opencode/`
**Decision**: All lint and security guard checks target `.opencode/skills/*/SKILL.md`, `.opencode/commands/*.md`, `opencode.json`, and `.opencode/**/package.json`.
**Rationale**: Our project uses OpenCode primitives exclusively. The original repo's tools check `.claude/` and `.agents/` paths which don't exist in our project.
**Alternatives**: Support both path patterns — rejected because we committed to OpenCode-first.

### D2: Permission allowlist for OpenCode's glob format
**Decision**: `security_guards.py` checks `opencode.json`'s `permission` object against an allowlist of expected permission entries. The allowlist is derived from the current `opencode.json` contents. A PR that widens permissions (e.g., `"*": "allow"` for bash) must update the allowlist in the same diff.
**Rationale**: OpenCode uses a different permission format than Claude Code. Instead of a flat `permissions.allow` list of strings, `opencode.json` has a nested object with tool keys (skill, bash, edit, etc.) and glob-to-action mappings. The guard checks that the structure matches expectations and that no bash entry is widened beyond the allowlist.
**Alternatives**: Parse and validate every glob pattern — rejected as overly complex for a lint script. Simple structural + allowlist check is sufficient.

### D3: LaTeX smoke compile in TeX Live container
**Decision**: The `latex-smoke` job runs in `texlive/texlive:latest` container, compiles `cv/main_example.tex` with lualatex and `cover_letters/cover_example.tex` with xelatex, and checks for errors in the log.
**Rationale**: Ensures templates compile cleanly with standard TeX Live. Uses the same engines the user runs locally (lualatex for CV, xelatex for cover). The original also checks page counts, but our templates use `[PLACEHOLDER]` tokens that produce meaningless page counts — we skip that assertion.
**Alternatives**: Use MiKTeX container — rejected; TeX Live is the CI standard and more portable.

### D4: No page-count assertions (unlike original)
**Decision**: We do NOT assert exact page counts (2 for CV, 1 for cover letter) in CI.
**Rationale**: Our templates contain `[PLACEHOLDER]` tokens, not real data. The compiled PDF will have placeholder text whose length bears no relation to a real CV. Page-count assertions would be meaningless until the user personalizes the templates. The original can assert page counts because its template has real content. We only check that compilation succeeds without errors.
**Alternatives**: Assert page counts — rejected for the above reason.

### D5: Placeholder integrity checks upstream-only
**Decision**: The `placeholder-integrity` job runs only when `github.repository == 'HeberYesid/jobsearch'` (upstream). It checks that template files still contain expected `[PLACEHOLDER]` tokens.
**Rationale**: Forks personalize their templates via `/setup` — their `cv/main_example.tex` will have real data, not placeholders. The upstream repo must keep placeholders to remain a shareable template. Same approach as the original.
**Alternatives**: Run on all forks — rejected because forks legitimately replace placeholders.

### D6: CLI typecheck matrix for 2 scrapers
**Decision**: The `cli-typecheck` job uses a matrix of 2 tools (linkedin-search, freehire-search), runs `bun install` and `bun run typecheck` in each CLI's directory.
**Rationale**: The original has 6 scrapers (4 Danish + linkedin + freehire); we have only 2. The matrix ensures each CLI typechecks independently. No live tests — typecheck is sufficient for CI.
**Alternatives**: Include `bun test` in CI — considered but the original deliberately excludes live portal tests. We could add unit tests, but they run locally and typecheck is the CI gate.

### D7: No dependency-review job (MVP)
**Decision**: Omit the `dependency-review` job from the initial CI pipeline.
**Rationale**: The original's dependency-review requires the repo's Dependency Graph feature enabled and only runs on upstream PRs. Our CLIs have zero runtime dependencies (only devDeps: typescript + @types/bun). The risk surface is minimal. Can be added later when the repo is public and has the dependency graph enabled.
**Alternatives**: Include with graceful skip — rejected for MVP simplicity; zero runtime deps make it low-value.

## Risks / Trade-offs

- **[Allowlist maintenance] PRs that intentionally change permissions must update the allowlist** → Mitigation: the error message in `security_guards.py` explicitly tells the contributor to update the allowlist in the same PR. This is by design — the diff shows both the widening and the explicit approval.
- **[TeX Live container size] The `texlive/texlive:latest` image is large (~5GB)** → Mitigation: only one job uses it; other jobs run on standard ubuntu-latest. CI time is not critical for a personal framework.
- **[No live CLI tests] Scrapers are only typechecked, not integration-tested in CI** → Mitigation: typecheck catches type errors; live tests run locally via `bun test`. The original explicitly excludes live tests for the same reason (LinkedIn ToS, network flakiness).
- **[No page-count assertions] LaTeX layout issues won't be caught by CI** → Mitigation: compilation errors are caught; layout issues (orphaned titles, overflow) are visual and require human inspection. The PDF verification loop (tech debt #1) will add automated layout checks post-MVP.
- **[Security guards are not airtight] A PR can edit the workflow itself** → Mitigation: same honest limit as the original. Branch protection with required checks and human review of workflow/config diffs remain the real backstop.
