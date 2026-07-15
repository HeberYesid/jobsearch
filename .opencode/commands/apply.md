---
description: >
  Given a job posting (URL or text), evaluate fit, draft a tailored CV + cover
  letter in LaTeX, spawn a reviewer subagent, revise, compile PDFs, and run an
  ATS check. Output in the posting's detected language (ES or EN).
---

Apply to a job posting. This is step 3 of the workflow (/setup → /scrape → /apply).

Load the `job-application-assistant` skill for reference file structures.

## Prerequisites

1. `/setup` must have been run — check that `profile/candidate-profile.md` exists. If missing, prompt the user to run `/setup` first and stop.
2. LaTeX: `lualatex` (MiKTeX) for CV, `xelatex` (MiKTeX) for cover letter. If missing, the system can still draft `.tex` files but cannot compile PDFs — warn the user.
3. `pdftotext` (poppler) is optional — the ATS check degrades gracefully if unavailable.

## Token-efficiency rules

- Never re-Read a file whose contents are already in context from an earlier step. If you read it in Step 1, it is still available in Step 2.
- When dispatching the reviewer subagent, pass draft content inline in the Task prompt rather than asking the reviewer to Read files you already have in memory.
- Run the full verification checklist exactly once, at the end (Step 7).

## Steps

Follow these steps exactly in order. Do not skip steps.

---

### Step 0: Parse Input

- If `$ARGUMENTS` looks like a URL, use WebFetch to retrieve the job posting content.
- If it is pasted text, use it directly.
- If `$ARGUMENTS` is empty, prompt the user to provide a job posting URL or paste the posting text. Do not proceed until input is provided.

Extract and store for use throughout the workflow:
- **Company name**
- **Role title**
- **Department** (if mentioned)
- **Location**
- **Language** of the posting — detect ES or EN using the heuristics in `.opencode/skills/job-application-assistant/07-language-detection.md` (keyword counting, script analysis, locale indicators). If ambiguous (below 1.5x margin and script inconclusive), prompt the user to confirm.

---

### Step 1: Evaluate Fit

Read:
- `profile/job-evaluation.md` — candidate's preferences, must-haves, deal-breakers, salary band, modality, location constraints, career direction
- `profile/candidate-profile.md` — use the section matching the detected language (ES or EN)
- `.opencode/skills/job-application-assistant/04-job-evaluation.md` — the 7-dimension framework

Evaluate the posting against the candidate's profile using the 7 dimensions:

1. **Skills** — match required/preferred skills against profile, note gaps
2. **Experience** — years and relevance vs posting requirements
3. **Culture** — company culture signals vs behavioral profile
4. **Location** — geography, relocation, remote feasibility
5. **Career alignment** — does this role move toward candidate's stated direction?
6. **Modality** — remote/hybrid/onsite match vs candidate's preference
7. **Salary band** — conditional: if posting discloses salary, compare against candidate's band. If no data, return "N/A — no data" and exclude from overall score.

Surface **deal-breakers** explicitly (location mismatch without remote, modality mismatch, salary below minimum when data available). The candidate decides whether to proceed.

Present the evaluation:
1. Skills match — which required/preferred skills match vs gaps
2. Experience match — how work history maps to the role
3. Culture match — behavioral profile fit
4. Location match
5. Modality match
6. Salary band (if data available)
7. Overall fit score and recommendation (strong fit / moderate fit / weak fit)
8. Deal-breakers (if any)

After presenting, ask the user:
> "Should I proceed with drafting the CV and cover letter for this role?"

**If the user says no, stop here.**

---

### Step 2: Draft CV + Cover Letter

You already have `profile/candidate-profile.md`, `profile/job-evaluation.md`, and `04-job-evaluation.md` in context from Step 1. Do not re-read them.

Read:
- `profile/writing-style.md` — use the section matching the detected language
- `profile/cv-templates.md` — CV tailoring preferences
- `profile/cover-letter-templates.md` — cover letter tailoring preferences
- `.opencode/skills/job-application-assistant/05-cv-templates.md` — CV tailoring rules
- `.opencode/skills/job-application-assistant/06-cover-letter-templates.md` — cover letter tailoring rules
- `cv/main_example.tex` — moderncv template (structural reference)
- `cover_letters/cover_example.tex` — cover.cls template (structural reference)

**Language**: Both the CV and the cover letter SHALL be in the posting's detected language. Draw from the matching profile section (ES or EN). Never translate claims between languages — if a claim exists only in the detected language's section, use it; if it exists only in the other section, find the equivalent or mark as a gap.

