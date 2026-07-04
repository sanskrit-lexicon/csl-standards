# A Serialization Standard for the Petersburg-Family Sanskrit Dictionaries: Evidence, Derivation, and Compression across TEI, OntoLex, and MDF

*Working draft. The numbers, tables, and figures in this paper are regenerable
from the workbench (`npm run build-pilot`); see [§14 Availability](#14-availability-and-reproducibility).
This draft is generated from [docs/PAPER_OUTLINE.md](PAPER_OUTLINE.md) and the
machine artefacts it cites. Former working title: "Sanskrit Lexicography Between
TEI and OntoLex"; reframed 2026-07-03 around the serialization-standard
contribution with three export profiles (see
[A27_review_fable5.md](A27_review_fable5.md)).*

## Abstract

This paper proposes a serialization standard for the Petersburg family of CDSL
Sanskrit dictionaries — Monier-Williams 1899 (MW), the large Petersburg dictionary
(PWG), and the shorter Petersburg dictionary (PWK) — built on a dictionary-neutral
model with parallel export profiles, and uses the family as a stress test for
lexicographic interoperability. Rather than converting
dictionary XML mechanically, we ask whether the *lexicographic meaning* of these
works survives mapping into complementary standard models: TEI as an archival
representation of dictionary text, OntoLex-Lemon as a semantic graph of lexical
knowledge, and SIL's Multi-Dictionary Formatter (MDF) as the flat field format the
language-documentation community consumes. From a 250-case deterministic sample of deliberately hard cases we
generate a dictionary-neutral model and, from it, parallel TEI, OntoLex, and MDF
profiles, recording every degradation as an evidence-bound *loss report*. The
resulting corpus of 1,722 reports shows that the models fail **asymmetrically**:
TEI is never lossy for the Western cases but never reaches the semantic graph;
OntoLex is never a clean transcription but exposes reusable relations; MDF, the
deliberately flat target, is never anything *but* lossy on the probed phenomena —
which distinctions it drops is itself a measurement of what is structurally
load-bearing in these dictionaries. The single
largest difficulty is not derivation or compounding but **evidence** — the class of
a citation (a textual attestation, an indigenous *kośa* authority, an editorial
reference, or the lexicographer-only hedge) and its degradation along the
PWG → PWK → MW lineage. We then take the diagnosis to its conclusion: we specify a
small Sanskrit-lexicographic extension layer in a `csl:` namespace, **implement it
in both target standards, and validate it** against a SHACL profile (pySHACL) and a
compiled TEI RELAX NG schema (jing). Every model-vocabulary loss that needs an
extension maps to an implemented, schema-validated construct (722 of 722), and the
upstream lineage collapse is made an explicit, queryable relation (369 of 369). The
accompanying public workbench publishes the raw CDSL snippets, the neutral model,
the TEI/OntoLex/MDF views, the loss reports, and the validators.

## 1. Introduction

Historical Sanskrit dictionaries are dense, highly compressed knowledge systems
that evolved through a complex textual lineage. Among them, MW, PWG, and PWK — the
Petersburg family, one editorial lineage in three redactions — stand as monumental
achievements of 19th-century lexicography. This paper proposes a serialization
standard for that family: a dictionary-neutral model of what these works assert,
with parallel export profiles into the standard models their different consumers
already read — the Text Encoding Initiative (TEI) guidelines, in an archival
profile and a TEI Lex-0 baseline, for editorial representation of dictionary text;
the OntoLex-Lemon model (with its Lexicog and FrAC modules) for semantic graph
representation of lexical knowledge; and SIL's Multi-Dictionary Formatter (MDF)
for the flat field-record format of the language-documentation community. The
family makes an exacting test bed for such a standard: the three dictionaries
share a direct intellectual lineage yet employ very different representational
strategies for derivation, evidence, and abbreviation. We argue that a
serialization standard must preserve not just structural tags but the underlying
lexicographic *assertions* these dictionaries make — above all their evidential
and derivational claims — and its evaluation core is therefore a measured
comparison of how the profiles hold or lose those assertions.

Our contribution is in three parts. First, an **instrument**: a reproducible
pipeline that samples hard cases, maps them through the profiles, and records
every loss as a structured, evidence-bound report. Second, a **diagnosis**: a
quantitative account of where and why each target standard loses meaning, which
shows the failures to be systematic and asymmetric rather than incidental. Third,
a **remedy**: a small extension layer, implemented and schema-validated in the
two rich standards, that closes the model-vocabulary gaps the diagnosis identifies
and makes the upstream editorial collapse an explicit relation. (The flat MDF
profile is deliberately not extended: its losses are recorded in-band as model-loss
notes, because which distinctions a flat schema drops is itself a finding.) The
remedy is the part that distinguishes this work from a survey of difficulties: the
proposed constructs are not sketches but running, validated code over the full
sample.

## 2. Data and Prior Work

The primary data derive from the digitized editions maintained by the Cologne
Digital Sanskrit Dictionaries (CDSL) project. CDSL provides invaluable digitized
XML, but its encoding schemas remain highly project-specific; the digitization of
MW analysed its markup of literary sources and lexical apparatus in detail
(Funderburk & Malten, 2008). Among MW's structural idioms, the `L.` marker is
explicitly evidential rather than bibliographic: Monier-Williams glosses it as
*"lexicographers"* — "a word or meaning which, although given in native lexicons,
has not yet been met with in any published text" (Monier-Williams, 1899) — so it
records that a word's only attestation is the indigenous lexicon tradition. The
MW–Petersburg lineage is likewise well established: Steiner (2020) demonstrates
Monier-Williams's substantial reliance on Böhtlingk–Roth for meanings, revising
earlier assessments of MW's semantic independence. The compression of PWG's
expansive named *kośa* apparatus through PWK into MW is thus an editorial lineage
this paper measures directly.

On the standards side we evaluate the TEI dictionaries module, which models the
physical and editorial structure of the text, alongside OntoLex-Lemon (McCrae,
Spohr & Cimiano, 2011) — including OntoLex-Lexicog (multi-resource lexicographic
structure) and the Frequency, Attestation and Corpus (FrAC) module (Chiarcos et
al., 2022) — which models conceptual and semantic relations. The TEI Lex-0
baseline (DARIAH-EU "Lexical Resources" WG) serves as a normalised interchange
target distinct from a full archival profile. We treat all of these as fixed targets and
ask what they can and cannot hold; where they cannot, we extend them rather than
abandon them.

A third export profile targets SIL's **Multi-Dictionary Formatter (MDF)** standard-format
markers (Toolbox/FLEx lineage; Coward & Grimes, 2000) — a deliberately *flat*,
line-oriented field record that the language-documentation community reads directly.
Its mapping over the same neutral model was adopted by the project on 2026-07-02
and is implemented: a serializer and marker-profile validator generate and check
MDF records for all 250 cases, and MDF runs as a third measured lane of the loss
corpus ([docs/MDF_EXPORT_MAPPING.md](MDF_EXPORT_MAPPING.md)). MDF earns its place
for two reasons. First, reach with external corroboration: the MUDIDI dictionary-digitization
benchmark (Setiawan et al., 2026) uses MDF as its parsing target across 30 public-domain
dictionaries (including Sanskrit–English) and shows machine parsing into MDF to be strong
but *convention-dependent* — exactly the prior knowledge CDSL's curated markup already
supplies. Second, as a schema stress test from the opposite direction: where TEI and
OntoLex are rich, MDF is intentionally poor, so mapping into it surfaces which CDSL
distinctions are structurally load-bearing rather than presentational. Where MDF has no
field for a distinction — notably the `L.` evidential hedge — the gap is recorded on the
same `clean`/`partial`/`lossy` scale as the other two profiles: for a flat target,
lossiness is the finding, not a failure.

## 3. Method

To test the limits of the target standards systematically, we built an automated
pipeline that targets hard cases of interoperability ([scripts/](../scripts/),
run with `npm run build-pilot`; the architecture is sketched in Figure 1). The
stages are:

1. **Sample.** A deterministic 250-case slice of MW/PWG/PWK lemmas, selected to
   over-represent difficulty: the `L.` hedge, named *kośa* citations, verbal
   roots, compounds, continuation (suppressed-headword) entries, and
   citation-compression between the three dictionaries. Selection is reproducible
   and resizable (`--max N`), and a fixed 15-case slice is reserved for the
   stricter, human-reviewable review tier.
2. **Neutral model.** For each case we extract a dictionary-neutral JSON model
   that suspends commitment to any standard: the lemma, materialised `<ls>`
   citations tagged by dictionary, senses for all three dictionaries, and the raw
   source records. This is the canonical layer from which all profiles and the
   loss reports are derived, so the profiles are commensurable.
3. **Parallel profiles.** From the neutral model we generate a **TEI archival**
   mapping (editorial structure plus the full CDSL records preserved as escaped
   quotes), a **TEI Lex-0** baseline, an **OntoLex/FrAC** mapping (a linked-data
   graph of entries, senses, attestations, and relations, emitted as JSON-LD and
   Turtle), and an **MDF** serialization (one standard-format field record per
   case, with in-band `\nt` model-loss markers where the flat schema drops a
   distinction).
4. **Loss reports.** Every case is mapped against each target and each phenomenon
   is classified `clean`, `partial`, or `lossy`, with a cause
   (`model-vocabulary-gap`, `editorial-compression`, `cdsl-markup-gap`,
   `print-compression`, `sanskrit-convention`, `data-quality`, or `none`), an
   `extensionNeeded` flag, and an evidence payload. The loss report is the unit of
   analysis: *no lossy mapping silently passes as clean*.

The schema for a loss report is given in
[docs/LOSS_REPORT_SCHEMA.md](LOSS_REPORT_SCHEMA.md); the full quantitative analysis
is in [docs/LOSS_ANALYSIS.md](LOSS_ANALYSIS.md), regenerable with
`npm run analyze-loss`.

## 4. The Loss Corpus: An Asymmetry of Success

The pilot yields **1,722 loss reports** over 256 cases (the 250 Western cases
plus the six indigenous *kośa* entries of §9). Overall, 1007 are `partial`
(58%), 640 `lossy` (37%), and 75 `clean` (4%). The central finding is in the
cross-tabulation of target against status (Figure 5):

| target | clean | partial | lossy |
|---|--:|--:|--:|
| TEI (archival) | 75 | 217 | 6 |
| OntoLex | 0 | 662 | 100 |
| MDF | 0 | 0 | 292 |
| neutral (lineage) | 0 | 128 | 242 |

The models do not fail; they **succeed differently**. For the Western cases
the TEI archival profile is *never* lossy (75 clean, 217 partial): TEI can always
at least preserve the dictionary as an edition. OntoLex is *never* clean (662
partial, 100 lossy): it never merely transcribes, so it either relates the data or
drops what it cannot relate. MDF, the deliberately flat third profile, is never
anything *but* lossy (292 of 292): on every probed phenomenon there is no field to
be partially adequate *with*, so the lane reads as a census of which CDSL
distinctions are structurally load-bearing — every one probed turned out to be.
The only TEI-lossy reports (6) are not Western at all —
they are the indigenous *kośa* sense/citation fusion in the Lex-0 baseline (§9), a
different profile and a different lexicographic tradition.

A further lane, `neutral`, measures loss in the dictionary *lineage itself*, before
any model choice. Among the rich-model lanes it is the most lossy (242 lossy, 128
partial, 0 clean): much of what looks like "interoperability loss" is in fact loss
that already happened in the 19th-century editorial chain, recoverable only by
reading across PWG, PWK, and MW together (§8).

By cause, the corpus splits as: **model-vocabulary-gap 60%** (the target standard
lacks a concept), **editorial-compression 21%** (upstream lineage loss the
standards could have held), print-compression 7%, CDSL-markup-gap 7%, clean 4%, and
the small but qualitatively distinct `sanskrit-convention` and `data-quality`
(<1% each). By phenomenon, the leaders are `source-collapse` (21%), the unparsed
`citation-coordinate` (21%), and the MW `L.` hedge (20% — its weight grew with the
MDF lane, which cannot carry it at all); the five
evidence-related phenomena together are **69%** of the corpus. The centre of
gravity is evidence, not derivation or compounding.

## 5. Evidence and Provenance

The treatment of evidence is the primary stress point. A named *kośa* citation in
PWG is an explicit attestation in the indigenous lexicographic tradition; the MW
`L.` hedge is a generalized marker that a word is known only from native
lexicographers and lacks textual attestation; an editorial reference (*ib.*, *W.*,
*MW.*, a catalogue) points within the lexicographic tradition rather than at a
text; and a textual citation carries a coordinate (book, hymn, verse). Mapped to
the standards' default vocabulary, all of these flatten to a generic bibliographic
link, and the coordinate is locked inside a string.

We claim the evidence *class* is not decoration but a component of lexical meaning:
an interoperable model must distinguish a direct textual attestation from a
secondary lexicographic hedge, an indigenous *kośa* authority, and an editorial
reference, and must expose the citation's coordinate as structured data. This is
the single largest source of model-vocabulary loss, and §10 reports the construct
that closes it.

## 6. Roots and Derivation

Sanskrit lexicography is deeply structured around verbal roots (*dhātu*). In the
MW–PWG–PWK lineage a root functions simultaneously as a standalone entry and as the
derivational scaffolding for a family of words. Modelled as a plain
`ontolex:LexicalEntry`, the derivational role is lost; modelled only as text, the
grammatical function is lost. A faithful model must carry the root *as* an entry
*and* as a derivational base, with its grammatical class and a pointer into the
established root inventory.

## 7. Compounds and Continuations

The compression of MW, PWG, and PWK relies on nested subentries for compounds and
on continuation (suppressed-headword) entries recovered from page adjacency.
Compounds expose a tension between the printed layout and the semantic ontology:
TEI excels at preserving the subentry and adjacency as printed, while OntoLex is
suited to exposing the component decomposition and parent–child relations. Forcing
these into a single flat entry — as simplified pipelines do — loses both archival
fidelity and semantic relation. Continuation entries raise a distinct hazard: the
parent must be *reconstructed* from adjacency, and must therefore never be asserted
as if it were printed.

## 8. The PWG → PWK → MW Lineage

Tracing entries across the three dictionaries shows that compression and
translation are not semantically neutral. PWK abridges and reinterprets PWG, often
discarding specific *kośa* citations for generalized summaries; MW recomposes the
Petersburg dictionaries in English, further simplifying the evidential apparatus
(collapsing specific references into `L.`). We measure this directly: of the 250
cases, PWK abridges PWG's named apparatus in **all 250** (123 drop it entirely, 127
retain a subset — e.g. *ac*: PWG 35 → PWK 8 → MW 3), and in **119 cases** MW
carries no citation where PWG named a textual source.

