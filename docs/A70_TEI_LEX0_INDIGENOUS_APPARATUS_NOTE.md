_Created: 24-09-2026 · Last updated: 24-09-2026_

# What TEI Lex-0 lacks for the indigenous apparatus: twelve structures from the Śabdakalpadruma, with workarounds and proposed extensions

Dr. Mārcis Gasūns (draft prepared with a little help from my Chinese friend)

> **Status.** Draft note, not submitted (Uprava H5322, portfolio row A70). It is the
> publishable form of the gaps file
> [`TEI_LEX0_SKD_GAPS.md`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/docs/TEI_LEX0_SKD_GAPS.md)
> and its machine twin
> [`data/pilot/skd-lex0-gaps.json`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/data/pilot/skd-lex0-gaps.json).
> Every example below is an exported, validated entry in
> [`data/pilot/tei-lex0/`](https://github.com/sanskrit-lexicon/csl-standards/tree/main/data/pilot/tei-lex0).
> Venue candidates are in §8. The proposals are offered for discussion in the TEI Lex-0
> working group; none is adopted anywhere yet.

## Abstract

TEI Lex-0 is a baseline element model abstracted from European print dictionaries. We
exported a seeded, stratified sample of 47 entries from the *Śabdakalpadruma* (SKD), the
nineteenth-century Sanskrit compilation of the indigenous *kośa* and *dhātupāṭha*
traditions, to Lex-0 on a generator already validated over 250 entries from three
Western Sanskrit dictionaries. The sample validates 297/297 against a compiled ODD and
its Schematron. Twelve structures of the indigenous apparatus have no Lex-0 home or only
a partial one. Five have no home at all: the *iti*-unit in which the attestation is the
sense boundary, the *anubandha* slot of operation letters on a root, the zero-meaning
rule by which a marker's absence is a statement, the attributed commentary layer inside
an entry, and the encyclopaedic *nibandha* prose. Six have a partial home and one is a
digitisation artefact. For each we give a real exported example, the workaround the
export uses today, and a proposed extension. Nine of the twelve proposals need no
schema change; they are controlled values or guideline examples. Two need a
content-model change. One is out of Lex-0 scope. Corpus counts over all 42,196 SKD
records show that the five no-home structures are not marginal: the corpus carries
30,029 closing `iti` formulas, one per *iti*-unit.

## 1. The problem

TEI Lex-0 exists so that dictionaries encoded by different projects can be compared,
merged and queried with one element model (Romary and Tasovac 2018; DARIAH-ERIC
Working Group on Lexical Resources, guidelines). Its baseline was abstracted from
European print dictionaries: a headword, a grammar group, numbered senses, definitions,
usage labels, examples with bibliographic references, and cross-references drawn from a
short list of lexical relations.

Sanskrit lexicography has a second lineage. The indigenous *kośa* is a versified synonym
list closed by the name of its authority; the *dhātupāṭha* is a root list whose grammar
is coded in letters decoded through a key. The *Śabdakalpadruma* of Rādhākānta Deva
compiles both into one alphabetic dictionary in Sanskrit, with vernacular glosses and,
for many lemmata, treatise-length discussion. The Cologne Digital Sanskrit Dictionaries
(CDSL) carry it as 42,196 content records.

The question this note answers is narrow. When the SKD apparatus is exported to Lex-0
without forcing, which structures have no place to go? "Without forcing" is the method:
where the standard had no home for a structure, the export did not invent one. It
recorded the loss in a typed note and left the structure in the archival profile. The
answer is twelve structures. They are listed with counts in §3 and with proposals in §4.

## 2. Data and validation

The details are in
[`TEI_LEX0_SKD_GAPS.md`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/docs/TEI_LEX0_SKD_GAPS.md)
§1 and §4. What matters for the argument:

- **Source.** CDSL `skd.txt` at csl-orig `f4c08c578b33`: 42,196 content records plus
  335 alias records, excluded.
- **Root decode.** The csl-atlas M4 table (2,544 SKD root rows) applies the
  Dhātudīpikā *anubandha* key. Readings derived by it carry `resp="#m4"`; letters as
  printed carry `resp="#source"`.
- **Strata.** Ten strata, each defined by something printed in the source, in a
  priority order. Four records per stratum by a deterministic draw (FNV-1a over a fixed
  seed and the record number), plus six curated *kośa* entries and one gap witness. That
  is 47 SKD entries beside the 250 MW/PWG/PWK cases: 297 in all.
- **Validation.** The pinned toolchain (TEI P5 4.11.0, Stylesheets 7.60.0, jing, Saxon
  10.9) validates 297/297 against the compiled RNG and 297/297 against the ODD's
  Schematron. A negative control fails as it should. Every SKD entry names the gaps it
  witnesses as `<note type="lex0-gap" n="Gx">`, and the validator checks that the JSON
  registry and the entries agree, 12/12.
- **Counts.** A corpus count is a positive-marker count over all records. It is a lower
  bound and never a claim that the structure is absent elsewhere. G11 has no count: a
  derivation parenthesis has no single marker that separates it from any other
  parenthesis.

Validation against the official DARIAH Lex-0 RNG is a separate pin (Uprava H5320). Until
it is in CI, "validates" here means "against our profile ODD", which is a strict
subset of Lex-0 plus our constraints.

## 3. The twelve gaps: structure, example, workaround, proposal

Change classes used below, and summarised in §4:

- **A** guideline example only, no schema change;
- **B** a new controlled value for an existing attribute (`gram/@type`, `note/@type`,
  `cit/@subtype`, `@norm`);
- **C** a content-model change;
- **D** out of Lex-0 scope.

### G1. The *iti*-unit: sense and closing authority are one thing (no home; 30,029; class B)

**Structure.** A run of meanings or synonyms is closed by `iti <authority>`: *iti
Amaraḥ*, *iti Medinī*. The formula is the boundary of the sense unit. It is not a
citation attached to a sense; it is what makes the run a sense.

**Example.** *dharma* (L17667) has three such runs, each closed by a different
authority: Amara, Medinī, Hemacandra. In the export each becomes one `<sense>`:

```xml
<sense n="2">
  <def xml:lang="sa-Latn" resp="#source">nyāyaḥ; svabhāvaḥ; ācāraḥ; upamā; kratuḥ; ahiṃsā; upaniṣat</def>
  <bibl type="kosa-authority"><title>Medinī</title></bibl>
  <note type="model-loss" resp="#source">Sense and its closing authority (iti Medinī) are one indivisible iti-unit in the source, split into def + bibl in the Lex-0 baseline.</note>
</sense>
```

**Workaround.** One `<sense>` per authority group, the formula inside it as
`<bibl type="kosa-authority">`, a `<note type="model-loss">`, and an entry-level
declaration `<note type="entry-convention">kosa-iti-unit</note>`. The ODD constraint
`csl-lex0-kosa-sense-boundary` checks that every sense in such an entry ends in its
authority.

**Proposal.** Lex-0 should recognise an *authority-bounded sense*. The least invasive
form is a controlled value: `<sense type="kosa">` (or `@subtype`) whose guideline
semantics are "the last `<bibl>` child is the boundary of the sense, not an example
source". No content-model change is needed; `<bibl>` is already permitted inside
`<sense>`. The Schematron rule we use can be offered as an optional check. This is the
one gap already argued at length in the Western-side paper
([`PAPER.md`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/docs/PAPER.md)
§ evidence class) and prototyped as the `csl:` fusion construct in
[`EXTENSION_PROPOSAL.md`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/docs/EXTENSION_PROPOSAL.md)
§5; the SKD sample shows it is the dominant sense construction of the indigenous
tradition, not a curiosity.

### G2. The *anubandha* slot: operation letters on a root (no home; 1,925; class B)

**Structure.** Right after the root a *dhātupāṭha* entry carries Vopadeva's
it-letters, for instance `i ṅa` in `ghiṇa¦, i ṅa grahaṇe`. They are code letters for the
root's class and morphophonemic operations. They mean nothing without the Dhātudīpikā
key printed in the SKD front matter.

**Example.** *ghiṇa* (L11792):

```xml
<gramGrp>
  <pos norm="verb" resp="#machine">verb</pos>
  <gram type="anubandha" norm="i" resp="#source">i</gram>
  <gram type="anubandha" norm="ṅa" resp="#source">Na</gram>
  <gram type="pada" norm="atmanepada" resp="#m4">ātmanepada</gram>
  <gram type="it-augment" resp="#m4">seṭ</gram>
</gramGrp>
```

**Workaround.** One `<gram type="anubandha">` per letter as printed, `resp="#source"`;
the decoded class, voice, transitivity and augment as further `<gram>` elements with
`resp="#m4"`. The ODD enforces the responsibility split.

**Proposal.** Add `anubandha` to the controlled list of `gram/@type` values, with the
guideline semantics "an operation code whose decoding key is a table in the same
dictionary". The list has grown by pull request before (DARIAH-ERIC/lexicalresources
[#236](https://github.com/DARIAH-ERIC/lexicalresources/pull/236) added `degree`), so
this is the established route. The key itself should be encoded once, as a table in the
`<encodingDesc>` or a front-matter `<div>`, and each code letter should be able to
point at its row by `@corresp`. The decoded values (`gana`, `pada`) need either their
own `gram/@type` values or a documented mapping onto existing ones where Lex-0 has a
near equivalent; we have not asserted such a mapping.

### G3. Zero-meaning: a marker's absence is itself a statement (no home; 445; class A)

**Structure.** The SKD front matter says that a root without it-letters is marked by a
dot or a zero. An empty slot is therefore the source's statement "no *anubandha*". An
unmarked *pada* means the *parasmaipada* default. The source asserts by silence.

**Example.** *bharbha* (L24806) has an empty slot:

```xml
<gram type="anubandha" norm="none" resp="#source">none</gram>
<note type="zero-meaning" resp="#machine">Empty anubandha slot: per the Śabdakalpadruma front matter a root without anubandha carries a dot or zero here — the source's statement 'no anubandha', not missing data.</note>
```

**Workaround.** The empty slot becomes `norm="none"` with a zero-meaning note. An
unmarked *pada* and an unresolved class are **not** asserted; the note says why no
`<gram>` appears. Three cases are kept apart: source-stated absence, source silence
with a known default, and a detector limit of the decode.

**Proposal.** No schema change. Lex-0 should reserve one token for stated absence in
`@norm` (we use `none`) and say in the guidelines that an omitted `<gram>` means "not
stated", never "absent". The three-way distinction above is the guideline text. Without
it, a filled `<gram>` over-asserts and an omitted one under-reads, and the two errors
are invisible to any validator.

### G4. The commentary layer inside the entry (no home; 2,287; class C)

**Structure.** After the Kavikalpadruma line, Durgādāsa's commentary restates each
it-letter before the form it licenses and closes with `iti durgādāsaḥ`: `i, ghiṇṇyate .
ṅa, ghiṇṇate . jeghiṇṇyate`. It is an attributed commentary nested in the entry, and its
forms are keyed to the operation that produces them.

**Example.** *ghiṇa* (L11792):

```xml
<note type="commentary" xml:lang="sa-Latn" resp="#source"><bibl><author>Durgādāsa</author></bibl> i, ghiṇṇyate . ṅa, ghiṇṇate . jeghiṇṇyate</note>
```

**Workaround.** A `<note type="commentary">` with a `<bibl>` for the commentator and
the text in IAST, capped at 600 characters. The archival profile keeps the full source.

**Proposal.** Two steps. First, `commentary` as a recommended `note/@type` value with a
`<bibl>` child for the commentator (class B). Second, the part that needs a content
model: a form licensed by an operation should be encodable as `<form type="derived">`
carrying `@corresp` to the `<gram type="anubandha">` it illustrates, so that "ṅa gives
*ghiṇṇate*" is a link and not prose (class C). The first step is enough to stop the loss;
the second makes the commentary queryable.

### G5. The *paryāya* run: an authority's numbered synonym list (partial; 4,887; class B)

**Structure.** `tatparyāyaḥ . X 2 Y 3 …`: synonyms numbered from the *kośa* verse, the
headword being no. 1, bound to the authority that closes the run.

**Example.** *kīrti* (L7806): `sukhyātiḥ — paryāya: yaśaḥ, samajñā`, closed by Amara.
The run is kept inside the sense as text:

```xml
<def xml:lang="sa-Latn" resp="#source">sukhyātiḥ — paryāya: yaśaḥ, samajñā</def>
<bibl type="kosa-authority"><author>Amara</author></bibl>
```

**Workaround.** The run stays inside the authority-bounded sense (so G1 is not broken),
the ordinals are dropped, and the loss is declared.

**Proposal.** `<xr type="synonymy">` exists, but it can carry neither the verse ordinal
nor the binding to one authority. Allow `@n` on each `<ref>` for the ordinal, and allow
a `<bibl>` inside `<xr>` for the authority, both as guideline examples, and reserve
`subtype="paryaya"` on the `<xr>` so that a numbered, authority-bound list is
distinguishable from a modern synonym note. The working group's own handling of
referenced sense numbers as surface labels (issue
[#242](https://github.com/DARIAH-ERIC/lexicalresources/issues/242)) is the model: the
printed number is a `<lbl>` first, a computable link second.

### G6. The *bhāṣā* gloss: a vernacular equivalent with no language name (partial; 3,470; class A)

**Structure.** `cāpaḍāṣaṣṭhī iti bhāṣā`: "in the vernacular". The equivalent is
Bengali, occasionally Hindi, written in Sanskrit orthography. The source names only "the
vernacular".

**Example.** *carpaṭā* (L12271):

```xml
<cit type="translationEquivalent" xml:lang="bn-Latn" cert="medium" resp="#machine"><quote>cāpaḍāṣaṣṭhī</quote></cit>
```

**Workaround.** `xml:lang="bn-Latn"` with `cert="medium"` and `resp="#machine"` on the
attribution; the gloss itself is `resp="#source"`.

**Proposal.** No schema change. The guidelines should show the pattern where the
source's own label survives: the printed label as `<lbl>bhāṣā</lbl>` inside the `<cit>`,
`xml:lang="und-Latn"` (BCP 47 *undetermined*) on the quote when the project declines to
infer, and the inferred language as a separate, `@cert`-marked statement. Our export
infers; a more cautious project should be able not to, and still validate.

### G7. The scoped cross-reference (partial; 354; class A, pending upstream)

**Structure.** `asyā vivaraṇaṃ capeṭīśabde draṣṭavyam`: "for its account, see under
*capeṭī*". The reference defers one aspect of the entry (its properties, its account,
the rest) to another headword. `<xr>` has `@type` but no way to say which part of the
entry is deferred.

**Example.** *carpaṭā* (L12271):

```xml
<xr type="see"><lbl xml:lang="sa-Latn">asyā vivaraṇaṃ</lbl> <ref type="entry" cert="medium" resp="#machine">capeṭī</ref></xr>
```

**Workaround.** The scope as `<lbl>`, the target as `<ref type="entry">`.

**Proposal.** The working group already opened this: issue
[#63](https://github.com/DARIAH-ERIC/lexicalresources/issues/63) proposes a scope
attribute on `<ref>` once `<ref>` joins `att.lexicographic`, and issue
[#64](https://github.com/DARIAH-ERIC/lexicalresources/issues/64) a cross-reference type
for inclusion rather than pointing. The SKD scoped cases (354 in the corpus, 5 in the
sample) are offered as test material for whichever resolution lands. Until then the
`<lbl>` form is a guideline example, not a schema change.

### G8. *Nibandha*: treatise prose inside an entry (no home; 667; class C)

**Structure.** Entries of 4,000 characters or more embed ritual, medical, astronomical
or narrative discussion with its own paragraphs, quotations and attributions. *revatī*
(L29882) carries about 9,500 characters of Purāṇic and astronomical discussion, with 11
quotations and 9 attributions.

**Example.** *revatī*:

```xml
<note type="unparsed-prose" resp="#machine">1 prose segment(s), 9562 characters not reduced to glosses; nibandha remainder: 11 quotation(s), 9 distinct attribution(s); opens "durgā . yathā, “revā tu narmmadā devī …” iti devīpurāṇe 45 adhyāyaḥ …". Full text: the archival profile / source record.</note>
```

**Workaround.** Only the *kośa*-like head becomes senses. The rest is summarised in a
note (extent, quotation count, attribution count, opening). It is never forced into
`<def>`.

**Proposal.** Lex-0 excludes free prose (`<dictScrap>`) by design, and rightly for a
baseline. But an encyclopaedic discourse attached to a lemma is content, not scrap, and
it is the norm in the Sanskrit *nibandha* tradition as in many historical dictionaries.
We propose a typed prose container at entry level, `<note type="discourse">`, whose
content model admits `<p>`, `<cit>`, `<quote>` and `<bibl>`, and an `@extent` in
characters so a consumer can decide whether to load it. This is a content-model change.
The fallback that needs none is a `<ptr>` to the full TEI text in the archival profile,
which is what our summary note effectively is.

### G9. A quotation attributed by a following `iti <work>` (partial; 20,452; class B)

**Structure.** A quotation is followed by `iti <work>`. Which sense it illustrates is
given only by where it stands. `<cit type="example">` must sit in one `<sense>`; the
source gives adjacency, not a link.

**Example.** *kīrti* (L7806), sense 6:

```xml
<cit type="example" subtype="positional" xml:lang="sa">
  <quote xml:space="preserve">yaśaḥkīrttipravibhraṣṭo jīvannapi na jīvati</quote>
  <bibl><title>kasyacit</title></bibl>
</cit>
```

**Workaround.** The quotation is attached to the sense group it follows, with
`subtype="positional"` so the link is marked as inferred. A `yathā` example, where the
source states the link, keeps no such mark.

**Proposal.** Reserve `positional` as a `cit/@subtype` value, with guideline semantics
"the sense link is inferred from position, not stated by the source". This is a
provenance statement about a link, and links have no element to carry `@cert`, so the
subtype is the one place it can go. Twenty thousand quotations in one dictionary is a
large enough population to make the distinction worth a token.

### G10. Word class by gender behaviour: *triliṅga*, *avyaya* (partial; 4,440; class B)

**Structure.** The indigenous class is given by gender behaviour: `tri` (takes all
three genders, in effect an adjective) and `vya` (*avyaya*, indeclinable). It is a
morphological criterion, not a part of speech.

**Example.** *apa* (L1368):

```xml
<gramGrp>
  <pos norm="indeclinable" resp="#machine">indeclinable</pos>
  <gram type="linga" resp="#source">vya</gram>
</gramGrp>
```

**Workaround.** A machine-attributed `<pos>` beside the printed token as
`<gram type="linga" resp="#source">`.

**Proposal.** Add `linga` to `gram/@type`, or document under an existing value the
case where a gender label is the word-class label. The important guideline point is
the responsibility split shown above: the `<pos>` is an inference and says so; the
`<gram>` is the source.

### G11. Derivation as grammatical analysis (partial; no count; class A)

**Structure.** The etymology parenthesis is a Pāṇinian derivation: root plus affix, a
*sūtra* reference, a compound type (`nañsamāsaḥ`), or an Uṇādi *sūtra*.

**Example.** *kīrti* (L7806):

```xml
<etym type="derivation"><lbl>from</lbl> <mentioned xml:lang="sa">kṝt + ktin</mentioned> <bibl><title>Uṇādisūtra 4.118</title></bibl> <note type="analysis" xml:lang="sa-Latn" resp="#source">kṝt + ktin . yadvā, kṝt saṃśabdane “hṛpiṣiruhīti” uṇāṃ 4 . 118 . irādikāryye in .</note></etym>
```

**Workaround.** `<etym type="derivation">` with `<mentioned>` for root and affix, the
full analysis as a note, and the licensing rule as `<bibl>`.

**Proposal.** No schema change for the root-plus-affix and *sūtra* cases: `<etym>`
already holds `<mentioned>`, `<lbl>` and `<bibl>`, and the guideline needs only the
example that a *rule* can be the bibliographic object. The compound-type token is the
gap: it is a grammatical analysis of the lemma, not an etymon, and belongs in
`<gramGrp>` as a `<gram type="samasa">` (class B) rather than in `<etym>`.

### G12. The CDSL correction layer (digitisation, not indigenous; 114; class D)

**Structure.** csl-orig embeds editorial corrections with date, editor and issue URL:
`{{gātrabhaṅgāḥ->gātrabhaṅgā|…|CORRECTIONS/issues/291|…}}`.

**Example.** *gātrabhaṅgā* (L10817):

```xml
<note type="cdsl-correction" resp="#cdsl">gātrabhaṅgāḥ → gātrabhaṅgā <ref target="https://github.com/sanskrit-lexicon/CORRECTIONS/issues/291">…/CORRECTIONS/issues/291</ref></note>
```

**Workaround.** The corrected reading is exported; each correction is witnessed in a
note with its issue URL.

**Proposal.** None for Lex-0. This is a fact about the digitisation, and it is listed so
that digitisation gaps are not mistaken for indigenous ones. In the archival profile the
right home is TEI `<choice>` with `<sic>` and `<corr>` inside `<orth>`, which Lex-0 as a
baseline need not admit.

## 4. The proposals in one table

| Gap | Structure | Corpus | Class | Proposal | Upstream thread |
|---|---|---:|:-:|---|---|
| G1 | *iti*-unit | 30,029 | B | `sense/@type="kosa"`: last `<bibl>` is the sense boundary; optional Schematron | none; our [EXTENSION_PROPOSAL §5](https://github.com/sanskrit-lexicon/csl-standards/blob/main/docs/EXTENSION_PROPOSAL.md) |
| G2 | *anubandha* slot | 1,925 | B | `gram/@type="anubandha"`; key encoded once, letters `@corresp` to it | [#236](https://github.com/DARIAH-ERIC/lexicalresources/pull/236) (route precedent) |
| G3 | zero-meaning | 445 | A | reserve `@norm="none"` for stated absence; omitted = not stated | none |
| G4 | commentary layer | 2,287 | B + C | `note/@type="commentary"` with `<bibl>`; `form/@corresp` to the licensing `<gram>` | none |
| G5 | *paryāya* run | 4,887 | B | `ref/@n` ordinals, `<bibl>` in `<xr>`, `xr/@subtype="paryaya"` | [#242](https://github.com/DARIAH-ERIC/lexicalresources/issues/242) |
| G6 | *bhāṣā* gloss | 3,470 | A | `<lbl>` keeps the source label; `und-Latn` when not inferring | none |
| G7 | scoped cross-reference | 354 | A | adopt the #63 scope attribute; SKD cases as tests | [#63](https://github.com/DARIAH-ERIC/lexicalresources/issues/63), [#64](https://github.com/DARIAH-ERIC/lexicalresources/issues/64) |
| G8 | *nibandha* prose | 667 | C | `note/@type="discourse"` admitting `<p>`, `<cit>`, `<bibl>`, with `@extent` | none |
| G9 | positional quotation | 20,452 | B | `cit/@subtype="positional"` | none |
| G10 | *liṅga* word class | 4,440 | B | `gram/@type="linga"`; `<pos>` as marked inference | none |
| G11 | derivation analysis | — | A + B | guideline example for rule-as-`<bibl>`; `gram/@type="samasa"` | none |
| G12 | CDSL correction | 114 | D | out of scope; `<choice>` in the archival profile | none |

Nine proposals are class A or B and need no content-model change. G4 and G8 need one.
G12 needs nothing from Lex-0.

## 5. Design principles behind the proposals

1. **Attribute before element.** Every proposal is first tried as a controlled value on
   an attribute Lex-0 already has. A new element is proposed only where content has to
   go somewhere it cannot go today (G4 second step, G8).
2. **Absence is a statement, and silence is not.** A source that asserts by silence
   must be encodable without the encoder asserting for it. G3 is the rule; G2 and G10
   apply it through the responsibility split.
3. **As printed and as decoded are two claims.** Whatever the source prints carries
   `resp="#source"`; whatever a key, a table or a script produced carries its own
   `@resp` and `@cert`. Lex-0 already has the attributes; the proposals only insist on
   the split.
4. **The tradition's unit outranks the standard's unit.** Where the source's unit is the
   authority-bounded run (G1, G5) the export keeps it whole and marks the loss, rather
   than splitting it to fit `<def>` plus `<bibl>` and losing the fact that they were one.
5. **Prose is content, not scrap.** The *nibandha* is the largest thing in the SKD and
   the one thing Lex-0 refuses on principle. A typed container with an extent is the
   compromise between a baseline that stays small and a dictionary that is mostly prose.

## 6. Relation to prior work

- The Western-side pilot of this repository
  ([`PAPER.md`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/docs/PAPER.md),
  [`LOSS_ANALYSIS.md`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/docs/LOSS_ANALYSIS.md))
  measured 2,038 loss reports over 280 cases from MW, PWG and PWK. Its dominant cause,
  the missing evidence class, is the Western face of G1: a citation whose *kind* the
  standard cannot say. The `csl:` extension layer in
  [`EXTENSION_PROPOSAL.md`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/docs/EXTENSION_PROPOSAL.md)
  already prototypes the fusion construct (§5). This note adds the eleven structures
  that only appear once the indigenous half is exported.
- [`TEI_LEX0_PILOT.md`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/docs/TEI_LEX0_PILOT.md)
  §5 first stated the *iti*-unit loss on one curated entry; the stratified sample makes
  it a corpus fact.
- The sense/citation fusion at corpus scale is argued in the csl-atlas paper on sense
  inheritance (§7), and the SKD/VCP microstructure is the subject of the portfolio's
  A30 and A04 drafts. This note stays on the standard's side of that line: what Lex-0
  needs, not what the *kośa* is.
- On the Lex-0 side, issues #63, #64 and #242 of the working group's tracker show the
  same pressure from European historical dictionaries: scoped references, inclusion
  references, and referenced sense numbers. The SKD cases are more numerous and more
  regular, which is the argument for treating them as test material.

## 7. Limitations, and what would refute this note

- **One dictionary.** SKD is the largest compilation of the indigenous tradition, but
  the Vācaspatya and the primary *kośa* texts may show structures SKD flattens. The
  twelve are a floor.
- **Sample of 47.** The strata guarantee that each structure is witnessed, not that its
  variants are. Corpus counts are marker counts and lower bounds.
- **Profile validation, not official.** "297/297" is against our ODD. The official
  DARIAH RNG pin (H5320) may reject a workaround, in which case the proposal for that
  gap is strengthened, not weakened, but the sentence "validates today" must be
  re-checked.
- **Decode certainty.** The M4 decode is a table; where it is silent the export says
  so. A revision of the table changes `resp="#m4"` values, not the gap list.
- **Language inference.** `bn-Latn` for the *bhāṣā* gloss is an inference over the
  whole dictionary, not per gloss. G6's proposal exists so that a project can decline
  it.

**Refutation.** The claim "no home" for G1, G2, G3, G4 and G8 is falsified if the
current Lex-0 ODD and guidelines already admit an encoding that keeps the structure
whole without a `model-loss` note. We checked the guidelines and the tracker searches
recorded in §6; we did not find one. A working-group member who does would collapse the
corresponding proposal into a guideline example, and this note would be shortened
accordingly. The class-A proposals are already that.

## 8. Venue and next steps

- **Venue candidates**, not chosen: a discussion issue in the working group's tracker
  (DARIAH-ERIC/lexicalresources), which costs nothing and reaches the people who
  maintain the ODD; a short article in the *Journal of the Text Encoding Initiative*;
  a short paper at eLex 2027. The tracker issue is the natural first step, since seven
  of the twelve proposals are controlled values the working group can accept or refuse
  in a comment.
- **No submission** is made by this note. The portfolio row is Uprava
  [`ARTICLES.md`](https://github.com/gasyoun/Uprava/blob/main/ARTICLES.md) A70.
- **Next engineering step**: run the sample against the official DARIAH RNG (H5320)
  and record per gap which workaround it rejects.

## References

To be verified at submission; the two web sources were live on 24-09-2026.

- DARIAH-ERIC Working Group on Lexical Resources. *TEI Lex-0: A baseline encoding for
  lexicographic resources.* <https://dariah-eric.github.io/lexicalresources/pages/TEILex0/TEILex0.html>
- DARIAH-ERIC/lexicalresources issue tracker, issues #63, #64, #242 and pull request
  #236. <https://github.com/DARIAH-ERIC/lexicalresources/issues>
- Romary, L. and Tasovac, T. 2018. "TEI Lex-0: A Target Format for TEI-Encoded
  Dictionaries and Lexicons." *TEI Conference and Members' Meeting 2018*, Tokyo.
- TEI Consortium. *TEI P5: Guidelines for Electronic Text Encoding and Interchange*,
  ch. 9 "Dictionaries" and ch. 21 "Certainty, Precision, and Responsibility".
- Rādhākānta Deva. *Śabdakalpadruma.* Calcutta, nineteenth century. Digital text:
  Cologne Digital Sanskrit Dictionaries, csl-orig `v02/skd/skd.txt`.
- This repository:
  [`TEI_LEX0_SKD_GAPS.md`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/docs/TEI_LEX0_SKD_GAPS.md),
  [`data/pilot/skd-lex0-gaps.json`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/data/pilot/skd-lex0-gaps.json),
  [`data/pilot/skd-lex0-sample.json`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/data/pilot/skd-lex0-sample.json),
  [`data/pilot/skd-lex0-external-validation.json`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/data/pilot/skd-lex0-external-validation.json),
  [`data/schema/tei-lex0-profile.odd.xml`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/data/schema/tei-lex0-profile.odd.xml).

_Гасунс_
