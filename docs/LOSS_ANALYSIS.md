# Loss-Report Analysis (Month 3)

Quantitative analysis of the pilot loss reports and the MW/PWG/PWK
cross-dictionary signal. This backs [PAPER_OUTLINE.md](PAPER_OUTLINE.md) §8
(Standards Critique), Figure 2 (evidence-class comparison), and Figure 5
(loss-report distribution).

All numbers here are **regenerable**: run `npm run analyze-loss`
([`scripts/analyze-loss-reports.mjs`](../scripts/analyze-loss-reports.mjs)),
which reads [`data/pilot/loss-reports.json`](../data/pilot/loss-reports.json) and
[`data/pilot/neutral-model.json`](../data/pilot/neutral-model.json) and writes the
machine artifact [`data/pilot/loss-analysis.json`](../data/pilot/loss-analysis.json).
Do not hand-edit the tables below — re-run the script.

Corpus: **124 loss reports across 50 cases** (each case yields a TEI and an
OntoLex report per phenomenon).

## 1. The central finding: the two models fail asymmetrically

| target | clean | partial | lossy | failure |
|---|--:|--:|--:|--:|
| tei | 15 | 47 | 0 | 0 |
| ontolex | 0 | 42 | 20 | 0 |

This is the paper's argument expressed as data. **TEI is never `lossy`** (15
clean, 47 partial) and **OntoLex is never `clean`** (42 partial, 20 lossy). The
TEI archival profile can always at least preserve the dictionary *as an edition*
(the string, the source record, a custom `@type`); what it cannot always do is
make the lexicographic semantics explicit. OntoLex is the mirror image: it forces
every statement into a semantic graph, so it never merely transcribes — it either
relates the data or drops what it cannot relate. The models do not fail; they
**succeed differently**, exactly as [PAPER_OUTLINE.md](PAPER_OUTLINE.md) §3 claims.

Overall status: 89 partial (72%), 20 lossy (16%), 15 clean (12%).

## 2. Failure classification (by cause)

| failureClassification | n | % |
|---|--:|--:|
| model-vocabulary-gap | 66 | 53% |
| cdsl-markup-gap | 27 | 22% |
| print-compression | 16 | 13% |
| none (clean) | 15 | 12% |

The dominant cause is the **target models' vocabulary**, not the CDSL source: a
majority of losses (53%) are cases where TEI/OntoLex simply lack a concept (an
evidence class, a derivational-base relation, an explicit component graph). Only
22% trace to a CDSL markup gap and 13% to print-layout compression. This matters
for the standards critique: the remedy is mostly an **extension layer on the
standards** (§8), not better CDSL encoding. Consistently, 89 of 124 reports
(72%) carry `extensionNeeded: true`.

## 3. Where the stress concentrates (phenomenon)

| phenomenon | n | % |
|---|--:|--:|
| generic-lexicographer-hedge | 54 | 44% |
| continuation-parent | 16 | 13% |
| compound-subentry | 15 | 12% |
| compound-decomposition | 15 | 12% |
| root-as-entry | 12 | 10% |
| root-as-derivational-base | 12 | 10% |

The single largest stress point is the **MW `L.` hedge** (44% of all reports;
present in 27 of 50 cases). The evidence problem, not derivation or compounding,
is the centre of gravity of the sample — which is why §4 (Evidence and
Provenance) carries the argument.

## 4. The MW/PWG/PWK cross-dictionary signal (neutral model)

All 50 cases have all three dictionary records (mw=50, pwg=50, pwk=50). The
neutral-model phenomena that drive the lineage argument (§7):

| phenomenon | n | % of 50 |
|---|--:|--:|
| tri-dict / pwg-rich / pwk-abridged / homophone | 50 | 100% |
| hedge (MW `L.`) | 27 | 54% |
| **mw-uncited-pwg-cited** | 23 | 46% |
| compound | 15 | 30% |
| root | 12 | 24% |
| continuation | 8 | 16% |

The key lineage number is **`mw-uncited-pwg-cited` = 23/50 (46%)**: in nearly
half the sample PWG carries a *named* attestation where MW carries only the `L.`
hedge or nothing. This is direct evidence for the §4/§7 claim that evidential
certainty **degrades** along the PWG → PWK → MW lineage, and it is the data
behind Figure 2 (PWG named kosha citations vs MW `L.`).

## 5. Coverage gaps — what the instrument does not yet measure

These are honest limits of the current pilot, recorded so they are not mistaken
for absence of the phenomena (the roadmap's "do not hide model failures").

- **Loss reports are MW-only.** Every one of the 124 reports has
  `sourceDictionary: "mw"`. The PWG → PWK → MW *transformation* (§7) and Figure 2
  are argued from the neutral model's phenomenon labels, **not yet from loss
  reports**. A `source-collapse` report family sourced from PWG and PWK is the
  obvious next slice.
- **PWG named citations are not materialized.** The neutral model captures 25
  citations, all `generic-lexicographer-hedge` (MW `L.`); zero
  `named-kosha-citation` objects exist yet, even though 23 cases are flagged
  `mw-uncited-pwg-cited`. The named evidence is detected but not lifted into the
  citation model.
- **Schema phenomena not yet emitted:** `named-kosha-citation`,
  `source-collapse`, `citation-coordinate`, `editorial-reference`
  (defined in [LOSS_REPORT_SCHEMA.md](LOSS_REPORT_SCHEMA.md) but unused).
- **No `failure` status** is emitted, and two roadmap failure causes —
  `sanskrit-convention` and `data-quality` — are not used. The current heuristics
  classify everything as a model/markup/print issue; genuinely
  Sanskrit-convention-bound losses (e.g. the kośa sense/citation fusion in
  [TEI_LEX0_PILOT.md](TEI_LEX0_PILOT.md) §5) are documented in prose but not yet
  in the loss-report corpus.

## 6. Reviewer-trust note

56 of 124 reports are `reviewed` (the 15 high-stress review-slice keys), 68 are
`machine`. The asymmetry finding in §1 holds within the reviewed slice as well as
the full corpus, so it is not an artefact of unreviewed heuristics.