These 369 `source-collapse` losses are recorded with `target: neutral` and cause
`editorial-compression`, with an evidence payload of per-dictionary `<ls>` counts
and a sample of the dropped sources, because the loss is upstream of any model
choice — TEI and OntoLex can both represent named citations. The degradation of
evidential certainty along the lineage is the largest single cause-family, and §10
reports the relation that makes it explicit.

## 9. The Indigenous *Kośa*: A Tradition-Bound Construct

A qualitatively different loss appears in the indigenous *kośa* (here the SKD
register, six entries). A *kośa* binds a run of synonyms to its closing authority
formula (*iti amaraḥ*, *iti medinī*) as one indivisible *iti*-unit: sense
enumeration and source attestation are a *single construction*. The
sense/citation-separating standards cannot express this; the TEI Lex-0 baseline can
only split it into a `<def>` and a separate `<bibl>`. These are the only
TEI-`lossy` reports in the corpus (cause `sanskrit-convention`). Unlike the Western
losses, this is neither a model-vocabulary gap nor an editorial artefact but a
property of a lexicographic tradition — addressable only by a tradition-specific
customisation, not a generic extension (§10).

## 10. From Measured Loss to Validated Remedy

The diagnosis above is actionable: each loss cause points to a concrete construct.
We specify these in a `csl:` namespace, tie each to the loss it answers, and — the
step that distinguishes this work — **implement and validate** all of them over the
full sample ([docs/EXTENSION_PROPOSAL.md](EXTENSION_PROPOSAL.md)). The constructs
fall into two kinds: *target extensions* (new TEI/OntoLex vocabulary for
model-vocabulary gaps) and *modeling constructs* (which make an upstream loss
explicit without claiming to recover it).

