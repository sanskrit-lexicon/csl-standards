# csl-standards

_Created: 04-06-2026 · Last updated: 11-07-2026_

Technical standards and export workbench for CDSL dictionary data.

This repository is the home for TEI, OntoLex/Lexicog, RDF, SHACL, and related
interoperability experiments that are too technical for
[`csl-atlas`](https://github.com/sanskrit-lexicon/csl-atlas) and not
GitHub/org observability work for
[`csl-observatory`](https://github.com/sanskrit-lexicon/csl-observatory).

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
  documented (the runbook for that later phase is written down in
  [`docs/PUBLISHING_LOD.md`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/docs/PUBLISHING_LOD.md)).
- Freeze FrAC work until VisualDCS or another corpus-evidence source is ready.

## Starting Point

The initial migration source was the TEI/OntoLex pilot from:

```text
C:\Users\user\Documents\GitHub\csl-atlas
```

The migration plan is in
[`docs/MIGRATION_PLAN.md`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/docs/MIGRATION_PLAN.md).
Boundary rules are in
[`docs/BOUNDARY_RULES.md`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/docs/BOUNDARY_RULES.md).

The atlas-side removal and pointer update merged in
[`csl-atlas` PR #32](https://github.com/sanskrit-lexicon/csl-atlas/pull/32).

## Worked example

From
[`docs/DEMO.md`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/docs/DEMO.md)'s
√ac hard case (six source dictionaries: MW, PWG, PWK + optional AP90/GRA/FRI),
the actual TEI export at
[`data/pilot/tei/mw-pwg-pwk-ac.xml`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/data/pilot/tei/mw-pwg-pwk-ac.xml)
encodes the verbal-root relation and a named-source citation with the
`csl:`-motivated constructs (`whitney-root` pointer, `named-source-citation`
subtype) layered onto standard TEI elements:

```xml
<etym xml:id="mw-pwg-pwk-ac-root-relation" type="root">
  <lbl>verbal root</lbl>
  <ref type="whitney-root" target="urn:csl:whitney-root:ac,1">ac,1</ref>
</etym>
…
<bibl xml:id="mw-pwg-pwk-ac-cite-pwg-1" type="named-source-citation"
      subtype="textual" corresp="#mw-pwg-pwk-ac-record-pwg">
  <abbr>NAIGH. 2,14.</abbr>
  <citedRange>2,14</citedRange>
</bibl>
```

`<etym>`/`<ref target="urn:csl:whitney-root:...">` is standard TEI carrying a
CDSL-specific URN scheme; `<bibl type="named-source-citation" subtype="textual">`
is how the `csl:evidenceClass`/`csl:citedWork`/`csl:citedRange` OntoLex
properties (see
[`docs/CSL_VOCABULARY.md`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/docs/CSL_VOCABULARY.md))
surface on the TEI side of the same record. Reproduce it yourself:
`npm run build-pilot` regenerates this file from the pipeline;
`npm run validate-tei-profile` checks it against the archival TEI profile.

## Commands

The pipeline is an [Observable Framework](https://observablehq.com/framework)
project driven by npm scripts:

```sh
npm run dev                        # observable preview
npm run build                      # observable build
npm test                           # node --test
npm run build-pilot                # full pipeline: sample → select → neutral-model → parse-skd-kosa → loss-reports → TEI/TEI-Lex0/OntoLex/MDF export → validate-* → analyze-loss → build-figures
npm run validate-pilot             # validate pilot artifacts (CI gate)
npm run validate-tei-profile       # validate TEI archival profile (CI gate)
npm run validate-tei-lex0          # validate TEI Lex-0 baseline (CI gate)
npm run validate-ontolex-profile   # validate OntoLex/SHACL profile (CI gate)
npm run validate-mdf-profile       # validate MDF marker profile (CI gate)
npm run analyze-loss               # regenerate docs/LOSS_ANALYSIS.md from the loss reports
npm run scale-check                # 500/1000-case scale-stability check
```

Individual pipeline stages can be run standalone via `npm run <script>` — see
[`package.json`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/package.json)
for the exact chain order `build-pilot` runs them in.

## PWG→RU LOD standards surface

[`standards/pwg-ru-lod/`](https://github.com/sanskrit-lexicon/csl-standards/tree/main/standards/pwg-ru-lod)
holds the `csl-standards`-owned query + validation surface for the **PWG→RU**
(Petersburg Dictionary → Russian) Linked-Open-Data graph. Per the boundary
rules, the graph **generator + input data** stay in
[`SanskritLexicography/RussianTranslation`](https://github.com/gasyoun/SanskritLexicography/tree/master/RussianTranslation);
the **query/validation surface** lands here — the SHACL profile
([`shapes.ttl`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/standards/pwg-ru-lod/shapes.ttl)),
the VoID descriptor
([`void.ttl`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/standards/pwg-ru-lod/void.ttl)),
and the acceptance SPARQL query
([`sense_citation_dcsfreq.rq`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/standards/pwg-ru-lod/sense_citation_dcsfreq.rq)).
Actual publication of the graph as dereferenceable LOD is still deferred — the
step-by-step runbook for that later phase is
[`docs/PUBLISHING_LOD.md`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/docs/PUBLISHING_LOD.md).

## Key documents

- [`docs/DEMO.md`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/docs/DEMO.md) — guided end-to-end walkthroughs of three contrasting hard cases (the verbal root √ac with 6 source dictionaries; the compound *annavid*; the suppressed-headword continuation *āyana*): raw CDSL records → neutral model → TEI + OntoLex profiles → the loss reports they generate → the `csl:` constructs that answer them. The fastest way to see the whole instrument on real data.
- [`docs/PAPER.md`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/docs/PAPER.md) — the full prose draft: *Sanskrit Lexicography Between TEI and OntoLex*. The TEI-vs-OntoLex asymmetry, the evidence/derivation/compression findings, and the implemented + validated `csl:` extension layer (every proposal construct, `extensionCoverage` 722/722, `lineageCoverage` 369/369). [`docs/PAPER_OUTLINE.md`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/docs/PAPER_OUTLINE.md) is the planning outline.
- [`docs/BOUNDARY_RULES.md`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/docs/BOUNDARY_RULES.md) — what belongs here vs. delegates.
- [`docs/INTEROPERABILITY_MODEL.md`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/docs/INTEROPERABILITY_MODEL.md) — neutral JSON layer between CDSL source, TEI, and OntoLex.
- [`docs/EVIDENCE_LABEL_CROSSWALK.md`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/docs/EVIDENCE_LABEL_CROSSWALK.md) — maps the `csl-atlas` evidence labels and review statuses to W3C PROV-O and TEI `@cert`/`@resp` (FAIR interoperability).
- [`docs/TEI_LEX0_PILOT.md`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/docs/TEI_LEX0_PILOT.md) — TEI Lex-0 baseline encoding for CDSL entries, covering a Western (MW) and an indigenous *kośa* (SKD) entry, with the sense/citation-fusion loss.
- [`docs/MDF_EXPORT_MAPPING.md`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/docs/MDF_EXPORT_MAPPING.md) — the flat SIL MDF field-schema profile (the third interoperability view alongside TEI and OntoLex).
- [`docs/SALT_API_PROFILE.md`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/docs/SALT_API_PROFILE.md) — normative C-SALT-compatible REST + GraphQL profile.
- [`docs/SALT_API_PHASE0_CHECKLIST.md`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/docs/SALT_API_PHASE0_CHECKLIST.md) — implementation-ready Salt API Phase 0 handoff for `csl-apidev`.
- [`docs/CSL_VOCABULARY.md`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/docs/CSL_VOCABULARY.md) — compact `csl:` vocabulary index and loss phenomenon → construct → validation-rule crosswalk.
- [`docs/SCALE_STABILITY.md`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/docs/SCALE_STABILITY.md) — 500/1000 scale stability check; the central asymmetry and evidence-dominance claims hold while the canonical committed corpus remains 250 cases.
- [`docs/VALIDATED_INTEROPERABILITY_PROFILE.md`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/docs/VALIDATED_INTEROPERABILITY_PROFILE.md) — 250-case TEI + OntoLex/FrAC validation.
- [`docs/LOSS_ANALYSIS.md`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/docs/LOSS_ANALYSIS.md) — quantitative analysis of the 1430 loss reports: the TEI-vs-OntoLex target asymmetry, the PWG→PWK→MW source-collapse family (369 lineage losses), the evidence-class sub-typing family (470: kośa/coordinate/editorial citations the flat model can't type, including optional-dictionary evidence), the indigenous *kośa* sense/citation fusion (6), and by-cause breakdown; regenerate with `npm run analyze-loss`.
- [`docs/EXTENSION_PROPOSAL.md`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/docs/EXTENSION_PROPOSAL.md) — the Sanskrit lexicographic extension layer for TEI + OntoLex (evidence class, root/compound/continuation relations, source-collapse lineage, kośa sense-boundary). Every construct (§1–§5, §4a) is now implemented in the `csl:` namespace and validated in-pipeline (pySHACL + jing), each tied to the loss it answers.
- [`docs/PUBLISHING_LOD.md`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/docs/PUBLISHING_LOD.md) — the human-runnable runbook for taking the PWG→RU LOD graph from validated-locally to real, dereferenceable Linked Open Data (the deferred "later phase"), with each step tagged HUMAN / AGENT / HUMAN-DECIDE.

_Dr. Mārcis Gasūns_
