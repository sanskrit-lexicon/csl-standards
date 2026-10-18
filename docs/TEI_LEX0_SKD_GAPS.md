_Created: 24-09-2026 · Last updated: 24-09-2026_

# TEI Lex-0 and the Śabdakalpadruma: where the indigenous apparatus has no home

This is the gaps file for the indigenous half of the TEI Lex-0 pilot (H5321). A
stratified sample of the *Śabdakalpadruma* (SKD) was exported to Lex-0 on the
existing generator. Every structure in the SKD apparatus that Lex-0 cannot hold
is recorded here, each with a real exported example. Where the standard had no
place for a structure, it was not forced into one.

The machine-readable twin is
[`data/pilot/skd-lex0-gaps.json`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/data/pilot/skd-lex0-gaps.json).
It is generated from the registry
[`scripts/lib/skd-gaps.mjs`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/scripts/lib/skd-gaps.mjs)
and the sample itself. Every exported entry names the gaps it shows as
`<note type="lex0-gap" n="Gx">`. The validator checks that the JSON and the
entries agree.

## 1. The sample

- **Source**: [`csl-orig v02/skd/skd.txt`](https://github.com/sanskrit-lexicon/csl-orig/blob/master/v02/skd/skd.txt)
  at `f4c08c578b33`. It has 42,196 content records. A further 335
  `{{Lbody=N}}` alias records are counted and excluded.
- **Root decode**: the csl-atlas M4 table
  [`data/lexico/indigenous_roots.csv`](https://github.com/sanskrit-lexicon/csl-atlas/blob/main/data/lexico/indigenous_roots.csv)
  at `bbca79116982`, 2,544 SKD root rows. It is the Dhātudīpikā anubandha key
  applied to the slot.
- **Strata**: a priority order, in which each record falls into the first stratum
  whose marker it carries (`classifyStratum` in
  [`scripts/lib/skd.mjs`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/scripts/lib/skd.mjs)).
  Every stratum is defined by something *printed* in the source. `residual` means
  the record carries none of these markers; it does not mean the record is empty.
- **Draw**: 4 records per stratum. The order is deterministic: FNV-1a over
  `h5321-skd-lex0-v1:<stratum>:<L>`, with no clock and no `Math.random`.
- **Also included**: the 6 curated kośa entries from earlier slices, and one
  *gap-witness* record for any gap the draw did not reach.

| Stratum | Positive marker | Corpus | Sample |
|---|---|---:|---:|
| dhatu-anubandha | M4 root row, no liṅga token, printed it-letters | 1,925 | 4 |
| dhatu-zero-slot | M4 root row, no liṅga token, empty slot | 445 | 4 |
| cross-reference | `… Sabde drazwavyam` in a body under 300 chars | 227 | 4 |
| nibandha | body of 4,000 chars or more | 667 | 4 |
| avyaya | leading `vya` | 423 | 4 |
| kosa-paryaya | `tatparyyAyaH` run | 4,553 | 10 (6 curated) |
| kosa-iti | `iti <authority>` closing formula | 22,553 | 5 (1 gap witness) |
| bhasa-gloss | `iti BAzA` | 716 | 4 |
| literary-quotation | `“…”` quotation | 6,487 | 4 |
| residual | none of the above | 4,200 | 4 |

That is 47 entries in total. They are exported beside the 250 MW/PWG/PWK cases as
`data/pilot/tei-lex0/skd-*.lex0.xml`. The sample and corpus census are in
[`data/pilot/skd-lex0-sample.json`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/data/pilot/skd-lex0-sample.json).

The M4 table also flags nouns that merely *cite* a root. A root stratum therefore
needs an M4 row **and** no leading liṅga token (`puM`, `strI`, `klI`, `tri`,
`vya`). Without that second condition, *carpaṭā* (strī) would be misclassified
as a dhātu.

## 2. Zero-meaning: marker absence is not content absence

SKD carries none of the Western `<ab>`/`<ls>` apparatus, so the digitisation is
full of silence. The export never treats silence as "no content". Three cases
are distinguished:

1. **Empty anubandha slot.** The SKD front matter says a root without it-letters
   is marked by a dot or zero. The empty slot is therefore the source's statement
   "no anubandha". It is encoded as `<gram type="anubandha" norm="none">`, with a
   `<note type="zero-meaning">` explaining it.
2. **Unmarked pada.** An unmarked pada is the parasmaipada *default*. It is not
   printed, so it is **not asserted**. The zero-meaning note says why no pada
   `<gram>` appears.
3. **Unresolved gaṇa.** This is a detector limit of the M4 decode, not a claim
   that the root has no gaṇa. It is noted and never encoded as a value.

Readings derived by M4 (gaṇa, pada, transitivity, it-augment) carry
`resp="#m4"`. Letters read as printed carry `resp="#source"`. The ODD enforces
both.

## 3. The gaps

"Corpus" is a positive-marker count over all SKD records. It is a lower bound,
never a claim that the structure is absent elsewhere. "Sample" is the number of
exported entries that witness the gap.

| Id | Structure | Class | Corpus | Sample | Example |
|---|---|---|---:|---:|---|
| G1 | iti-unit: sense and closing authority fused | no home | 30,029 | 30 | [skd-DarmmaH](https://github.com/sanskrit-lexicon/csl-standards/blob/main/data/pilot/tei-lex0/skd-DarmmaH.lex0.xml) L17667 |
| G2 | Anubandha slot (it-letters) on a root | no home | 1,925 | 4 | [skd-GiRa](https://github.com/sanskrit-lexicon/csl-standards/blob/main/data/pilot/tei-lex0/skd-GiRa.lex0.xml) L11792 |
| G3 | Zero-meaning: a marker's absence is a statement | no home | 445 | 7 | [skd-BarBa](https://github.com/sanskrit-lexicon/csl-standards/blob/main/data/pilot/tei-lex0/skd-BarBa.lex0.xml) L24806 |
| G4 | Dhātupāṭha commentary layer (Durgādāsa) | no home | 2,287 | 7 | [skd-GiRa](https://github.com/sanskrit-lexicon/csl-standards/blob/main/data/pilot/tei-lex0/skd-GiRa.lex0.xml) L11792 |
| G5 | Paryāya run: numbered synonym list | partial | 4,887 | 10 | [skd-kaRWaH](https://github.com/sanskrit-lexicon/csl-standards/blob/main/data/pilot/tei-lex0/skd-kaRWaH.lex0.xml) L6080 |
| G6 | Bhāṣā gloss without a language name | partial | 3,470 | 8 | [skd-carpawA](https://github.com/sanskrit-lexicon/csl-standards/blob/main/data/pilot/tei-lex0/skd-carpawA.lex0.xml) L12271 |
| G7 | Scoped cross-reference | partial | 354 | 5 | [skd-carpawA](https://github.com/sanskrit-lexicon/csl-standards/blob/main/data/pilot/tei-lex0/skd-carpawA.lex0.xml) L12271 |
| G8 | Nibandha: treatise prose inside an entry | no home | 667 | 4 | [skd-revatI](https://github.com/sanskrit-lexicon/csl-standards/blob/main/data/pilot/tei-lex0/skd-revatI.lex0.xml) L29882 |
| G9 | Quotation attributed by a following `iti <work>` | partial | 20,452 | 8 | [skd-kIrttiH](https://github.com/sanskrit-lexicon/csl-standards/blob/main/data/pilot/tei-lex0/skd-kIrttiH.lex0.xml) L7806 |
| G10 | Liṅga-based word class (triliṅga, avyaya) | partial | 4,440 | 5 | [skd-apa](https://github.com/sanskrit-lexicon/csl-standards/blob/main/data/pilot/tei-lex0/skd-apa.lex0.xml) L1368 |
| G11 | Derivation as grammatical analysis | partial | — | 6 | [skd-DarmmaH](https://github.com/sanskrit-lexicon/csl-standards/blob/main/data/pilot/tei-lex0/skd-DarmmaH.lex0.xml) L17667 |
| G12 | CDSL correction layer (digitisation) | digitisation | 114 | 1 | [skd-gAtraBaNgA](https://github.com/sanskrit-lexicon/csl-standards/blob/main/data/pilot/tei-lex0/skd-gAtraBaNgA.lex0.xml) L10817 |

G11 has no corpus count: a derivation parenthesis has no single positive marker
that would separate it from any other parenthesis.

### G1 — iti-unit: sense and closing authority fused (no home)

A run of meanings closes with `iti <authority>`. That formula is the boundary of
the sense unit, not apparatus that can be detached from it. Lex-0 separates
`<sense>`/`<def>` from `<bibl>` and has nothing in which the attestation *is* the
sense boundary. **Workaround:** one `<sense>` per authority group. The formula
goes inside it as `<bibl type="kosa-authority">`, together with
`<note type="model-loss">`. The entry declares `kosa-iti-unit`, and the ODD
constraint `csl-lex0-kosa-sense-boundary` checks the pairing. See
[TEI_LEX0_PILOT.md](https://github.com/sanskrit-lexicon/csl-standards/blob/main/docs/TEI_LEX0_PILOT.md) §5.

### G2 — anubandha slot (no home)

L11792 as printed: `GiRa¦, i Na grahaRe . iti kavikalpadrumaH ..`. Here `i Na`
are Vopadeva's it-letters. They are code letters for gaṇa and operations, and
they can be decoded only through the Dhātudīpikā key in the SKD front matter.
Lex-0 `<gramGrp>` has no category for an operation code. **Workaround:**

```xml
<gram type="anubandha" norm="i" cert="high" resp="#source">i</gram>
<gram type="anubandha" norm="ṅa" cert="high" resp="#source">Na</gram>
<gram type="pada" norm="atmanepada" cert="high" resp="#m4">ātmanepada</gram>
```

### G3 — zero-meaning (no home)

L24806 *bharbha* has an empty slot. Lex-0 cannot tell "the source states X is
absent" apart from "the source says nothing". An omitted `<gram>` reads as
unknown, and a filled one over-asserts. **Workaround:** see §2 above.

```xml
<gram type="anubandha" norm="none" cert="high" resp="#source">none</gram>
<note type="zero-meaning" resp="#machine">Empty anubandha slot: … the source's statement 'no anubandha', not missing data.</note>
```

### G4 — Dhātupāṭha commentary layer (no home)

After the Kavikalpadruma line, Durgādāsa restates each it-letter before the form
it licenses: `i, GiRRyate . Na, GiRRate . jeGiRRyate . iti durgAdAsaH`. Lex-0 has
no home for an attributed commentary nested inside an entry, nor for forms keyed
to the operation that produces them. **Workaround:**
`<note type="commentary"><bibl><author>Durgādāsa</author></bibl> …</note>`, in
IAST and capped at 600 characters. The archival profile keeps the full source.

### G5 — paryāya run (partial home)

In `tatparyyAyaH . X 2 Y 3 …` the synonyms are numbered from the kośa verse, with
the headword as no. 1, and the list is bound to its authority. `<xr type="synonymy">`
exists, but it can carry neither the ordinal nor that binding. **Workaround:**
the run stays inside the authority-bounded sense as `paryāya: …` in `<def>`. The
ordinals are dropped, and that loss is declared.

### G6 — bhāṣā gloss (partial home)

L12271: `cApaqAzazWI iti BAzA` means "in the vernacular: cāpaḍāṣaṣṭhī". The
source names only "the vernacular". `<cit type="translationEquivalent">` needs an
`@xml:lang`, so any language tag is an inference. **Workaround:** `xml:lang="bn-Latn"`
with `cert="medium" resp="#machine"` on the attribution.

### G7 — scoped cross-reference (partial home)

L12271: `asyA vivaraRaM capewISabde drazwavyam` means "for its account, see under
*capeṭī*". The reference defers only one aspect of the entry. `<xr>` has no way
to state which part is deferred. **Workaround:**
`<xr type="see"><lbl>asyā vivaraṇaṃ</lbl> <ref type="entry">capeṭī</ref></xr>`.

### G8 — nibandha (no home)

L29882 *revatī* carries about 9,500 characters of Purāṇic and astronomical
discussion, with 11 quotations and 9 attributions. Lex-0 excludes free prose and
has no container for an encyclopaedic discourse attached to a lemma.
**Workaround:** only the kośa-like head becomes senses. The rest is summarised in
`<note type="unparsed-prose">` (extent, quotations, attributions, opening). It
is never forced into `<def>`.

### G9 — quotation attributed by a following `iti <work>` (partial home)

A quotation `“…”` is followed by `iti <work>`. The source says which sense the
quotation illustrates only by where it stands. `<cit type="example">` must sit in
one sense. **Workaround:** the quotation is attached to the preceding sense group
as `<cit type="example" subtype="positional">`, so the link is marked as inferred
from position. A `yathā` example keeps its source link.

### G10 — liṅga-based word class (partial home)

`tri` (triliṅga, taking all three genders) and `vya` (avyaya) classify a word by
gender behaviour, not by part of speech. **Workaround:** `<pos norm="adjective"|"indeclinable" resp="#machine">`
plus the printed token as `<gram type="linga" resp="#source">`.

### G11 — derivation as grammatical analysis (partial home)

The etymology parenthesis is a Pāṇinian derivation: root + affix, a sūtra
reference, a compound type, or an Uṇādi sūtra. `<etym>` has no slot for the rule
applied. **Workaround:** `<etym type="derivation">` with `<mentioned>`, the full
analysis in `<note type="analysis">`, and the sūtra as
`<bibl><title>Aṣṭādhyāyī</title><citedRange>`.

### G12 — CDSL correction layer (digitisation, not indigenous)

L10817: `{{gAtraBaNgAH->gAtraBaNgA||20160503|Jim Funderburk|…/CORRECTIONS/issues/291|…}}`.
The corrected reading is exported, and each correction is witnessed in
`<note type="cdsl-correction" resp="#cdsl">` with its issue URL. It is listed
here so that digitisation gaps are not mistaken for indigenous ones.

## 4. Validation

- **Structural and cross-check.**
  [`scripts/validate-tei-lex0.mjs`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/scripts/validate-tei-lex0.mjs)
  passes 297/297 entries (250 MW/PWG/PWK + 47 SKD). The SKD gap registry is 12/12
  consistent: every gap has an example, and each `sampleCount` equals the number
  of entries that witness it.
- **Schema.** The ODD constraint `csl-lex0-skd-indigenous-apparatus` in
  [`tei-lex0-profile.odd.xml`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/data/schema/tei-lex0-profile.odd.xml)
  asserts the following:
  - an empty slot needs a zero-meaning note and G3;
  - a printed letter needs `#source` and G2;
  - gaṇa, pada, transitivity and it-augment need `#m4`;
  - gap ids match `G\d+` and sit only on SKD entries;
  - SKD documents declare `dict-skd`.
- **Pinned toolchain — pass.** The profile ODD was compiled with TEI P5 4.11.0 and
  TEI Stylesheets 7.60.0.
  - jing validated **297/297** files against the compiled RNG.
  - The Saxon 10.9 SVRL engine ran the ODD's Schematron: **297/297**, with 0
    failed asserts.
  - A negative control fails as it should. It is `skd-BarBa` with its
    zero-meaning note removed and an M4 gram re-attributed to the source.
  - The harness totals are 845 passed, 0 failed, 1 skipped; the skip is the
    archival ODD compile, which is outside this run. Recorded, with hashes, in
  [`data/pilot/skd-lex0-external-validation.json`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/data/pilot/skd-lex0-external-validation.json).
- **Official schema.** Validation against the official DARIAH Lex-0 RNG belongs
  to its sibling pin (H5320). Once that schema is in CI, this sample is its
  fixture.

## 5. Reproduce

```sh
npm run parse-skd-kosa && npm run export-tei-lex0 && npm run validate-tei-lex0
```

This needs `csl-orig` and `csl-atlas` as sibling checkouts. For the pinned-toolchain
run, use a box with Java, then:

```sh
npm run setup-external-tools && npm run validate-external-profiles:strict
```

_Гасунс_