- **Evidence class (§1 of the proposal).** Every OntoLex `frac:Attestation`
  carries a sub-typed `csl:evidenceClass` ∈ {`textual`, `hedge`, `kosha`,
  `editorial`}, and a coordinate-bearing citation parses into `csl:citedWork` +
  `csl:citedRange` (`AV. 6,116,1.` → `AV.` / `6,116,1`). The construct is
  **symmetric across both standards**: every TEI citation `<bibl>` in the archival
  and Lex-0 profiles carries the same class as `@subtype` plus a `<citedRange>`.
- **Root relation (§2).** `csl:RootRelation` (with a pointer into the root
  inventory) models the root as a derivational base, distinct from a plain entry.
- **Decomposition (§3).** `decomp:ComponentList` exposes the compound's components
  with a status flag recording whether the segmentation is asserted or
  machine-derived.
- **Continuation recovery status (§4).** `csl:ContinuationRelation` carries
  `csl:recoveryStatus` ∈ {`recovered`, `conjectured`, `unresolved`} (TEI: the same
  on the continuation `<xr>` `@subtype`), so a parent reconstructed from adjacency
  is never asserted as if printed.
- **Source-collapse lineage (§4a).** A `csl:LineageRelation` per transition —
  PWG → PWK (`abridgement`) and PWG → MW (`recomposition`) — carries the
  source/retained/dropped citation counts, making the lineage collapse a
  first-class, queryable assertion rather than an inference from counts.
