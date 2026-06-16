# Sanskrit Lexicographic Extension Proposal (TEI + OntoLex)

A proposal — for discussion, not adopted — for the extension layer the MW-PWG-PWK
pilot shows is needed. It is the concrete form of [PAPER_OUTLINE.md](PAPER_OUTLINE.md)
§8: *"we propose a Sanskrit lexicographic extension layer for both standards."*

Each construct below is already **prototyped** in the pilot's `csl:` namespace
(`https://sanskrit-lexicon.github.io/csl-standards/ns#`) and exercised over 250
cases, so this is a report of what the generators actually emit, not a wishlist.
Each is tied to the loss it addresses — by `failureClassification` cause and
`phenomenon` from [LOSS_ANALYSIS.md](LOSS_ANALYSIS.md) and
[LOSS_REPORT_SCHEMA.md](LOSS_REPORT_SCHEMA.md).

## Motivation

The 1277 loss reports split by cause into: **model-vocabulary-gap (49%)** — the
target standards lack a concept, chiefly an *evidence class* (kośa vs textual vs
editorial citation, and unparsed citation coordinates; see
[LOSS_ANALYSIS.md](LOSS_ANALYSIS.md) §4b); **editorial-compression (29%)** — the
19th-century lineage already dropped evidence; **cdsl-markup-gap (9%)**,
**print-compression (6%)**, **sanskrit-convention (<1%)**, and a single
**data-quality** anomaly. Only the model-vocabulary and sanskrit-convention causes
are addressable by *extending the standards*; the others are upstream
(source/lineage) and are addressed by *modeling* the lineage, not by new schema. This proposal therefore has two kinds of construct: **target
extensions** (new TEI/OntoLex vocabulary) and **lineage/provenance constructs**
(a layer that records what the sources themselves lost).

## The `csl:` namespace

The pilot reserves `csl:` for terms with no standard equivalent, reused across the
TEI notes/attributes and the OntoLex graph so the two views share one spine. The
proposal is to promote the stable subset below into a published vocabulary
(`csl-lex`), keeping TEI and OntoLex bindings aligned.

## 1. Evidence class — *named attestation vs lexicographer hedge* — **IMPLEMENTED**

- **Loss:** `generic-lexicographer-hedge`, `named-kosha-citation`,
  `editorial-reference`, `citation-coordinate`; cause *model-vocabulary-gap*
  (49% of the corpus — the largest; see [LOSS_ANALYSIS.md](LOSS_ANALYSIS.md) §4b).
  The MW `L.` siglum is an evidential hedge, not a citation; an indigenous *kośa*
  source is not a textual attestation; an editorial reference points within the
  tradition; and a citation's textual coordinate is locked in a flat string.
  Flattening all of these to a generic bibl loses the distinction.
- **Implemented:** OntoLex — every `frac:Attestation` now carries a sub-typed
  **`csl:evidenceClass`** ∈ {`textual`, `hedge`, `kosha`, `editorial`}, and a
  coordinate-bearing one parses into **`csl:citedWork`** + **`csl:citedRange`**
  (e.g. `AV. 6,116,1.` → work `AV.`, range `6,116,1`). Classification and parsing
  live in [scripts/lib/evidence.mjs](../scripts/lib/evidence.mjs); the
  [SHACL profile](../data/schema/ontolex-frac-profile.shacl.ttl) constrains
  `csl:evidenceClass` with `sh:in`, and all 250 graphs pass pySHACL. The coarse
  `csl:evidenceType` ∈ {`named-source-citation`, `generic-lexicographer-hedge`}
  is retained for back-compatibility. **TEI side** (symmetric, also implemented):
  every citation `<bibl>` in the archival profile and the Lex-0 baseline carries
  the same evidence class as **`@subtype`** ∈ {`textual`, `hedge`, `kosha`,
  `editorial`} (the hedge additionally as `<usg type="hint">` in Lex-0), and a
  coordinate-bearing citation a structured **`<citedRange>`** — all validated
  against the compiled TEI RELAX NG (jing). Per-statement `@cert`/`@resp` carries
  certainty, mapped to PROV-O in
  [EVIDENCE_LABEL_CROSSWALK.md](EVIDENCE_LABEL_CROSSWALK.md).
- **Proposal:** standardize this **evidence-class vocabulary** as a first-class
  attestation property (textual · hedge · kośa · editorial · catalogue ·
  unresolved) plus a structured cited-locus, with a defined certainty mapping to
  TEI `@cert` and PROV-O. The four implemented classes are the detectable subset;
  `catalogue`/`unresolved` remain proposed.

## 2. Root relation — *entry that is also a derivational base*

- **Loss:** `root-as-entry`, `root-as-derivational-base`; cause
  *model-vocabulary-gap* (§5). A Sanskrit root is simultaneously a lexical entry
  and the derivational scaffolding of a word family; a plain entry loses the
  scaffolding (Figure 3).
