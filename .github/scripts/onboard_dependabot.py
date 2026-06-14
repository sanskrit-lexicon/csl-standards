#!/usr/bin/env python3
"""Onboard every gasyoun/* and sanskrit-lexicon/* repo to hands-off Dependabot.

Idempotently ensures each non-archived repo has:
  * allow_auto_merge + allow_squash_merge + delete_branch_on_merge settings
  * .github/workflows/dependabot-auto-merge.yml   (merges Dependabot PRs)
  * .github/dependabot.yml                         (opens Dependabot PRs)

Runs on a GitHub Actions runner via `gh api`. GH_TOKEN must be a PAT / GitHub App
token with `repo` + `workflow` scope and admin on the target repos. Existing files
are never overwritten. Set DRY_RUN=true to report without writing.

Mirrors the local /cologne-dependabot-all and /cologne-dependabot-automerge-all
skills, but enumerates via the API (no local clones) so it can run unattended.
Scheduled by .github/workflows/dependabot-automerge-sync.yml.
"""
import base64
import os
import subprocess
import sys

sys.stdout.reconfigure(encoding="utf-8")

ORGS = ["sanskrit-lexicon"]
USERS = ["gasyoun"]
DRY_RUN = os.environ.get("DRY_RUN", "").strip().lower() in ("true", "1", "yes")

AUTOMERGE_PATH = ".github/workflows/dependabot-auto-merge.yml"
DEPENDABOT_PATH = ".github/dependabot.yml"

# Must stay byte-identical to what /cologne-dependabot-automerge-all deploys.
AUTOMERGE_YML = """name: Dependabot auto-merge

# Hands-off merge of Dependabot pull requests. When all required checks pass
# GitHub merges the PR by itself; on repos with no required checks the PR is
# squash-merged directly. To hold back major bumps for human review, gate the
# Approve + Enable steps on:
#   steps.meta.outputs.update-type != 'version-update:semver-major'
# Deployed by /cologne-dependabot-automerge-all.

on: pull_request

permissions:
  contents: write
  pull-requests: write

jobs:
  dependabot:
    name: Auto-merge Dependabot PRs
    runs-on: ubuntu-latest
    if: ${{ github.actor == 'dependabot[bot]' }}
    steps:
      - name: Fetch Dependabot metadata
        id: meta
        uses: dependabot/fetch-metadata@v2
        with:
          github-token: "${{ secrets.GITHUB_TOKEN }}"

      - name: Approve the PR
        run: gh pr review --approve "$PR_URL" || true
        env:
          PR_URL: ${{ github.event.pull_request.html_url }}
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Enable auto-merge (falls back to a direct squash-merge where no required checks exist)
        run: gh pr merge --auto --squash "$PR_URL" || gh pr merge --squash "$PR_URL"
        env:
          PR_URL: ${{ github.event.pull_request.html_url }}
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
"""


def gh(args):
    return subprocess.run(["gh", *args], capture_output=True, text=True)


def list_repos():
    """Return [(slug, default_branch), ...] of non-archived repos for all owners."""
    out = []
    queries = [(f"orgs/{o}/repos", o) for o in ORGS] + [(f"users/{u}/repos", u) for u in USERS]
    for path, owner in queries:
        r = gh(["api", "--paginate", f"{path}?per_page=100",
                "-q", r'.[] | [.full_name, .default_branch, (.archived|tostring)] | @tsv'])
        if r.returncode != 0:
            print(f"WARN   could not list repos for {owner}: {r.stderr.strip()[:120]}")
            continue
        for line in r.stdout.splitlines():
            parts = line.split("\t")
            if len(parts) != 3:
                continue
            slug, branch, archived = parts
            if archived == "true":
                continue
            out.append((slug, branch))
    return out


def file_exists(slug, path, branch):
    return gh(["api", f"repos/{slug}/contents/{path}?ref={branch}"]).returncode == 0


def put_file(slug, path, branch, content, message):
    b64 = base64.b64encode(content.encode("utf-8")).decode("ascii")
    r = gh(["api", "-X", "PUT", f"repos/{slug}/contents/{path}",
            "-f", f"message={message}", "-f", f"content={b64}", "-f", f"branch={branch}"])
    return r.returncode == 0, r.stderr.strip()[:120]


