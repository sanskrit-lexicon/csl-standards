# Roadmap

Status date: 2026-06-20.

The original three-month scaffold is complete. The repository now has a reproducible
TEI/OntoLex workbench, a validated 250-case canonical pilot, a 500/1000 scale-stability
check, a Salt API Phase 0 handoff package, a public `csl:` vocabulary index, and the
`v1.0.0` stable release.

The completed post-v0.9 sequence was:

1. Scaling stability check.
2. Salt API Phase 0.
3. `csl:` vocabulary page.
4. `v1.0.0` annotated-tag snapshot.
5. Paper submission last, aimed at broader computational lexicography.

Current next step: implement the Salt API MW REST pilot in `csl-apidev`. Paper submission
remains last.

## Completed Baseline

- Public `csl-standards` repository and Observable site.
- Deterministic MW/PWG/PWK hard-case sampler, canonical 250-case pilot, and 15-case review slice.
- Dictionary-neutral model with optional-dictionary registry support.
- Generated archival TEI, TEI Lex-0, OntoLex/FrAC JSON-LD, and RDF/Turtle profiles.
- Optional dictionaries AP90, GRA, FRI, and BEN woven through the implemented profiles.
- Loss corpus and analysis: 1430 reports at the canonical 250-case scale.
- Implemented `csl:` extension layer: evidence classes, cited ranges, root relation,
  decomposition, continuation recovery status, lineage relation, and kośa sense-boundary
  customisation.
- Coverage metrics at 250 cases: `extensionCoverage` 722/722 and `lineageCoverage` 369/369.
- External validation: RELAX NG/jing, Schematron/Saxon SVRL, and SHACL/pySHACL documented;
  portable Windows toolchain pinned and SHA-256 verified.
- Audit hardening: CI workflow, guarded Dependabot auto-merge, non-zero pipeline failures,
  and current project state/changelog discipline.
- Release: `v1.0.0` annotated tag pushed.

## Track 1 - Scaling Stability Check

Status: complete as of 2026-06-20.

The new `npm run scale-check` harness runs 500- and 1000-case pilots, captures compact
summaries, and restores canonical `data/pilot/*` and `src/data/pilot/*` before exiting.

Results are recorded in [`SCALE_STABILITY.md`](SCALE_STABILITY.md) and
[`../data/scale/scale-stability-report.json`](../data/scale/scale-stability-report.json).

Observed results:

- 500 cases: 2807 reports; TEI lossy 6, OntoLex lossy 200, neutral lossy 474.
- 1000 cases: 5559 reports; TEI lossy 6, OntoLex lossy 400, neutral lossy 941.
- TEI has 0 lossy western-dictionary reports at both scales.
- OntoLex has 0 clean reports at both scales.
- Lossy burden remains neutral > OntoLex > TEI.
- Evidence-loss share remains stable, about 70%.
- `extensionCoverage` and `lineageCoverage` are complete at both scales.

Decision: the central asymmetry and evidence-dominance claims hold at 500/1000. Keep the
250-case corpus canonical for committed generated pilot artifacts; use the compact scale
report for paper/release claims.

## Track 2 - Salt API Phase 0

Status: complete as of 2026-06-20.

Salt API is the next engineering track after scaling, but server implementation belongs in
`csl-apidev`. This repository owns the contract package:

- [`SALT_API_PROFILE.md`](SALT_API_PROFILE.md) — normative REST/GraphQL profile.
- [`SALT_API_PROFILE.ru.md`](SALT_API_PROFILE.ru.md) — Russian mirror.
- [`../data/schema/salt-api.openapi.yaml`](../data/schema/salt-api.openapi.yaml) — OpenAPI.
- [`../data/schema/salt-api.graphql`](../data/schema/salt-api.graphql) — GraphQL SDL.
- [`SALT_API_LOSS_REPORT.md`](SALT_API_LOSS_REPORT.md) — CSL ↔ C-SALT divergence ledger.
- [`SALT_API_PHASE0_CHECKLIST.md`](SALT_API_PHASE0_CHECKLIST.md) — implementation handoff checklist.

Next implementation step outside this repo: MW REST pilot in `csl-apidev`.

## Track 3 - `csl:` Vocabulary Package

Status: complete as of 2026-06-20.

The small vocabulary/index page is now available as:

- [`CSL_VOCABULARY.md`](CSL_VOCABULARY.md) for repository readers.
- `/tools/csl-vocabulary` on the Observable site.

It indexes the project-local `csl:` terms and maps each major loss phenomenon to its
construct and validation rule.

## Track 4 - v1.0.0 Stable Snapshot

Status: complete as of 2026-06-20.

`v1.0.0` is a citeable stable repository snapshot after scale/Salt/vocabulary work. Release
policy remains annotated git tags only: no GitHub Release, no Zenodo DOI in this pass.

Release policy:

- Annotated git tag only.
- No GitHub Release.
- No Zenodo DOI in this pass.

## Track 5 - Paper Submission

Status: deferred until after `v1.0.0`.

Audience: broader computational lexicography.

Next paper work:

1. Tune the framing away from narrow TEI/OntoLex venue assumptions and toward reusable
   computational lexicography method.
2. Use the 500/1000 stability report as a robustness check, while keeping the canonical
   committed corpus at 250 cases.
3. Keep optional dictionaries stopped for now; do not add BHS unless a later paper revision
   specifically needs a Buddhist Hybrid stress test.
4. Tighten abstract, conclusion, figures, citation style, and data-availability language.

Exit condition:

> A paper draft that can be sent to an external reader or venue without relying on repository
> history as explanation.