- **Prototype:** OntoLex — **`csl:RootRelation`** with **`csl:whitneyRoot`**;
  TEI — `<etym type="root">` with a Whitney-root `<ref>`.
- **Proposal:** a `lemon`/`ontolex-morph`-aligned **derivational-base relation**
  linking the root entry to the lexemes it generates, distinct from a plain
  `ontolex:LexicalEntry`, carrying the grammatical class (`csl:verbClass`).

## 3. Compound decomposition status — *subentry vs component graph*

- **Loss:** `compound-subentry`, `compound-decomposition`; cause
  *model-vocabulary-gap* (§6). TEI preserves the printed subentry/adjacency;
  OntoLex exposes the parts; a flat model loses one or the other (Figure 4).
- **Prototype:** OntoLex — **`decomp:ComponentList`** of `decomp:Component` with
  `ontolex:correspondsTo` lexemes, plus a **`csl:modelingNote`** recording whether
  the segmentation is machine-derived or needs philological review.
- **Proposal:** standardize a **decomposition-status flag** (asserted ·
  machine-segmented · unresolved) on `decomp:ComponentList`, so a component graph
  carries its own confidence rather than being silently asserted.

## 4. Continuation-parent status — *suppressed-headword recovery* — **IMPLEMENTED**

- **Loss:** `continuation-parent`; cause *print-compression* (the parent must be
  recovered from page adjacency).
- **Implemented:** OntoLex — **`csl:ContinuationRelation`** with **`csl:mwECode`**
  (the MW `<e>` adjacency code) and an explicit **`csl:recoveryStatus`** ∈
  {`recovered`, `conjectured`, `unresolved`}; TEI — `<xr
  type="adjacency-continuation-parent" subtype="<status>">`. The status is
  `conjectured` whenever only the adjacency pointer is known (the current pilot
  state — the parent lemma is never asserted as if printed), `unresolved` without a
  pointer, and `recovered` reserved for an actually-asserted parent. SHACL adds
  `csl:ContinuationRelationShape` (`sh:in` on `csl:recoveryStatus`); validated
  under pySHACL and against the compiled TEI RELAX NG (jing).
- **Proposal:** standardize the **recovery-status** vocabulary on an adjacency-parent
  relation, so a reconstructed parent is never asserted as if printed.

## 4a. Source-collapse / lineage relation — *editorial compression* — **IMPLEMENTED**

- **Loss:** `source-collapse`; cause *editorial-compression* (29% of reports —
  the largest single cause-family). PWG names a source; PWK abridges it; MW
  collapses it to `L.` or drops it (§4). This is upstream loss, so the fix is a
  **modeling** construct, not a target-schema gap.
- **Implemented:** OntoLex now emits a **`csl:LineageRelation`** per transition —
  PWG → PWK (`csl:transition "abridgement"`) and PWG → MW (`"recomposition"`) —
  carrying `csl:lineageFrom` / `csl:lineageTo` and the
  `csl:sourceCitationCount` / `csl:retainedCitationCount` /
  `csl:droppedCitationCount` (e.g. *ac*: PWG 35 → PWK 8 = 27 dropped; PWG 35 →
  MW 3 = 32 dropped). The [SHACL profile](../data/schema/ontolex-frac-profile.shacl.ttl)
  adds `csl:LineageRelationShape` (constraining `csl:transition` with `sh:in`),
  and all 250 graphs conform under pySHACL. This sits alongside the existing
  OntoLex-Lexicog multi-resource graph (one `lexicog:Entry` per source dictionary)
  and the `target: neutral` `source-collapse` loss reports, each of which now names
  its `csl:LineageRelation` remedy in `mappedAs`. `analyze-loss`'s `lineageCoverage`
  reports **369 of 369** source-collapse losses modeled.
- **Proposal:** standardize a **cross-resource lineage relation** so the
  degradation of evidential certainty along PWG → PWK → MW is a first-class,
  queryable assertion rather than an inference from counts.

## 5. Kośa sense/citation fusion — *a tradition-bound construct* — **IMPLEMENTED**

- **Loss:** `sense-citation-fusion`; cause *sanskrit-convention* (the only cause
  not fixable by a generic extension). The indigenous *kośa* binds a synonym run
  to its closing authority as one indivisible *iti*-unit (§5); the sense/
  citation-separating standards cannot express it.
