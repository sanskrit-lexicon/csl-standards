# Roadmap

Status date: 2026-06-20 (content refreshed 2026-07-27 — Salt Phase 1 GitHub-side merge and
Track 5 paper-progress synced against `.ai_state.md`/`CHANGELOG.md`/A27 review; H1498).

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

Current next step: Cologne host deploy + Apache rewrites for the already-merged Salt API MW
REST pilot (ops gate on the Cologne maintainer, not further `csl-apidev` code — see Track 2).
Paper submission is now gated on MG's byline/title/venue `@DECIDE` rather than on drafting
(see Track 5) — most of the drafting work is done.

## Completed Baseline

- Public `csl-standards` repository and Observable site.
- Deterministic MW/PWG/PWK hard-case sampler, canonical 250-case pilot, and 15-case review slice.
- Dictionary-neutral model with optional-dictionary registry support.
- Generated archival TEI, TEI Lex-0, OntoLex/FrAC JSON-LD, RDF/Turtle, and MDF profiles.
- Optional dictionaries AP90, GRA, FRI, and BEN woven through the implemented profiles.
- Loss corpus and analysis: 1722 reports at the canonical 250-case scale (incl. the MDF lane added 03-07-2026).
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

Status: complete as of 2026-06-20. Phase 1 (MW REST pilot) GitHub-side implementation is also
merged — `csl-apidev` PR #59 into `salt-api-phase1`, then PR #46 to `master` (2026-06-20). Only
the Cologne host deploy + Apache rewrites remain: the public `entries` route returns HTTP 404
and `ids`/`graphql` time out or fail TLS from this host, so live parity stays blocked on that
ops gate, not on further code (`.ai_state.md`; `CHANGELOG.md` v1.1.0 "Salt Phase 1 deployment
checkpoint").

Salt API is the next engineering track after scaling, but server implementation belongs in
`csl-apidev`. This repository owns the contract package:

- [`SALT_API_PROFILE.md`](SALT_API_PROFILE.md) — normative REST/GraphQL profile.
- [`SALT_API_PROFILE.ru.md`](SALT_API_PROFILE.ru.md) — Russian mirror.
- [`../data/schema/salt-api.openapi.yaml`](../data/schema/salt-api.openapi.yaml) — OpenAPI.
- [`../data/schema/salt-api.graphql`](../data/schema/salt-api.graphql) — GraphQL SDL.
- [`SALT_API_LOSS_REPORT.md`](SALT_API_LOSS_REPORT.md) — CSL ↔ C-SALT divergence ledger.
- [`SALT_API_PHASE0_CHECKLIST.md`](SALT_API_PHASE0_CHECKLIST.md) — implementation handoff checklist.

Next implementation step outside this repo: Cologne host deploy + Apache rewrites for the
already-merged MW REST pilot (ops gate), then the Phase 2 GraphQL pilot.

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

Status: in progress, not deferred — `v1.0.0` has shipped (Track 4) and the paper draft has
been through a hostile-review re-frame pass ([docs/A27_review_fable5.md](https://github.com/sanskrit-lexicon/csl-standards/blob/main/docs/A27_review_fable5.md),
H144/A27, [PR #100](https://github.com/sanskrit-lexicon/csl-standards/pull/100) +
[PR #101](https://github.com/sanskrit-lexicon/csl-standards/pull/101) merged). 3 of the 4
next-paper-work items below are already executed; only submission itself remains gated.

Audience: broader computational lexicography.

Next paper work (updated against the A27 pass):

1. **Done** — tuned the framing away from narrow TEI/OntoLex venue assumptions: retitled to
   "A Serialization Standard for the Petersburg-Family Sanskrit Dictionaries: Evidence,
   Derivation, and Compression across TEI, OntoLex, and MDF"; abstract/§1/§2 re-led around the
   three-profile contribution (A27 finding M2).
2. **Done** — the 500/1000 stability report is cited in §12 Limitations as the robustness
   check, while the committed corpus stays the 250-case pilot.
3. **Still standing** — optional dictionaries remain stopped; no BHS added (nothing to execute
   here unless a future revision needs a Buddhist Hybrid stress test).
4. **Done** — abstract, figures (Figure 1 regenerated with the MDF box), and citation style
   tightened (six fixes, A27 minor findings m1-m6); §13 Conclusion and §14 Availability read as
   tightened prose after the PR #101 re-sync.

Remaining gates before submission ([A27 review §5](https://github.com/sanskrit-lexicon/csl-standards/blob/main/docs/A27_review_fable5.md#5-remaining-gates)): byline (the paper
currently has none), title veto, and venue re-aim now that the re-frame opens
LREC/LDL/*Semantic Web*-type venues beyond jTEI — all `@DECIDE` (MG).

Exit condition:

> A paper draft that can be sent to an external reader or venue without relying on repository
> history as explanation.
