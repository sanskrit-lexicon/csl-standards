# TEI/OntoLex Migration Plan

Date: 2026-06-03

Decision: move standards/export work from `csl-atlas` to `csl-standards`.

Status: completed and published on 2026-06-04.

- Public repo: `https://github.com/sanskrit-lexicon/csl-standards`
- Atlas cleanup PR: `https://github.com/sanskrit-lexicon/csl-atlas/pull/32`

## Goals

- TEI: validate CDSL markup and support publication for other lexicographic
  projects.
- OntoLex: stress-test dictionary modeling now; real RDF publication later.
- FrAC: freeze until VisualDCS or another corpus-evidence source can provide
  actual corpus/frequency/attestation data.

## Source And Destination

Source:

```text
C:\Users\user\Documents\GitHub\csl-atlas
```

Destination:

```text
C:\Users\user\Documents\GitHub\csl-standards
```

## Completed Move Manifest

The following list is the completed initial migration set. Keep it as a
reproducibility manifest when auditing why a standards file is no longer in
`csl-atlas`.

Scripts:

- `scripts/sample-hard-cases.mjs`
- `scripts/select-review-cases.mjs`
- `scripts/build-neutral-model.mjs`
- `scripts/build-loss-reports.mjs`
- `scripts/export-tei.mjs`
- `scripts/export-ontolex.mjs`
- `scripts/validate-pilot.mjs`
- `scripts/validate-tei-profile.mjs`
- `scripts/validate-ontolex-profile.mjs`
- `scripts/validate-external-profiles.mjs`

Schemas and generated outputs:

- `data/schema/hard-case.schema.json`
- `data/schema/neutral-model.schema.json`
- `data/schema/loss-report.schema.json`
- `data/schema/tei-archival-profile.odd.xml`
- `data/schema/ontolex-frac-profile.shacl.ttl`
- `data/pilot/`
- `src/data/pilot/` if the standards repo keeps an Observable-facing site

Documentation and UI:

- `docs/PROJECT_SPEC.md`
- `docs/VALIDATED_INTEROPERABILITY_PROFILE.md`
- `docs/SAMPLING_STRATEGY.md`
- `docs/LOSS_REPORT_SCHEMA.md`
- `docs/INTEROPERABILITY_MODEL.md`
- standards sections of `docs/USE_CASES.md`
- standards sections of `docs/ROADMAP_3_MONTHS.md`
- `docs/PAPER_OUTLINE.md` if the paper remains a standards/interoperability
  paper rather than a dictionary-atlas paper
- `src/tools/interoperability-hard-cases.md`
- related locale keys for the interoperability page

Package commands:

- `sample-hard-cases`
- `select-review-cases`
- `build-neutral-model`
- `build-loss-reports`
- `export-tei`
- `export-ontolex`
- `build-pilot`
- `validate-pilot`
- `validate-tei-profile`
- `validate-tei-odd`
- `validate-ontolex-profile`
- `validate-ontolex-shacl`
- `validate-external-profiles`
- `validate-external-profiles:strict`

## Migration Order

Completed on 2026-06-04. The order below is retained as an audit trail.

1. Copy the manifest above into `csl-standards` and make it reproducible there.
2. Run the standards validation gates in `csl-standards`.
3. Remove atlas navigation, sidebar entries, locale keys, package commands, and
   generated pilot mirrors from `csl-atlas`.
4. Leave a short external pointer from `csl-atlas` to `csl-standards` only if it
   helps readers understand dictionary evidence.
5. Re-run the atlas release gates without standards commands.

## Atlas Release Rule During Transition

After the pipeline is moved, `csl-atlas` keeps only a short pointer to this
repository. New feature work must happen in `csl-standards`.
