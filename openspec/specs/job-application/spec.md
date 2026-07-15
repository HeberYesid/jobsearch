# job-application Specification

## Purpose
TBD - created by archiving change job-application. Update Purpose after archive.
## Requirements
### Requirement: Posting input parsing
The `/apply` command SHALL accept a job posting as `$ARGUMENTS` — either a URL (fetched via WebFetch) or pasted text (used directly). The system SHALL extract: company name, role title, department (if mentioned), location, and posting language (ES or EN) using the heuristics from `07-language-detection.md`.

#### Scenario: URL input
- **WHEN** `/apply` is called with a URL as `$ARGUMENTS`
- **THEN** the system fetches the posting via WebFetch and extracts company, role, location, and detected language

#### Scenario: Text input
- **WHEN** `/apply` is called with pasted job posting text as `$ARGUMENTS`
- **THEN** the system uses the text directly and extracts company, role, location, and detected language

#### Scenario: Missing arguments
- **WHEN** `/apply` is called with no `$ARGUMENTS`
- **THEN** the system prompts the user to provide a job posting URL or paste the posting text and does not proceed

### Requirement: Seven-dimension fit evaluation
The `/apply` command SHALL evaluate the posting against the candidate's profile using the 7-dimension framework from `04-job-evaluation.md` (skills, experience, culture, location, career alignment, modality, salary band conditional). The evaluation SHALL surface deal-breakers explicitly. The salary band dimension SHALL return "N/A — no data" when the posting does not disclose salary, and SHALL NOT penalize the overall fit score. After presenting the evaluation, the system SHALL ask the user whether to proceed with drafting.

#### Scenario: Strong fit
- **WHEN** the candidate's profile matches most posting requirements across dimensions
- **THEN** the evaluation presents per-dimension scores, an overall fit score, a recommendation (strong/moderate/weak fit), and asks whether to proceed

#### Scenario: Deal-breaker detected
- **WHEN** a deal-breaker is identified (e.g., modality mismatch, location mismatch without remote option)
- **THEN** the evaluation surfaces the deal-breaker explicitly, warns the candidate, and asks whether to proceed despite it

#### Scenario: Salary data unavailable
- **WHEN** the posting does not include salary information
- **THEN** the salary band dimension returns "N/A — no data" and is excluded from the overall fit score calculation

#### Scenario: User declines to proceed
- **WHEN** the user responds "no" to the proceed prompt
- **THEN** the system stops and does not draft any documents

### Requirement: Language-aware document generation
The `/apply` command SHALL detect the posting's language (ES or EN) using `07-language-detection.md` heuristics and SHALL generate both the CV and the cover letter in that language, drawing from the matching profile section. The system SHALL NOT translate claims between languages — if a claim exists only in the detected language's profile section, it SHALL be used; if it exists only in the other section, the system SHALL find the equivalent or mark it as a gap.

#### Scenario: Spanish posting
- **WHEN** the posting is detected as Spanish
- **THEN** the CV and cover letter are generated in Spanish using the ES sections from `profile/candidate-profile.md`, `profile/behavioral-profile.md`, and `profile/writing-style.md`

#### Scenario: English posting
- **WHEN** the posting is detected as English
- **THEN** the CV and cover letter are generated in English using the EN sections from the profile files

#### Scenario: Ambiguous language
- **WHEN** the posting's language cannot be confidently determined (keyword counts below 1.5x margin and script analysis is inconclusive)
- **THEN** the system prompts the user to confirm the language before proceeding

### Requirement: CV drafting with moderncv template
The `/apply` command SHALL tailor `cv/main_example.tex` into `cv/main_<company>.tex` following the rules in `05-cv-templates.md`: section selection (always include contact, experience, education, skills, languages; conditional certifications), content tailoring (job title matches posting, experience reordered by relevance, skills reordered to posting priority, keywords naturally integrated), and page management (2-page target, trim oldest entries first if exceeding). Every `[PLACEHOLDER]` token in the generated file SHALL be replaced — no raw tokens in output.

#### Scenario: Tailored CV generated
- **WHEN** the drafter generates the CV
- **THEN** `cv/main_<company>.tex` contains no `[PLACEHOLDER]` tokens, the job title matches the posting, experience is reordered by relevance, and skills are reordered to posting priority

#### Scenario: CV exceeds 2 pages
- **WHEN** the tailored CV content exceeds 2 pages
- **THEN** the drafter trims the oldest or least relevant experience entries first (bottom-up) to meet the 2-page target

