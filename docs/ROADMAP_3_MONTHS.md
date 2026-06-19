# Roadmap

Status date: 2026-06-19.

This document replaces the original three-month scaffold roadmap. The original
Month 1-3 arc has been completed and exceeded: the repository is public, the
workbench is reproducible, the pilot has scaled to 250 cases, four profiles are
generated and validated, the paper draft exists, and `v0.9.0` has been cut.

The project is now in a post-v0.9 phase: the core research instrument works. The
roadmap below is about choosing the next publication and infrastructure targets.

## Completed Baseline

- Public `csl-standards` repository and Observable site.
- Deterministic MW/PWG/PWK hard-case sampler, currently 250 cases plus a 15-case
  review slice.
- Dictionary-neutral model with optional-dictionary registry support.
- Generated archival TEI, TEI Lex-0, OntoLex/FrAC JSON-LD, and RDF/Turtle profiles.
- Optional dictionaries woven across the profiles: AP90, GRA, FRI, and BEN.
- Sense extraction and sense-linked citations for all optional dictionaries that
  carry usable sense/citation apparatus; FRI contributes trilingual senses without
  named citations.
- Loss corpus and analysis: 1430 reports; central asymmetry remains TEI
  never lossy for Western cases, OntoLex never clean, neutral lineage most lossy.
- Implemented `csl:` extension layer: evidence classes, cited ranges, root
  relation, decomposition, continuation recovery status, lineage relation, and
  kośa sense-boundary customisation.
- Coverage metrics: `extensionCoverage` 722/722 and `lineageCoverage` 369/369.
- External validation: RELAX NG/jing, Schematron/Saxon SVRL, and SHACL/pySHACL
  documented; portable Windows toolchain pinned and SHA-256 verified.
- Audit hardening: CI workflow, guarded Dependabot auto-merge, non-zero pipeline
  failures, and current project state/changelog discipline.
- Release: `v0.9.0` tagged and pushed.

## Non-Negotiables

- Keep every generated dataset reproducible.
- Do not hide model failures; lossy mappings stay visible even when a `csl:`
  remedy is implemented.
- Keep TEI archival and OntoLex semantic roles separate.
- Keep optional dictionaries additive; the MW/PWG/PWK backbone remains the stable
  comparison spine.
- Keep English/Russian labels decoupled from data.
- Keep public pages static unless interactivity clearly earns its weight.
- Keep CI and branch-protection assumptions aligned with Dependabot automation.

## Track A - Paper Toward Submission

Goal: turn the workbench and paper draft into a submission-ready article.

Next work:

1. Decide target venue/audience and tune the paper accordingly.
2. Tighten the abstract and conclusion around one claim: evidence, not derivation,
   is the main interoperability stressor.
3. Reduce implementation detail where it distracts from the argument; move
   engineering details to appendices/docs.
4. Make the optional-dictionary layer a controlled generalisation section, not a
   second paper inside the paper.
5. Review figures against the submission target's format and expected visual density.
6. Add any required citation style, metadata, acknowledgements, and data-availability
   language.
7. Run a final "numbers audit" against `npm run analyze-loss`, `npm test`, and
   `npm run build`.

Exit condition:

> A paper draft that can be sent to an external reader or venue without needing
> the repository history as explanation.

## Track B - Public Research Release / v1.0

Goal: package the work as a stable research artefact beyond the engineering tag.

Next work:

1. Decide whether `v1.0.0` is a paper-submission snapshot, a public data snapshot,
   or both.
2. Decide whether to add a GitHub Release, Zenodo DOI, or continue with annotated
   git tags only.
3. Prepare a compact release narrative: what the instrument proves, what the
   generated corpus contains, and how to reproduce it.
4. Confirm license/citation metadata is enough for reuse.
5. Freeze generated artefacts for the release, including the external validation
   report appropriate to the release environment.

Exit condition:

> A citeable stable snapshot with a clear reproduction path.

## Track C - Corpus Scale And Dictionary Breadth

Goal: decide whether more data changes the argument or merely adds volume.

Current state:

- `node scripts/sample-hard-cases.mjs --max N` is the scaling lever.
- Optional dictionaries are registry-driven and additive.
- Of local candidates, BHS is the only obvious remaining citation-bearing
  optional dictionary, but it attaches narrowly (22/250 in the current notes).
- Citation-free dictionaries can broaden source coverage but will not materially
  expand the loss corpus.

Next work:

1. Run one scaled pilot, likely 500 or 1000, only if it answers a paper question.
2. Compare whether percentages and rankings stay stable, especially
   evidence-related phenomena and source-collapse.
3. Add BHS only if the paper needs a narrow Buddhist Hybrid test case.
4. Avoid adding citation-free dictionaries unless the release goal is coverage
   breadth rather than argument strength.

Exit condition:

> A decision recorded as either "250 is enough for the paper" or "scaled corpus
> materially changes the claim."

## Track D - Standards Package

Goal: make the implemented extension layer easier for outsiders to inspect and reuse.

Next work:

1. Publish a compact `csl:` vocabulary/index page from the existing SHACL/ODD terms.
2. Add a crosswalk table from each loss phenomenon to implemented TEI/OntoLex
   construct and validation rule.
3. Clarify which constructs are proposed for standardisation versus project-local
   modelling conventions.
4. Decide whether the namespace should remain project-local or become a versioned
   `csl-lex` vocabulary.

Exit condition:

> A reader can understand the extension layer without reading generator code.

## Track E - Salt API Integration

Goal: decide whether to resume the C-SALT-compatible API track now or after the paper.

Current state:

- `docs/SALT_API_INTEGRATION_ROADMAP.md`, `docs/SALT_API_PROFILE.md`, and
  `docs/SALT_API_LOSS_REPORT.md` exist as a verified contract/handoff package.
- This track depends on implementation work in `csl-apidev`, not only this repo.

Next work:

1. If prioritised, turn the roadmap into a Phase 0 checklist and verify which
   profile artefacts are still missing or stale.
2. Confirm the implementation owner and target host path.
3. Decide whether MW REST pilot remains the first implementation step.
4. Decide whether this belongs before paper submission or after.

Exit condition:

> A go/no-go decision for Salt API Phase 0/1 with an implementation owner.

## Questions For The Project Lead

1. What is the next primary deliverable: paper submission, `v1.0.0` citeable
   release, Salt API Phase 0, or a scaled corpus run?
2. What is the intended paper venue/audience: TEI, OntoLex/LD, digital humanities,
   Sanskrit lexicography, or a broader computational lexicography venue?
3. Should `v1.0.0` include a GitHub Release and/or Zenodo DOI, or should this repo
   continue using annotated git tags only?
4. Is the current 250-case corpus enough for the paper, or should we run a 500/1000
   case stability check before submission?
5. Should BHS be added as the next optional dictionary despite its narrow coverage,
   or should optional-dictionary work stop unless it changes the paper argument?
6. Do you want the `csl:` extension layer packaged as a small vocabulary page
   before submission?
7. Should the Salt API roadmap be paused until after the paper, or should it become
   the next engineering track?
