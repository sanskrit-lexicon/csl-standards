# Changelog

All notable changes to csl-standards are documented here.

This repository does not currently publish versioned release notes. Entries use
dated maintenance snapshots; keep upcoming work under [Unreleased] until it is
ready for a dated entry.

## [Unreleased]

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
