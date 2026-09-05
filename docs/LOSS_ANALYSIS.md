_Created: 13-06-2026 · Last updated: 05-09-2026_

# Loss-Report Analysis (Month 3)

Quantitative analysis of the pilot loss reports and the MW/PWG/PWK
cross-dictionary signal. This backs [PAPER_OUTLINE.md](https://github.com/sanskrit-lexicon/csl-standards/blob/main/docs/PAPER_OUTLINE.md) §7
(PWG→PWK→MW transformations), §8 (Standards Critique), Figure 2 (evidence-class
comparison), and Figure 5 (loss-report distribution).

All numbers here are **regenerable**: run `npm run analyze-loss`
([`scripts/analyze-loss-reports.mjs`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/scripts/analyze-loss-reports.mjs)),
which reads [`data/pilot/loss-reports.json`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/data/pilot/loss-reports.json) and
[`data/pilot/neutral-model.json`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/data/pilot/neutral-model.json) and writes the
machine artifact [`data/pilot/loss-analysis.json`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/data/pilot/loss-analysis.json).
Do not hand-edit the tables below — re-run the script.

Corpus: **1722 loss reports** across the 250 Western cases and 6 indigenous *kośa*
entries. Five families are present:

Scale robustness is recorded separately in [SCALE_STABILITY.md](https://github.com/sanskrit-lexicon/csl-standards/blob/main/docs/SCALE_STABILITY.md):
500- and 1000-case runs preserve the central asymmetry, evidence-loss dominance, and
complete extension/lineage coverage while leaving this canonical 250-case corpus
unchanged. (The scale check predates the MDF lane and covers the TEI / OntoLex /
neutral lanes.)

- **Target-model losses** (876): what TEI / OntoLex / MDF cannot hold when mapping
  a CDSL record. Generated per case per target per phenomenon — the probe set is
  symmetric, so each target lane carries the same **292** probe reports; OntoLex
  additionally carries the 470 evidence-class reports below, and TEI the 6 fusion
  reports. The MDF lane's 292 (all `lossy`; hedge 117, compound-decomposition 75,
  root-as-derivational-base 60, continuation-parent 40) are deliberately *not*
  extension targets (`extensionNeeded: false` throughout): a flat interchange
  format is not extended, so each names its `\nt` model-loss marker in `mappedAs`
  (e.g. `\bb L. + \nt model-loss marker`) — recorded, not remedied.
- **Source-collapse losses** (369): named evidence the *dictionary lineage* itself
  drops along PWG → PWK → MW. These are `target: "neutral"` because TEI and
  OntoLex can both hold named citations — the loss is editorial, upstream of any
  model choice, so `extensionNeeded` is `false`.
- **Evidence-class sub-typing losses** (470): named citations the flat
  `frac:Attestation` model carries but cannot *type* — indigenous *kośa* sources
  (`named-kosha-citation`), editorial/self references (`editorial-reference`), and
  the unparsed textual coordinates inside a citation (`citation-coordinate`). All
  are `target: "ontolex"`, cause `model-vocabulary-gap`, `extensionNeeded: true`:
  the information survives as a flat string but its evidence class is lost (§4b).
  This family now also covers the optional dictionaries' citations (AP90 73,
  GRA 77, BEN 3 reports): an optional dictionary's named evidence enters the OntoLex graph
  and is flattened by the same gap, so it is recorded by the same construct rather
  than silently excluded.
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
| ontolex | 0 | 662 | 100 | 0 |
| mdf | 0 | 0 | 292 | 0 |
| neutral | 0 | 128 | 242 | 0 |