**CV** (`cv/main_<company>.tex`):
- Follow the moderncv/banking format from `05-cv-templates.md`
- Tailor the profile statement and experience bullets to the specific role
- Reframe skills and achievements to match job requirements
- Reorder experience to put most relevant role first
- Reorder skills to match posting's priority order
- Integrate posting keywords naturally into descriptions (only if supported by profile — never fabricate)
- Replace every `[PLACEHOLDER]` token — no raw tokens in output
- Target 2 pages. If exceeding, trim oldest or least relevant experience first (bottom-up)

**Cover letter** (`cover_letters/cover_<company>_<role>.tex`):
- Follow the structure from `06-cover-letter-templates.md`
- Use the `cover.cls` template
- Populate metadata commands from profile and posting
- 6-part body: greeting, opening, body 1, body 2, closing, sign-off
- Address to a named person if available, otherwise "Dear Hiring Manager" (EN) or "Estimado equipo de selección" (ES)
- Tone from `profile/writing-style.md` for the detected language
- Target 1 page
- Replace every `[PLACEHOLDER]` token — no raw tokens in output

Write both files to disk. Keep the exact text of both drafts in working memory — you will pass them inline to the reviewer in Step 3 and revise them in Step 4 without re-reading.

---

### Step 3: Reviewer — Research & Critique

Use the Task tool to spawn the `reviewer` subagent. The reviewer gets a fresh context, so pass the drafts and posting text inline in the prompt.

The reviewer subagent is defined at `.opencode/agents/reviewer.md`. It has read-only permissions (cannot edit files or run bash). It will:
1. Research the company (WebSearch/WebFetch)
2. Read `profile/` files (candidate-profile, behavioral-profile, writing-style, job-evaluation) for content critique
3. Review the inline drafts against the posting
4. Return Part A (structured JSON edits) + Part B (narrative suggestions)

Construct the Task prompt with:
- Company name and role title
- The full job posting text (inline)
- The CV draft text (inline)
- The cover letter draft text (inline)
- The detected language

The reviewer returns feedback in two parts:
- **Part A** — JSON array of edits: `{ file, old_string, new_string, reason }`
- **Part B** — Narrative suggestions grouped by: missed keywords, company angles, action-oriented reframing, tone/style issues

---

### Step 4: Revise Based on Feedback

Once the reviewer returns its feedback:

1. **Apply Part A (structured edits) directly with the Edit tool.** Do NOT re-read the draft files — you already have them in context from Step 2. For each edit in the JSON array, call Edit with the given `file`, `old_string`, and `new_string`. Skip any edit whose rationale would require fabricating content.

2. **Apply Part B (narrative suggestions) using judgment:**
   - **Missed keywords/requirements:** add the keyword where it fits naturally. Prefer experience bullets (concrete evidence) over the profile statement (abstract claim).
   - **Company/department-specific angles:** weave the reviewer's research into the cover letter opening or motivation paragraph. **Verify every company claim via WebFetch/WebSearch before including it** — do not trust reviewer research at face value.
   - **Action-oriented reframing:** rewrite passive or generic phrasing (CV profile statement, cover letter opening, bullet leads).
   - **Tone and style issues:** apply the writing-style fixes from `profile/writing-style.md` (no cliches, no apologetic hedging, consistent first-person active voice).

   Use Edit for targeted changes; only re-read a file if an edit fails because the surrounding text has shifted.

3. **Do NOT incorporate any suggestion that fabricates skills or experience.** If a posting requirement is a genuine gap, acknowledge it honestly and frame adjacent experience instead.

After all edits, the two files on disk are the final drafts.

---

### Step 5: Compile PDFs

Compile both documents:

```powershell
lualatex -interaction=nonstopmode cv/main_<company>.tex
xelatex -interaction=nonstopmode cover_letters/cover_<company>_<role>.tex
```

- CV uses **lualatex** — pdflatex fails on modern MiKTeX with fontawesome5 font-expansion errors.
- Cover letter uses **xelatex** — `cover.cls` requires fontspec.

If either compile fails, read the error log, fix the `.tex` source, and recompile. Common fixes:
- Missing package: MiKTeX auto-installs on first run; if it prompts, allow it.
- Font not found: the templates use `IfFontExistsTF` fallback; if a custom font is referenced, replace with a system font or remove the reference.

