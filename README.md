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

- [docs/DEMO.md](docs/DEMO.md) — guided end-to-end walkthroughs of three contrasting hard cases (the verbal root √ac with 6 source dictionaries; the compound *annavid*; the suppressed-headword continuation *āyana*): raw CDSL records → neutral model → TEI + OntoLex profiles → the loss reports they generate → the `csl:` constructs that answer them. The fastest way to see the whole instrument on real data.
- [docs/PAPER.md](docs/PAPER.md) — the full prose draft: *Sanskrit Lexicography Between TEI and OntoLex*. The TEI-vs-OntoLex asymmetry, the evidence/derivation/compression findings, and the implemented + validated `csl:` extension layer (every proposal construct, `extensionCoverage` 722/722, `lineageCoverage` 369/369). [docs/PAPER_OUTLINE.md](docs/PAPER_OUTLINE.md) is the planning outline.
- [docs/BOUNDARY_RULES.md](docs/BOUNDARY_RULES.md) — what belongs here vs. delegates.
- [docs/INTEROPERABILITY_MODEL.md](docs/INTEROPERABILITY_MODEL.md) — neutral JSON layer between CDSL source, TEI, and OntoLex.
- [docs/EVIDENCE_LABEL_CROSSWALK.md](docs/EVIDENCE_LABEL_CROSSWALK.md) — maps the `csl-atlas` evidence labels and review statuses to W3C PROV-O and TEI `@cert`/`@resp` (FAIR interoperability).
- [docs/TEI_LEX0_PILOT.md](docs/TEI_LEX0_PILOT.md) — TEI Lex-0 baseline encoding for CDSL entries, covering a Western (MW) and an indigenous *kośa* (SKD) entry, with the sense/citation-fusion loss.
- [docs/SALT_API_PROFILE.md](docs/SALT_API_PROFILE.md) — normative C-SALT-compatible REST + GraphQL profile.
- [docs/SALT_API_PHASE0_CHECKLIST.md](docs/SALT_API_PHASE0_CHECKLIST.md) — implementation-ready Salt API Phase 0 handoff for `csl-apidev`.
- [docs/CSL_VOCABULARY.md](docs/CSL_VOCABULARY.md) — compact `csl:` vocabulary index and loss phenomenon → construct → validation-rule crosswalk.
- [docs/SCALE_STABILITY.md](docs/SCALE_STABILITY.md) — 500/1000 scale stability check; the central asymmetry and evidence-dominance claims hold while the canonical committed corpus remains 250 cases.
- [docs/VALIDATED_INTEROPERABILITY_PROFILE.md](docs/VALIDATED_INTEROPERABILITY_PROFILE.md) — 250-case TEI + OntoLex/FrAC validation.
- [docs/LOSS_ANALYSIS.md](docs/LOSS_ANALYSIS.md) — quantitative analysis of the 1430 loss reports: the TEI-vs-OntoLex target asymmetry, the PWG→PWK→MW source-collapse family (369 lineage losses), the evidence-class sub-typing family (470: kośa/coordinate/editorial citations the flat model can't type, including optional-dictionary evidence), the indigenous *kośa* sense/citation fusion (6), and by-cause breakdown; regenerate with `npm run analyze-loss`.
- [docs/EXTENSION_PROPOSAL.md](docs/EXTENSION_PROPOSAL.md) — the Sanskrit lexicographic extension layer for TEI + OntoLex (evidence class, root/compound/continuation relations, source-collapse lineage, kośa sense-boundary). Every construct (§1–§5, §4a) is now implemented in the `csl:` namespace and validated in-pipeline (pySHACL + jing), each tied to the loss it answers.
