## ADDED Requirements

### Requirement: Three onboarding paths
The system SHALL support three profile-building paths: (A) reading from the `documents/` folder, (B) accepting a CV pasted in chat, (C) conducting a guided interview. The system SHALL auto-detect which path to use based on available input.

#### Scenario: Path A - documents folder populated
- **WHEN** `/setup` is run and `documents/` contains files in its subfolders (cv/, linkedin/, diplomas/, references/, applications/)
- **THEN** the system reads all files, extracts profile data, and writes it to `profile/` files without requiring a guided interview

#### Scenario: Path B - CV pasted in chat
- **WHEN** `/setup` is run and the user pastes their CV text in the conversation
- **THEN** the system extracts profile data from the pasted text and writes it to `profile/` files

#### Scenario: Path C - guided interview fallback
- **WHEN** `/setup` is run and no documents are provided and no CV is pasted
- **THEN** the system conducts a guided interview asking about experience, education, skills, values, and writing preferences, and writes responses to `profile/` files

#### Scenario: Path A with partial documents
- **WHEN** `documents/` has files in some subfolders but not all
- **THEN** the system extracts what it can from available files and asks the user to supplement missing sections via interview questions

### Requirement: Bilingual profile in single pass
The system SHALL populate both Spanish and English sections of the profile during a single `/setup` run. The system SHALL NOT require a second run for the second language.

#### Scenario: Both sections populated
- **WHEN** `/setup` completes via any path
- **THEN** `profile/candidate-profile.md` contains both an ES section and an EN section with equivalent information derived from the same source materials

#### Scenario: No claim translation
- **WHEN** a claim exists in one language section but not the other
- **THEN** the system finds the equivalent from source materials or marks it as a gap rather than auto-translating

### Requirement: Idempotent updates
The system SHALL detect an existing profile and merge new information rather than overwriting.

#### Scenario: Re-running setup with existing profile
- **WHEN** `/setup` is run and `profile/` already contains profile files
- **THEN** the system reads the existing profile, asks what the user wants to update, and merges new information preserving existing data unless explicitly changed

### Requirement: Honesty and gap detection
The system SHALL NOT fabricate skills, experience, or qualifications. Unsupported claims SHALL be marked as acknowledged gaps.

#### Scenario: Gap identification
- **WHEN** the candidate's source materials lack a skill or experience that would be expected for their target roles
- **THEN** the system marks it as an "acknowledged gap" in the profile rather than inventing it

#### Scenario: Defensible claims
- **WHEN** the profile is generated
- **THEN** every claim in the profile SHALL be traceable to source materials (documents/, pasted CV, or interview responses)

### Requirement: Profile storage separation
The system SHALL store real profile data in `profile/` (gitignored) and keep skill reference files under `.opencode/skills/job-application-assistant/` as committed templates with `[PLACEHOLDER]` tokens.

#### Scenario: Profile files created
- **WHEN** `/setup` completes
- **THEN** `profile/` contains: candidate-profile.md, behavioral-profile.md, writing-style.md, job-evaluation.md, cv-templates.md, cover-letter-templates.md, search-queries.md

#### Scenario: Skill files remain templates
- **WHEN** `/setup` completes
- **THEN** skill files in `.opencode/skills/job-application-assistant/` still contain `[PLACEHOLDER]` tokens and no real personal data is written to committed files

### Requirement: Search query derivation
The system SHALL derive job search queries from the profile for use by downstream `/scrape`.

#### Scenario: Search queries generated
- **WHEN** `/setup` completes
- **THEN** `profile/search-queries.md` contains keyword-based search queries relevant to the candidate's target roles and market (Colombia + LatAm + remote international)

### Requirement: Seven skill reference files
The system SHALL maintain 7 skill reference files under `.opencode/skills/job-application-assistant/` covering: candidate profile structure, behavioral profile, writing style, job evaluation framework, CV templates, cover letter templates, and language detection.

#### Scenario: Skill files created
- **WHEN** the candidate-profile capability is implemented
- **THEN** `.opencode/skills/job-application-assistant/` contains SKILL.md plus 01-candidate-profile.md through 07-language-detection.md, all with `[PLACEHOLDER]` tokens

### Requirement: Seven-dimension fit framework
The `04-job-evaluation.md` skill file SHALL define 7 fit dimensions: skills, experience, culture, location, career alignment, modality, and salary band (conditional on data availability).

#### Scenario: Fit dimensions documented
- **WHEN** the skill file is created
- **THEN** `04-job-evaluation.md` describes all 7 dimensions including how modality (remote/hybrid/onsite) and salary band are evaluated, with deal-breaker surfacing rules

### Requirement: Language detection reference
The `07-language-detection.md` skill file SHALL describe how `/apply` detects a posting's language and selects the matching profile section.

#### Scenario: Language detection logic documented
- **WHEN** the skill file is created
- **THEN** `07-language-detection.md` describes detection heuristics (language keywords, script analysis, locale indicators) and the mapping to ES or EN profile sections for CV and cover letter generation
