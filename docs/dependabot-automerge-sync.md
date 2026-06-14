# Dependabot auto-merge — org sync

A scheduled GitHub Actions workflow that keeps every `gasyoun/*` and
`sanskrit-lexicon/*` repo on the hands-off Dependabot setup, **without anyone
running anything locally**. It is the autonomous onboarding layer for new repos;
the per-PR merging itself is already handled inside each repo by
`.github/workflows/dependabot-auto-merge.yml`.

## What it does

On a weekly cron (Monday 06:00 UTC) and on manual dispatch, it walks every
non-archived repo in both owners and idempotently ensures each has:

| Artifact | Purpose |
|---|---|
| `allow_auto_merge` + `allow_squash_merge` + `delete_branch_on_merge` settings | what `gh pr merge --auto --squash` relies on |
| `.github/workflows/dependabot-auto-merge.yml` | merges Dependabot PRs once checks pass |
| `.github/dependabot.yml` | opens Dependabot PRs (ecosystems auto-detected) |

Existing files are **never overwritten** — a repo with a hand-tuned
`dependabot.yml` (e.g. grouped updates) is left alone. Settings are re-asserted
every run (cheap, idempotent).

- Workflow: [`.github/workflows/dependabot-automerge-sync.yml`](../.github/workflows/dependabot-automerge-sync.yml)
- Script: [`.github/scripts/onboard_dependabot.py`](../.github/scripts/onboard_dependabot.py)

## One-time setup: the token

The default `GITHUB_TOKEN` can only touch **this** repo, so the workflow needs a
token that can write to siblings. Create a repo secret named **`ORG_AUTOMERGE_TOKEN`**:

1. Generate one of:
   - a **classic PAT** with scopes `repo` + `workflow` (admin on repos you own is included by `repo`), **or**
   - a **fine-grained PAT** scoped to both owners with permissions:
     *Contents: Read & write*, *Workflows: Read & write*, *Administration: Read & write*, *Pull requests: Read & write*, **or**
   - a **GitHub App** installed on both owners with the same permissions, and mint an installation token.
2. Add it at `csl-standards` → **Settings → Secrets and variables → Actions → New repository secret**, name `ORG_AUTOMERGE_TOKEN`.

Until that secret exists the workflow runs but **no-ops with a warning** — so it
is safe to merge before the token is in place.

## Running it manually

`csl-standards` → **Actions → Dependabot auto-merge — org sync → Run workflow**.
Tick **dry_run** to see what it *would* change without writing anything.

## Why a scheduled workflow and not a Claude skill/hook

The per-PR merging is a GitHub Actions workflow inside each repo, so it already
runs with no machine and no Claude. The only gap is a brand-new repo that doesn't
have the workflow yet. A Claude **hook** only fires inside a live Claude session,
and a **skill** only runs when invoked — neither is autonomous. A scheduled
GitHub Actions workflow is, which is why onboarding lives here. The local
`/cologne-dependabot-automerge-all` skill remains available for an on-demand sweep.
