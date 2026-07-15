#!/usr/bin/env python3
"""Supply-chain guards for the framework's riskiest surfaces.

Run from anywhere: python tools/security_guards.py

This repo ships pre-approved OpenCode permissions and CLI code that every
fork user executes. These guards make dangerous changes LOUD, not
impossible: a PR that intentionally needs one of them must update the
allowlists in this file in the same diff, so the change is explicit and
reviewable rather than buried.

Checks:
1. opencode.json — permission structure must match expectations. The bash
   permission glob entries must be in the allowlist below. Catches permission
   widening (e.g. bash "*": "allow"), which would auto-approve commands on
   every fork.
2. .gitignore — the personal-data ignore rules must all still be present.
   Catches weakening that would make future users silently commit their
   profile, documents, or scraper state.
3. .opencode/**/package.json — no npm/bun lifecycle scripts (preinstall,
   install, postinstall, prepare, prepack) and no trustedDependencies.
   Catches code execution smuggled into `bun install`.

Stdlib only. Exit 0 on success, 1 with a failure list otherwise.
"""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
errors: list[str] = []

# The bash permission glob entries the template ships. A PR that adds or
# changes a bash permission must add it here too — that is the point: the
# diff shows both the widening and the explicit approval.
ALLOWED_BASH_PERMISSIONS = {
    "*": "ask",
    "git status *": "allow",
    "git diff *": "allow",
    "git log *": "allow",
    "git show *": "allow",
    "git add *": "allow",
    "git commit *": "ask",
    "git push *": "ask",
    "lualatex *": "allow",
    "xelatex *": "allow",
    "pdflatex *": "allow",
    "pdftotext *": "allow",
    "python *": "allow",
    "python3 *": "allow",
    "bun *": "allow",
    "node *": "allow",
    "npx *": "allow",
    "choco *": "allow",
    "openspec *": "allow",
    "mkdir *": "allow",
    "Test-Path *": "allow",
    "Get-ChildItem *": "allow",
    "Get-Content *": "allow",
    "New-Item *": "allow",
    "Remove-Item *": "ask",
}

# Personal-data ignore rules that must never disappear from .gitignore.
REQUIRED_IGNORE_RULES = [
    "profile/",
    "documents/cv/*",
    "documents/linkedin/*",
    "documents/diplomas/*",
    "documents/references/*",
    "documents/applications/*",
    "job_scraper/*",
]

FORBIDDEN_SCRIPTS = {"preinstall", "install", "postinstall", "prepare", "prepack"}


def check_permissions() -> None:
    path = ROOT / "opencode.json"
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        errors.append(f"opencode.json: unreadable or invalid JSON: {exc}")
        return

    perm = data.get("permission", {})
    if not isinstance(perm, dict):
        errors.append("opencode.json: 'permission' must be an object")
        return

    # Check bash permissions against allowlist
    bash = perm.get("bash", {})
    if not isinstance(bash, dict):
        errors.append("opencode.json: 'permission.bash' must be an object")
        return

    for key, value in bash.items():
        expected = ALLOWED_BASH_PERMISSIONS.get(key)
        if expected is None:
            errors.append(
                f"opencode.json: bash permission {key!r} is not in the reviewed allowlist. "
                "Pre-approved permissions run without prompting on every fork. If this entry is "
                "intentional, add it to ALLOWED_BASH_PERMISSIONS in tools/security_guards.py in "
                "the same PR so the widening is explicit and reviewable."
            )
        elif value != expected:
            errors.append(
                f"opencode.json: bash permission {key!r} has value {value!r} but allowlist "
                f"expects {expected!r}. If this change is intentional, update "
                f"ALLOWED_BASH_PERMISSIONS in tools/security_guards.py in the same PR."
            )


def check_gitignore() -> None:
    path = ROOT / ".gitignore"
    try:
        rules = {line.strip() for line in path.read_text(encoding="utf-8").splitlines()}
    except OSError as exc:
        errors.append(f".gitignore: unreadable: {exc}")
        return
    for rule in REQUIRED_IGNORE_RULES:
        if rule not in rules:
            errors.append(
                f".gitignore: required personal-data rule missing: {rule!r}. "
                "These rules keep fork users from committing personal data. If the rule moved "
                "or was renamed intentionally, update REQUIRED_IGNORE_RULES in "
                "tools/security_guards.py in the same PR."
            )


def check_package_manifests() -> None:
    manifests = [
        p
        for p in ROOT.glob(".opencode/**/package.json")
        if "node_modules" not in p.parts
    ]
    if not manifests:
        # Not an error — some forks may not have CLI tools
        print("note: no package.json files found under .opencode/")
        return
    for manifest in manifests:
        relpath = manifest.relative_to(ROOT)
        try:
            data = json.loads(manifest.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            errors.append(f"{relpath}: unreadable or invalid JSON: {exc}")
            continue
        bad = FORBIDDEN_SCRIPTS & set(data.get("scripts", {}))
        if bad:
            errors.append(
                f"{relpath}: lifecycle script(s) {sorted(bad)} are forbidden - they execute "
                "arbitrary code during `bun install` on every fork user's machine."
            )
        if "trustedDependencies" in data:
            errors.append(
                f"{relpath}: trustedDependencies is forbidden - it re-enables dependency "
                "lifecycle scripts that bun blocks by default."
            )


def main() -> int:
    check_permissions()
    check_gitignore()
    check_package_manifests()
    if errors:
        print(f"security_guards: {len(errors)} failure(s)")
        for err in errors:
            print(f"  - {err}")
        return 1
    print(
        "security_guards: OK (permissions allowlist, gitignore rules, package manifests)"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