- **Kośa sense-boundary (§5).** A TEI Lex-0 ODD customisation treats the authority
  formula as the boundary of the *iti*-unit: each *kośa* entry declares the
  convention, the authority is emitted as a typed `<bibl type="kosa-authority">`,
  and every *iti*-unit carries a `<note type="model-loss">` witnessing the fusion,
  so the convention is *declared*, not silently flattened.

The remedy is **measured**. Every loss report names the construct that answers it
in a `mappedAs` field, so coverage is regenerable, not asserted. Of the OntoLex
`model-vocabulary-gap` losses that need an extension, **722 of 722** map to an
implemented construct (`extensionCoverage`); of the upstream source-collapse
losses, **369 of 369** are now modeled by a lineage relation (`lineageCoverage`,
250 abridgement + 119 recomposition). The distinction matters: the evidence-class
work *closes* a downstream gap (the standard now carries the class), whereas the
lineage relation *records* an upstream loss (the evidence is genuinely gone from the
lineage; we make its disappearance explicit, not recovered).

## 11. Validation and Reproducibility

Every construct is validated, not merely emitted. The OntoLex graphs are checked
against a SHACL profile
([data/schema/ontolex-frac-profile.shacl.ttl](../data/schema/ontolex-frac-profile.shacl.ttl))
with shapes for the lexical entry, source records, attestations (with an `sh:in`
constraint on the evidence class), the Lexicog multi-resource structure, the
continuation relation, and the lineage relation. The TEI is checked against a
RELAX NG schema compiled from project ODDs ([data/schema/](../data/schema/)), and
the Lex-0 ODD's Schematron (the kośa sense-boundary §9 and baseline-shape rules) is
compiled to an SVRL transform with the ISO Schematron skeleton. All are run by the
project validators in `build-pilot` and, independently, by an external harness
using real engines — **jing** for RELAX NG, a **Saxon + ISO Schematron skeleton**
SVRL engine for the Schematron, and **pySHACL** for SHACL — assembled by a portable,
no-admin toolchain ([docs/EXTERNAL_VALIDATION.md](EXTERNAL_VALIDATION.md)). The
external harness validates all 250 archival + 256 Lex-0 XML files (RELAX NG), runs
the Schematron over all 256 Lex-0 entries with **zero failed assertions**, and
validates all 250 RDF graphs (SHACL), with no failures — 1,014 checks, 0 skipped,
recorded in the committed
[external-validation-review.json](../data/pilot/external-validation-review.json)
(re-run 2026-07-03 with jing, Saxon+ISO-Schematron, and pySHACL installed; an
earlier committed run had recorded the non-SHACL layers as skipped for lack of the
toolchain). Running the real engines
was not cosmetic: real RNG validation exposed and we fixed three genuine
TEI-conformance bugs (a duplicate `xml:id`, an illegal `<sourceDesc>` content
model, and a misplaced `@target`) that the substring-level structural validators
had passed. The MDF profile has no external schema language to compile, so it is
validated in-pipeline against the project's marker profile
([data/schema/mdf-export-profile.json](../data/schema/mdf-export-profile.json)):
all 250 records pass, with 281 in-band `\nt` model-loss markers witnessing the
flat schema's drops ([data/pilot/mdf-review.json](../data/pilot/mdf-review.json)).

