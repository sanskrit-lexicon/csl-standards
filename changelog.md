# Changelog

All notable changes to csl-standards are documented here. Releases are dated,
semver-style snapshots; upcoming work stays under [Unreleased] until it is cut
into a dated version. Versions track `package.json`.

## [Unreleased]

## [0.5.0] - 2026-06-16

**The extension proposal is complete.** v0.4.0 implemented the first batch of
`csl:` constructs; this release closes the remaining two, so **every construct in
EXTENSION_PROPOSAL (§1 evidence class, §2 root, §3 decomposition, §4 continuation
recovery-status, §4a source-collapse lineage, §5 kośa sense-boundary) is now
implemented and validated in-pipeline** — OntoLex against the SHACL profile
(pySHACL) and TEI against the compiled RELAX NG (jing). Added here: the
**continuation recovery-status** (`csl:recoveryStatus` / TEI `@subtype`, so a
parent reconstructed from page adjacency is never asserted as if printed) and the
**kośa sense-boundary customisation** (the indigenous *iti*-unit recorded as a
declared, enforced Lex-0 ODD customisation rather than a silent flattening). The
one open hardening is executing the Lex-0 ODD's Schematron with an external SVRL
engine (enforced in-pipeline today).

### Added
- **Kośa sense-boundary customisation implemented** (EXTENSION_PROPOSAL §5) — the
  **last unimplemented construct**; the whole proposal (§1–§5, §4a) is now
  implemented. The TEI Lex-0 export marks each indigenous *kośa* entry with
  `<note type="entry-convention">kosa-iti-unit</note>`, emits the closing authority
  as a typed **`<bibl type="kosa-authority">`** (the sense boundary, distinct from an
  example citation) and a `<note type="model-loss">` witnessing the sense/citation
  fusion on every iti-unit. The Lex-0 ODD's `csl-lex0-kosa-sense-boundary`
  Schematron asserts the pairing, and [validate-tei-lex0](https://github.com/sanskrit-lexicon/csl-standards/blob/main/scripts/validate-tei-lex0.mjs)
  now **enforces** it in `build-pilot` (previously only declared); all 6 kośa
  entries validate against the compiled TEI RELAX NG (jing). The
  `sense-citation-fusion` loss reports name the remedy in `mappedAs`.
- **Continuation-parent recovery status implemented** (EXTENSION_PROPOSAL §4) —
  the second-to-last unimplemented construct. `csl:ContinuationRelation` now carries
  an explicit **`csl:recoveryStatus`** ∈ {`recovered`, `conjectured`, `unresolved`}
  (OntoLex), and the TEI archival continuation `<xr>` the same as **`@subtype`**, so
  a parent reconstructed from MW adjacency is never asserted as if printed
  (`conjectured` in the current pilot — only the adjacency pointer is known). SHACL
  adds `csl:ContinuationRelationShape` (`sh:in` on the status); validated under
  pySHACL and against the compiled TEI RELAX NG (jing). The continuation loss report
  names the remedy in `mappedAs`. With this, EXTENSION_PROPOSAL §1/§2/§3/§4/§4a are
  all implemented; only §5 (kośa ODD customisation) remains.

## [0.4.0] - 2026-06-16

**The extension proposal, made real.** v0.3.0 measured the interoperability gaps
and validated the toolchain; this release turns the proposed `csl:` constructs
into implemented, schema-validated artefacts. The evidence-class extension is now
symmetric across both target standards (OntoLex `csl:evidenceClass` shipped in
0.3.0; **TEI `@subtype` + `<citedRange>`** added here, RELAX NG/jing-validated),
and the **source-collapse lineage relation** (`csl:LineageRelation`) makes the
PWG → PWK → MW evidence collapse — the largest loss family — explicit and
queryable, SHACL-validated. EXTENSION_PROPOSAL §1/§2/§3/§4a are now implemented
and validated; §4 (continuation recovery-status) and §5 (kośa ODD) remain
prototype/customisation. Coverage is measured: `extensionCoverage` 569/569
(model-vocabulary-gap) and `lineageCoverage` 369/369 (source-collapse).

### Added
- **Source-collapse lineage relation implemented** (EXTENSION_PROPOSAL §4a) —
  closes the largest loss family's construct. The OntoLex export emits a
  [`csl:LineageRelation`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/scripts/export-ontolex.mjs)
  per transition — PWG → PWK (`csl:transition "abridgement"`) and PWG → MW
  (`"recomposition"`) — carrying `csl:sourceCitationCount` /
  `csl:retainedCitationCount` / `csl:droppedCitationCount` (e.g. *ac*: 35 → 8 → 3).
  The [SHACL profile](https://github.com/sanskrit-lexicon/csl-standards/blob/main/data/schema/ontolex-frac-profile.shacl.ttl)
  adds `csl:LineageRelationShape`; all 250 graphs conform under pySHACL. Each
  `source-collapse` loss report names the remedy in `mappedAs`; `analyze-loss`
  gains a `lineageCoverage` block showing **369/369** source-collapse losses
  modeled (250 abridgement + 119 recomposition). Unlike the evidence-class gap,
  this is a *modeling* construct for an upstream editorial loss, not a target
  extension — the evidence is still gone, but the collapse is now explicit and
  queryable. See [LOSS_ANALYSIS.md](https://github.com/sanskrit-lexicon/csl-standards/blob/main/docs/LOSS_ANALYSIS.md) §4.
- **TEI side of the evidence-class extension** — makes the headline construct
  symmetric across both target standards (the OntoLex side shipped in v0.3.0).
  Every citation `<bibl>` in the [archival profile](https://github.com/sanskrit-lexicon/csl-standards/blob/main/scripts/export-tei.mjs)
  and the [TEI Lex-0 baseline](https://github.com/sanskrit-lexicon/csl-standards/blob/main/scripts/export-tei-lex0.mjs)
  now carries the evidence class as **`@subtype`** ∈ {`textual`, `hedge`, `kosha`,
  `editorial`}, and a coordinate-bearing citation a structured **`<citedRange>`**
  (`AV. 6,116,1.` → `6,116,1`). Same shared classifier/parser
  ([scripts/lib/evidence.mjs](https://github.com/sanskrit-lexicon/csl-standards/blob/main/scripts/lib/evidence.mjs))
  as the OntoLex export. Both TEI validators check the `@subtype` is in the
  allowed set; the elements/attributes validate against the compiled TEI RELAX NG
  (jing) — no ODD change needed (`@subtype` and `<citedRange>` come from the `core`
  module both ODDs already import).

## [0.3.0] - 2026-06-16

**Validation hardening + interoperability-modeling depth.** The pilot's external
validation is now real, not skipped — a portable, no-admin Java/TEI toolchain
compiles both ODDs to RELAX NG and runs jing + pySHACL over all 250 archival /
256 Lex-0 / 250 RDF artefacts (it surfaced and we fixed three real
TEI-conformance bugs). On the modeling side the OntoLex-Lexicog container is
completed (`LexicographicResource → entry → Entry`), the loss-report corpus closes
every coverage gap (all schema phenomena + every roadmap cause now emitted; 959 →
**1277** reports, model-vocabulary-gap now the leading cause at 49%), and the
proposal's headline construct — the **evidence-class extension** — is implemented
and SHACL-validated, with `extensionCoverage` measuring **569/569** OntoLex
model-vocabulary-gap losses mapped to a concrete `csl:` construct.

### Changed
- **OntoLex-Lexicog container refinement**: each source dictionary is now a
  `lexicog:LexicographicResource` (with `dct:source`/`csl:dictionary`) whose
  `lexicog:entry` is the `lexicog:Entry` that `lexicog:describes` the lemma — the
  complete multi-resource structure, replacing the bare `lexicog:Entry` carrying
  source metadata directly. SHACL profile split into
  `csl:LexicographicResourceShape` + `csl:LexicographicEntryShape`; validator and
  Turtle updated; 250 graphs regenerated and pass.
- **SHACL layer lit up**: `validate-external-profiles` now finds pySHACL via
  `python -m pyshacl` as well as on PATH (so `pip install --user pyshacl` works
  without PATH changes). pySHACL validates all 250 RDF graphs against the profile.

### Fixed
- **Three TEI-conformance bugs the real RNG validation exposed** (the structural
  validators only substring-check and had passed them): the TEI Lex-0 lemma's
  `<entry>` shared its `xml:id` with the `<TEI>` root (duplicate ID) → now
  `…-entry`; the Lex-0 `<sourceDesc>` mixed `<p>` + `<listBibl>` (illegal content
  model) → prose moved into the `<listBibl>` `<head>`; the archival continuation
  `<xr>` carried `@target` (not permitted there) → moved to the inner `<ref>`. All
  250 archival + 256 Lex-0 files now validate against the compiled TEI RELAX NG.

### Added
- **Evidence-class extension implemented + validated** — turns the proposal into a
  working artefact. Every `frac:Attestation` now carries a sub-typed
  [`csl:evidenceClass`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/scripts/lib/evidence.mjs)
  ∈ {`textual`, `hedge`, `kosha`, `editorial`}, and a coordinate-bearing citation
  parses into `csl:citedWork` + `csl:citedRange` (`AV. 6,116,1.` → `AV.` / `6,116,1`).
  The [SHACL profile](https://github.com/sanskrit-lexicon/csl-standards/blob/main/data/schema/ontolex-frac-profile.shacl.ttl)
  constrains the class with `sh:in`; all 250 graphs conform under pySHACL.
  `analyze-loss` gains an `extensionCoverage` block showing **569/569** OntoLex
  model-vocabulary-gap losses now map to an implemented `csl:` construct (each loss
  report names its remedy in `mappedAs`). Classification/parsing shared via
  [scripts/lib/evidence.mjs](https://github.com/sanskrit-lexicon/csl-standards/blob/main/scripts/lib/evidence.mjs)
  (single source of truth for export + loss detection). See
  [EXTENSION_PROPOSAL.md](https://github.com/sanskrit-lexicon/csl-standards/blob/main/docs/EXTENSION_PROPOSAL.md)
  §1 and [LOSS_ANALYSIS.md](https://github.com/sanskrit-lexicon/csl-standards/blob/main/docs/LOSS_ANALYSIS.md) §4b.
- **Evidence-class sub-typing loss family** closes every remaining loss-report
  coverage gap. [build-loss-reports.mjs](https://github.com/sanskrit-lexicon/csl-standards/blob/main/scripts/build-loss-reports.mjs)
  now emits the three previously-defined-but-unused schema phenomena —
  `named-kosha-citation` (79), `citation-coordinate` (222), `editorial-reference`
  (16), all `target: ontolex`, cause `model-vocabulary-gap`, `extensionNeeded:
  true` — plus a `data-quality` `source-anomaly` report for `[sic]` markers (1).
  `analyze-loss` now reports `schemaPhenomenaNotEmitted: []` and
  `roadmapCausesNotEmitted: []`; corpus grows 959 → **1277** reports.
  `data-quality` added to the schema's `failureClassification` enum; see
  [LOSS_ANALYSIS.md](https://github.com/sanskrit-lexicon/csl-standards/blob/main/docs/LOSS_ANALYSIS.md)
  §4b. Model-vocabulary-gap is now the leading cause (49%).
- **Portable external-validation toolchain** so `validate-external-profiles` runs
  the real RNG instead of skipping: [scripts/setup-external-tools.mjs](https://github.com/sanskrit-lexicon/csl-standards/blob/main/scripts/setup-external-tools.mjs)
  (`npm run setup-external-tools`) assembles a no-admin JRE + Saxon-HE + jing + TEI
  Stylesheets + p5subset under `tools/` (gitignored) and compiles both ODDs to RNG;
  [scripts/validate-external.mjs](https://github.com/sanskrit-lexicon/csl-standards/blob/main/scripts/validate-external.mjs)
  (`npm run validate-external`) runs the harness against it. Documented (incl. a
  WSL/apt route) in [docs/EXTERNAL_VALIDATION.md](https://github.com/sanskrit-lexicon/csl-standards/blob/main/docs/EXTERNAL_VALIDATION.md).

## [0.2.0] - 2026-06-15

Month-3 milestone — **public research demo + paper skeleton + extension
proposal**. The MW-PWG-PWK interoperability pilot is now an end-to-end,
reproducible instrument at **250-case** scale: CDSL source → neutral model → TEI
archival + TEI Lex-0 + OntoLex-Lexicog exports, all machine-validated, with a
**959-report** loss corpus, quantitative analysis, a public bilingual page, the
extension proposal, and all five paper figures.

### Added
- **Extension proposal** ([docs/EXTENSION_PROPOSAL.md](docs/EXTENSION_PROPOSAL.md)) —
  each documented loss-cause mapped to a concrete TEI/OntoLex construct already
  prototyped in the `csl:` namespace (evidence-type vocabulary, root/derivational
  relation, decomposition-status, adjacency-parent recovery, cross-resource
  lineage, kośa sense-boundary), with a standardize-vs-project-local disposition.
  Discharges PAPER_OUTLINE §8.
- **Paper figures** ([scripts/build-figures.mjs](scripts/build-figures.mjs),
  `npm run build-figures`) — all five figures as reproducible, dependency-free SVG
  into [data/pilot/figures/](data/pilot/figures), from the analysis artifact and
  neutral model.
- **TEI Lex-0 ODD** ([data/schema/tei-lex0-profile.odd.xml](data/schema/tei-lex0-profile.odd.xml))
  + RNG validation wired into `validate-external-profiles` (gated on the
  Java/TEI-Stylesheets toolchain; recorded as `skipped` when absent), encoding the
  Lex-0 baseline shape and the kośa sense-boundary customisation.
- **Senses across all three dictionaries** — MW segmenter
  ([scripts/lib/mw-senses.mjs](scripts/lib/mw-senses.mjs)) and PWG/PWK extractor
  ([scripts/lib/pw-senses.mjs](scripts/lib/pw-senses.mjs)) — with **sense-level
  citation linkage** in TEI Lex-0 (MW) and OntoLex (all three).
- **Named-source citation layer** in the neutral model — every `<ls>` across
  MW/PWG/PWK, tagged by dictionary, materialized once and shared.
- **Loss-report families**: PWG → PWK → MW source-collapse (`editorial-compression`)
  and the indigenous kośa sense/citation fusion (`sanskrit-convention`).
- **Month-3 loss-report analysis** ([scripts/analyze-loss-reports.mjs](scripts/analyze-loss-reports.mjs),
  [docs/LOSS_ANALYSIS.md](docs/LOSS_ANALYSIS.md)) and a **public bilingual Loss
  Analysis page** on the Observable site.
- Broadened the **SKD kośa parser** to six records with SLP1→IAST transliteration
  and a work-vs-person `<title>`/`<author>` split.

### Changed
- **Pilot extended 50 → 250 hard cases** (review slice fixed at 15); the
  tri-dictionary requirement (a counterpart in all of MW/PWG/PWK) is enforced;
  validators and scope/status labels are now count-agnostic.
- **OntoLex export remodeled as OntoLex-Lexicog multi-resource** — a `lexicog:Entry`
  per source dictionary, multilingual senses, sense-level `frac:Attestation`s — and
  made fully model-driven (no re-extraction from raw).
- Centralised the `<ls>` citation parser
  ([scripts/lib/citations.mjs](scripts/lib/citations.mjs)) shared by the neutral
  model and both exporters.

### Fixed
- Generated artifacts are **byte-reproducible**: generators honour
  `SOURCE_DATE_EPOCH` and otherwise omit `generatedAt`
  ([scripts/lib/provenance.mjs](scripts/lib/provenance.mjs)).
- Code-review findings: Figure 5 height clipping; OntoLex `lexicog:entry` domain
  violation on the lemma; sampler double-compaction.

## [0.1.0] - 2026-06-13

Initial public changelog (was labelled "1.0.0" for the changelog file itself;
relabelled to track the project's `package.json` version at the time).

### Added
- Added this changelog so repository-level changes have a stable home.
- Recorded the current repository purpose: Technical standards and export workbench for CDSL dictionary data.

### Recent Git History
- 2026-06-13 Merge pull request #6 from sanskrit-lexicon/feat/skd-kosa-parser
- 2026-06-13 feat: parse the SKD kosa entry from source for TEI Lex-0 (G2 slice 3)
- 2026-06-13 Merge pull request #5 from sanskrit-lexicon/feat/tei-lex0-generator
- 2026-06-13 feat: TEI Lex-0 generator + structural validator (G2 slice 2)
- 2026-06-13 Merge pull request #4 from sanskrit-lexicon/docs/tei-lex0-pilot
