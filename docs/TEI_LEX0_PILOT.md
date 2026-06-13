# TEI Lex-0 Pilot

Date: 2026-06-13

Status: draft, slice 1 (target encoding + worked exemplars). The generator and
RNG validation are slice 2 (sec. 6–7).

This pilot establishes a **TEI Lex-0** baseline encoding for CDSL dictionary
entries, covering one Western dictionary (Monier-Williams) and — for the first
time in this workbench — one **indigenous *kośa*** (*Śabdakalpadruma*). It closes
the `csl-atlas` review gap **G2** ("no actual TEI Lex-0 export yet") by pinning
down the target element model and proving the hard, novel case (the indigenous
entry), with each statement's epistemic status bound to `@cert`/`@resp`.

Sample: [`data/pilot/tei-lex0/pilot-sample.lex0.tei.xml`](../data/pilot/tei-lex0/pilot-sample.lex0.tei.xml)
(entries `mw-gaja`, `skd-dharma`; well-formed; 5 senses; 11 `@cert`-bound nodes).

## Trust Block

- Evidence: `derived` — hand-authored from CDSL source records (MW L62306, SKD
  L17667), the TEI Lex-0 guidelines, and the committed evidence vocabulary.
- Limitations: a two-entry exemplar, not a generated corpus; validated for XML
  well-formedness and element-model alignment, **not yet** against the TEI Lex-0
  RNG (sec. 6).
- Validation: `python -m xml.etree.ElementTree` parse passes; full RNG check
  deferred to slice 2.
- Owner repo: `csl-standards`.
- Next use: slice 2 — a generator over the pilot set (incl. SKD ingestion) and
  Lex-0 RNG validation wired into `build-pilot`.

## 1. What already exists, and the gap

The workbench already emits TEI: [`scripts/export-tei.mjs`](../scripts/export-tei.mjs)
produces 50 entries under `data/pilot/tei/`, validated by
[`scripts/validate-tei-profile.mjs`](../scripts/validate-tei-profile.mjs). But that
output is the project's own **archival** profile (`tei-archival-profile-v0.1`,
see [`VALIDATED_INTEROPERABILITY_PROFILE.md`](VALIDATED_INTEROPERABILITY_PROFILE.md)),
and it is, by design, **not** TEI Lex-0:

- it targets the TEI *Dictionaries* module for archival fidelity (it preserves
  each raw CDSL record as an escaped `<cit type="source-entry"><quote>`), not the
  DARIAH Lex-0 baseline for interchange;
- it covers **only MW/PWG/PWK** — no indigenous dictionary;
- it carries **no `@cert`/`@resp`** evidence metadata, although the crosswalk
  ([`EVIDENCE_LABEL_CROSSWALK.md`](EVIDENCE_LABEL_CROSSWALK.md)) specifies the
  mapping.

This pilot adds the three missing pieces: a Lex-0 target encoding, an indigenous
entry, and the evidence→`@cert` binding.

## 2. Why Lex-0 in addition to the archival profile

The two are complementary, not competing. The archival profile answers *"what
did the printed dictionary say, record by record?"* and keeps the source text
recoverable. **TEI Lex-0** answers *"what is the reusable lexicographic content,
in a baseline another project can ingest?"* — a small, regular element set
(`entry`, `form/orth`, `gramGrp/pos`+`gen`, `sense/def`, `cit/quote`, `bibl`,
`etym`, `usg`, `re`) with controlled normalisation via `@norm`. A CDSL Lex-0
export is what makes the data citable into the wider lexicographic ecosystem
(ELEXIS / Lexonomy / DARIAH tooling).

## 3. CDSL → TEI Lex-0 element mapping

| CDSL / neutral model | TEI Lex-0 | Notes |
|---|---|---|
| `<L>` record / `dictionaryRecord` | `<entry xml:id>` | one entry per lemma record |
| `<k1>`/`<k2>` headword | `<form type="lemma"><orth notation="SLP1">` | SLP1 orth; `xml:lang="sa-Latn-x-SLP1"` |
| `<lex>` gender token | `<gen norm="…">` | `m`→masculine, `f`→feminine, `klī`→neuter (observed) |
| `<lex>` part of speech | `<pos norm="…">` | derived from the gender/lex token (e.g. `m.`→noun) |
| gloss / sense | `<sense><def xml:lang>` | numbered with `@xml:id`; `@cert`/`@resp` per sec. 4 |
| `<ls>` named source | `<bibl><abbr>…</abbr><citedRange>` | inside the sense it attests |
| MW `<ls>L.</ls>` hedge | `<usg type="hint">` or `<bibl type="generic-lexicographer">` | "lexicographers only"; distinctive of MW |
| quotation (kāvya line) | `<cit type="example"><quote>…</quote><bibl>` | indigenous `yathā …` examples |
| derivation / `vyutpatti` | `<etym><lbl/><mentioned/><bibl>` | e.g. SKD's Uṇādi reference |
| `ifc.` compound-final form | `<re type="comb" subtype="ifc"><form>` | MW *gaja* → f. `gajā` |
| *paryāya* synonym run | `<sense><def><lbl>paryāya</lbl> …</def>` | see sec. 5 (the loss) |