- **Implemented:** the project **TEI Lex-0 ODD**
  ([tei-lex0-profile.odd.xml](../data/schema/tei-lex0-profile.odd.xml)) carries a
  *kośa sense-boundary customisation* (`constraintSpec` `csl-lex0-kosa-sense-boundary`,
  Schematron). A kośa entry declares the convention with
  `<note type="entry-convention">kosa-iti-unit</note>`; each sense closed by an
  authority formula carries it as a typed **`<bibl type="kosa-authority">`** (the
  sense boundary, distinguishable from an example citation) and a
  `<note type="model-loss">` witnessing the fusion. The Schematron asserts the
  pairing; [validate-tei-lex0](../scripts/validate-tei-lex0.mjs) **enforces** it in
  `build-pilot` (not only declares it), and the markup validates against the
  compiled TEI RELAX NG (jing). The `sense-citation-fusion` loss reports name this
  remedy in `mappedAs`.
- **Proposal:** a TEI Lex-0 **ODD customisation** (not a core change) treating the
  authority formula as a sense boundary, with a documented model-loss note when a
  baseline consumer flattens it — i.e. make the convention declarable, not silently
  lost. (Executing the ODD's Schematron with an external SVRL engine is the one
  remaining validation-hardening step; the constraint is enforced in-pipeline today.)

## Provenance / trust spine

All of the above hang off one spine, already implemented: per-statement
`@cert`/`@resp` (TEI) ↔ PROV-O (`prov:wasDerivedFrom`, OntoLex) ↔ `csl:reviewStatus`
(machine · validated-slice), specified in
[EVIDENCE_LABEL_CROSSWALK.md](EVIDENCE_LABEL_CROSSWALK.md). The extension layer's
value is that an assertion's *epistemic status* travels with it across both models.

## What needs standardization vs stays project-local

| Construct | Disposition |
|---|---|
| Evidence-class vocabulary + cited-locus (§1) | **Implemented in both standards** (OntoLex `csl:evidenceClass` + `csl:citedWork`/`csl:citedRange`; TEI `@subtype` + `<citedRange>`); **standardize** — broadly useful beyond Sanskrit |
| Derivational-base / root relation (§2) | Align with `ontolex-morph`; standardize the binding |
| Decomposition-status flag (§3) | **Standardize** on `decomp` |
| Adjacency-parent recovery status (§4) | **Implemented** (`csl:recoveryStatus`; TEI `@subtype`); project-local, propose as a TEI dictionaries pattern |
| Cross-resource lineage relation (§4a) | **Implemented** (`csl:LineageRelation` with retained/dropped counts); propose on `lexicog` — lineage is general to dictionary families |
| Kośa sense-boundary (§5) | **Implemented** (Lex-0 ODD Schematron + `bibl[@type="kosa-authority"]`, enforced in-pipeline); TEI Lex-0 **ODD customisation**, not a core change |

## Status

Prototyped and validated over the 250-case pilot; **proposed for discussion**. No
construct here is claimed as adopted by TEI or the OntoLex community group. The
`csl:` terms are the working reference implementation; the SHACL profile
([ontolex-frac-profile.shacl.ttl](../data/schema/ontolex-frac-profile.shacl.ttl))
and the two ODDs are the machine-checkable form.

The evidence-class construct (§1) is now **implemented in both target standards
and validated** — OntoLex (`csl:evidenceClass` + `csl:citedWork`/`csl:citedRange`,
SHACL/pySHACL) and TEI (`@subtype` + `<citedRange>` on every citation `<bibl>` in
the archival and Lex-0 profiles, RELAX NG/jing) — closing the loop from measured
loss to working remedy: every OntoLex `model-vocabulary-gap` loss that needs an
extension (569 of 569) names a concrete, implemented `csl:` construct, and all 250
graphs conform to the SHACL profile under pySHACL (`extensionCoverage` in
[loss-analysis.json](../data/pilot/loss-analysis.json)). The root (§2) and
decomposition (§3) constructs were already implemented; the **source-collapse
lineage relation (§4a)** (`csl:LineageRelation`, `lineageCoverage` 369/369), the
**continuation recovery-status (§4)** (`csl:recoveryStatus` / TEI `@subtype`), and
the **kośa sense-boundary customisation (§5)** (Lex-0 ODD Schematron +
`bibl[@type="kosa-authority"]`) are now implemented too. **Every construct in this
proposal (§1–§5, §4a) is now implemented and validated in-pipeline**; the only
open hardening is executing the Lex-0 ODD's Schematron with an external SVRL engine
(its rule is enforced by the project validator today).

## References

- [LOSS_ANALYSIS.md](LOSS_ANALYSIS.md) — the loss corpus the proposal answers to.
- [EVIDENCE_LABEL_CROSSWALK.md](EVIDENCE_LABEL_CROSSWALK.md) — the provenance spine.
- [TEI_LEX0_PILOT.md](TEI_LEX0_PILOT.md) — the kośa case and the Lex-0 ODD.
- [INTEROPERABILITY_MODEL.md](INTEROPERABILITY_MODEL.md) — the neutral model the
  constructs are generated from.
- [PAPER_OUTLINE.md](PAPER_OUTLINE.md) §8 — the argument this proposal discharges.
