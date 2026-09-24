- **Loss-analysis docs re-synced to the measured corpus (2038 reports, 280 cases).**
  [`docs/LOSS_ANALYSIS.md`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/docs/LOSS_ANALYSIS.md)
  was stale in two layers. It still said 1722 reports, while the JSON already said
  2014 before H5321 and 2038 after it. It also predated the LIFT lane and the
  MDF compound refinement from H721. Every table and count is now regenerated
  from `npm run analyze-loss`:
  - LIFT row added.
  - MDF is now 0 clean, 75 partial, 217 lossy; it was 292 lossy.
  - TEI-lossy is 30, and the kośa fusion counts rose from 6 to 30. They come
    from the 6 curated entries plus 24 of the 41 entries added by the H5321
    stratified SKD sample.
  - Cause and phenomenon shares are updated. The `L.` hedge is now the largest
    phenomenon at 23%, and the evidence-related phenomena make up 64% (was 69%).
  - The review slice now holds 162 reviewed reports (was 129).
  - The same stale counts are fixed in `docs/PAPER.md` (abstract, §2, §4 table and
    prose, §9, §12, Figure 5 caption), `docs/PAPER_OUTLINE.md`,
    `docs/EXTENSION_PROPOSAL.md` and `docs/ROADMAP_3_MONTHS.md`.
  - **Figure 5 regenerated.** The committed SVG still showed 2014 reports and the
    6 TEI-lossy bar. Its caption said MDF is "lossy across the board", which is no
    longer true. `scripts/build-figures.mjs` now states it measured (never clean,
    mostly lossy) and splits the caption over two lines so it no longer clips at
    760 px.
