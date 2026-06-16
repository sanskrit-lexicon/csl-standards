# Validated TEI And OntoLex/FrAC Profile

Date: 2026-05-29

## Scope

This profile upgrades the MW-PWG-PWK pilot from stubs to full 250-case machine-reviewed TEI and OntoLex/FrAC validation. The original deterministic 15-case slice is still preserved as the first stricter review subset, but validation now covers all 250 generated hard cases.

Selection is deterministic:

| Bucket | Count | Purpose |
|---|---:|---|
| root | 5 | Test verbal roots as lexical entries, derivational bases, and grammatical infrastructure. |
| compound | 5 | Test archival preservation plus semantic decomposition review. |
| continuation | 3 | Test MW adjacency/continuation before semantic assertion. |
| hedge-only | 2 | Test `L.` as evidential hedge without root/compound/continuation confounds. |

Generated selection file:

- `data/pilot/review-cases.json`
- `src/data/pilot/review-cases.json`

Full-review output files:

- `data/pilot/tei-review.json`
- `src/data/pilot/tei-review.json`
- `data/pilot/ontolex-review.json`
- `src/data/pilot/ontolex-review.json`

Current selected cases:

| Bucket | Cases |
|---|---|
| root | `ac`, `ah`, `akz`, `am`, `aMh-mw107` |
| compound | `annavid`, `arcya`, `arTAntara`, `aryapatnI`, `BadreSa` |
| continuation | `akupya`, `aMSa`, `Apra` |
| hedge-only | `a-mw7`, `A-mw22012` |

## TEI Archival Profile

Generator: `scripts/export-tei.mjs`

The output is a full TEI archival profile:

- TEI root with namespace and `teiHeader`.
- `entry` with stable case id and entry type.
- `form/orth` preserving SLP1 lemma form.
- `sense/def` where a safe machine gloss can be extracted.
- `etym` or `xr` relations for roots, compounds, and continuations.
- `listBibl` citation index for extracted `<ls>` signals.
- Three `cit type="source-entry"` blocks preserving full CDSL MW/PWG/PWK records as escaped archival quotes.
- Explicit `review-status` and `profile-version` notes.

Validator: `scripts/validate-tei-profile.mjs`

Project ODD/profile file: `data/schema/tei-archival-profile.odd.xml`

The validator checks all 250 cases for:

- TEI namespace and header.
- Correct stable `xml:id`.
- three source-entry citations.
- escaped raw CDSL tags, not live pseudo-XML.
- required phenomenon-specific structures: hedge, root, compound, continuation.
- declared full validation scope.
- project ODD/profile markers.

## OntoLex/FrAC Profile

Generator: `scripts/export-ontolex.mjs`

The output is a full OntoLex/FrAC profile:

- 250 JSON-LD graphs in `data/pilot/ontolex/`.
- 250 RDF/Turtle files in `data/pilot/rdf/`.
- `ontolex:LexicalEntry` lemma node (dictionary-neutral).
- **OntoLex-Lexicog multi-resource view**: per source dictionary that has senses, a
  `lexicog:LexicographicResource` (the dictionary) whose `lexicog:entry` is a
  `lexicog:Entry` (its article for this lemma) that `lexicog:describes` the lemma and
  lists its `lexicog:component` senses.
- `ontolex:Form` canonical form node.
- `ontolex:LexicalSense` nodes from all three dictionaries — MW (`@en`) plus the
  German Petersburg dictionaries PWG/PWK (`@de`), each tagged `csl:sourceDictionary`.
- `csl:SourceRecord` nodes for MW/PWG/PWK provenance.
- `frac:Attestation` nodes linked with `prov:wasDerivedFrom`, **attesting the
  specific sense** they belong to (sense-level linkage), or the entry for
  citations not tied to a sense. Each attestation carries a sub-typed
  **`csl:evidenceClass`** ∈ {`textual`, `hedge`, `kosha`, `editorial`} (the
  evidence-class extension), and a coordinate-bearing citation parses into
  **`csl:citedWork`** + **`csl:citedRange`**.
- `csl:RootRelation`, `decomp:ComponentList`, or `csl:ContinuationRelation` nodes where applicable.

Validator: `scripts/validate-ontolex-profile.mjs`

Project SHACL/profile file: `data/schema/ontolex-frac-profile.shacl.ttl`

The validator checks all 250 cases for:

- required JSON-LD context prefixes;
- graph size beyond a stub;
- OntoLex and Lexicog entry typing;
- canonical form;
- three source records;
- FrAC attestations with provenance and a valid `csl:evidenceClass`;
- phenomenon-specific relation nodes;
- RDF/Turtle presence with required prefixes and entry triples.
- declared full validation scope.
- project SHACL/profile markers.

## Commands

Run the full pilot:

```bash
npm run build-pilot
```

Run the stricter profile validators alone:

```bash
npm run validate-tei-profile
npm run validate-ontolex-profile
npm run validate-tei-odd
npm run validate-ontolex-shacl
```

Run the optional external validation harness:

```bash
npm run validate-external-profiles
npm run validate-external-profiles:strict
```

The external harness writes:

- `data/pilot/external-validation-review.json`
- `src/data/pilot/external-validation-review.json`

It records three independent hardening checks:

| Layer | External tool | Behavior |
|---|---|---|
| TEI ODD compilation | `teitorelaxng` from the TEI Stylesheets | Compiles `data/schema/tei-archival-profile.odd.xml` to a temporary RELAX NG schema when available. |
| TEI XML validation | `jing` or `xmllint` | Validates all 250 generated TEI XML files against a compiled RELAX NG schema. Set `CSL_STANDARDS_TEI_RNG` to use a precompiled schema. |
| Lex-0 ODD compilation | `teitorelaxng` from the TEI Stylesheets | Compiles `data/schema/tei-lex0-profile.odd.xml` to a temporary RELAX NG schema when available. |
| Lex-0 XML validation | `jing` or `xmllint` | Validates all 256 generated `*.lex0.xml` files against the compiled RELAX NG schema. Set `CSL_STANDARDS_LEX0_RNG` to use a precompiled schema. |
| SHACL validation | `pyshacl` | Validates all 250 RDF/Turtle files against `data/schema/ontolex-frac-profile.shacl.ttl`. |

The default command records missing external tools as `skipped`; `:strict` turns skipped checks into a failing CI-style result.

## Remaining Limits

This is full 250-case machine review, not the final complete philological project. Remaining work:

- Human philological review of all 250 cases.
- Running the optional external validation harness in a toolchain-equipped environment and committing the resulting pass report.
- Expanding from project-profile validation to publication-grade TEI and RDF release QA.
