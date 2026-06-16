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

## 1. Evidence class — *named attestation vs lexicographer hedge*

- **Loss:** `generic-lexicographer-hedge`, `named-source-citation`; cause
  *model-vocabulary-gap*. The MW `L.` siglum is not a citation but an evidential
  hedge (lexicographer-only); flattening it to a generic bibl loses the
  distinction (§4 of the paper).
- **Prototype:** TEI — `@cert`/`@resp` on every statement + `<usg type="hint">`
  for the hedge and `<bibl type="named-source">` for sources, mapped to PROV-O in
  [EVIDENCE_LABEL_CROSSWALK.md](EVIDENCE_LABEL_CROSSWALK.md). OntoLex —
  `frac:Attestation` with **`csl:evidenceType`** ∈ {`named-source-citation`,
  `generic-lexicographer-hedge`} and `prov:wasDerivedFrom` the source record.
- **Proposal:** standardize a small **evidence-type vocabulary** as a first-class
  attestation property (textual attestation · lexicographer hedge · named kośa ·
  editorial self-reference · catalogue reference · unresolved), with a defined
  certainty mapping to TEI `@cert` and PROV-O.

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

## 4. Continuation-parent status — *suppressed-headword recovery*

- **Loss:** `continuation-parent`; cause *print-compression* (the parent must be
  recovered from page adjacency). 
- **Prototype:** OntoLex — **`csl:ContinuationRelation`** with **`csl:mwECode`**
  (the MW `<e>` adjacency code); TEI — `<xr type="adjacency-continuation-parent">`.
- **Proposal:** an **adjacency-parent relation** with an explicit *recovery
  status* (recovered · conjectured · unresolved), so a reconstructed parent is
  never asserted as if printed.

## 4a. Source-collapse / lineage relation — *editorial compression*

- **Loss:** `source-collapse`; cause *editorial-compression* (38% of reports —
  the largest). PWG names a source; PWK abridges it; MW collapses it to `L.` or
  drops it (§4). This is upstream loss, so the fix is a **modeling** construct, not
  a target-schema gap.
- **Prototype:** the OntoLex-Lexicog multi-resource graph — one **`lexicog:Entry`
  per source dictionary** (`lexicog:describes` the lemma) — plus the
  `target: neutral` `source-collapse` loss reports with an evidence-bound
  `sourceEvidence` payload (per-dictionary `<ls>` counts).
- **Proposal:** a **cross-resource lineage relation** between the `lexicog:Entry`
  nodes (derived-from / abridges) carrying *retained* vs *dropped* evidence, so the
  degradation of evidential certainty along PWG → PWK → MW is a first-class,
  queryable assertion rather than an inference from counts.

## 5. Kośa sense/citation fusion — *a tradition-bound construct*

- **Loss:** `sense-citation-fusion`; cause *sanskrit-convention* (the only cause
  not fixable by a generic extension). The indigenous *kośa* binds a synonym run
  to its closing authority as one indivisible *iti*-unit (§5); the sense/
  citation-separating standards cannot express it.
- **Prototype:** the project **TEI Lex-0 ODD**
  ([tei-lex0-profile.odd.xml](../data/schema/tei-lex0-profile.odd.xml)) declares a
  *kośa sense-boundary customisation* (authority formula = sense boundary) as a
  Schematron constraint; the parsed kośa senses carry their authority inline.
- **Proposal:** a TEI Lex-0 **ODD customisation** (not a core change) treating the
  authority formula as a sense boundary, with a documented model-loss note when a
  baseline consumer flattens it — i.e. make the convention declarable, not silently
  lost.

## Provenance / trust spine

All of the above hang off one spine, already implemented: per-statement
`@cert`/`@resp` (TEI) ↔ PROV-O (`prov:wasDerivedFrom`, OntoLex) ↔ `csl:reviewStatus`
(machine · validated-slice), specified in
[EVIDENCE_LABEL_CROSSWALK.md](EVIDENCE_LABEL_CROSSWALK.md). The extension layer's
value is that an assertion's *epistemic status* travels with it across both models.

## What needs standardization vs stays project-local

| Construct | Disposition |
|---|---|
| Evidence-type vocabulary (§1) | **Standardize** — broadly useful beyond Sanskrit |
| Derivational-base / root relation (§2) | Align with `ontolex-morph`; standardize the binding |
| Decomposition-status flag (§3) | **Standardize** on `decomp` |
| Adjacency-parent recovery status (§4) | Project-local; propose as a TEI dictionaries pattern |
| Cross-resource lineage relation (§4a) | Propose on `lexicog`; lineage is general to dictionary families |
| Kośa sense-boundary (§5) | TEI Lex-0 **ODD customisation**, not a core change |

## Status

Prototyped and validated over the 250-case pilot; **proposed for discussion**. No
construct here is claimed as adopted by TEI or the OntoLex community group. The
`csl:` terms are the working reference implementation; the SHACL profile
([ontolex-frac-profile.shacl.ttl](../data/schema/ontolex-frac-profile.shacl.ttl))
and the two ODDs are the machine-checkable form.

## References

- [LOSS_ANALYSIS.md](LOSS_ANALYSIS.md) — the loss corpus the proposal answers to.
- [EVIDENCE_LABEL_CROSSWALK.md](EVIDENCE_LABEL_CROSSWALK.md) — the provenance spine.
- [TEI_LEX0_PILOT.md](TEI_LEX0_PILOT.md) — the kośa case and the Lex-0 ODD.
- [INTEROPERABILITY_MODEL.md](INTEROPERABILITY_MODEL.md) — the neutral model the
  constructs are generated from.
- [PAPER_OUTLINE.md](PAPER_OUTLINE.md) §8 — the argument this proposal discharges.
