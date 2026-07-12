# MDF Export Mapping (Third Profile)

_Created: 11-06-2026 · Last updated: 12-07-2026_

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

Order below follows App. B (see Book-Sourced Refinements) — not alphabetic.

| Marker | MDF role |
|---|---|
| `\lx` | lexeme / headword |
| `\hm` | homonym number |
| `\lc` | citation / lexical-citation form |
| `\se` | subentry (reserved, not emitted) |
| `\ps` | part of speech (and gender, for MW) |
| `\sn` | sense number |
| `\ge` | gloss (English) |
| `\re` | reversal-index pointer (reserved, not emitted) |
| `\de` | definition (national; reserved for MW) |
| `\xv` | example sentence (vernacular) |
| `\xn` | example translation (national) |
| `\lf` / `\le` | lexical function / value (typed relation — compound decomposition) |
| `\cf` | cross-reference (untyped — q.v. targets) |
| `\va` | variant form (reserved, not emitted) |
| `\et` / `\es` | etymon / etymology source language |
| `\sd` | semantic domain (reserved, not emitted — source data now EXISTS: the H742 semdom ↔ Amarakosha crosswalk, [SEMDOM_AK_CROSSWALK_2026.md](https://github.com/gasyoun/SanskritLexicography/blob/master/data/SEMDOM_AK_CROSSWALK_2026.md), kosha manifest id `semdom-amarakosha-crosswalk`; emit only reviewed codes — the candidate table is a shortlist, top-1 17.5%, per [SanskritLexicography FINDINGS §76](https://github.com/gasyoun/SanskritLexicography/blob/master/FINDINGS.md)) |
| `\bb` | bibliography / source citation |
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
| `relation` (cross-reference, q.v.) | `\cf` | partial | No App. D lexical function cleanly types a generic see-also pointer; stays untyped. |
| `relation` (compound decomposition) | `\lf Compound` + `\le` | partial | App. D's `Compound` lexical function types each component ("lexicalized compound using headword not easily handled by other lexical functions"); still not an ordered/typed decomposition graph. |
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
| `<ab>` | abbreviation (`q.v.`, `&c.`) | inline; `q.v.` ⇒ `\cf` (untyped); compound component ⇒ `\lf Compound` + `\le` (typed) | partial | "q.v." marks a cross-reference target; a compound's own component words get the typed lexical function instead. |
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

A compound-decomposition record (real pilot output, `mw-pwg-pwk-nigfhya`):

```
\lx nigfhya
\hm 1
\lc ni-gfhya
\ps mfn.
\ge to be held back etc
\lf Compound
\le ni
\lf Compound
\le gfhya
\nt meta: profile=mdf-export-profile-v0.1; scope=full-mdf-marker-profile; review=full-machine-review; entry-type=compound; src=MW L=108119 pc=546,1
```

## Book-Sourced Refinements (11-07-2026, H721)

Read directly from Coward & Grimes 2000 App. B ("Relative order of fields in an
entry") and App. D ("Alphabetized starter list of lexical functions") via
`pypdf` text extraction of the local `MDF_2000.pdf` — not guessed or inferred
from general MDF/Toolbox knowledge. Three concrete refinements:

- ✅ **Field order is now validated against the book's actual App. B table, not
  a plausible-looking guess.** The true relative order, filtered to this
  profile's markers, is `\lx \hm \lc \se \ps \sn \ge \re \de \xv \xn \lf \le \cf
  \va \et \es \sd \bb \nt` — notably **`\lf`/`\cf` (relations) precede `\et`/`\es`
  (etymology)**, the reverse of a naive alphabetic-ish first guess. (An earlier
  draft of this refinement had `\et`/`\es` before `\cf`, `\re` after `\de`
  instead of between `\ge` and `\de`, and `\va` right after `\lc`; all three
  were corrected against the book text before this landed.)
  [`data/schema/mdf-export-profile.json`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/data/schema/mdf-export-profile.json)
  carries the corrected `fieldOrder` array, and
  [`scripts/validate-mdf-profile.mjs`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/scripts/validate-mdf-profile.mjs)
  checks every exported record's marker sequence against it (`\sn`/`\ge` and
  `\lf`/`\le` each share one order key since they legitimately alternate across
  repeats — a multi-sense record's `\sn`/`\ge` pairs, a multi-component
  compound's `\lf`/`\le` pairs; any other marker repeating in a run, e.g.
  multiple `\cf`/`\bb`, is a same-key repeat — a record is only flagged when a
  field's key is strictly less than the highest key already seen).
  `scripts/export-mdf.mjs` was fixed to emit `\lf`/`\le` before `\cf`
  accordingly.
- ✅ **`\ge` vs `\re` vs `\de` semantics settled**, and now correctly positioned
  per App. B (`\re` sits directly after `\ge`, before `\de`/`\we` — not after
  `\de` as an earlier draft had it). `\ge` is the interlinear/secondary gloss
  (App. B: "supplanted by a `\de`" — the two are mutually exclusive alternates
  at the same slot); `\de` is the primary prose definition in the dictionary's
  own national/target language; `\re` is a curated reversal-index pointer,
  never mined from body text. For MW, English is the national language, so MW
  glosses go to `\ge` and `\de`/`\re` stay reserved. The deferred item this
  settles is *which* field a future Sanskrit–Sanskrit kosha (SKD/VCP) profile
  should target: `\de` (Sanskrit is *their* national language, not a secondary
  gloss), never `\ge`. `\re` stays reserved regardless — reversal entries are
  policy-gated on a curated pass over `\ge`/`\de` fields, corroborated by the
  SIL correlation doc's finding that SIL builds reversals from curated gloss
  fields only, never mined (matching the csl-atlas body/reverse
  headword-mining rejection at 38.6% precision).
- ✅ **`\lf` (lexical functions) implemented for compound decomposition, from
  the book's actual App. D vocabulary — not fabricated.** App. D's `Compound`
  function ("Lexicalized compound using headword not easily handled by other
  lexical functions") is a direct, book-sourced fit: `export-mdf.mjs` now
  emits `\lf Compound` + `\le <component>` per component, upgrading
  compound-decomposition from `lossy` (flattened to untyped `\cf`) to
  `partial` (typed, still not an ordered/typed decomposition graph — no
  component role, position, or boundary type). q.v. cross-references stay
  plain `\cf`: no App. D function (Syn, Ant, Gen, Spec, Part, Whole, Cpart,
  Sim, ParS/ParD, …) cleanly types a generic "see also" pointer, and MDF's own
  `\cf` ("See:") is already the correct book-sanctioned home for that — typing
  it as, say, `Syn` would be a false precision claim the source text doesn't
  support. This lands the item an earlier draft of this refinement had
  deferred to H723/H724 pending a "digested" App. D list — the direct text
  extraction turned out sufficient without waiting on that separate digest
  pass, which still has its own scope (full literature digest into
  `literature/md/Lexicography-Manuals`, rights-check on committing the PDF).

## Real-Consumer Smoke Test — Lexique Pro 3.6 (H722)

MG ruled 11-07-2026 ([SIL MDF ecosystem correlation map](https://github.com/gasyoun/SanskritLexicography/blob/master/papers/SIL_MDF_ECOSYSTEM_CORRELATION.md) §5) that self-validation is not enough: the pilot export must be
loaded into a real MDF consumer. Executed 11/12-07-2026 by Fable 5 (`claude-fable-5`) under
[H722](https://github.com/gasyoun/Uprava/blob/main/handoffs/H722-Fable_csl-standards_lexique-pro-mdf-smoke-test_11.07.26.md):
[Lexique Pro 3.6.0.583](https://software.sil.org/lexiquepro/) (SIL freeware), run **portably** — the
setup exe demands admin elevation, but `innoextract 1.9` unpacks a fully working layout — and driven
via scripted Win32 automation (pywinauto 0.6.9). Input: all **250** pilot records from
[`data/pilot/mdf/`](https://github.com/sanskrit-lexicon/csl-standards/tree/main/data/pilot/mdf)
concatenated into one SFM lexicon file (records blank-line-separated, `\lx`-initial, CRLF,
UTF-8 **without** BOM per org convention).

**Load verdict: green.** The Configure Lexicon wizard accepted the file with no Toolbox
`.typ`/`.lng` sidecars ("Do not use any" default), recognised every marker in the pilot
inventory as standard MDF, pre-checked **English** as the gloss language from `\ge`, and
auto-derived the language marker letter `e`. Result: status bar `Sanskrit: 250 words` —
all 250 records parsed, **zero crashes or import errors** — and an English reversal
finderlist was auto-built purely from `\ge` values (`English: 390 words`), navigable back
to entries.

Consumer-setup facts a future MDF consumer of these exports must know:

- **Encoding is NOT auto-detected.** The wizard defaults to *Plain text file*; with our
  BOM-less UTF-8 that setting would mojibake every IAST character. *Unicode UTF-8 file*
  must be selected manually on the Encoding page. (Keeping the export BOM-less is still
  right — a BOM is banned org-wide and Toolbox-lineage tools accept declared UTF-8.)
- `\lc` replaces `\lx` as the display headword when present (em-dash segmentation like
  `DIra—tA` is preserved verbatim); `\hm` renders as a subscript on the headword and as
  `(n)` in the entry list.
- The wizard is non-destructive by design ("Lexique Pro will not make any changes to the
  database file itself") — safe to hand the raw export to end users.

### Per-marker render outcomes

| Marker | Count in pilot | Outcome | Evidence |
|---|---|---|---|
| `\lx` | 250 | ✅ renders | entry list + article header; SLP1 keys display verbatim |
| `\hm` | 129 | ✅ renders | subscript on headword (`A‑kalpa₁`), `(n)` in list |
| `\lc` | 83 | ✅ renders | replaces `\lx` as display headword; `DIra—tA` em-dash intact |
| `\ps` | 170 | ✅ renders | italic line under headword; non-ASCII `cl. 5P,5Ā` correct |
| `\sn` | 239 | ✅ renders | bold sense numbers, one paragraph per sense (`Ap₁` shows all 12) |
| `\ge` | 414 | ✅ renders | bulleted gloss per sense; also feeds the reversal index (390 words) |
| `\cf` | 13 | ✅ renders | teal *See:* hyperlink; resolving targets navigate (`ac`↔`aYc` verified round-trip); dangling targets (10/13 in-pilot) are inert — no crash, no error dialog |
| `\bb` | 379 | ⚠️ renders-wrong | *Read:* label, but **only one `\bb` per entry displays** — `Ap` carries 12 stacked `\bb` and shows only `AV. ix, 5, 22` |
| `\lf` + `\le` | 134 + 134 | ⚠️ renders-wrong | *Compound:* label, but **repeated identical `\lf` labels collapse to the last pair** — `DIra—tA` (`\le DIra` + `\le tA`) shows only `tA` |
| `\nt` | 515 | ✅ renders | every note as its own *Note:* paragraph; literal backslashes in note text display verbatim |
| `\et` | 3 | ✅ renders | *Etym:* line (`vi` → `dis`) |
| `\es` | 14 | ❌ ignored | never displayed — `vi` has `\es Lat.` and no trace renders |

### Findings (validator-passed, consumer-degraded)

All three findings pass [`validate-mdf-profile.mjs`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/scripts/validate-mdf-profile.mjs)
cleanly — they are display-layer losses in the consumer, surfaced only by this real-consumer test:

1. **Stacked `\bb` collapse.** The exporter emits all source references as consecutive
   `\bb` lines at the end of the entry; Lexique Pro displays exactly one. The
   MDF-idiomatic fix is **per-sense `\bb` placement** (each `\bb` inside the `\sn` block
   it evidences) and/or joining same-sense references into one `\bb` line — a serializer
   structure change in [`export-mdf.mjs`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/scripts/export-mdf.mjs),
   not a trivial patch, so logged as a review item per the H722 rule rather than
   hot-fixed. Until then 11/12 of `Ap`'s references are invisible in this consumer
   (data intact in the file).
2. **Repeated `\lf`/`\le` pair collapse.** Two `\lf Compound` + `\le` pairs render as a
   single *Compound:* group holding only the last `\le`. Candidate mitigation: one
   `\lf Compound` with a joined `\le DIra + tA` value, or distinct `\lf` labels — same
   review-item routing as (1).
3. **`\es` is display-dead in Lexique Pro.** Keep emitting it (the field is correct MDF
   and other consumers read it), but do not rely on it being visible here.

Screenshots (committed under [`docs/img/`](https://github.com/sanskrit-lexicon/csl-standards/tree/main/docs/img)):

![Pilot lexicon loaded — 250 words, alphabet index, reversal tab](https://raw.githubusercontent.com/sanskrit-lexicon/csl-standards/main/docs/img/lexiquepro-smoke-overview.png)

![Ap₁ — 12 numbered senses, IAST in \ps](https://raw.githubusercontent.com/sanskrit-lexicon/csl-standards/main/docs/img/lexiquepro-smoke-ap-senses.png)

![DIra—tA₂ — repeated \lf/\le pair collapsed to one value](https://raw.githubusercontent.com/sanskrit-lexicon/csl-standards/main/docs/img/lexiquepro-smoke-dirata-lf-collapse.png)

## Open Questions / Review Items

- ✅ **Resolved.** `<srs>`/`<bot>` roles confirmed against `csl-orig/v02/mw/mw-meta2.txt`:
  `<srs/>` is a sandhi rendering marker inside `<s>` (dropped, no `\sn`); `<bot>` is a
  Linnaean plant name (flows into `\ge`). See the markup table above.
- ✅ **Resolved.** `<k2>` maps to `\lc` **when it carries a morpheme boundary** (`—`/`-`),
  which preserves genuine segmentation/compounding information; when `<k2>` merely
  duplicates `<k1>` it is treated as index metadata and dropped. `\va` is reserved for
  true variant spellings (not emitted by the MW-only first pass).
- ✅ **Resolved (for MW).** MW's national language is English, so glosses go to `\ge`.
  The `\ge`/`\de`/`\re` choice for the Sanskrit–Sanskrit koshas (SKD/VCP) is now
  settled in favour of `\de` (see Book-Sourced Refinements above) for when the
  profile is extended beyond MW.
- ✅ **Resolved.** A per-record `\nt meta:` line carries the CDSL `<L>` id and `<pc>`
  coordinate (plus profile version, scope, review status, entry type) for round-trip
  traceability.
- ✅ **Resolved.** `\lf` typed lexical functions for compound decomposition —
  see Book-Sourced Refinements above. q.v. cross-references remain untyped
  `\cf` (no App. D function fits a generic see-also pointer).

## Next Steps

1. ✅ **Done.** Deterministic
   [`scripts/export-mdf.mjs`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/scripts/export-mdf.mjs)
   serializer over the neutral model, mirroring `export-tei.mjs` / `export-ontolex.mjs`
   (one CDSL record → one `.mdf` record in `data/pilot/mdf/`).
2. ✅ **Done.** An `\nt model-loss:` marker is emitted for every `lossy` adequacy row
   (hedge, root, continuation — compound decomposition is `partial` now, see below),
   and
   [`scripts/validate-mdf-profile.mjs`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/scripts/validate-mdf-profile.mjs)
   checks structure, marker inventory, field order, and the presence of each
   model-loss marker.
3. ✅ **Done.** The full hard sample runs through MDF and the loss corpus carries an
   `mdf` target alongside `tei`/`ontolex`/`lift`/`neutral`, so adequacy is comparable
   case-by-case (`npm run analyze-loss`: 217 `lossy` + 75 `partial`, down from
   292 `lossy`/0 `partial` before the `\lf Compound` refinement — MDF/LIFT are still
   the poorest two of the four views, but no longer uniformly `lossy`).
4. ✅ **Done (11-07-2026, H721).** Field order validated against the book's actual
   App. B table (not a guess); `\ge`/`\de`/`\re` semantics settled and correctly
   positioned; `\lf Compound` implemented from App. D for compound decomposition
   (`lossy`→`partial`); a fourth serialization ([LIFT](LIFT_EXPORT_MAPPING.md)) added
   beside MDF for consumption by living SIL tools, with the same field-order and
   `\lf`→`<relation type="Compound">` refinements carried over.
5. **Remaining.** Cross-check a Sanskrit MDF sample against the MUDIDI MDF conventions,
   since MUDIDI's parsing subset omits Sanskrit — this is the gap CDSL data can fill.
6. **Remaining.** Type `\lf` beyond `Compound` (e.g. a genuine `Syn`/`Ant` case, if
   one is ever identified in the neutral model — none of the current phenomena
   warrant it) and digest the rest of App. D into
   `literature/md/Lexicography-Manuals` (H723/H724), independent of this pass's
   direct-extraction fix.

_Dr. Mārcis Gasūns_
