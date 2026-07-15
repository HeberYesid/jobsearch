---
description: Build your candidate profile (3 paths: documents/ folder, paste CV, or guided interview). Output lands in profile/ (gitignored).
---

Build the candidate profile. This is step 1 of the workflow (/setup → /scrape → /apply).

Load the `job-application-assistant` skill for reference file structures.

## Auto-Detection

Determine which path to use:

1. **Path A (documents/ folder)**: Check if `documents/` subfolders (cv/, linkedin/, diplomas/, references/, applications/) contain files beyond `.gitkeep`. If yes → Path A.
2. **Path B (pasted CV)**: If the user provides `$ARGUMENTS` (pasted CV text) → Path B.
3. **Path C (guided interview)**: If no documents and no pasted CV → Path C.

If multiple sources are available, prefer Path A (documents/) and supplement with interview questions for missing sections.

## Path A: documents/ folder

1. List files in `documents/` subfolders.
2. Read each file (handle .pdf, .tex, .md, .docx, .txt).
3. Extract: personal info, experience, education, skills, certifications, languages, values, writing style indicators.
4. If some sections are missing, ask supplement questions (Path C-style) for those specific gaps.

## Path B: Pasted CV

1. Read the pasted CV text from `$ARGUMENTS`.
2. Extract: personal info, experience, education, skills, certifications, languages.
3. Ask supplement questions for behavioral profile and writing style (these are rarely in a CV).

## Path C: Guided Interview

Ask structured questions (one batch at a time, not all at once):

**Batch 1 — Basics:**
- Full name, contact info, LinkedIn/portfolio URL
- Current job title and target roles
- Years of experience

**Batch 2 — Experience:**
- For each significant role: title, company, dates, location, key achievements
- Education: degrees, institutions, dates
- Certifications and languages

**Batch 3 — Skills:**
- Technical skills grouped by category (languages, frameworks, tools, cloud, etc.)
- Soft skills

**Batch 4 — Behavioral:**
- Work values, preferred work style, culture preferences
- Teamwork and leadership style

**Batch 5 — Writing:**
- Preferred tone for ES and EN
- Things to do / avoid in CV and cover letters
- Example sentences or past cover letters for reference

## Bilingual Generation (all paths)

Generate BOTH ES and EN sections in a single pass:
- Use the same source materials for both sections.
- Do NOT translate claims between sections. Find the equivalent from source materials or mark as a gap.
- If the source materials are in one language only, generate that language's section from the source and derive the other section by finding equivalents (not translating).

## Profile Output

Write the following files to `profile/`:

1. `profile/candidate-profile.md` — ES + EN sections (experience, education, skills, certifications, languages). Follow structure in skill file `01-candidate-profile.md`.
2. `profile/behavioral-profile.md` — ES + EN sections (values, work style, culture). Follow `02-behavioral-profile.md`.
3. `profile/writing-style.md` — ES + EN sections (tone, do/don't). Follow `03-writing-style.md`.
4. `profile/job-evaluation.md` — Preferences, must-haves, deal-breakers, salary band, modality, location constraints, career direction. Follow `04-job-evaluation.md`.
5. `profile/cv-templates.md` — CV tailoring preferences. Follow `05-cv-templates.md`.
6. `profile/cover-letter-templates.md` — Cover letter preferences. Follow `06-cover-letter-templates.md`.
7. `profile/search-queries.md` — Search strategy derived from the profile. Must contain:
   - At least 3 query categories (e.g. "Backend Engineer", "Data Analyst", "DevOps"), each with:
     - Keywords: search terms derived from the candidate's core skills and target roles
     - Seniority level: junior/middle/senior/staff
     - Location preferences: specific cities, countries, or "Remote"
   - Geographic focus: default search geography (e.g. "Colombia + remote international")
   - Portal preferences: which portals to search (linkedin-search, freehire-search, and any future /add-portal additions)
   - The `/scrape` command reads this file to determine search parameters. Top 3 priority categories are searched by default; "broad" runs all.

## Idempotency

Before writing, check if `profile/` already contains profile files:
- If yes: read existing profile, ask what the user wants to update, merge new information. Do NOT overwrite existing data unless explicitly changed.
- If no: proceed with full generation.

## Gap Detection

While generating the profile, identify skills or experience that would be expected for the candidate's target roles but are missing from their materials. List these in an "Acknowledged Gaps" section at the end of `profile/candidate-profile.md`. Never fabricate or infer skills not present in the source materials.

## Honesty Rules (non-negotiable)

- **Never fabricate** skills, experience, or qualifications.
- Every claim MUST be traceable to source materials.
- Acknowledged gaps are explicitly marked, not hidden or invented.

## Completion

After writing all profile files, show:
- Summary of what was generated (which path, which files)
- Any acknowledged gaps found
- Next step: "Run `/scrape` to search for jobs, or `/apply <posting-url>` to apply to a specific job."
