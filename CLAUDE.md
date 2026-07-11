# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Repository Is

`csl-standards` is the technical standards and export workbench for CDSL
(Cologne Digital Sanskrit Dictionaries) data — TEI, OntoLex/Lexicog, RDF,
SHACL, and related interoperability work that's too technical for the public
`csl-atlas` reader site and out of scope for the `csl-observatory` org-metrics
site. Created 2026-06-04 from the `csl-atlas` boundary cleanup (TEI/OntoLex
pilot migrated out per `csl-atlas`' own `docs/BOUNDARY_RULES.md`). It validates
CDSL markup against TEI-style profiles, uses OntoLex as a controlled modeling
stress-test, and documents where each standard loses information relative to
the source dictionary records — real RDF publication is deliberately deferred
to a later phase.

## Common commands

```sh
npm run dev                        # observable preview
npm run build                      # observable build
npm test                           # node --test
npm run build-pilot                # full pipeline: sample → select → neutral-model → parse-skd-kosa → loss-reports → TEI/TEI-Lex0/OntoLex/MDF/LIFT export → validate-* → analyze-loss → build-figures
npm run validate-pilot             # validate pilot artifacts (CI gate)
npm run validate-tei-profile       # validate TEI archival profile (CI gate)
npm run validate-tei-lex0          # validate TEI Lex-0 baseline (CI gate)
npm run validate-ontolex-profile   # validate OntoLex/SHACL profile (CI gate)
npm run export-mdf                 # export the flat SIL MDF field-schema profile (third view)
npm run validate-mdf-profile       # validate MDF marker profile (CI gate)
npm run export-lift                # export the SIL LIFT XML profile (fourth view)
npm run validate-lift-profile      # validate LIFT entry profile (CI gate)
npm run analyze-loss               # regenerate docs/LOSS_ANALYSIS.md from the loss reports
npm run scale-check                # 500/1000-case scale-stability check (docs/SCALE_STABILITY.md)
npm run validate-external-profiles[:strict]   # validate against external TEI/OntoLex tooling
```

Individual pipeline stages (`sample-hard-cases`, `select-review-cases`,
`build-neutral-model`, `build-loss-reports`, `export-tei`,
`export-tei-lex0`, `export-ontolex`, `export-mdf`, `export-lift`,
`parse-skd-kosa`, `build-figures`, `refine-curated-stubs`) can be run standalone
via `npm run <script>` — see `package.json` for the exact chain order
`build-pilot` runs them in.

## Key directories / files

| Path | Purpose |
|---|---|
| `src/` | Observable Framework site source |
| `scripts/` | One script per pipeline stage (sampling → neutral model → export → validation → analysis) |
| `data/` | Pipeline data (inputs + generated artifacts) |
| `docs/` | The actual technical content — see below, this is where most of the intellectual work lives |
| `dist/` | Build output — generated |
| `test/` | Unit tests (`node --test`) |
| `tools/` | Supporting tooling, e.g. external validator setup |

Key docs (read these before making a claim about the model, not just the code):

- `docs/DEMO.md` — guided walkthroughs on 3 hard cases (√ac, *annavid*, *āyana*) from raw CDSL record through neutral model to TEI/OntoLex export
- `docs/PAPER.md` / `docs/PAPER_OUTLINE.md` — the prose draft: *Sanskrit Lexicography Between TEI and OntoLex*
- `docs/BOUNDARY_RULES.md` — what belongs here vs. delegates to `csl-atlas`/`csl-observatory`
- `docs/INTEROPERABILITY_MODEL.md` — the neutral JSON layer between CDSL source, TEI, and OntoLex
- `docs/EVIDENCE_LABEL_CROSSWALK.md` — maps `csl-atlas` evidence labels/review statuses to W3C PROV-O and TEI `@cert`/`@resp`
- `docs/TEI_LEX0_PILOT.md` — TEI Lex-0 baseline encoding (MW + SKD entries)
- `docs/SALT_API_PROFILE.md`, `docs/SALT_API_PHASE0_CHECKLIST.md` — C-SALT-compatible REST+GraphQL API profile, handoff spec for `csl-apidev`
- `docs/CSL_VOCABULARY.md` — the `csl:` extension vocabulary index
- `docs/LOSS_ANALYSIS.md` — quantitative breakdown of the loss reports (regenerate via `analyze-loss`, don't hand-edit)
- `docs/SCALE_STABILITY.md`, `docs/VALIDATED_INTEROPERABILITY_PROFILE.md` — scale-stability and 250-case validation results

## CI workflows

| Workflow | Trigger | Purpose |
|---|---|---|
| `ci.yml` | PR, push to `main` | `npm ci` → `npm test` → validate pilot/TEI-profile/OntoLex-profile/TEI-Lex0 → `npm run build` |
| `dependabot-auto-merge.yml`, `dependabot-automerge-sync.yml` | Dependabot PRs | Auto-merge dependency bumps |

## Conventions

- **Scope is gated by `docs/BOUNDARY_RULES.md`**: a page/script/dataset/schema
  belongs here only if its primary object is a TEI/OntoLex/RDF/SHACL profile,
  export, or validation rule, or a standards-facing neutral model. Reader-facing
  dictionary evidence work belongs in `csl-atlas`; org/GitHub metrics belong in
  `csl-observatory`. Don't re-add TEI/OntoLex work back into `csl-atlas` — the
  boundary cleanup that created this repo explicitly moved it out.
- **The `csl:` extension namespace is implemented, not aspirational** — every
  construct proposed in `docs/EXTENSION_PROPOSAL.md` (§1–§5, §4a) is
  implemented and validated in-pipeline (pySHACL + jing), each construct tied
  to a specific documented loss it answers (`extensionCoverage` 722/722,
  `lineageCoverage` 369/369 at last measurement). Don't propose a new
  construct without first checking whether an existing loss-report category
  already covers it.
- **Real RDF publication is deliberately deferred** — don't treat any current
  export as production-ready for external RDF consumption; the mission is
  documenting where standards lose information relative to CDSL source, not
  shipping a live triple store.
- **FrAC work is frozen** until VisualDCS or another corpus-evidence source
  is ready to back it — don't resume FrAC modeling without that dependency.
- Loss/coverage/scale numbers throughout `docs/` are measured, not estimated —
  regenerate the relevant `npm run` script rather than hand-editing a number
  in a doc after a pipeline or data change.

## What not to touch

- `dist/`, `node_modules/` — generated/local, gitignored.
- `docs/LOSS_ANALYSIS.md` — generated by `npm run analyze-loss`; hand-editing
  will be silently overwritten and desyncs the reported numbers from the data.
