# Loss-Report Analysis (Month 3)

Quantitative analysis of the pilot loss reports and the MW/PWG/PWK
cross-dictionary signal. This backs [PAPER_OUTLINE.md](PAPER_OUTLINE.md) §7
(PWG→PWK→MW transformations), §8 (Standards Critique), Figure 2 (evidence-class
comparison), and Figure 5 (loss-report distribution).

All numbers here are **regenerable**: run `npm run analyze-loss`
([`scripts/analyze-loss-reports.mjs`](../scripts/analyze-loss-reports.mjs)),
which reads [`data/pilot/loss-reports.json`](../data/pilot/loss-reports.json) and
[`data/pilot/neutral-model.json`](../data/pilot/neutral-model.json) and writes the
machine artifact [`data/pilot/loss-analysis.json`](../data/pilot/loss-analysis.json).
Do not hand-edit the tables below — re-run the script.

Corpus: **959 loss reports** across the 250 Western cases and 6 indigenous *kośa*
entries. Three families are present:

- **Target-model losses** (584): what TEI / OntoLex cannot hold when mapping a
  CDSL record. Generated per case per target per phenomenon.
- **Source-collapse losses** (369): named evidence the *dictionary lineage* itself
  drops along PWG → PWK → MW. These are `target: "neutral"` because TEI and
  OntoLex can both hold named citations — the loss is editorial, upstream of any
  model choice, so `extensionNeeded` is `false`.
- **Sense/citation-fusion losses** (6): the indigenous *kośa* (SKD) structures
  sense and source authority as one indivisible *iti*-unit that the Lex-0 baseline
  must split into `<def>` + `<bibl>` — a `sanskrit-convention` loss with no
  equivalent in the sense/citation-separating standards (see §4a).

## 1. The central finding: kinds of asymmetry

| target | clean | partial | lossy | failure |
|---|--:|--:|--:|--:|
| tei | 75 | 217 | 6 | 0 |
| ontolex | 0 | 192 | 100 | 0 |
| neutral | 0 | 127 | 242 | 0 |

**Target asymmetry (Western cases).** For the 250 MW/PWG/PWK cases the TEI
archival profile is never `lossy` (75 clean, 217 partial); OntoLex is never
`clean` (192 partial, 100 lossy). TEI can always at least preserve the dictionary
*as an edition*; OntoLex never merely transcribes, so it either relates the data
or drops what it cannot relate. The models do not fail — they **succeed
differently** ([PAPER_OUTLINE.md](PAPER_OUTLINE.md) §3). The only `tei`-lossy
reports (6) are *not* Western: they are the indigenous *kośa* sense/citation
fusion in the Lex-0 baseline (§4a) — a different TEI profile and a different
lexicographic tradition.

**Source asymmetry.** The `neutral` lane (the dictionary lineage, before any
model) is the *most* lossy of the three: 242 lossy, 127 partial, 0 clean. Much of
what looks like "interoperability loss" is in fact loss that already happened in
the 19th-century editorial chain, recoverable only by reading across PWG, PWK, and
MW together (see §4).

Overall status: 536 partial (56%), 348 lossy (36%), 75 clean (8%).

## 2. Failure classification (by cause)

| failureClassification | n | % |
|---|--:|--:|
| editorial-compression | 369 | 38% |
| model-vocabulary-gap | 312 | 33% |
| cdsl-markup-gap | 117 | 12% |
| print-compression | 80 | 8% |
| none (clean) | 75 | 8% |
| sanskrit-convention | 6 | 1% |

The two leading causes are near-equal and tell different stories.
**Editorial-compression (38%)** is upstream lineage loss — the standards could
hold the evidence, but MW/PWK already discarded it. **Model-vocabulary-gap (33%)**
is downstream — the target standards lack a concept (an evidence class, a
derivational-base relation). Only 12% is a CDSL-markup gap and 8% print-layout
compression. The smallest but qualitatively distinct cause is
**sanskrit-convention (1%, 6 reports)**: losses inherent to a lexicographic
tradition, not fixable by either better encoding or a generic model extension
(the *kośa* fusion, §4a). So the remedy splits three ways: a **standards
extension layer** for the model-vocabulary gaps (§8), **cross-dictionary lineage
modeling** for the editorial-compression losses (§7), and a
**tradition-specific ODD customisation** for the sanskrit-convention losses. The
369 editorial-compression reports all carry `extensionNeeded: false` (the
standards are not at fault); the 6 sanskrit-convention reports carry `true` (they
need the kośa Lex-0 customisation).

## 3. Where the stress concentrates (phenomenon)

| phenomenon | n | % |
|---|--:|--:|
| source-collapse | 369 | 38% |
| generic-lexicographer-hedge | 234 | 24% |
| continuation-parent | 80 | 8% |
| compound-subentry | 75 | 8% |
| compound-decomposition | 75 | 8% |
| root-as-entry | 60 | 6% |
| root-as-derivational-base | 60 | 6% |
| sense-citation-fusion | 6 | 1% |

