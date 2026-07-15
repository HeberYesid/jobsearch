## 1. Reviewer subagent

- [x] 1.1 Create `.opencode/agents/reviewer.md` with frontmatter: `description`, `mode: subagent`, `hidden: true`, `permission` object (edit: deny, bash: deny, task: deny, read: allow, glob: allow, grep: allow, webfetch: allow, websearch: allow)
- [x] 1.2 Write reviewer prompt body: company research instructions (WebSearch/WebFetch for website, mission, recent news, culture), profile file reads (01-candidate-profile, 02-behavioral-profile, 03-writing-style, 04-job-evaluation — content critique only, NOT 05/06), inline draft review (CV + cover letter passed in prompt), Part A feedback format (JSON array of edits with file/old_string/new_string/reason), Part B feedback format (narrative: missed keywords, company angles, action-oriented reframing, tone/style issues checked against 03 + 02), honesty enforcement rule (no fabrication, ground all suggestions in profile data)

## 2. /apply command

- [x] 2.1 Create `.opencode/commands/apply.md` with frontmatter (`description`), token-efficiency rules (no re-reads, pass drafts inline to reviewer, single verification pass at end), step ordering note ("follow exactly in order")
- [x] 2.2 Write Step 0 (Parse Input): URL detection → WebFetch, text → direct use, extract company/role/department/location/language, missing args → prompt user
- [x] 2.3 Write Step 1 (Evaluate Fit): read `profile/job-evaluation.md` + `profile/candidate-profile.md`, apply 7-dimension framework from `04-job-evaluation.md`, surface deal-breakers, salary band conditional (N/A if no data), present evaluation (skills match, experience match, culture match, location, modality, salary, overall fit score + recommendation), ask user to proceed — stop if no
- [x] 2.4 Write Step 2 (Draft CV + Cover Letter): read `profile/writing-style.md`, `profile/cv-templates.md`, `profile/cover-letter-templates.md`, read `cv/main_example.tex` + `cover_letters/cover_example.tex` as structural reference, detect posting language via `07-language-detection.md`, generate CV (`cv/main_<company>.tex`) in posting language from matching profile section following `05-cv-templates.md` rules, generate cover letter (`cover_letters/cover_<company>_<role>.tex`) in posting language following `06-cover-letter-templates.md` rules, replace all [PLACEHOLDER] tokens, keep drafts in working memory
- [x] 2.5 Write Step 3 (Reviewer): invoke `reviewer` subagent via Task tool, pass both draft texts inline + posting text inline in the prompt, receive Part A (structured edits) + Part B (narrative suggestions)
- [x] 2.6 Write Step 4 (Revise): apply Part A edits via Edit tool (skip fabrication), apply Part B with judgment (missed keywords → add where natural, company angles → verify via WebFetch before including, reframing → rewrite passive phrasing, tone → fix per writing-style), re-read file only if edit fails due to shifted text, reject any suggestion that fabricates skills/experience
- [x] 2.7 Write Step 5 (Compile): `lualatex -interaction=nonstopmode cv/main_<company>.tex`, `xelatex -interaction=nonstopmode cover_letters/cover_<company>_<role>.tex`, fix .tex and recompile if error, clean up .aux/.log/.out files after success
- [x] 2.8 Write Step 6 (ATS Check): run `pdftotext -v` availability check, if available → `pdftotext -layout cv/main_<company>.pdf cv/main_<company>.txt`, read .txt, parseability checks (text extracted, email/phone as literal text, reading order matches visual, dates recognizable), keyword coverage table (covered/synonym-only/missing-have/missing-gap), if missing-have → add keyword + recompile + re-extract, if missing-gap → leave missing, delete .txt after check, if pdftotext unavailable → warn + visual keyword review + note degraded mode
- [x] 2.9 Write Step 7 (Present): verification checklist (factual accuracy, targeting, consistency, quality — pass/fail), key tailoring decisions (3-5 points: emphasis, company angles, impactful reviewer suggestions, acknowledged gaps), files created list, degraded ATS mode note if applicable, next steps guidance

## 3. Verification and archive

- [x] 3.1 Run `openspec validate job-application`
- [x] 3.2 Run `openspec archive job-application`