Reproducibility is built in. Generators honour `SOURCE_DATE_EPOCH` and otherwise
omit timestamps, so `build-pilot` is byte-stable; the five figures are deterministic
SVG ([scripts/build-figures.mjs](../scripts/build-figures.mjs)). The honest limits
of the instrument are recorded in [LOSS_ANALYSIS.md](LOSS_ANALYSIS.md) §5 rather
than hidden.

## 12. Limitations

The sample is 250 cases drawn from three dictionaries of one lineage; the
asymmetry findings are strong within it but their generality across other
dictionaries is only partially tested. The MDF lane is measured, but it postdates
the scale-stability check, which therefore covers the TEI, OntoLex, and neutral
lanes only; and MDF's uniform lossiness reflects the deliberately hard probe set —
routine MW entries serialize into MDF's core fields without incident, so the lane
measures the hard-case ceiling, not average-case fidelity. A scale-stability check reran the same
pipeline at 500 and 1000 cases in temporary restored workspaces
([docs/SCALE_STABILITY.md](SCALE_STABILITY.md)): the central asymmetry still held,
evidence-loss share stayed about 70%, and extension/lineage coverage remained
complete. The committed generated corpus remains the 250-case pilot so the paper
has a stable, reviewable dataset rather than shifting bulk artifacts. The optional-dictionary layer now tests
that generalisation beyond the tri-dict backbone: Apte 1890 (AP90, 133/250),
Grassmann's Rig-Veda Wörterbuch (GRA, 109/250), the Frish Sanskrit Reader (FRI,
87/250), and Benfey 1866 (BEN, 142/250) are attached through the registry and
woven across OntoLex, archival TEI, TEI Lex-0, and the loss corpus. Their coverage
is still uneven and source-dependent: FRI adds trilingual senses but no named
citations, while AP90/GRA/BEN add sense-linked evidence where their `<ls>`
apparatus supports it. Adding a dictionary is therefore mechanically cheap but
philologically variable. The evidence-class and lineage detectors are curated
heuristics (kośa sigla, editorial abbreviations, a coordinate
regex, a literal `[sic]`), so per-class counts are a **lower bound**, not a
philological census — for example, all-caps *kośa* sigla are currently read as
textual. Sense extraction is machine-derived and marked as such. The loss reports
record loss against the *standards*; where a remedy is the `csl:` extension, the
gap against vanilla TEI/OntoLex is still recorded, and "implemented" means a
working, schema-validated reference construct, not adoption by TEI or the OntoLex
community group — though each is validated by a real engine (jing for RELAX NG, a
Saxon + ISO Schematron skeleton SVRL engine for the Lex-0 Schematron, and pySHACL
for SHACL), not only by the project's own validators.