### Requirement: Cover letter drafting with cover.cls template
The `/apply` command SHALL tailor `cover_letters/cover_example.tex` into `cover_letters/cover_<company>_<role>.tex` following the rules in `06-cover-letter-templates.md`: metadata commands populated from profile and posting, 6-part body structure (greeting, opening, body 1, body 2, closing, sign-off), tone from `profile/writing-style.md` for the detected language, and 1-page target. Every `[PLACEHOLDER]` token SHALL be replaced.

#### Scenario: Tailored cover letter generated
- **WHEN** the drafter generates the cover letter
- **THEN** `cover_letters/cover_<company>_<role>.tex` contains no `[PLACEHOLDER]` tokens, metadata is populated (recipient, company, date, subject), and the body follows the 6-part structure

#### Scenario: Unknown hiring manager
- **WHEN** the posting does not name a hiring manager
- **THEN** the greeting uses "Dear Hiring Manager" (EN) or "Estimado equipo de selección" (ES)

### Requirement: Reviewer subagent
The system SHALL include a reviewer subagent at `.opencode/agents/reviewer.md` with `mode: subagent` and `hidden: true`. The reviewer SHALL have read-only permissions (edit: deny, bash: deny, task: deny, read/webfetch/websearch/glob/grep: allow). The `/apply` command SHALL invoke the reviewer via the Task tool, passing both draft texts inline in the prompt. The reviewer SHALL research the company (WebSearch/WebFetch), read profile files (01-candidate-profile, 02-behavioral-profile, 03-writing-style, 04-job-evaluation) for content critique, and return feedback in two parts: Part A (structured JSON edits with file/old_string/new_string/reason) and Part B (narrative suggestions grouped by category).

#### Scenario: Reviewer invoked with drafts inline
- **WHEN** the drafter completes the initial drafts
- **THEN** the `/apply` command invokes the reviewer subagent via Task tool with both draft texts passed inline in the prompt

#### Scenario: Reviewer researches company
- **WHEN** the reviewer subagent runs
- **THEN** it uses WebSearch and WebFetch to research the company's website, mission, recent news, and culture, and incorporates findings into its feedback

#### Scenario: Reviewer returns structured feedback
- **WHEN** the reviewer completes its analysis
- **THEN** it returns Part A (JSON array of edits with file, old_string, new_string, reason) and Part B (narrative suggestions for missed keywords, company angles, action-oriented reframing, tone/style issues)

#### Scenario: Reviewer cannot modify files
- **WHEN** the reviewer subagent attempts to edit a file or run a bash command
- **THEN** the permission system denies the action (edit: deny, bash: deny)

### Requirement: Revision based on reviewer feedback
The `/apply` command (drafter) SHALL apply Part A (structured edits) directly with the Edit tool, skipping any edit whose rationale would require fabricating content. The drafter SHALL apply Part B (narrative suggestions) using judgment — adding missed keywords where they fit naturally, weaving company research into the cover letter (after verifying claims via WebFetch/WebSearch), reframing passive phrasing, and fixing tone/style issues. The drafter SHALL NOT incorporate any suggestion that fabricates skills or experience.

#### Scenario: Structured edits applied
- **WHEN** the reviewer returns Part A with JSON edits
- **THEN** the drafter applies each edit via the Edit tool (file, old_string, new_string), skipping edits that would fabricate content

#### Scenario: Narrative suggestions applied with judgment
- **WHEN** the reviewer returns Part B with narrative suggestions
- **THEN** the drafter addresses each category (missed keywords, company angles, reframing, tone) and applies changes via Edit, re-reading a file only if an edit fails due to shifted text

#### Scenario: Company claims verified
- **WHEN** the reviewer's feedback includes company-specific claims from web research
- **THEN** the drafter verifies each claim via WebFetch or WebSearch before including it in the cover letter, and discards unverified claims

#### Scenario: Fabrication rejected
- **WHEN** a reviewer suggestion would require inventing a skill, experience, or achievement not in the profile
- **THEN** the drafter skips the suggestion and, if the requirement is a gap, acknowledges it honestly by framing adjacent experience instead

### Requirement: LaTeX compilation
The `/apply` command SHALL compile the CV with `lualatex -interaction=nonstopmode cv/main_<company>.tex` and the cover letter with `xelatex -interaction=nonstopmode cover_letters/cover_<company>_<role>.tex`. If compilation fails, the system SHALL surface the error and attempt to fix the `.tex` source. After successful compilation, the system SHALL clean up build artifacts (`.aux`, `.log`, `.out` files), keeping only `.tex` and `.pdf`.

#### Scenario: Successful compilation
- **WHEN** both `.tex` files are finalized
- **THEN** the system compiles the CV with lualatex and the cover letter with xelatex, producing PDF files

