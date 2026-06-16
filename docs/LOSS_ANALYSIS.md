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

Corpus: **1277 loss reports** across the 250 Western cases and 6 indigenous *kośa*
entries. Four families are present:

- **Target-model losses** (584): what TEI / OntoLex cannot hold when mapping a
  CDSL record. Generated per case per target per phenomenon.
- **Source-collapse losses** (369): named evidence the *dictionary lineage* itself
  drops along PWG → PWK → MW. These are `target: "neutral"` because TEI and
  OntoLex can both hold named citations — the loss is editorial, upstream of any
  model choice, so `extensionNeeded` is `false`.
- **Evidence-class sub-typing losses** (317): named citations the flat
  `frac:Attestation` model carries but cannot *type* — indigenous *kośa* sources
  (`named-kosha-citation`), editorial/self references (`editorial-reference`), and
  the unparsed textual coordinates inside a citation (`citation-coordinate`). All
  are `target: "ontolex"`, cause `model-vocabulary-gap`, `extensionNeeded: true`:
  the information survives as a flat string but its evidence class is lost (§4b).
- **Sense/citation-fusion losses** (6): the indigenous *kośa* (SKD) structures
  sense and source authority as one indivisible *iti*-unit that the Lex-0 baseline
  must split into `<def>` + `<bibl>` — a `sanskrit-convention` loss with no
  equivalent in the sense/citation-separating standards (see §4a).

A single `data-quality` report (one `source-anomaly`, `target: "neutral"`) records
a source record carrying an unresolved editorial `[sic]` marker.

## 1. The central finding: kinds of asymmetry

| target | clean | partial | lossy | failure |
|---|--:|--:|--:|--:|
| tei | 75 | 217 | 6 | 0 |
| ontolex | 0 | 509 | 100 | 0 |
| neutral | 0 | 128 | 242 | 0 |

**Target asymmetry (Western cases).** For the 250 MW/PWG/PWK cases the TEI
archival profile is never `lossy` (75 clean, 217 partial); OntoLex is never
`clean` (509 partial, 100 lossy). TEI can always at least preserve the dictionary
*as an edition*; OntoLex never merely transcribes, so it either relates the data
or drops what it cannot relate. The models do not fail — they **succeed
differently** ([PAPER_OUTLINE.md](PAPER_OUTLINE.md) §3). The only `tei`-lossy
reports (6) are *not* Western: they are the indigenous *kośa* sense/citation
fusion in the Lex-0 baseline (§4a) — a different TEI profile and a different
lexicographic tradition.

**Source asymmetry.** The `neutral` lane (the dictionary lineage, before any
model) is the *most* lossy of the three: 242 lossy, 128 partial, 0 clean. Much of
what looks like "interoperability loss" is in fact loss that already happened in
the 19th-century editorial chain, recoverable only by reading across PWG, PWK, and
MW together (see §4).

Overall status: 854 partial (67%), 348 lossy (27%), 75 clean (6%).

## 2. Failure classification (by cause)

| failureClassification | n | % |
|---|--:|--:|
| model-vocabulary-gap | 629 | 49% |
| editorial-compression | 369 | 29% |
| cdsl-markup-gap | 117 | 9% |
| print-compression | 80 | 6% |
| none (clean) | 75 | 6% |
| sanskrit-convention | 6 | <1% |
| data-quality | 1 | <1% |

The two leading causes tell different stories. **Model-vocabulary-gap (49%)** is
now the largest: downstream losses where the target standard lacks a concept — a
derivational-base relation, and above all an *evidence class* (the 317
evidence-class sub-typing reports, §4b, all fall here, alongside the root and
relation gaps). **Editorial-compression (29%)** is upstream lineage loss — the
standards could hold the evidence, but MW/PWK already discarded it. Only 9% is a
CDSL-markup gap and 6% print-layout compression. The qualitatively distinct small
causes are **sanskrit-convention (<1%, 6 reports)** — losses inherent to a
lexicographic tradition, not fixable by either better encoding or a generic model
extension (the *kośa* fusion, §4a) — and a single **data-quality** report (an
unresolved `[sic]` marker). So the remedy splits three ways: a **standards
extension layer** for the model-vocabulary gaps (§8), **cross-dictionary lineage
modeling** for the editorial-compression losses (§7), and a
**tradition-specific ODD customisation** for the sanskrit-convention losses. The
369 editorial-compression reports all carry `extensionNeeded: false` (the
standards are not at fault); the 317 evidence-class and 6 sanskrit-convention
reports carry `true` (they need a model extension or the kośa Lex-0 customisation).