`source-collapse` is the single largest phenomenon (38%), ahead of the MW
`L.` hedge (24%). Together the two evidence-related phenomena are 63% of the
corpus — the evidence problem, not derivation or compounding, is the centre of
gravity (§4).

## 4. The PWG → PWK → MW lineage, as loss reports (§7)

The 369 source-collapse reports are evidence-bound: each carries a
`sourceEvidence` object with the `<ls>` named-citation counts and a sample of the
dropped sources.

| transition | reports | status |
|---|--:|---|
| PWG → MW (MW carries no citation) | 119 | lossy |
| PWG → PWK, all dropped | 123 | lossy |
| PWG → PWK, partially retained | 127 | partial |

In **119 of 250 cases (48%)** PWG names a textual source (e.g. `AV. 6,116,1.`,
`RAGH. 2,10.`, `ṚV. 7,6,5.`) that MW reduces to the `L.` hedge or drops entirely
— the data behind Figure 2. PWK abridges PWG in **all 250 cases**: 123 drop the
named apparatus completely, 127 retain a subset (e.g. *ac*: PWG 35 → PWK 8 → MW
3). This is the §7 claim — that compression along the lineage is *not* a
semantically neutral operation — expressed as a measurement.

This matches the neutral-model phenomenon labels (all 250 cases have all three
records; 119 are `mw-uncited-pwg-cited`; all 250 are `pwk-abridged`), now lifted
from labels into evidence-bound reports.

### 4a. The indigenous *kośa* sense/citation fusion (§5 of the Lex-0 pilot)

The 6 SKD *kośa* entries contribute 6 `sense-citation-fusion` reports
(`target: tei`, `sourceDictionary: skd`, cause `sanskrit-convention`). A *kośa*
binds a run of synonyms/meanings to its closing authority as one indivisible
*iti*-unit (*ity amaraḥ*, *iti medinī*); the Lex-0 baseline can only express this
by splitting it into a `<def>` and a separate `<bibl>`. Each report records the
authority groups it had to split (e.g. *Darmma*: 3 groups — Amara, Medinī,
Hemacandra). Unlike the Western losses, this is neither a model-vocabulary gap nor
an editorial-compression artefact: it is a property of the Sanskrit lexicographic
tradition, addressable only by a *kośa* Lex-0 ODD customisation (treating the
authority formula as a sense boundary). It is the qualitative counterpart to the
quantitative Western findings — one tradition where sense and citation are *not
separable categories at all*.

## 5. Coverage gaps — what the instrument does not yet measure

Honest limits of the current pilot, recorded so they are not mistaken for absence
of the phenomena (the roadmap's "do not hide model failures").

- **Named citations are now materialized in the neutral model** (done). The model
  carries 2617 citation objects — 116 `generic-lexicographer-hedge` and **2501
  `named-source-citation`** (PWG 1872, MW 379, PWK 366, capped at 12 per
  dictionary), each tagged with its `dictionary`. The TEI Lex-0 export emits them
  as entry-level `<bibl type="named-source" source="#dict-…">`, so a lemma like
  *arcya* — uncited in MW — carries PWG's named sources. MW senses are extracted
  too (224 of 250 Western entries carry a `<def>`/`<xr>`), and **sense-level
  linkage is done**: each MW `<ls>` is attached to the sense it attests (117
  entries / 244 senses), so MW sources sit inside the `<sense>` and only the
  cross-dictionary PWG/PWK sources remain entry-level (see
  [TEI_LEX0_PILOT.md](TEI_LEX0_PILOT.md) §6).
- **Schema *phenomena* not yet emitted:** `named-kosha-citation`,
  `citation-coordinate`, `editorial-reference` (defined in
  [LOSS_REPORT_SCHEMA.md](LOSS_REPORT_SCHEMA.md) as loss-report phenomena but
  unused). Note these are loss-report phenomena, distinct from the citation
  *type* now materialized above; `source-collapse` is now emitted.
- **No `failure` status**, and one roadmap failure cause — `data-quality` —
  remains unused. (`sanskrit-convention` is now emitted, §4a.) Whether any pilot
  loss is best classified as an unresolved data-quality issue is left open rather
  than forced.

## 6. Reviewer-trust note

Of the 959 reports, 96 (the 15 high-stress review-slice keys) are marked
`reviewed`; the rest are `machine`. The **target** asymmetry of §1 holds within
the reviewed slice — TEI is never lossy there (0 of 33) and OntoLex is never
clean (20 lossy, 13 partial) — so it is not an artefact of unreviewed heuristics.
(The 6 `tei`-lossy reports in the full corpus are the indigenous *kośa* fusion,
all `machine`, and fall outside the Western review slice.) The **source**
asymmetry (the neutral lane being the *most* lossy) is a full-corpus measurement:
the review slice is deliberately root/hedge-heavy, so it contains only 30 of the
369 source-collapse reports (10 lossy, 20 partial) and does not, on its own, show
the lineage-collapse magnitude.
