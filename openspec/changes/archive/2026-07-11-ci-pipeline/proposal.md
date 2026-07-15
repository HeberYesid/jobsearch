## Why

The framework ships shared infrastructure (slash commands, skills, subagents, CLI scrapers, LaTeX templates) that every fork user executes. Without CI, there is no automated check that skills have valid frontmatter, commands are well-formed, permissions haven't been widened, personal-data gitignore rules haven't been weakened, CLI code typechecks, or LaTeX templates compile. A single broken commit to any of these surfaces silently breaks every fork.

## What Changes

- **New GitHub Actions workflow** (`.github/workflows/ci.yml`): 5 jobs — lint skills/commands/config, security guards, LaTeX smoke compile, CLI typecheck (matrix: linkedin-search, freehire-search), placeholder integrity (upstream-only).
- **New `tools/lint_skills.py`**: validates SKILL.md frontmatter (name + description required), command files start with frontmatter, `opencode.json` is valid JSON with expected permission structure. Adapted from original to use `.opencode/` paths instead of `.claude/`/`.agents/`.
- **New `tools/security_guards.py`**: checks `opencode.json` permissions against an allowlist (catches permission widening), verifies `.gitignore` personal-data rules are present (catches weakening), checks `.opencode/**/package.json` for forbidden lifecycle scripts (catches code execution via `bun install`). Adapted from original to use OpenCode's glob-based permission format instead of Claude Code's `settings.json` format.
- **New `SETUP.md`**: detailed setup guide (prerequisites installation, verification, first-run instructions).
- **New `CONTRIBUTING.md`**: contribution guidelines (how to add portals, templates, run CI locally, OpenSpec workflow).
- **Update `README.md`**: add CI badge, link to SETUP.md and CONTRIBUTING.md.

## Capabilities

### New Capabilities
- `ci-pipeline`: Automated CI checks for framework integrity — skill/command/config lint, security guards (permissions/gitignore/manifests), LaTeX smoke compilation, CLI typecheck, and placeholder integrity.

### Modified Capabilities
_(none)_

## Impact

- **New files**: `.github/workflows/ci.yml`, `tools/lint_skills.py`, `tools/security_guards.py`, `SETUP.md`, `CONTRIBUTING.md`
- **Modified files**: `README.md` (CI badge + links)
- **CI dependencies**: PyYAML (lint job), TeX Live container (latex-smoke job), Bun (cli-typecheck job)
- **No runtime impact**: CI runs on GitHub Actions, not on the user's machine
- **Fork-friendly**: placeholder-integrity job runs only on upstream repo (`github.repository == 'HeberYesid/jobsearch'`); lint, security, compile, and typecheck run on all forks