## 13. Conclusion

Sanskrit dictionaries are not edge cases to be normalized away by rigid standards.
The complexities of MW, PWG, and PWK reveal where dictionary interoperability needs
finer, more expressive concepts of evidence, derivation, and editorial
compression. Using TEI for archival preservation, OntoLex for semantic mapping,
and MDF for flat interchange with the language-documentation community — and
adding a small, validated extension layer where the rich standards fall short —
we can build digital lexicographic
models that respect the deep intellectual architecture of the originals. The
contribution is not a list of difficulties but a closed loop: every difficulty we
measured is answered by a construct we implemented and validated over the whole
sample.

## Figures

All five figures are reproducible SVG, generated by `npm run build-figures`
([scripts/build-figures.mjs](../scripts/build-figures.mjs)) into
[data/pilot/figures/](../data/pilot/figures/). Figures 1, 2, and 5 are driven by
[data/pilot/loss-analysis.json](../data/pilot/loss-analysis.json); Figures 3 and 4
are concept diagrams grounded in real pilot exemplars.

1. **Three-view architecture**: CDSL → neutral model → TEI/OntoLex/MDF.
   [figure-1-architecture.svg](../data/pilot/figures/figure-1-architecture.svg)
2. **Evidence-class collapse**: PWG named *kośa* citations vs the MW `L.` hedge —
   119/250 cases are `mw-uncited-pwg-cited`.
   [figure-2-evidence-collapse.svg](../data/pilot/figures/figure-2-evidence-collapse.svg)
