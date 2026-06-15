# Changelog

All notable changes to csl-standards are documented here. Releases are dated,
semver-style snapshots; upcoming work stays under [Unreleased] until it is cut
into a dated version. Versions track `package.json`.

## [Unreleased]

### Fixed
- **Three TEI-conformance bugs the real RNG validation exposed** (the structural
  validators only substring-check and had passed them): the TEI Lex-0 lemma's
  `<entry>` shared its `xml:id` with the `<TEI>` root (duplicate ID) → now
  `…-entry`; the Lex-0 `<sourceDesc>` mixed `<p>` + `<listBibl>` (illegal content
  model) → prose moved into the `<listBibl>` `<head>`; the archival continuation
  `<xr>` carried `@target` (not permitted there) → moved to the inner `<ref>`. All
  250 archival + 256 Lex-0 files now validate against the compiled TEI RELAX NG.

### Added
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
