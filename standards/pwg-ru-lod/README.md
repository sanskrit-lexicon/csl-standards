# PWG→RU LOD graph — SPARQL surface + SHACL profile (E7)

_Created: 08-07-2026 · Last updated: 08-07-2026_

This directory is the `csl-standards`-owned **standards surface** for the PWG→RU
(Petersburg Dictionary → Russian) Linked-Open-Data graph. Per the
[boundary rules](../../docs/BOUNDARY_RULES.md), OntoLex/LOD **exports** live here,
not in the pipeline repo: the graph **generator + input data** stay in
[`gasyoun/SanskritLexicography` → `RussianTranslation`](https://github.com/gasyoun/SanskritLexicography/tree/master/RussianTranslation),
and the **published graph + the query/validation surface** land in `csl-standards`.

## The graph model (summary)

OntoLex-Lemon + `vartrans` + PROV-O, on a LiLa-style lemma-bank spine. Built by
[`RussianTranslation/src/export_lod.py`](https://github.com/gasyoun/SanskritLexicography/blob/master/RussianTranslation/src/export_lod.py);
full model + before/after coverage table in
[`RussianTranslation/LOD_GRAPH.md`](https://github.com/gasyoun/SanskritLexicography/blob/master/RussianTranslation/LOD_GRAPH.md).

- **Lemma bank** — one shared `ontolex:Form` / `lila:Lemma` node per SLP1 lemma
  (`key1`); every homograph `ontolex:LexicalEntry` links to it via
  `ontolex:canonicalForm`, and the separate DCS-frequency graph keys
  `pwglex:dcsCount` to the **same** lemma IRI (the cross-dataset join hub).
- **Senses** — `ontolex:LexicalSense` with `skos:definition@ru`, a PROV-O
  `pwglex:evidenceGrade` (SKOS scheme: approved / human-reviewed / machine-preview
  / dict-attested / kow / corpus; each flagged `pwglex:citable`).
- **Citations** — each per-sense `<ls>` is a first-class `pwglex:Citation` /
  `prov:Entity` (`sourceSigla`, `locus`, raw), linked `dct:references`.
- **Dating** — Renou stratum per sense as `pwglex:StratumAttestation` (oldest/
  youngest state, date min/max, dated-citation count).
- **Sense relations** — `vartrans:SenseRelation` (restate / add / relocate /
  correct; abridging / additive; per source layer).

## Files here

- [`sense_citation_dcsfreq.rq`](sense_citation_dcsfreq.rq) — the acceptance query:
  join a PWG sense to its `<ls>` citation **and** the DCS frequency of its lemma,
  across the shared lemma IRI (offline two-graph form + a commented `SERVICE`
  true-federation variant).
- [`shapes.ttl`](shapes.ttl) — the SHACL profile pinning the modelling contract
  (entry has a lemma + label; sense has a grade + definition; citation/attestation/
  relation carry their required provenance fields).

These are **schema only** — no dictionary content — so they are safe to publish
here now. Running them needs the graph data, which is produced by the generator
in `RussianTranslation` and validated there by
[`src/lod_acceptance.py`](https://github.com/gasyoun/SanskritLexicography/blob/master/RussianTranslation/src/lod_acceptance.py).

## Publication status — gated, not yet published

Consistent with this repo's mission ("leave real RDF publication for a later
phase, after the modeling risks are documented"):

- **Full graph data publication is gated on G5** — the translation store is
  currently 100 % machine (`ai_translated` → `gr:machine-preview`, non-citable);
  the citable subset is the SPARQL filter `pwglex:citable true` and is empty until
  human sense-approvals land. Any publish step runs a
  [`/publish-safety-check`](https://github.com/gasyoun/SanskritLexicography) first.
- **IRI publication domain is an open `@DECIDE`** — the generator ships a
  `https://w3id.org/sanskrit-lexicon/pwg-ru/` placeholder and takes `--base-iri`;
  the real dereferenceable domain (w3id PURL vs a project domain) is a human
  ruling tracked in
  [`Uprava/GTD_NEXT_ACTIONS.md`](https://github.com/gasyoun/Uprava/blob/main/GTD_NEXT_ACTIONS.md).

_Dr. Mārcis Gasūns_