3. **Root modeling**: a root as lexical entry vs derivational base (TEI
   `<etym type="root">` vs OntoLex `csl:RootRelation`).
   [figure-3-root-modeling.svg](../data/pilot/figures/figure-3-root-modeling.svg)
4. **Compound split**: TEI subentry/adjacency vs OntoLex `decomp:ComponentList`.
   [figure-4-compound-split.svg](../data/pilot/figures/figure-4-compound-split.svg)
5. **Loss-report distribution**: the TEI-never-lossy / OntoLex-never-clean /
   MDF-all-lossy asymmetry and the by-cause breakdown.
   [figure-5-loss-distribution.svg](../data/pilot/figures/figure-5-loss-distribution.svg)

## 14. Availability and Reproducibility

The CSL Standards workbench publishes the generated hard-case samples and the raw
JSON, TEI, RDF/Turtle, and MDF outputs, with an interactive view tracing the
pipeline from the original CDSL records through the neutral model to the final
XML, RDF, and field records. Everything in this paper is regenerable:

```sh
npm run build-pilot          # sample → neutral model → exports → validators → analysis → figures
npm run analyze-loss         # regenerate the loss-analysis tables
npm run validate-external    # real RNG (jing) + SHACL (pySHACL) over the full corpus
```

Key artefacts: the loss corpus
([data/pilot/loss-reports.json](../data/pilot/loss-reports.json)), the analysis
([data/pilot/loss-analysis.json](../data/pilot/loss-analysis.json)), the SHACL
profile and ODDs ([data/schema/](../data/schema/)), the MDF records
([data/pilot/mdf/](../data/pilot/mdf/)), and the extension proposal
([docs/EXTENSION_PROPOSAL.md](EXTENSION_PROPOSAL.md)). The validated-profile summary
is in [docs/VALIDATED_INTEROPERABILITY_PROFILE.md](VALIDATED_INTEROPERABILITY_PROFILE.md);
the implemented MDF third-profile mapping is in
[docs/MDF_EXPORT_MAPPING.md](MDF_EXPORT_MAPPING.md).

## References

The references below are the **secondary literature, standards, tools, and primary
sources** the work builds on. Every entry is a real, verifiable publication or
specification.

**Secondary literature**