## 3. Where the stress concentrates (phenomenon)

| phenomenon | n | % |
|---|--:|--:|
| source-collapse | 369 | 29% |
| generic-lexicographer-hedge | 234 | 18% |
| citation-coordinate | 222 | 17% |
| continuation-parent | 80 | 6% |
| named-kosha-citation | 79 | 6% |
| compound-subentry | 75 | 6% |
| compound-decomposition | 75 | 6% |
| root-as-entry | 60 | 5% |
| root-as-derivational-base | 60 | 5% |
| editorial-reference | 16 | 1% |
| sense-citation-fusion | 6 | <1% |
| source-anomaly | 1 | <1% |

`source-collapse` is the single largest phenomenon (29%), ahead of the MW
`L.` hedge (18%) and the unparsed `citation-coordinate` (17%). The five
evidence-related phenomena — source-collapse, hedge, coordinate, kośa citation
and editorial reference — together are **72%** of the corpus: the evidence
problem, not derivation or compounding, is the centre of gravity (§4, §4b).

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

### 4b. Evidence-class sub-typing — the model-vocabulary gap, measured

The 317 evidence-class reports make precise *what kind* of concept the semantic
model lacks. The flat `frac:Attestation` carries every named citation as a string,
but cannot say what it *is*:

| phenomenon | reports | what is flattened |
|---|--:|---|
| citation-coordinate | 222 | a citation's textual coordinate (`AV. 6,116,1.`) kept as a flat abbr string, not parsed into a structured `locus` / `citedRange`. |
| named-kosha-citation | 79 | indigenous *kośa* sources (Amara, Medinī, Hemacandra, …) modeled identically to textual attestations — the lexicon-vs-text distinction is lost. |
| editorial-reference | 16 | self / catalogue references (`ib.`, `W.`, `MW.`, `Verz`) modeled as named-source citations — their non-attestation role is not distinguished. |

Each report carries `sourceEvidence.count` and a deduplicated `sample` of the
offending citation strings, and `extensionNeeded: true`: unlike source-collapse
(where the evidence is already gone), here the evidence *survives* the mapping —
only its class is lost, recoverable by an OntoLex/FrAC vocabulary extension that
sub-types attestations (text vs *kośa* vs editorial) and parses citation
coordinates. This is the concrete content of the §2 model-vocabulary-gap that now
leads the corpus, and the §8 extension layer's primary target.

**The remedy is now implemented in both target standards and validated.** OntoLex
emits a sub-typed `csl:evidenceClass` ∈ {`textual`, `hedge`, `kosha`, `editorial`}
on every `frac:Attestation`, parsing a coordinate-bearing citation into
`csl:citedWork` + `csl:citedRange` ([scripts/lib/evidence.mjs](../scripts/lib/evidence.mjs),
[export-ontolex.mjs](../scripts/export-ontolex.mjs)); the [SHACL profile](../data/schema/ontolex-frac-profile.shacl.ttl)
constrains the class with `sh:in`, and all 250 graphs conform under pySHACL. The
TEI archival and Lex-0 exports carry the same class as `@subtype` (plus a
`<citedRange>`) on every citation `<bibl>`, validated against the compiled TEI
RELAX NG with jing — so the construct is symmetric across both standards. Each
loss report names its remedy in `mappedAs`, so the closure is measurable:
`analyze-loss`'s `extensionCoverage` shows **569 of 569** OntoLex
model-vocabulary-gap losses needing an extension map to an implemented `csl:`
construct (the four evidence classes, plus the already-implemented
`csl:RootRelation` and `decomp:ComponentList`). This is *not* a claim that the
loss vanished from the base standards — the gap against vanilla OntoLex/FrAC is
still recorded — but that the proposed extension exists as a working, validated
artefact, not only as prose (the detectors are heuristic, so the counts remain a
lower bound on each evidence class).

