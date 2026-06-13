# Changelog

All notable changes to csl-standards are documented here.

This repository does not currently publish versioned release notes. Entries use
dated maintenance snapshots; keep upcoming work under [Unreleased] until it is
ready for a dated entry.

## [Unreleased]

### Added
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