def ensure_settings(slug):
    r = gh(["api", "-X", "PATCH", f"repos/{slug}",
            "-F", "allow_auto_merge=true",
            "-F", "allow_squash_merge=true",
            "-F", "delete_branch_on_merge=true"])
    return r.returncode == 0, r.stderr.strip()[:120]


def root_file_names(slug, branch):
    r = gh(["api", f"repos/{slug}/contents?ref={branch}", "-q", r'.[].name'])
    return set(r.stdout.splitlines()) if r.returncode == 0 else set()


def detect_ecosystems(names):
    eco = ["github-actions"]  # always
    if "pyproject.toml" in names or any(n.startswith("requirements") and n.endswith(".txt") for n in names):
        eco.append("pip")
    if "package.json" in names:
        eco.append("npm")
    if "composer.json" in names:
        eco.append("composer")
    return eco


def make_dependabot_yml(ecosystems):
    lines = ["version: 2", "updates:"]
    for eco in ecosystems:
        lines += [
            f"  - package-ecosystem: {eco}",
            "    directory: /",
            "    schedule:",
            "      interval: weekly",
            "      day: monday",
            '      time: "08:00"',
            "      timezone: Europe/Moscow",
            "    open-pull-requests-limit: 5",
            "",
        ]
    return "\n".join(lines)


CO_AUTHOR = "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"


def onboard(slug, branch):
    actions = []

    ok, note = (True, "dry-run") if DRY_RUN else ensure_settings(slug)
    if not ok:
        return f"ERROR  {slug:<40} settings: {note}"
    actions.append("settings")

    if not file_exists(slug, AUTOMERGE_PATH, branch):
        if DRY_RUN:
            actions.append("+auto-merge")
        else:
            ok, note = put_file(slug, AUTOMERGE_PATH, branch, AUTOMERGE_YML,
                                "ci: add Dependabot auto-merge workflow\n\n"
                                "Onboarded by csl-standards dependabot-automerge-sync.\n\n" + CO_AUTHOR)
            if not ok:
                return f"ERROR  {slug:<40} auto-merge PUT: {note}"
            actions.append("+auto-merge")

    if not file_exists(slug, DEPENDABOT_PATH, branch):
        eco = detect_ecosystems(root_file_names(slug, branch))
        if DRY_RUN:
            actions.append(f"+dependabot({','.join(eco)})")
        else:
            ok, note = put_file(slug, DEPENDABOT_PATH, branch, make_dependabot_yml(eco),
                                "ci: add Dependabot config\n\n"
                                f"Ecosystems: {', '.join(eco)}. Weekly, Monday 08:00 MSK.\n"
                                "Onboarded by csl-standards dependabot-automerge-sync.\n\n" + CO_AUTHOR)
            if not ok:
                return f"ERROR  {slug:<40} dependabot PUT: {note}"
            actions.append(f"+dependabot({','.join(eco)})")

    changed = [a for a in actions if a != "settings"]
    verb = "WOULD " if DRY_RUN else ""
    return f"{verb}OK   {slug:<40} {'  '.join(changed) if changed else '(already complete)'}"


def main():
    mode = "DRY-RUN" if DRY_RUN else "LIVE"
    repos = list_repos()
    print(f"[{mode}] dependabot-automerge-sync over {len(repos)} repos\n")

    results = []
    for slug, branch in repos:
        try:
            msg = onboard(slug, branch)
        except Exception as e:  # noqa: BLE001 - never let one repo fail the whole run
            msg = f"ERROR  {slug:<40} {type(e).__name__}: {e}"
        print(msg)
        results.append(msg)

    errors = [r for r in results if r.startswith("ERROR")]
    onboarded = [r for r in results if "+" in r]
    print(f"\n{'='*64}")
    print(f"repos={len(repos)} | changed={len(onboarded)} | errors={len(errors)}")
    for e in errors:
        print(f"  {e}")
    # Exit 0 even on per-repo permission errors so the weekly cron isn't permanently red;
    # the summary above surfaces anything that needs a human.
    sys.exit(0)


if __name__ == "__main__":
    main()
