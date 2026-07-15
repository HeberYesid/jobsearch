# Setup Guide

## Prerequisites

### Required

- **[Node.js](https://nodejs.org/) 20+** — runtime for OpenSpec and CLI tools
- **[Bun](https://bun.sh/)** — runtime for scraper CLIs
- **[OpenCode](https://opencode.ai/)** — the AI coding assistant that runs the slash commands
- **[OpenSpec](https://github.com/fission-ai/openspec)** — spec-driven development tool

```powershell
npm install -g @fission-ai/openspec@latest
```

### LaTeX (required for /apply)

Install MiKTeX (Windows) or TeX Live (Linux/macOS):

```powershell
choco install miktex -y
```

### poppler (optional — ATS check)

Install poppler for the ATS text-layer verification:

```powershell
choco install poppler -y
```

If poppler is not installed, `/apply` runs the ATS check in degraded mode (visual keyword review instead of text-layer extraction).

## Verification

Verify all tools are installed and accessible:

```powershell
node --version     # v20+
bun --version      # any recent version
openspec --version # @fission-ai/openspec
lualatex --version # MiKTeX / TeX Live
xelatex --version  # MiKTeX / TeX Live
pdftotext -v       # poppler (optional)
```

## First Run

1. **Build your profile** — run `/setup` in OpenCode:
   - **Path A**: Drop your CV, LinkedIn export, diplomas, references in `documents/` subfolders, then run `/setup`
   - **Path B**: Paste your CV text: `/setup <paste your CV here>`
   - **Path C**: Run `/setup` with no arguments for a guided interview

   Output lands in `profile/` (gitignored — your personal data never gets committed).

2. **Search for jobs** — run `/scrape`:
   ```
   /scrape                    # uses top 3 search categories from your profile
   /scrape broad              # runs all search categories
   /scrape data science       # focuses on a specific category
   ```

3. **Apply to a posting** — run `/apply`:
   ```
   /apply https://linkedin.com/jobs/view/1234567890/
   /apply                     # then paste the job posting text
   ```

   `/apply` will: evaluate fit (7 dimensions) → draft CV + cover letter in LaTeX → spawn a reviewer subagent → revise → compile PDFs → run ATS check.

## Fonts (LaTeX)

The CV and cover letter templates use **Lato** and **Raleway** fonts. Download them from Google Fonts and install system-wide, or place `.ttf` files in `cover_letters/OpenFonts/`. The templates use `IfFontExistsTF` fallback — if the fonts are missing, compilation still succeeds with default sans-serif.

## Troubleshooting

- **`lualatex` not found**: Ensure MiKTeX is installed and its bin directory is in your PATH. On Windows, run `Refresh-Path` or restart your terminal after installing.
- **`pdftotext` not found**: Install poppler (`choco install poppler -y`). The ATS check will work in degraded mode without it.
- **LaTeX compilation fails**: Check the `.log` file in the same directory as the `.tex` file. Common issues: missing packages (MiKTeX auto-installs on first run — allow it), font issues (templates have fallback).
- **`bun` command not found**: Install from [bun.sh](https://bun.sh/). The scraper CLIs require Bun to run. Without Bun, `/scrape` falls back to WebSearch.
