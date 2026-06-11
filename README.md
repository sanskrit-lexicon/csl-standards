# csl-standards

Technical standards and export workbench for CDSL dictionary data.

This repository is the home for TEI, OntoLex/Lexicog, RDF, SHACL, and related
interoperability experiments that are too technical for `csl-atlas` and not
GitHub/org observability work for `csl-observatory`.

Status: public repository created on 2026-06-04 from the CSL Atlas boundary
cleanup.

- Public repo: <https://github.com/sanskrit-lexicon/csl-standards>
- Dictionary atlas: <https://github.com/sanskrit-lexicon/csl-atlas>
- GitHub/org observatory: <https://github.com/sanskrit-lexicon/csl-observatory>
- DCS/corpus home: <https://github.com/gasyoun/VisualDCS>

## Mission

- Validate CDSL dictionary markup against explicit TEI-style profiles.
- Prepare publication paths that other lexicographic projects can reuse.
- Use OntoLex as a controlled stress test for Sanskrit dictionary modeling now.
- Leave real RDF publication for a later phase, after the modeling risks are
  documented.
- Freeze FrAC work until VisualDCS or another corpus-evidence source is ready.

## Salt API profile

The normative spec for a [C-SALT](https://api.c-salt.uni-koeln.de)-compatible REST + GraphQL
API, so the original [`sanskrit-lexicon`](https://github.com/sanskrit-lexicon/csl-apidev)
can serve the same contract as C-SALT over CDSL data. Verified field-for-field against the
live MW API on 2026-06-11.

- [`docs/SALT_API_PROFILE.md`](docs/SALT_API_PROFILE.md) — normative profile (EN; [Russian mirror](docs/SALT_API_PROFILE.ru.md))
- [`data/schema/salt-api.openapi.yaml`](data/schema/salt-api.openapi.yaml) + [`salt-api.graphql`](data/schema/salt-api.graphql) — machine schemas
- [`docs/SALT_API_LOSS_REPORT.md`](docs/SALT_API_LOSS_REPORT.md) — CSL ↔ C-SALT divergences (findings, not bugs)
- [`docs/SALT_API_INTEGRATION_ROADMAP.md`](docs/SALT_API_INTEGRATION_ROADMAP.md) — phased server-integration plan
- [`data/pilot/parity_mw.py`](data/pilot/parity_mw.py) — MW parity check (roadmap §9)

Server-side implementation lives in [`csl-apidev`](https://github.com/sanskrit-lexicon/csl-apidev)
([Phase 1 skeleton, #46](https://github.com/sanskrit-lexicon/csl-apidev/pull/46)).

## Starting Point

The initial migration source was the TEI/OntoLex pilot from:

```text
C:\Users\user\Documents\GitHub\csl-atlas
```

The migration plan is in [docs/MIGRATION_PLAN.md](docs/MIGRATION_PLAN.md).
Boundary rules are in [docs/BOUNDARY_RULES.md](docs/BOUNDARY_RULES.md).

The atlas-side removal and pointer update merged in
[`csl-atlas` PR #32](https://github.com/sanskrit-lexicon/csl-atlas/pull/32).
