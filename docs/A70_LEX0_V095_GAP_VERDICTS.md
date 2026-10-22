# A70 — official TEI Lex-0 v0.9.5 RNG: per-gap verdict record (H6196)

_Run: 22-10-2026 · pin: official Lex-0 v0.9.5 RNG (`data/schema/TEILex0-v0.9.5.rng`, provenance in its `.PROVENANCE.md`; source lex-0.org build 2026-02-08T16:26:17Z = bcdh/tei-lex-0 tag v0.9.5, ODD at tag byte-identical to repo main HEAD) · validator: `scripts/validate-tei-lex0-schema.mjs` via `xmllint --relaxng` (libxml2 2.15.4 — see the libxml2 note at the end) · report: `data/pilot/tei-lex0-schema-review.json` · corpus: 297 generated + 1 hand-authored exemplar._

**Result: 291/298 valid; 7 files rejected, all as recorded G4 witnesses; negative control rejected (pin live).**

Per the note's §7 rule, verdicts are recorded verbatim from the validator output, no re-interpretation. A rejection strengthens the corresponding gap's proposal; a survival means the workaround coexists with the official grammar.

## Gate-level verdicts (not gap-specific)

| # | Construct | v0.9.5 verdict | Verbatim validator output |
|---|---|---|---|
| 0a | `entry` without `@type` | **REJECTED** — `entry/@type` is now required (v0.9.4 did not require it; all 298 exports failed as-is before the generator gained `type="entry"`) | `element body: Relax-NG validity error : Element body failed to validate content` (negative control, report `negativeControl.error`; adding `type="entry"` passes — verified on skd-pArasI during the run) |
| 0b | `entry` nested inside `entry` (exemplar `relatedEntry` shape) | **REJECTED** (v0.9.4 admitted the nesting; exemplar flattened to a sibling entry) | `element entry: Relax-NG validity error : Did not expect element entry there` + `element body: Relax-NG validity error : Element body has extra content: entry` |
| 0c | `<lbl>` inside `<def>` (exemplar *paryāya* label) | **REJECTED** (v0.9.4 admitted it; label now plain text, per the G5 workaround as written) | `element lbl: Relax-NG validity error : Element def has extra content: lbl` |

## Per-gap verdicts (G1–G12)

Survive = the workaround construct as exported validates against the official v0.9.5 RNG; the row's evidence file is a case in the report's `cases` with `ok: true` unless noted.

| Gap | Workaround as exported | v0.9.5 verdict | Evidence (validator output line / report case) |
|---|---|---|---|
| G1 | *iti*-unit: authority formula as `<cit type="example"><bibl type="kosa-authority">` inside the sense | **SURVIVES** | `skd-hulahulI.lex0.xml` validates (23/30 G1-tagged files pass; the 7 failures are the G4 shape below, not the G1 shape); probe with the shape validates clean |
| G2 | *anubandha* slot as `<gram type="anubandha" norm="…" resp="#source">` | **SURVIVES** — `gram/@type` is an open (Name-datatype) choice; the handoff's expected rejection of non-official values did **not** materialize | probe carrying `<gram type="anubandha" norm="none">` validates; the 4 G2-tagged files (skd-GiRa, skd-DrAGa, skd-garjja, skd-stamBa) fail **only** on the G4 note/bibl shape (e.g. `skd-GiRa.lex0.xml:53: element bibl: Relax-NG validity error : Did not expect element bibl there`), not on the `gram` rows |
| G3 | zero-meaning: empty slot as `<gram type="anubandha" norm="none">` + `<note type="zero-meaning">` | **SURVIVES** | `skd-karvva.lex0.xml` validates (7 tagged: 1 passes, 6 fail only as G4 witnesses) |
| G4 | Dhātupāṭha commentary as `<note type="commentary">` with `<bibl><author>Durgādāsa</author></bibl>` | **REJECTED — witness ruling recorded** | `skd-sarjja.lex0.xml:54: element bibl: Relax-NG validity error : Did not expect element bibl there` + `Element note has extra content: bibl` (all 7 witnesses identical). Per §7 the shape is kept and the rejection recorded verbatim — the validator asserts these files still fail with exactly this line (`EXPECTED_WITNESS_REJECTIONS`); conforming them away would silently erase G4's strongest exhibit |
| G5 | *paryāya* run kept whole as plain prose in `<def>` inside the authority-bounded sense | **SURVIVES** as written; the `<lbl>` wrapper variant is rejected (gate-level 0c) | `skd-hulahulI.lex0.xml` validates (10/10 tagged pass) |
| G6 | *bhāṣā* gloss as `<cit type="translationEquivalent" xml:lang="bn-Latn" cert="medium" resp="#machine">` | **SURVIVES** | `skd-hulahulI.lex0.xml` validates (8/8 tagged pass) |
| G7 | scoped cross-reference as `<ref type="entry" subtype="see">` with the scope in text | **SURVIVES** — and v0.9.5 `ref` now carries `att.scoped.attributes` (`@scope`, upstream issue #63 / PR #104 landed), so the official attribute coexists with the workaround; exports do not yet use `@scope` | `skd-SiSutvaM.lex0.xml` validates (5/5 tagged pass); `att.scoped.attributes` present on `ref` in `data/schema/TEILex0-v0.9.5.rng` |
| G8 | *nibandha* prose summarised in `<note type="unparsed-prose">` | **SURVIVES** | `skd-annapUrRA.lex0.xml` validates (4/4 tagged pass) |
| G9 | position-attached quotation as `<cit type="example" subtype="positional">` | **SURVIVES** | `skd-varaH.lex0.xml` validates (8/8 tagged pass) |
| G10 | *triliṅga*/*avyaya* as `<gram type="pos" norm="…">` + `<gram type="linga">` | **SURVIVES** — the open `gram/@type` choice admits `linga`/`anubandha` as printed-token names; the handoff's expected controlled-vocabulary rejection did **not** materialize | `skd-aDarastAt.lex0.xml` validates (5/5 tagged pass) |
| G11 | derivation as `<etym subtype="derivation">` + `<hi rend="mentioned">` + `<note type="analysis">` | **SURVIVES** | `skd-DarmmaH.lex0.xml` validates (6/6 tagged pass) |
| G12 | CDSL correction as `<note type="cdsl-correction">`; the issue URL moved from `<ref>` to plain text (note content admits no `ref`) | **SURVIVES** after the conformance; the previous `ref`-in-note shape is rejected | `skd-gAtraBaNgA.lex0.xml` validates (1/1 tagged pass); old shape: `Relax-NG validity error : Element ref failed to validate attributes` (probe) |

## Reproduce

```sh
npm run validate-tei-lex0-schema   # 291/298 valid; 7 G4 witnesses rejected as recorded; negative control rejected — pin live
npm run validate-tei-lex0          # 297/297 structural baseline; SKD gap registry 12/12 consistent
```

Negative control: a document in the generator's own header shape with `entry/@type` dropped must fail; a run where it passes is a broken pin, not a success.

## libxml2 pin

The official v0.9.5 RNG hangs libxml2 < 2.15 forever (`xmlRelaxNGSimplify` recursion; verified on 2.9.13 and 2.14.6 — both hang; 2.15.4 validates in ~30 ms/file). CI therefore builds libxml2 2.15.4 and pins `xmllint` to it unless the runner already ships ≥ 2.15 (`.github/workflows/ci.yml`, "Validate TEI Lex-0 against official v0.9.5 schema" step). All verdicts above were produced with 2.15.4.