After successful compilation, clean up build artifacts:

```powershell
Remove-Item cv/main_<company>.aux, cv/main_<company>.log, cv/main_<company>.out -ErrorAction SilentlyContinue
Remove-Item cover_letters/cover_<company>_<role>.aux, cover_letters/cover_<company>_<role>.log, cover_letters/cover_<company>_<role>.out -ErrorAction SilentlyContinue
```

Keep only `.tex` and `.pdf` files.

**Note (MVP):** This is a single compile pass. The PDF verification loop (inspect for orphaned titles, overflow, font mismatches; iterate until clean) is tech debt and will be added in a post-MVP OpenSpec change. Tell the user to visually inspect the PDFs before submitting.

---

### Step 6: ATS Check

This check applies to the **CV only** — cover letters rarely go through keyword screening.

**Availability check:** Run `pdftotext -v`. If it fails (poppler not installed):
- Print: "Warning: pdftotext (poppler) not available. ATS check running in degraded mode (visual keyword review only)."
- Do keyword coverage (item 3 below) against your visual Read of the PDF instead.
- Note the degraded mode in the Step 7 report.
- Skip to item 3.

**1. Extract the text layer:**

```powershell
pdftotext -layout cv/main_<company>.pdf cv/main_<company>.txt
```

Read the `.txt` file.

**2. Parseability checks:**
- [ ] Text extracted at all — no garbage runs (no `(cid:NNN)` markers, no replacement characters, no missing text visible in the PDF)
- [ ] Email and phone survive as literal text — icon fonts extract as glyph names (harmless noise), but the actual address and digits must be present as text
- [ ] Reading order matches visual order — section headings appear in the same sequence as on the page
- [ ] Dates recognizable — each role and degree has its years present in the extraction

If contact details are not extractable (carried only by icon glyphs), fix the `.tex` to print them as text, recompile (Step 5), and re-extract.

**3. Keyword coverage:**
Reuse the required/preferred keyword list you extracted in Step 0 — do not re-derive it. Match each keyword against the extracted text (or visual Read in degraded mode), in the posting's language. Report a table:

| Keyword | Priority | Status | Note |
|---------|----------|--------|------|
| ... | required/preferred | covered / synonym-only / missing (have it) / missing (gap) | where it appears, or why absent |

- **covered** — the term appears (verbatim or trivial inflection)
- **synonym-only** — the concept is present under a different term. If the posting's exact term is truthfully applicable per the profile, prefer the posting's term (ATS keyword matches are often literal)
- **missing (have it)** — the profile shows the candidate has this skill but the CV never says it: add it where it fits naturally (prefer experience bullets), recompile (Step 5), and re-extract
- **missing (gap)** — a genuine gap: leave it missing. **Never stuff keywords.** Acknowledge in the cover letter's framing, not in the CV

**4. Clean up:** Delete the extracted `.txt` file.

---

### Step 7: Present Final Output

Re-read both final files once here to verify on-disk state matches your mental model after Step 4 and Step 5 edits.

### Verification Checklist
Report pass/fail for each:
- **Factual accuracy** — every claim in CV and cover letter traceable to `profile/`
- **Targeting** — CV and cover letter tailored to this specific posting (not generic)
- **Consistency** — CV and cover letter tell the same story (no contradictions)
- **Language** — both documents in the posting's detected language, drawn from matching profile section
- **Quality** — no raw `[PLACEHOLDER]` tokens, no typos, no LaTeX errors
- **ATS** — keyword coverage table presented, gaps acknowledged not stuffed
- **Degraded mode** — if pdftotext was unavailable, noted here

### Key Tailoring Decisions
Summarize 3-5 key decisions:
- What was emphasized and why
- What company-specific angles were incorporated (and verified)
- What the reviewer suggested that was most impactful
- Any gaps that were acknowledged or reframed

### Files Created
List the files written:
- `cv/main_<company>.tex` + `cv/main_<company>.pdf`
- `cover_letters/cover_<company>_<role>.tex` + `cover_letters/cover_<company>_<role>.pdf`

Tell the user: "Both files are ready for your review. Open the PDFs to check the final output before submitting. Visually verify layout (page count, no orphaned titles) — the automated PDF verification loop is not yet implemented."

### Next Steps
- **Ready to submit?** Log the application in your tracker for future reference.
- **Want to search for more jobs?** Run `/scrape` to find additional postings.
- **Need to update your profile?** Run `/setup` to merge new information.
