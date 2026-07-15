# Contributing

Contributions are welcome. This project uses spec-driven development with [OpenSpec](https://github.com/fission-ai/openspec).

## Adding a New Portal Scraper

1. Create a skill directory: `.opencode/skills/<portal-name>/`
   - `SKILL.md` — OpenCode skill frontmatter (`name`, `description`, `license`) + CLI documentation
   - `cli/` — Bun TypeScript CLI (zero runtime dependencies)
     - `src/cli.ts` — entry point, flag parsing
     - `src/helpers.ts` — fetch, parse, shared utilities
     - `src/commands/search.ts` — search command
     - `src/commands/detail.ts` — detail command
     - `package.json` — `name: <portal>-cli`, devDeps: `typescript` + `@types/bun`
     - `tsconfig.json` — ESNext, bundler, `types: ["bun"]`
     - `tests/` — unit tests with `bun:test`

2. Follow the pattern of `linkedin-search` (HTML parsing) or `freehire-search` (REST API).

3. Output contract: search results as `{ meta: { count }, results: [...] }` in JSON mode; errors as `{ "error": "...", "code": "..." }` on stderr with exit code 1.

4. Add the portal to the `cli-typecheck` matrix in `.github/workflows/ci.yml`.

5. Add a personal-use-only ToS warning to the `SKILL.md` if the portal has terms restricting automated access.

6. The scraper skill discovery is automatic — the `job-scraper` skill reads every `SKILL.md` under `.opencode/skills/*/`. No need to register the portal anywhere.

## Running CI Checks Locally

```powershell
python tools/lint_skills.py        # lint skills, commands, opencode.json
python tools/security_guards.py    # check permissions, gitignore, package manifests
```

For CLI typechecking:

```powershell
cd .opencode\skills\linkedin-search\cli
bun install
bun run typecheck
bun test
```

## OpenSpec Workflow

This project uses spec-driven development. All changes go through OpenSpec:

```powershell
# 1. Create a change
openspec new change <change-name>

# 2. Write the 4 artifacts (in dependency order):
#    proposal.md → design.md + specs/ → tasks.md
#    Check status and get instructions:
openspec status --change <change-name> --json
openspec instructions <artifact-id> --change <change-name> --json

# 3. Validate
openspec validate <change-name>

# 4. Implement the tasks

# 5. Archive (moves to openspec/changes/archive/, updates specs/)
echo "y" | openspec archive <change-name>
```

Specs live in `openspec/specs/<capability>/spec.md` and are the source of truth for what the system does.

## Honesty Rules

Contributors must not introduce code that fabricates skills, experience, or qualifications. The framework's core principle is honesty: unsupported keywords become acknowledged gaps, not stuffed content. Any change that weakens this principle will be rejected.

## Project Structure

| Path | Purpose |
|------|---------|
| `.opencode/commands/` | Slash commands (`/setup`, `/scrape`, `/apply`) |
| `.opencode/skills/` | Skills (assistant, scrapers) |
| `.opencode/agents/` | Subagents (reviewer) |
| `profile/` | Candidate profile (gitignored) |
| `cv/` | CV template (moderncv) |
| `cover_letters/` | Cover letter class + template |
| `documents/` | Source materials for /setup (gitignored) |
| `job_scraper/` | Scraper state (gitignored) |
| `tools/` | CI lint scripts |
| `openspec/` | Specs + change proposals |