This refines the archival TEI table in
[`INTEROPERABILITY_MODEL.md`](INTEROPERABILITY_MODEL.md#tei-mapping): the neutral
model is the shared interpretation; archival TEI and Lex-0 are two views over it.

## 4. Evidence labels → `@cert` / `@resp`

Each Lex-0 statement carries the epistemic status defined in
[`EVIDENCE_LABEL_CROSSWALK.md`](EVIDENCE_LABEL_CROSSWALK.md#a-evidence-labels-prov-o-tei):

| evidence label | `@cert` | `@resp` |
|---|---|---|
| `observed` | `high` | the source dictionary (`#mw-source`, `#skd-source`) |
| `derived` | `high` | `#machine` (deterministic rule) |
| `inferred` | `low` (or `medium`) | the heuristic |
| `reviewed` | `high` | `#reviewer` |

In the sample, MW *gaja*'s `<gen>m</gen>` is `observed` (`cert="high" resp="#mw-source"`)
while its `<pos>noun</pos>` is `derived` (`cert="high" resp="#machine"`) — the same
`high` certainty but a different responsible agent, which is exactly the
distinction the crosswalk notes PROV-O alone cannot make.

## 5. The indigenous case and what Lex-0 loses

The *Śabdakalpadruma* entry for *Darmma* (L17667) is the reason the pilot includes
a *kośa*. Its synonym run — *puṇyam, śreyaḥ, sukṛtam, vṛṣaḥ* — **ends in its own
authority**, *ity amaraḥ* ("so [says] Amara"). In the source this is a single
*iti*-unit: the enumeration of senses and the citation of the source that
licenses them are **one indivisible construction**. TEI Lex-0 (like the European
lexicographic tradition it baselines) assumes sense and source are separable, so
the encoding must split the unit into a `<def>` plus a `<bibl>` — and the sample
flags this with `<note type="model-loss">`.

This is the same finding the sense-inheritance paper reports at corpus scale
(`csl-atlas` `docs/articles/paper_sense_inheritance.md` §7) and the crosswalk
records for the SKD register: the two Sanskrit lexicographic civilisations differ
not only in citation style but in **whether sense and citation are separable
categories at all**. A faithful indigenous Lex-0 export therefore needs a local
convention — treating the authority formula as a *boundary* of the sense unit
rather than as detachable apparatus — which is a candidate Lex-0 customisation
(ODD extension), not a defect to be silently flattened.

## 6. Validation status

- **Now:** the sample parses as well-formed XML and aligns with the Lex-0 element
  model (`entry` / `form` / `gramGrp` / `pos` / `gen` / `sense` / `def` / `cit` /
  `quote` / `bibl` / `etym` / `re` / `usg`).
- **Not yet:** validation against the **TEI Lex-0 RNG/ODD**. The archival
  validator [`validate-tei-profile.mjs`](../scripts/validate-tei-profile.mjs)
  checks the *archival* profile (it asserts three `<cit type="source-entry">` per
  entry — a Lex-0 entry has none), so it does **not** apply here. Lex-0 validation
  needs the DARIAH Lex-0 schema run through `jing`/`teitorelaxng` (the optional
  external harness, `validate-external-profiles`).

## 7. Next steps (slice 2)

1. `scripts/export-tei-lex0.mjs` — generate Lex-0 entries over the pilot set from
   the neutral model, emitting `@cert`/`@resp` from each field's evidence label.
2. **SKD ingestion** — extend the pilot sources beyond MW/PWG/PWK so the
   indigenous case is generated, not hand-authored.
3. A Lex-0 ODD (`data/schema/tei-lex0-profile.odd.xml`) + RNG validation wired
   into `build-pilot`, including the *kośa* sense-boundary customisation (sec. 5).
4. A Lex-0 loss report row family for the sense/citation-fusion phenomenon.

## References

- *TEI Lex-0: A baseline encoding for lexicographic resources* (DARIAH Working
  Group). <https://dariah-eric.github.io/lexicalresources/pages/TEILex0/TEILex0.html>
- TEI Consortium, *Guidelines*, ch. 9 "Dictionaries" and ch. 21 "Certainty,
  Precision, and Responsibility".
- [`EVIDENCE_LABEL_CROSSWALK.md`](EVIDENCE_LABEL_CROSSWALK.md) — evidence labels →
  PROV-O / TEI `@cert`/`@resp`.
- [`VALIDATED_INTEROPERABILITY_PROFILE.md`](VALIDATED_INTEROPERABILITY_PROFILE.md)
  — the archival TEI profile this pilot complements.
- `csl-atlas` `docs/articles/paper_sense_inheritance.md` §7 — the SKD
  sense/citation-fusion finding at corpus scale.
- Source records: CDSL MW `L62306` (*gaja*), SKD `L17667` (*Darmma*).