- McCrae, J., Spohr, D. & Cimiano, P. (2011). Linking Lexical Resources and Ontologies on the Semantic Web with lemon. In *The Semantic Web: Research and Applications (ESWC 2011)*, LNCS 6643, pp. 245–259. <https://doi.org/10.1007/978-3-642-21034-1_17>
- Chiarcos, C., Apostol, E.-S., Kabashi, B. & Truică, C.-O. (2022). Modelling Frequency, Attestation, and Corpus-Based Information with OntoLex-FrAC. In *Proceedings of COLING 2022*, pp. 4018–4027. <https://aclanthology.org/2022.coling-1.353/>
- Bowers, J., Herold, A., Tasovac, T. & Romary, L. (2022). TEI Lex-0 Etym: Toward Terse Recommendations for the Encoding of Etymological Information. *Journal of the Text Encoding Initiative*, Rolling Issue. <https://doi.org/10.4000/jtei.4300>
- Coward, D. F. & Grimes, C. E. (2000). *Making Dictionaries: A Guide to Lexicography and the Multi-Dictionary Formatter*. Waxhaw, NC: SIL International.
- Setiawan, D., Khishigsuren, T., Agarwal, M., Pit, P., Mahmudi, A. & Vylomova, E. (2026). MUDIDI: A Two-Stage Framework for Multilingual Dictionary Digitization with Language Models. arXiv:2606.09435.
- Steiner, R. (2020). "Woher hat er das?" Zum Charakter des Sanskrit-English Dictionary von Monier-Williams. *Zeitschrift der Deutschen Morgenländischen Gesellschaft* 170(1), pp. 107–118. (An English version, "On the character of Monier-Williams' Sanskrit-English Dictionary," is circulated by the author.)
- Funderburk, J. & Malten, T. (2008). Marking Monier: Current state of the digitized Monier-Williams Dictionary. Cologne Digital Sanskrit Dictionaries. <https://www.sanskrit-lexicon.uni-koeln.de/talkMay2008/markingMonier.html>

**Standards and specifications**

- TEI Consortium. *TEI P5: Guidelines for Electronic Text Encoding and Interchange* — the dictionaries (`ch. 9`) and ODD/customisation chapters. <https://tei-c.org/guidelines/>
- TEI Lex-0: A baseline encoding for lexicographic resources (DARIAH Working Group). <https://dariah-eric.github.io/lexical-resources/pages/TEILex0/TEILex0.html>
- OntoLex-Lemon: *Lexicon Model for Ontologies* (W3C OntoLex Community Group Final Report). <https://www.w3.org/2016/05/ontolex/>
- OntoLex-Lexicog: *A Lemon Extension for Modeling Lexicographic Resources*. <https://www.w3.org/2019/09/lexicog/>
- OntoLex-FrAC: *Frequency, Attestation and Corpus Information* module. <https://www.w3.org/community/ontolex/wiki/Frequency,_Attestation_and_Corpus_Information>
- W3C. *Shapes Constraint Language (SHACL)*. <https://www.w3.org/TR/shacl/>
- *RELAX NG Specification* (OASIS). <https://relaxng.org/spec-20011203.html>
- ISO/IEC 19757-3: *Schematron*. <http://schematron.com/>
- W3C. *PROV-O: The PROV Ontology*. <https://www.w3.org/TR/prov-o/>

**Tools**

- Jing — RELAX NG validator (Thai Open Source Software Center). <https://relaxng.org/jclark/jing.html>
- Saxon — XSLT 2.0/3.0 processor (Saxonica), used with the ISO Schematron skeleton.
- pySHACL — SHACL processor for RDF graphs. <https://github.com/RDFLib/pySHACL>

**Primary sources (dictionaries and indexes)**

- Monier-Williams, M. *A Sanskrit–English Dictionary*. Oxford, 1899. (MW)
- Böhtlingk, O. & Roth, R. *Sanskrit-Wörterbuch*. St Petersburg, 1855–1875. (PWG)
- Böhtlingk, O. *Sanskrit-Wörterbuch in kürzerer Fassung*. St Petersburg, 1879–1889. (PWK)
- Apte, V. S. *The Practical Sanskrit–English Dictionary*. Poona, 1890. (AP90)
- Grassmann, H. *Wörterbuch zum Rig-Veda*. Leipzig: Brockhaus, 1873–1875. (GRA)
- Frish Sanskrit Reader (CDSL/Cologne edition, 2015). (FRI)
- Benfey, T. *Sanskrit-English Dictionary*. London, 1866. (BEN)
- Whitney, W. D. *The Roots, Verb-Forms and Primary Derivatives of the Sanskrit Language*. Leipzig, 1885. (the root index referenced by `csl:whitneyRoot`)
- Amarasiṃha. *Amarakośa* (Nāmaliṅgānuśāsana) — representative of the indigenous *kośa* authorities (cited as AK.).
- Cologne Digital Sanskrit Dictionaries (CDSL), Universität zu Köln — the digitised editions and project-specific XML this study consumes. <https://www.sanskrit-lexicon.uni-koeln.de/>