#### Scenario: Compilation error
- **WHEN** lualatex or xelatex exits with an error
- **THEN** the system surfaces the error log, attempts to fix the `.tex` source, and recompiles

#### Scenario: Build artifacts cleaned
- **WHEN** compilation succeeds
- **THEN** the system deletes `.aux`, `.log`, and `.out` files, retaining only `.tex` and `.pdf`

### Requirement: ATS compatibility check
The `/apply` command SHALL run an ATS check on the compiled CV PDF. The system SHALL first check `pdftotext` availability. If available, it SHALL extract the text layer with `pdftotext -layout`, verify parseability (text extracted without garbage, email and phone survive as literal text, reading order matches visual order, dates recognizable), and run keyword coverage against the posting's required/preferred keywords (covered / synonym-only / missing-have / missing-gap). If `pdftotext` is unavailable, the system SHALL print a warning, perform keyword coverage against the visual Read of the PDF, and note the degraded mode in the final report. The extracted `.txt` file SHALL be deleted after the check.

#### Scenario: pdftotext available
- **WHEN** `pdftotext -v` succeeds
- **THEN** the system extracts the CV's text layer, runs parseability checks (contact details, reading order, dates), and produces a keyword coverage table

#### Scenario: pdftotext unavailable
- **WHEN** `pdftotext -v` fails (poppler not installed)
- **THEN** the system prints a warning, performs keyword coverage against the visual Read of the PDF, and notes the degraded mode in the final report

#### Scenario: Contact details not extractable
- **WHEN** the extracted text layer does not contain the email or phone as literal text (e.g., carried only by icon glyphs)
- **THEN** the system flags the issue, fixes the `.tex` to print contact details as text, recompiles, and re-runs the extraction

#### Scenario: Keyword covered
- **WHEN** a posting keyword appears in the extracted text (verbatim or trivial inflection)
- **THEN** the keyword coverage table marks it as "covered" with its location

#### Scenario: Keyword missing but candidate has it
- **WHEN** a posting keyword is not in the CV text but the profile shows the candidate has the skill
- **THEN** the system adds the keyword where it fits naturally (preferring experience bullets), recompiles, and re-runs the extraction

#### Scenario: Keyword missing and is a gap
- **WHEN** a posting keyword is not in the CV text and the candidate does not have the skill
- **THEN** the keyword coverage table marks it as "missing (gap)" and the system does NOT stuff the keyword into the CV

### Requirement: Honesty enforcement
Every claim in the CV and cover letter SHALL be traceable to `profile/` data. Unsupported posting keywords SHALL be acknowledged as gaps, never stuffed into the documents. The reviewer subagent SHALL enforce the same rule — all suggestions must be grounded in actual profile data.

#### Scenario: Claim traceable to profile
- **WHEN** a claim appears in the CV or cover letter
- **THEN** it can be traced back to a specific entry in `profile/candidate-profile.md`, `profile/behavioral-profile.md`, or `profile/writing-style.md`

#### Scenario: Unsupported keyword not stuffed
- **WHEN** the posting requires a skill the candidate does not have
- **THEN** the system marks it as an acknowledged gap in the keyword coverage table and does not add it to the CV; the cover letter may frame adjacent transferable experience

### Requirement: Final presentation
The `/apply` command SHALL present a final report including: verification checklist (factual accuracy, targeting, consistency, quality — pass/fail per item), key tailoring decisions (3-5 summary points: what was emphasized, company-specific angles, most impactful reviewer suggestions, acknowledged gaps), files created (`cv/main_<company>.tex`, `cover_letters/cover_<company>_<role>.tex`), and next steps.

#### Scenario: Final report presented
- **WHEN** the ATS check completes
- **THEN** the system presents the verification checklist, key tailoring decisions, files created, and next-step guidance

#### Scenario: Degraded ATS mode noted
- **WHEN** the ATS check ran in degraded mode (pdftotext unavailable)
- **THEN** the final report includes a note about the degraded ATS check

### Requirement: Prerequisite profile check
The `/apply` command SHALL verify that `profile/` exists and contains the required profile files before proceeding. If the profile is missing, the system SHALL prompt the user to run `/setup` first and shall not proceed.

#### Scenario: Profile exists
- **WHEN** `/apply` is called and `profile/candidate-profile.md` exists
- **THEN** the system proceeds with the workflow

#### Scenario: Profile missing
- **WHEN** `/apply` is called and `profile/` is empty or missing
- **THEN** the system prompts the user to run `/setup` first and does not proceed

