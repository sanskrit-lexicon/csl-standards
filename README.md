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

## Starting Point

The initial migration source was the TEI/OntoLex pilot from:

```text
C:\Users\user\Documents\GitHub\csl-atlas
```

The migration plan is in [docs/MIGRATION_PLAN.md](docs/MIGRATION_PLAN.md).
Boundary rules are in [docs/BOUNDARY_RULES.md](docs/BOUNDARY_RULES.md).

The atlas-side removal and pointer update merged in
[`csl-atlas` PR #32](https://github.com/sanskrit-lexicon/csl-atlas/pull/32).
