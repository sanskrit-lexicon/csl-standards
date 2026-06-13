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

## Key documents

- [docs/BOUNDARY_RULES.md](docs/BOUNDARY_RULES.md) — what belongs here vs. delegates.
- [docs/INTEROPERABILITY_MODEL.md](docs/INTEROPERABILITY_MODEL.md) — neutral JSON layer between CDSL source, TEI, and OntoLex.
- [docs/EVIDENCE_LABEL_CROSSWALK.md](docs/EVIDENCE_LABEL_CROSSWALK.md) — maps the `csl-atlas` evidence labels and review statuses to W3C PROV-O and TEI `@cert`/`@resp` (FAIR interoperability).
- [docs/TEI_LEX0_PILOT.md](docs/TEI_LEX0_PILOT.md) — TEI Lex-0 baseline encoding for CDSL entries, covering a Western (MW) and an indigenous *kośa* (SKD) entry, with the sense/citation-fusion loss.
- [docs/SALT_API_PROFILE.md](docs/SALT_API_PROFILE.md) — normative C-SALT-compatible REST + GraphQL profile.
- [docs/VALIDATED_INTEROPERABILITY_PROFILE.md](docs/VALIDATED_INTEROPERABILITY_PROFILE.md) — 50-case TEI + OntoLex/FrAC validation.
- [docs/LOSS_ANALYSIS.md](docs/LOSS_ANALYSIS.md) — Month-3 quantitative analysis of the 197 loss reports: the TEI-vs-OntoLex target asymmetry, the PWG→PWK→MW source-collapse family (73 lineage losses), and by-cause breakdown; regenerate with `npm run analyze-loss`.
