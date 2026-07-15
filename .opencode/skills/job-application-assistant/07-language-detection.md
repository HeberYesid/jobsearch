# Language Detection

This file defines how `/apply` detects a job posting's language and selects the matching profile section for CV and cover letter generation.

## Detection Heuristics

### Primary Signals
1. **Language keywords**: Common words in the posting text:
   - ES: "experiencia", "requisitos", "empresa", "trabajo", "beneficios", "salario", "hoja de vida", "vacante"
   - EN: "experience", "requirements", "company", "work", "benefits", "salary", "resume", "position"
2. **Script analysis**: Check for Spanish-specific characters (n, a, e, i, o, u, inverted question/exclamation marks) — strong ES signal.
3. **Locale indicators**: URL patterns (e.g., `.co`, `.com.mx`, `.es` — likely ES; `.com`, `.io` — likely EN but not definitive).

### Decision Logic
1. Count ES keywords vs EN keywords in the posting text.
2. If ES keywords > EN keywords by margin — **Spanish**.
3. If EN keywords > ES keywords by margin — **English**.
4. If tied or ambiguous — check script (accented chars — ES).
5. If still ambiguous — ask the user.

### Margin Threshold
- If one language's keyword count is >= 1.5x the other's — confident detection.
- Below 1.5x — use script analysis as tiebreaker.
- If both signals are ambiguous — prompt user for confirmation.

## Profile Section Selection

Once language is detected:
- **Spanish** — use ES sections from `profile/candidate-profile.md`, `profile/behavioral-profile.md`, `profile/writing-style.md`
- **English** — use EN sections from the same files

## Rules
- **Never translate claims** between languages. If a claim exists only in the detected language's profile section, use it. If it exists only in the other section, find the equivalent or mark as a gap.
- The CV and cover letter MUST be in the posting's detected language.
- If the posting is bilingual (e.g., ES/EN side by side), default to the language with more content or ask the user.