**Target asymmetry (Western cases).** For the 250 MW/PWG/PWK cases the TEI
archival profile is never `lossy` (75 clean, 217 partial); OntoLex is never
`clean` (662 partial, 100 lossy). TEI can always at least preserve the dictionary
*as an edition*; OntoLex never merely transcribes, so it either relates the data
or drops what it cannot relate. The models do not fail — they **succeed
differently** ([PAPER_OUTLINE.md](https://github.com/sanskrit-lexicon/csl-standards/blob/main/docs/PAPER_OUTLINE.md) §3). The only `tei`-lossy
reports (6) are *not* Western: they are the indigenous *kośa* sense/citation
fusion in the Lex-0 baseline (§4a) — a different TEI profile and a different
lexicographic tradition.

**Flat-target asymmetry (MDF).** The MDF lane is never anything *but* `lossy`
(0 clean, 0 partial, 292 lossy): on every probed phenomenon the flat field
schema drops the distinction entirely — there is no field to be partially
adequate *with*. This is by design (lossiness is the finding, not a failure —
[MDF_EXPORT_MAPPING.md](https://github.com/sanskrit-lexicon/csl-standards/blob/main/docs/MDF_EXPORT_MAPPING.md)): the lane measures which CDSL
distinctions are structurally load-bearing, and every one probed turned out to
be.

**Source asymmetry.** Among the rich-model lanes the `neutral` lane (the
dictionary lineage, before any model) is the *most* lossy: 242 lossy, 128
partial, 0 clean. Much of what looks like "interoperability loss" is in fact
loss that already happened in the 19th-century editorial chain, recoverable only
by reading across PWG, PWK, and MW together (see §4).

Overall status: 1007 partial (58%), 640 lossy (37%), 75 clean (4%).

## 2. Failure classification (by cause)

| failureClassification | n | % |
|---|--:|--:|
| model-vocabulary-gap | 1034 | 60% |
| editorial-compression | 369 | 21% |
| print-compression | 120 | 7% |
| cdsl-markup-gap | 117 | 7% |
| none (clean) | 75 | 4% |
| sanskrit-convention | 6 | <1% |
| data-quality | 1 | <1% |

The two leading causes tell different stories. **Model-vocabulary-gap (60%)** is
the largest: downstream losses where the target standard lacks a concept — a
derivational-base relation, and above all an *evidence class* (the 470
evidence-class sub-typing reports, §4b, all fall here, alongside the root and
relation gaps, and the MDF lane's 252 flat-field gaps). **Editorial-compression
(21%)** is upstream lineage loss — the standards could hold the evidence, but
MW/PWK already discarded it. 7% is print-layout compression (which now includes
the 40 MDF continuation reports — MDF has no continuation concept, so adjacency
must be resolved before export) and 7% a CDSL-markup gap. The qualitatively
distinct small causes are **sanskrit-convention (<1%, 6 reports)** — losses
inherent to a lexicographic tradition, not fixable by either better encoding or a
generic model extension (the *kośa* fusion, §4a) — and a single **data-quality**
report (an unresolved `[sic]` marker). So the remedy splits three ways: a
**standards extension layer** for the TEI/OntoLex model-vocabulary gaps (§8),
**cross-dictionary lineage modeling** for the editorial-compression losses (§7),
and a **tradition-specific ODD customisation** for the sanskrit-convention
losses. The 369 editorial-compression reports carry `extensionNeeded: false`
(the standards are not at fault), as do all 292 MDF reports (a flat interchange
format is recorded, not extended); the extension flag concentrates in the
OntoLex lane (762) and the TEI hedge/fusion reports (123).

## 3. Where the stress concentrates (phenomenon)

| phenomenon | n | % |
|---|--:|--:|
| source-collapse | 369 | 21% |
| citation-coordinate | 363 | 21% |
| generic-lexicographer-hedge | 351 | 20% |
| compound-decomposition | 150 | 9% |
| root-as-derivational-base | 120 | 7% |
| continuation-parent | 120 | 7% |
| named-kosha-citation | 91 | 5% |
| compound-subentry | 75 | 4% |
| root-as-entry | 60 | 3% |
| editorial-reference | 16 | 1% |
| sense-citation-fusion | 6 | <1% |
| source-anomaly | 1 | <1% |

`source-collapse` is the single largest phenomenon (21%), just ahead of the
unparsed `citation-coordinate` (21%) and the MW `L.` hedge (20% — the hedge's
weight grew with the MDF lane, which cannot carry it at all: 117 of its 351
reports are MDF). The five evidence-related phenomena — source-collapse, hedge,
coordinate, kośa citation and editorial reference — together are **69%** of the
corpus: the evidence problem, not derivation or compounding, is the centre of
gravity (§4, §4b).

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

**The collapse is now an explicit modeled relation.** Because this loss is
upstream (the standards *could* hold the evidence; the 19th-century editorial chain
dropped it), the remedy is a *modeling* construct rather than a target extension:
the OntoLex export emits a **`csl:LineageRelation`** per transition — PWG → PWK
(`abridgement`) and PWG → MW (`recomposition`) — carrying
`csl:sourceCitationCount` / `csl:retainedCitationCount` /
`csl:droppedCitationCount` (e.g. *ac*: 35 → 8 = 27 dropped; 35 → 3 = 32 dropped),
SHACL-validated via `csl:LineageRelationShape` (EXTENSION_PROPOSAL.md §4a). Each
source-collapse report names this remedy in `mappedAs`; `analyze-loss`'s
`lineageCoverage` shows **369 of 369** source-collapse losses modeled (250
abridgement + 119 recomposition). The degradation of evidential certainty along
the lineage is now a first-class, queryable assertion, not only an inference from
counts.

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

The 470 evidence-class reports make precise *what kind* of concept the semantic
model lacks. The flat `frac:Attestation` carries every named citation as a string,
but cannot say what it *is*:

| phenomenon | reports | what is flattened |
|---|--:|---|
| citation-coordinate | 363 | a citation's textual coordinate (`AV. 6,116,1.`) kept as a flat abbr string, not parsed into a structured `locus` / `citedRange`. |
| named-kosha-citation | 91 | indigenous *kośa* sources (Amara, Medinī, Hemacandra, …) modeled identically to textual attestations — the lexicon-vs-text distinction is lost. |
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
`csl:citedWork` + `csl:citedRange` ([scripts/lib/evidence.mjs](https://github.com/sanskrit-lexicon/csl-standards/blob/main/scripts/lib/evidence.mjs),
[export-ontolex.mjs](https://github.com/sanskrit-lexicon/csl-standards/blob/main/scripts/export-ontolex.mjs)); the [SHACL profile](https://github.com/sanskrit-lexicon/csl-standards/blob/main/data/schema/ontolex-frac-profile.shacl.ttl)
constrains the class with `sh:in`, and all 250 graphs conform under pySHACL. The
TEI archival and Lex-0 exports carry the same class as `@subtype` (plus a
`<citedRange>`) on every citation `<bibl>`, validated against the compiled TEI
RELAX NG with jing — so the construct is symmetric across both standards. Each
loss report names its remedy in `mappedAs`, so the closure is measurable:
`analyze-loss`'s `extensionCoverage` shows **722 of 722** OntoLex
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
  carries **3844 named-source citations**, each tagged with its dictionary. Optional
  dictionaries beyond the tri-dict backbone are attached via a registry
  ([scripts/lib/dictionaries.mjs](https://github.com/sanskrit-lexicon/csl-standards/blob/main/scripts/lib/dictionaries.mjs)): Apte 1890
  (AP90, 133/250 cases), Grassmann's Rig-Veda Wörterbuch (GRA, 109/250), the Frish
  Sanskrit Reader (FRI, 87/250), and Benfey Sanskrit-English 1866 (BEN, 142/250).
  They now enter **all four profiles**: OntoLex, archival TEI, TEI Lex-0, and the
  loss corpus. FRI broadens source/sense coverage without named citations; AP90,
  GRA, and BEN add sense-linked evidence where their `<ls>` apparatus supports it.
  Optional-dictionary evidence contributes to the same measured evidence-class gap:
  AP90 73, GRA 77, and BEN 3 reports in the current 470-report family.
- **All schema *phenomena* are now emitted** (done): `named-kosha-citation`,
  `citation-coordinate` and `editorial-reference` — previously defined in
  [LOSS_REPORT_SCHEMA.md](https://github.com/sanskrit-lexicon/csl-standards/blob/main/docs/LOSS_REPORT_SCHEMA.md) but unused — are emitted as the
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

Of the 1722 reports, 129 (the 15 high-stress review-slice keys) are marked
`reviewed`; the rest are `machine` (the §4b evidence-class and §4a kośa reports
are all `machine`). The **target** asymmetry of §1 holds within
the reviewed slice — TEI is never lossy there (0 of 33), OntoLex is never
clean (20 lossy, 13 partial), and the MDF reports are uniformly lossy (33 of
33) — so it is not an artefact of unreviewed heuristics.
(The 6 `tei`-lossy reports in the full corpus are the indigenous *kośa* fusion,
all `machine`, and fall outside the Western review slice.) The **source**
asymmetry (the neutral lane being the *most* lossy) is a full-corpus measurement:
the review slice is deliberately root/hedge-heavy, so it contains only 30 of the
369 source-collapse reports (10 lossy, 20 partial) and does not, on its own, show
the lineage-collapse magnitude.

_Dr. Mārcis Gasūns_
