# LIFT Export Mapping (Fourth Profile)

_Created: 11-07-2026 · Last updated: 11-07-2026_

Status: **implemented.** The **fourth export profile**, beside the existing
[TEI archival](INTEROPERABILITY_MODEL.md#tei-mapping), [OntoLex/FrAC semantic](INTEROPERABILITY_MODEL.md#ontolex-mapping),
and [MDF flat-field](MDF_EXPORT_MAPPING.md) views, targeting SIL's
**LIFT (Lexicon Interchange FormaT)** XML schema — the modern successor to MDF's
SFM markers, consumed directly by [FLEx](https://software.sil.org/fieldworks/) and
[Lexique Pro](https://software.sil.org/lexiquepro/), and the source format
[Webonary](https://www.webonary.org/) and [Dictionary App Builder](https://software.sil.org/dictionaryappbuilder/)
publish from. Format: [`sillsdev/lift-standard`](https://github.com/sillsdev/lift-standard)
version 0.13. Serialized by
[`scripts/export-lift.mjs`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/scripts/export-lift.mjs),
validated by
[`scripts/validate-lift-profile.mjs`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/scripts/validate-lift-profile.mjs)
against
[`data/schema/lift-export-profile.json`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/data/schema/lift-export-profile.json),
and compared case-by-case against TEI/OntoLex/MDF in the loss corpus (the `lift`
target in [`build-loss-reports.mjs`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/scripts/build-loss-reports.mjs)).
Run via `npm run export-lift` / `npm run validate-lift-profile` (both wired into
`npm run build-pilot`). Ruled 11-07-2026 in
[`SIL_MDF_ECOSYSTEM_CORRELATION.md`](https://github.com/gasyoun/SanskritLexicography/blob/master/papers/SIL_MDF_ECOSYSTEM_CORRELATION.md)
§5.2: "LIFT: add now (not parked) — fourth serialization beside TEI/OntoLex/MDF."

## Why LIFT, And Why A Fourth View (Not A Replacement For MDF)

MDF and LIFT model the same field-linguistics tradition (Toolbox/FLEx lineage) but
serve different consumers:

1. **MDF buys MUDIDI comparability** — the benchmark's Stage 2 target is MDF SFM
   markers, and a real SIL consumer (Lexique Pro) reads MDF directly with zero
   import step (→ [H722](https://github.com/gasyoun/Uprava/blob/main/handoffs/H722-Fable_csl-standards_lexique-pro-mdf-smoke-test_11.07.26.md)).
2. **LIFT buys consumption by *living* SIL tools.** FLEx and Lexique Pro both
   exchange LIFT natively; it is the interchange format Webonary and Dictionary
   App Builder actually ingest, not merely display. Publishing only MDF would
   strand the CDSL data one import-step short of those channels.
3. **LIFT is XML, MDF is SFM — the adequacy calls carry over, the shape does not.**
   This mapping does not re-derive MDF's field-level adequacy decisions
   (`docs/MDF_EXPORT_MAPPING.md`); it re-expresses the same clean/partial/lossy
   calls in LIFT's `<entry>`/`<sense>`/`<relation>`/`<etymology>`/`<note>`
   structure. Where MDF's `\nt model-loss:` line makes a flattening visible,
   LIFT's `<note type="model-loss">` does the same job.

## Target LIFT Element Inventory

The subset of LIFT 0.13 elements this profile emits (national language = English
for MW, vernacular = `sa-Latn-x-slp1`):

| Element | Role | MDF analogue |
|---|---|---|
| `<entry id order>` | one lexeme record; `order` = MW homonym number | `\lx` record + `\hm` |
| `<lexical-unit><form lang><text>` | headword | `\lx` |
| `<variant><form><text>` + `<trait name="variant-type">` | segmented/sort form with a genuine morpheme boundary | `\lc` |
| `<sense id order>` | one sense (order only on multi-sense entries) | `\sn` |
| `<grammatical-info value>` | part of speech + gender | `\ps` |
| `<gloss lang="en"><text>` | English gloss | `\ge` |
| `<relation type="cf" ref>` | cross-reference, untyped (q.v. targets) | `\cf` |
| `<relation type="Compound" ref>` | cross-reference, typed (compound components) | `\lf Compound` + `\le` |
| `<etymology type source><form><text>` | etymon + source language | `\et` / `\es` |
| `<note type="source">` | bibliography / source citation, hedge kept literal `L.` | `\bb` |
| `<note type="model-loss">` | a lossy adequacy call made visible | `\nt model-loss:` |
| `<note type="meta">` | per-entry provenance (profile, scope, review, entry-type, MW pointer) | `\nt meta:` |
| `<note type="sense-numbering">` | declares inferred (prose) sense numbering | `\nt sense-numbering:` |

Not yet emitted (reserved, scope for a future pass, see Next Steps): `<definition>`
(would carry `\de` once the profile extends past MW to Sanskrit–Sanskrit national-
language koshas — see `MDF_EXPORT_MAPPING.md`'s resolved `\ge`/`\de`/`\re`
ruling), `<pronunciation>`, `<example>` (MW has none to populate, same as MDF's
empty `\xv`/`\xn`), `<reversal>` (finderlists are policy-rejected per the SIL
correlation doc §2 — reversals come only from curated gloss fields, never mined,
which is not yet done for any profile), and `guid`/`dateCreated`/`dateModified`
attributes (omitted so output stays byte-reproducible across runs, matching the
other three profiles' no-timestamp convention).

## Neutral Model → LIFT

Parallel to the equivalent table in `MDF_EXPORT_MAPPING.md`; adequacy calls are
identical by construction (same source data, same phenomena), the "Notes" column
states only what differs because LIFT is XML rather than line-oriented SFM.

| Neutral Model | LIFT Target | Adequacy | Notes vs. MDF |
|---|---|---|---|
| `dictionaryRecord` | `<entry>` | clean | One CDSL `<L>…<LEND>` → one LIFT `<entry>`, same as MDF's record block. |
| `form` (headword) | `<lexical-unit><form><text>` | clean | Identical to MDF `\lx`. |
| `form` (variant / segmented) | `<variant>` (boundary-bearing `<k2>` only) | partial | Same boundary-detection rule as MDF `\lc`; LIFT additionally lets the variant carry a `trait`, unused for MW. |
| `form` (homonym index) | `<entry order>` attribute | clean | LIFT expresses homograph order as an attribute, not a field value. |
| `grammar` | `<grammatical-info value>` | clean | Same as MDF `\ps`. |
| `sense` | `<sense>` + `<gloss>` | partial | Same prose-inference caveat as MDF `\sn`/`\ge`. |
| `citation` (textual / coordinate / named-kosha) | `<note type="source">` | partial | LIFT core has no dedicated bibliography field either; same flat-string preservation as MDF `\bb`. |
| `citation` (generic-lexicographer `L.`) | `<note type="source">` + `<note type="model-loss">` | **lossy** | Same evidential-hedge gap as MDF; LIFT has no evidence/provenance node in core (a custom `<trait>` could add one — out of scope for this pass, tracked below). |
| `relation` (cross-reference, q.v.) | `<relation type="cf">` | partial | Direction/role untyped, same as MDF `\cf`. No App. D lexical function cleanly types a generic see-also pointer (checked directly against the book's App. D list — not a placeholder pending a future digest). |
| `relation` (compound decomposition) | `<relation type="Compound">` | partial | LIFT twin of MDF's `\lf Compound` (App. D: "lexicalized compound using headword not easily handled by other lexical functions") — a direct, book-sourced fit. Still not an ordered/typed decomposition graph. |
| `relation` (continuation) | merge into parent entry | lossy | Same as MDF; LIFT has no continuation concept either. |
| `relation` (root / derivation) | `<etymology>` + `<note type="model-loss">` | lossy | LIFT's `<etymology>` holds the root string (marginally richer than MDF's bare `\et`) but not a typed derivational-base relation. |
| `loss` | `<note type="model-loss">` | n/a | Reviewed samples only, same as MDF. |

## Stress Points (LIFT-specific, beyond the MDF twins above)

- **LIFT is per-entry XML, this profile emits one file per case (a fragment, not
  a merged lexicon).** A production FLEx/Lexique Pro import expects one `.lift`
  file containing all entries under a single `<lift>` root plus a `.lift-ranges`
  sidecar (controlled vocabularies for `<trait>`/`<relation type>` values,
  parts-of-speech, semantic domains). Neither the merge nor the ranges file is
  built by this pass — `export-lift.mjs` deliberately mirrors `export-mdf.mjs`'s
  per-case fragment pattern for review/validation symmetry across all four
  profiles. Merging into a single importable lexicon is a follow-on step (see
  Next Steps), not required for the loss-corpus comparison this profile exists
  to support.
- **No `.lift-ranges` sidecar yet**, so `<grammatical-info value="m.">` etc. use
  MW's raw abbreviation strings rather than a LIFT-ranges-conformant controlled
  vocabulary. FLEx will accept unmapped values but flag them for reconciliation
  on import — expected friction for a first pass, not a defect to silently paper
  over.
- **`<relation type="Compound">` uses the book's App. D label as the type string
  verbatim, not a LIFT-native controlled-vocabulary term.** This is a pragmatic
  choice, not a claim that "Compound" is part of any LIFT range definition —
  it keeps the MDF and LIFT profiles' typed-relation vocabulary identical
  (both traceable to the same App. D source), which matters more for
  loss-corpus comparability than conforming to a not-yet-built
  `.lift-ranges` sidecar (see Next Steps). q.v. cross-references stay
  `type="cf"`, LIFT's own default relation type, for the same reason MDF
  keeps them plain `\cf`: no App. D function fits a generic see-also pointer.

## Worked Example

Same CDSL source as the MDF mapping doc's worked example (MW record 3, the
hedge case):

```
<L>3<pc>1,1<k1>a<k2>a<h>2<e>1
<hom>2.</hom> <s>a</s> ¦ (<s>pragfhya</s>, <ab>q.v.</ab>), a vocative particle …, <ls>T.</ls>
<LEND>
```

Candidate LIFT fragment:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<lift version="0.13" producer="csl-standards/export-lift.mjs">
  <entry id="mw-a-2" order="2">
    <lexical-unit>
      <form lang="sa-Latn-x-slp1"><text>a</text></form>
    </lexical-unit>
    <sense id="mw-a-2-s1">
      <gloss lang="en"><text>(pragṛhya, q.v.), a vocative particle …</text></gloss>
      <relation type="cf" ref="pragfhya"/>
    </sense>
    <note type="source"><form lang="en"><text>T.</text></form></note>
    <note type="model-loss"><form lang="en"><text>&lt;ls&gt;L.&lt;/ls&gt; generic-lexicographer hedge flattened to a source note; evidence-kind not representable in LIFT core</text></form></note>
    <note type="meta"><form lang="en"><text>profile=lift-export-profile-v0.1; scope=full-lift-entry-profile; review=full-machine-review; entry-type=lemma; src=MW L=3 pc=1,1</text></form></note>
  </entry>
</lift>
```

(The worked entry above uses `T.` as the source note, matching the MW record's
literal `<ls>T.</ls>`; the model-loss note documents the class of flattening the
mapping applies whenever the hedge/`L.` case is triggered, per
`MDF_EXPORT_MAPPING.md`'s worked example.)

The compound-decomposition twin of the MDF doc's `nigfhya` example (real pilot
output, `mw-pwg-pwk-nigfhya.lift`):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<lift version="0.13" producer="csl-standards/export-lift.mjs">
  <entry id="mw-pwg-pwk-nigfhya" order="1">
    <lexical-unit>
      <form lang="sa-Latn-x-slp1"><text>nigfhya</text></form>
    </lexical-unit>
    <variant>
      <form lang="sa-Latn-x-slp1"><text>ni-gfhya</text></form>
      <trait name="variant-type" value="segmented-citation-form"/>
    </variant>
    <sense id="mw-pwg-pwk-nigfhya-s1">
      <grammatical-info value="mfn."/>
      <gloss lang="en"><text>to be held back etc</text></gloss>
      <relation type="Compound" ref="ni"/>
      <relation type="Compound" ref="gfhya"/>
    </sense>
    <note type="meta"><form lang="en"><text>profile=lift-export-profile-v0.1; scope=full-lift-entry-profile; review=full-machine-review; entry-type=compound; src=MW L=108119 pc=546,1</text></form></note>
  </entry>
</lift>
```

## Open Questions / Review Items

- ✅ **Resolved.** Typed `<relation>` values — LIFT's analogue of MDF App D
  `\lf` lexical functions — implemented for compound decomposition
  (`<relation type="Compound">`), read directly from the book's App. D text
  (`pypdf` extraction of `MDF_2000.pdf`), not a placeholder pending a future
  digest. q.v. cross-references stay `type="cf"` — no App. D function fits a
  generic see-also pointer (see Stress Points above).
- **Deferred.** Merging the per-case fragments into a single `<lift>` lexicon
  file plus a `.lift-ranges` sidecar is needed before a real FLEx/Lexique Pro
  import, but is not required for loss-corpus comparability — tracked as a
  follow-on, most naturally alongside the Lexique Pro smoke test
  ([H722](https://github.com/gasyoun/Uprava/blob/main/handoffs/H722-Fable_csl-standards_lexique-pro-mdf-smoke-test_11.07.26.md))
  or the kosha/PWG integration pass
  ([H727](https://github.com/gasyoun/Uprava/blob/main/handoffs/H727-Fable_SanskritLexicography_pwg-kosha-mdf-integration_11.07.26.md)).
- **Resolved (for MW).** Vernacular language tag is `sa-Latn-x-slp1` (SLP1 kept
  consistent with the TEI and MDF profiles' orth notation, tagged per BCP-47
  private-use conventions); national language is `en`, matching MDF's `\ge`
  scope for MW.

## Next Steps

1. ✅ **Done.** Deterministic
   [`scripts/export-lift.mjs`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/scripts/export-lift.mjs)
   serializer over the neutral model, mirroring `export-mdf.mjs` field-by-field
   (one CDSL record → one `.lift` entry fragment in `data/pilot/lift/`).
2. ✅ **Done.** A `<note type="model-loss">` is emitted for every `lossy`
   adequacy row (hedge, root, continuation — compound decomposition is
   `partial` now, typed via `<relation type="Compound">`), and
   [`scripts/validate-lift-profile.mjs`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/scripts/validate-lift-profile.mjs)
   checks structure, element inventory, and the presence of each model-loss
   note.
3. ✅ **Done.** The full hard sample runs through LIFT and the loss corpus
   carries a `lift` target alongside `tei`/`ontolex`/`mdf`/`neutral`
   (`npm run analyze-loss`: 217 `lossy` + 75 `partial`, identical to MDF by
   construction), so adequacy is comparable case-by-case across all four
   profiles.
4. ✅ **Done (11-07-2026, H721).** `<relation type="Compound">` implemented
   from the book's actual App. D text for compound decomposition.
5. **Remaining.** Merge per-case fragments into one importable `<lift>` lexicon
   + `.lift-ranges` sidecar (see Open Questions above).

_Dr. Mārcis Gasūns_
