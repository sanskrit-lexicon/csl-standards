# Changelog

All notable changes to csl-standards are documented here.

This repository does not currently publish versioned release notes. Entries use
dated maintenance snapshots; keep upcoming work under [Unreleased] until it is
ready for a dated entry.

## [Unreleased]

### Changed
- **Extended the pilot from 50 to 250 hard cases.** The sampler default is now
  250 ([scripts/sample-hard-cases.mjs](https://github.com/sanskrit-lexicon/csl-standards/blob/main/scripts/sample-hard-cases.mjs)),
  and it now requires a counterpart in all three dictionaries (drops MW-only
  candidates that lack PWG/PWK). Hedge detection runs on the stored (compacted)
  raw so the phenomenon matches the artifacts even for long records. The
  validators are count-agnostic, and the `full-50-*` scope/status labels are now
  count-agnostic (`full-machine-review`, `full-tei-odd-profile`,
  `full-ontolex-shacl-profile`). The review slice stays 15. Regenerated corpus:
  250 TEI/OntoLex/RDF + 256 Lex-0; 959 loss reports; 2501 named-source citations;
  224/250 entries with senses; 117 entries / 244 senses sense-linked. Docs updated
  to the 250-scale figures (legacy/roadmap docs retain their original figures by
  design).

### Added
- Sense-level citation linkage: `extractMwSenses` now carries per-sense
  `citations` (the MW `<ls>` within each `<div>` segment), and the TEI Lex-0
  export renders them inside the `<sense>` — named sources as
  `<bibl type="named-source" source="#dict-mw">`, the hedge as `<usg type="hint">`.
  MW sources are no longer duplicated at entry level (the entry index keeps the
  cross-dictionary PWG/PWK sources). 25 entries / 52 senses carry linked citations
  (e.g. *ac* "to adorn" → `Dharmaś.`). Completes TEI_LEX0_PILOT §7.4; archival
  TEI/OntoLex unchanged.
- MW sense segmenter ([scripts/lib/mw-senses.mjs](https://github.com/sanskrit-lexicon/csl-standards/blob/main/scripts/lib/mw-senses.mjs)):
  populates `model.senses` from the MW record — splitting on `;`/`<div>`, glossing
  verbal roots as "to …" phrases, and recognising cross-references (`See …`, `= X`,
  `(for … See …)`). TEI Lex-0 entries carrying a real sense rose from **11 to 44**
  of 50 (the other 6 are genuine grammatical stubs); cross-references render as
  `<xr type="cf"><ref>`. Archival TEI and OntoLex outputs are unchanged (they keep
  their own definition extraction); this unblocks sense-level citation linkage.

### Changed
- Centralised the `<ls>` labeled-source parser into
  [scripts/lib/citations.mjs](https://github.com/sanskrit-lexicon/csl-standards/blob/main/scripts/lib/citations.mjs);
  `build-neutral-model`, `export-tei`, and `export-ontolex` now share it instead
  of each re-implementing `stripPseudoMarkup` + `extractCitations`. Output is
  byte-identical (verified: no data churn); net −17 lines. Documented that
  sense-level citation linkage is blocked upstream on MW sense extraction (only
  11/50 Western Lex-0 entries yield a machine sense).

### Added
- Public **Loss Analysis** page on the Observable site
  ([src/tools/loss-analysis.md](https://github.com/sanskrit-lexicon/csl-standards/blob/main/src/tools/loss-analysis.md)):
  renders the target×status asymmetry, by-cause and by-phenomenon breakdowns, the
  cross-dictionary citation layer, and the coverage gaps from
  `loss-analysis.json` — bilingual (EN/RU). `analyze-loss` now mirrors its artifact
  into `src/data/pilot/` so the site can load it; locales gained the
  `editorial-compression`, `sanskrit-convention`, `source-collapse`, and
  `sense-citation-fusion` labels.
- Indigenous *kośa* sense/citation-fusion loss-report family: [scripts/build-loss-reports.mjs](https://github.com/sanskrit-lexicon/csl-standards/blob/main/scripts/build-loss-reports.mjs)
  now emits one `sense-citation-fusion` report per SKD entry (6 total, `target:
  tei`, `sourceDictionary: skd`, cause `sanskrit-convention`), recording the
  authority groups the Lex-0 baseline had to split into `<def>` + `<bibl>`. Adds
  `skd` and `sanskrit-convention` to the loss-report schema; `validate-pilot`
  accepts fixture caseIds; `build-pilot` reordered so `parse-skd-kosa` precedes
  `build-loss-reports`. Corpus 197 → 203. This refines the central finding: the
  only `tei`-lossy reports are the 6 indigenous fusions, not the Western cases.

### Fixed
- Generated artifacts are now byte-reproducible: the six generators no longer
  stamp a wallclock `generatedAt`. A shared helper
  [scripts/lib/provenance.mjs](https://github.com/sanskrit-lexicon/csl-standards/blob/main/scripts/lib/provenance.mjs)
  honours `SOURCE_DATE_EPOCH` (reproducible-builds standard) and otherwise omits
  the field, so re-running `build-pilot` produces no diff. Removed the stale
  timestamps from the committed review/sample artifacts.

### Added
- Named-source citation layer in the neutral model: [scripts/build-neutral-model.mjs](https://github.com/sanskrit-lexicon/csl-standards/blob/main/scripts/build-neutral-model.mjs)
  now extracts every `<ls>` labeled source across MW/PWG/PWK (519
  `named-source-citation` objects + 25 hedges, tagged with `dictionary`, capped
  at 12/dict). The TEI Lex-0 export carries them as entry-level
  `<bibl type="named-source" source="#dict-…">` with the source dictionaries
  declared in the header, so a Western lemma uncited in MW (e.g. *arcya*) now
  carries PWG's named apparatus. `analyze-loss` reports
  `namedSourceCitationsMaterialized` (was 0) and citation counts by dictionary.
- PWG/PWK source-collapse loss-report family: [scripts/build-loss-reports.mjs](https://github.com/sanskrit-lexicon/csl-standards/blob/main/scripts/build-loss-reports.mjs)
  now emits 73 `target: neutral` reports for evidence dropped along the PWG → PWK
  → MW lineage (23 PWG→MW collapses + 50 PWK abridgements), each evidence-bound
  with `<ls>` citation counts and a `sourceEvidence` sample. New
  `editorial-compression` failure cause (loss is upstream, `extensionNeeded:
  false`); `neutral` target now accepted by `validate-pilot`. Corpus 124 → 197;
  source-collapse is the largest phenomenon (37%). PAPER_OUTLINE §7 and
  LOSS_ANALYSIS.md updated with the lineage measurements.
- Month-3 loss-report analysis: [scripts/analyze-loss-reports.mjs](https://github.com/sanskrit-lexicon/csl-standards/blob/main/scripts/analyze-loss-reports.mjs)
  (`npm run analyze-loss`) quantifies the 124 loss reports into the regenerable
  artifact [data/pilot/loss-analysis.json](https://github.com/sanskrit-lexicon/csl-standards/blob/main/data/pilot/loss-analysis.json),
  with the narrative in [docs/LOSS_ANALYSIS.md](https://github.com/sanskrit-lexicon/csl-standards/blob/main/docs/LOSS_ANALYSIS.md):
  the TEI-never-lossy / OntoLex-never-clean asymmetry, the by-cause breakdown
  (53% model-vocabulary gaps), the MW/PWG/PWK signal (23/50 mw-uncited-pwg-cited),
  and the instrument's coverage gaps. Wired into `build-pilot` and PAPER_OUTLINE §8.
- Broadened the SKD *kośa* parser ([scripts/parse-skd-kosa.mjs](https://github.com/sanskrit-lexicon/csl-standards/blob/main/scripts/parse-skd-kosa.mjs))
  from one record (*Darmma*) to six, with SLP1→IAST transliteration of glosses,
  a wider authority/work vocabulary, and a kośa-work-vs-person split rendered as
  TEI `<bibl><title>` vs `<bibl><author>`. The Lex-0 corpus now has 56 entries
  (50 MW/PWG/PWK + 6 SKD); `validate-tei-lex0` passes 56/56.

## [1.0.0] - 2026-06-13

### Added
- Added this changelog so repository-level changes have a stable home.
- Recorded the current repository purpose: Technical standards and export workbench for CDSL dictionary data.

### Recent Git History
- 2026-06-13 Merge pull request #6 from sanskrit-lexicon/feat/skd-kosa-parser
- 2026-06-13 feat: parse the SKD kosa entry from source for TEI Lex-0 (G2 slice 3)
- 2026-06-13 Merge pull request #5 from sanskrit-lexicon/feat/tei-lex0-generator
- 2026-06-13 feat: TEI Lex-0 generator + structural validator (G2 slice 2)
- 2026-06-13 Merge pull request #4 from sanskrit-lexicon/docs/tei-lex0-pilot
