# MDF Export Mapping (Third Profile)

_Created: 11-06-2026 · Last updated: 03-07-2026_

Status: **implemented.** The **third export profile** beside the existing
[TEI archival](INTEROPERABILITY_MODEL.md#tei-mapping) and
[OntoLex/FrAC semantic](INTEROPERABILITY_MODEL.md#ontolex-mapping) views, targeting
SIL's **Multi-Dictionary Formatter (MDF)** standard-format markers (Toolbox/FLEx
lineage). Serialized by
[`scripts/export-mdf.mjs`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/scripts/export-mdf.mjs),
validated by
[`scripts/validate-mdf-profile.mjs`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/scripts/validate-mdf-profile.mjs)
against
[`data/schema/mdf-export-profile.json`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/data/schema/mdf-export-profile.json),
and compared case-by-case against TEI/OntoLex in the loss corpus (the `mdf` target
in [`build-loss-reports.mjs`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/scripts/build-loss-reports.mjs)).
Run via `npm run export-mdf` / `npm run validate-mdf-profile` (both wired into
`npm run build-pilot`).

## Why MDF, And Why A Third View

The [interoperability model](INTEROPERABILITY_MODEL.md) already exposes two views over
the neutral JSON layer: TEI preserves the dictionary as an edited historical text;
OntoLex/FrAC exposes lexicographic meaning as a graph. MDF adds a **third, deliberately
flatter view**: a line-oriented field record (`\lx`, `\ps`, `\ge`, …) that the
language-documentation and endangered-languages community (Toolbox, FLEx, SIL) reads
directly.

Three reasons to carry it:

1. **External corroboration and reach.** The MUDIDI benchmark (Setiawan et al., 30
   public-domain dictionaries incl. Sanskrit–English) uses MDF as its Stage 2 target
   and shows that machine parsing into MDF is now strong but **convention-dependent**:
   a dictionary's own introduction and a formal field schema each add ~3–6 entry-field
   F1, and validated per-dictionary parse-rules add ~6 more. CDSL's curated markup and
   the `csl-atlas` [convention fingerprints](https://github.com/sanskrit-lexicon/csl-atlas/blob/main/docs/PARSE_RULES_FRAMING.md)
   already *are* that prior knowledge — an MDF export turns it into a contribution the
   documentation community can consume.
2. **A second schema stress-test.** TEI and OntoLex are rich. MDF is intentionally
   poor. Mapping into a flat field schema surfaces *which* CDSL distinctions are
   structurally load-bearing versus presentational — a useful third probe of the same
   neutral model.
3. **Lossiness is the finding, not a failure.** Where MDF has no field for a CDSL
   distinction (notably the `<ls>L.</ls>` generic-lexicographer hedge), the gap is
   recorded with the same [model-adequacy scale](INTEROPERABILITY_MODEL.md#model-adequacy-scale)
   used for TEI/OntoLex (`clean` / `partial` / `lossy` / `failure`).

## Target MDF Field Inventory

The subset of MDF markers this profile emits (national language = the target language,
e.g. English for MW):

| Marker | MDF role |
|---|---|
| `\lx` | lexeme / headword |
| `\hm` | homonym number |
| `\lc` | citation / lexical-citation form |
| `\va` | variant form |
| `\ps` | part of speech (and gender, for MW) |
| `\sn` | sense number |
| `\ge` | gloss (English) |
| `\de` | definition (national) |
| `\xv` | example sentence (vernacular) |
| `\xn` | example translation (national) |
| `\et` / `\es` | etymon / etymology source language |
| `\cf` | cross-reference |
| `\bb` | bibliography / source citation |
| `\se` | subentry |
| `\sd` | semantic domain |
| `\nt` | note |

## Neutral Model → MDF

Parallel to the TEI and OntoLex tables in `INTEROPERABILITY_MODEL.md`.

| Neutral Model | MDF Target | Adequacy | Notes |
|---|---|---|---|
| `dictionaryRecord` | record (blank-line-delimited block beginning `\lx`) | clean | One CDSL `<L>…<LEND>` → one MDF record. |
| `form` (headword) | `\lx` | clean | Primary key form. |
| `form` (variant / segmented) | `\va` / `\lc` | partial | Segmentation/sort keys have no exact MDF home. |
| `form` (homonym index) | `\hm` | clean | |
| `grammar` | `\ps` | clean | MW folds gender into `\ps` (`m.`, `f.`, `n.`). |
| `sense` | `\sn` + `\ge`/`\de` | partial | Prose-segmented senses (MW/WIL/VCP/SKD) need inference to number. |
| `citation` (textual / coordinate / named-kosha) | `\bb` | partial | MDF has no evidence-class field; source string is preserved flat. |
| `citation` (generic-lexicographer `L.`) | `\bb` + `\nt` | **lossy** | The evidential *hedge* meaning is flattened to a plain reference. |
| `relation` (cross-reference) | `\cf` | partial | Direction/role not typed in MDF. |
| `relation` (compound decomposition) | `\se` or `\cf` | lossy | MDF subentry ≠ semantic decomposition. |
| `relation` (continuation) | merge into parent record | lossy | MDF has no continuation concept; adjacency must be resolved first. |
| `relation` (root / derivation) | `\et` / `\nt` | lossy | No MDF root-relation field. |
| `loss` | `\nt` (model-loss note) | n/a | Reviewed samples only. |

## CDSL (MW) Markup → MDF

Granular tag-level mapping, derived from the live MW source
(`csl-orig/v02/mw/mw.txt`). The `¦` character separates the headword zone from the
definition zone and is the `\lx`-vs-gloss boundary. Confidence is the per-field
adequacy band.

| MW markup | Meaning | MDF | Adequacy | Notes |
|---|---|---|---|---|
| `<L>n … <LEND>` | record id + boundary | record block | clean | `n` kept as record id in a `\nt`/comment, not an MDF field. |
| `<k1>` | primary headword key (SLP1) | `\lx` | clean | |
| `<k2>` | segmented/sort key (`a—kAra`) | `\lc` / `\va` | partial | Morpheme boundary signals compounding; review. |
| `<h>` / `<hom>` | homonym number | `\hm` | clean | `<hom>` is the display form of `<h>`. |
| `<e>` | entry-structure code (`1`, `1A`, `3`) | — (structural) | n/a | Drives `\se`/continuation handling, not a content field. |
| `<lex>` | grammar / gender (`m.` `f.` `n.` `ind.`) | `\ps` | clean | |
| `<info lex=…/>` | machine annotation of `<lex>` | — (infrastructure) | n/a | F17 layer; metadata, not exported. |
| `<s>` / `<s1>` | inline Sanskrit (Deva/SLP1) | context-dependent | partial | Headword zone → part of `\lx`; example zone → `\xv`; gloss zone → inline. |
| gloss text after `¦` | English gloss/definition | `\ge` (MW) / `\de` | clean | MW target is English → `\ge`. |
| `<div>` | sense division | `\sn` boundary | clean | |
| `<srs/>` | sandhi marker inside `<s>` (not a sub-sense) | — (rendering) | n/a | **Resolved** against `csl-orig/v02/mw/mw-meta2.txt`: `<srs/>` is a self-closing marker used *within* `<s>` following a long vowel that is a sandhi — **not** a sub-sense divider. Dropped (no `\sn`). |
| `<bot>` | plant name (Linnaean) | part of `\ge` | clean | **Resolved** against `mw-meta2.txt`: `<bot>X</bot>` marks a botanical name; it is part of the gloss and flows into `\ge`. |
| `<ab>` | abbreviation (`q.v.`, `&c.`) | inline; `q.v.` ⇒ `\cf` | partial | "q.v." marks a cross-reference target. |
| `<ls>` | literary source / `L.` hedge | `\bb` (+`\nt` for `L.`) | **lossy** | See stress point below. |
| `<etym>` | etymology | `\et` | partial | |
| `<lang>` / `<gk>` | source language / Greek inline | `\es` / `\et` | partial | |
| `<bio>` | biographical/bibliographic | `\nt` / `\bb` | review | |
| `<pc>` / `<pcol>` / `<pb>` | print page/column coordinates | — (archival) | n/a | TEI keeps these; out of MDF scope (or `\nt`). |
| `<i>` | italic | — (typography stripped) | n/a | MDF drops emphasis; relevant to MUDIDI Stage 1 markup-F1, not Stage 2. |

## Stress Points (MDF-specific)

- **The `<ls>L.</ls>` hedge has no MDF home.** MW's signature *generic-lexicographer*
  hedge (40,212 occurrences; zero in PWG/PWK/WIL/SKD/VCP) asserts an evidence *kind*,
  not a citable source. MDF's flat `\bb` flattens it to an ordinary reference — `lossy`.
  This is the same stress point TEI handles with `@type="generic-lexicographer"` and
  OntoLex with a FrAC/provenance node; MDF cannot. **Recommended:** emit `\bb L.` plus a
  `\nt` model-loss marker so the flattening is visible, never silent.
- **No example fields populate for MW.** MW is a retrieval dictionary with **no
  examples**, so `\xv`/`\xn` stay empty; a production dictionary (e.g. Apte) would fill
  them. Empty example fields are expected, not missing data.
- **Senses are often prose, not numbered.** MW/WIL/VCP/SKD segment senses in prose;
  `\sn` numbering is then `inferred`, and must be labelled as such (never emitted as
  `observed`).
- **Continuations must be resolved first.** MW `<e>…A` continuation records suppress the
  headword and depend on adjacency; the neutral model reconstructs the parent before MDF
  can emit a single coherent record.
- **Named-kosha vs generic collapse.** PWG names specific koshas; MW collapses them to
  `L.`. An MDF export of PWG vs MW will show the same transformation the TEI/OntoLex
  views show — model it as transformation, not mere difference.

## Worked Example

CDSL source (MW record 2):

```
<L>2<pc>1,1<k1>akAra<k2>a—kAra<e>3
<s>a—kAra</s> ¦ <lex>m.</lex> the letter or sound <s>a</s>.<info lex="m"/>
<LEND>
```

Candidate MDF:

```
\lx akAra
\ps m.
\ge the letter or sound a
```

A record exercising the hedge (MW record 3):

```
<L>3<pc>1,1<k1>a<k2>a<h>2<e>1
<hom>2.</hom> <s>a</s> ¦ (<s>pragfhya</s>, <ab>q.v.</ab>), a vocative particle …, <ls>T.</ls>
<LEND>
```

Candidate MDF:

```
\lx a
\hm 2
\ge (pragṛhya, q.v.), a vocative particle …
\cf pragṛhya
\bb T.
\nt model-loss: <ls> source flattened to \bb; evidence-kind not represented
```

## Open Questions / Review Items

- ✅ **Resolved.** `<srs>`/`<bot>` roles confirmed against `csl-orig/v02/mw/mw-meta2.txt`:
  `<srs/>` is a sandhi rendering marker inside `<s>` (dropped, no `\sn`); `<bot>` is a
  Linnaean plant name (flows into `\ge`). See the markup table above.
- ✅ **Resolved.** `<k2>` maps to `\lc` **when it carries a morpheme boundary** (`—`/`-`),
  which preserves genuine segmentation/compounding information; when `<k2>` merely
  duplicates `<k1>` it is treated as index metadata and dropped. `\va` is reserved for
  true variant spellings (not emitted by the MW-only first pass).
- ✅ **Resolved (for MW).** MW's national language is English, so glosses go to `\ge`.
  The `\gn`/`\de` choice for the Sanskrit–Sanskrit koshas (SKD/VCP) is deferred to when
  the profile is extended beyond MW — the marker inventory reserves `\de` for it.
- ✅ **Resolved.** A per-record `\nt meta:` line carries the CDSL `<L>` id and `<pc>`
  coordinate (plus profile version, scope, review status, entry type) for round-trip
  traceability.

## Next Steps

1. ✅ **Done.** Deterministic
   [`scripts/export-mdf.mjs`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/scripts/export-mdf.mjs)
   serializer over the neutral model, mirroring `export-tei.mjs` / `export-ontolex.mjs`
   (one CDSL record → one `.mdf` record in `data/pilot/mdf/`).
2. ✅ **Done.** An `\nt model-loss:` marker is emitted for every `lossy` adequacy row
   (hedge, root, compound, continuation), and
   [`scripts/validate-mdf-profile.mjs`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/scripts/validate-mdf-profile.mjs)
   checks structure, marker inventory, and the presence of each model-loss marker
   (250/250 records pass, 281 model-loss markers).
3. ✅ **Done.** The full hard sample runs through MDF and the loss corpus carries an
   `mdf` target alongside `tei`/`ontolex`/`neutral`, so adequacy is comparable
   case-by-case (`npm run analyze-loss`; MDF is `lossy` across the board — the flat
   field schema is intentionally the poorest of the three views).
4. **Remaining.** Cross-check a Sanskrit MDF sample against the MUDIDI MDF conventions,
   since MUDIDI's parsing subset omits Sanskrit — this is the gap CDSL data can fill.

_Dr. Mārcis Gasūns_