## 5. Coverage gaps — what the instrument does not yet measure

Honest limits of the current pilot, recorded so they are not mistaken for absence
of the phenomena (the roadmap's "do not hide model failures").

- **Named citations are now materialized in the neutral model** (done). The model
  carries 2617 citation objects — 116 `generic-lexicographer-hedge` and **2501
  `named-source-citation`** (PWG 1872, MW 379, PWK 366, capped at 12 per
  dictionary), each tagged with its `dictionary`. The TEI Lex-0 export emits them
  as entry-level `<bibl type="named-source" source="#dict-…">`, so a lemma like
  *arcya* — uncited in MW — carries PWG's named sources. **Senses are extracted
  and sense-linked for all three dictionaries** in the neutral model: MW (English,
  224/250 entries, 414 senses, 244 sense-linked — also rendered into the TEI Lex-0
  entry, §6) and the German Petersburg dictionaries via their explicit `<div>` +
  `{%…%}` structure — PWG (214/250, 455 senses, 431 linked) and PWK (203/250, 939
  senses, 216 linked), carried on each source record (`records.{pwg,pwk}.senses`).
  PWG/PWK senses are not folded into the single TEI Lex-0 entry (a tri-source
  merge is OntoLex-Lexicog's job, not the Lex-0 baseline's), so those citations
  stay entry-level in the Lex-0 export while being sense-linked in the model — and
  the **OntoLex export now surfaces the full multi-resource view**: a `lexicog:Entry`
  per source dictionary with `frac:Attestation`s attesting the specific sense.
- **All schema *phenomena* are now emitted** (done): `named-kosha-citation`,
  `citation-coordinate` and `editorial-reference` — previously defined in
  [LOSS_REPORT_SCHEMA.md](LOSS_REPORT_SCHEMA.md) but unused — are emitted as the
  evidence-class sub-typing family (§4b), alongside the already-emitted
  `source-collapse`. `analyze-loss` reports `schemaPhenomenaNotEmitted: []`.
- **Every roadmap failure cause is now emitted** (done): `data-quality` is emitted
  for source records carrying an `[sic]` marker (one case in the pilot), and
  `sanskrit-convention` for the kośa fusion (§4a). `roadmapCausesNotEmitted: []`.
  The detectors are heuristic (curated *kośa*-sigla and editorial-abbreviation
  patterns, a coordinate regex, a literal `[sic]` match), so the counts are a
  lower bound on each class, not a philological census.
- **No `failure` status** is emitted: nothing in the pilot is a total mapping
  failure (every case maps as `clean`, `partial` or `lossy`). This is left as an
  honest empty cell rather than forced.

## 6. Reviewer-trust note

Of the 1277 reports, 96 (the 15 high-stress review-slice keys) are marked
`reviewed`; the rest are `machine` (the §4b evidence-class and §4a kośa reports
are all `machine`). The **target** asymmetry of §1 holds within
the reviewed slice — TEI is never lossy there (0 of 33) and OntoLex is never
clean (20 lossy, 13 partial) — so it is not an artefact of unreviewed heuristics.
(The 6 `tei`-lossy reports in the full corpus are the indigenous *kośa* fusion,
all `machine`, and fall outside the Western review slice.) The **source**
asymmetry (the neutral lane being the *most* lossy) is a full-corpus measurement:
the review slice is deliberately root/hedge-heavy, so it contains only 30 of the
369 source-collapse reports (10 lossy, 20 partial) and does not, on its own, show
the lineage-collapse magnitude.
