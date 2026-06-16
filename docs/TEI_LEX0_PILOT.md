# TEI Lex-0 Pilot

Date: 2026-06-13

Status: draft. Slice 1 (target encoding + worked exemplars), slice 2 (generator +
structural validator), and slice 3 (a source *kośa* parser, so the indigenous
entry is ingested from SKD rather than hand-curated) are done. The Lex-0 ODD is
authored and RNG validation is wired into the external harness (sec. 6); actually
running it needs the Java/TEI-Stylesheets toolchain.

This pilot establishes a **TEI Lex-0** baseline encoding for CDSL dictionary
entries, covering one Western dictionary (Monier-Williams) and — for the first
time in this workbench — one **indigenous *kośa*** (*Śabdakalpadruma*). It closes
the `csl-atlas` review gap **G2** ("no actual TEI Lex-0 export yet") by pinning
down the target element model and proving the hard, novel case (the indigenous
entry), with each statement's epistemic status bound to `@cert`/`@resp`.

Hand-authored exemplar (the documented target encoding, with inline comments):
[`data/pilot/tei-lex0/pilot-sample.lex0.tei.xml`](../data/pilot/tei-lex0/pilot-sample.lex0.tei.xml)
(entries `mw-gaja`, `skd-dharma`; well-formed; 5 senses; 11 `@cert`-bound nodes).

Generated corpus: `npm run export-tei-lex0`
([`scripts/export-tei-lex0.mjs`](../scripts/export-tei-lex0.mjs)) emits **256**
Lex-0 entries under `data/pilot/tei-lex0/*.lex0.xml` — the 250 MW/PWG/PWK neutral-
model cases plus **6 indigenous SKD entries** (*Darmma*, *kīrti*, *kaṇṭha*,
*vara*, *pāruṣya*, *tūla*). The SKD entries are **parsed from source**
by `npm run parse-skd-kosa` ([`scripts/parse-skd-kosa.mjs`](../scripts/parse-skd-kosa.mjs)),
which segments each kośa record by its closing authorities (*iti amaraḥ* / *iti
medinī* / *iti hemacandraḥ*, plus *Bharata*, *Jaṭādhara*, *Trikāṇḍaśeṣa*,
*Śabdaratnāvalī*, *Viśva*, *Śabdacandrikā*) into
[`data/pilot/lex0-fixtures.json`](../data/pilot/lex0-fixtures.json). Glosses are
transliterated from the SLP1 source to IAST (the lemma `orth` is left in SLP1, as
declared); recognised kośas are emitted as `<bibl><title>`, persons as
`<bibl><author>`. Every statement carries `@cert`/`@resp`; `npm run
validate-tei-lex0` checks all 256 against the Lex-0 baseline shape. The three steps
are wired into `build-pilot`.

## Trust Block

- Evidence: `derived` — hand-authored from CDSL source records (MW L62306, SKD
  L17667), the TEI Lex-0 guidelines, and the committed evidence vocabulary.
- Limitations: a two-entry exemplar, not a generated corpus; validated for XML
  well-formedness and element-model alignment, **not yet** against the TEI Lex-0
  RNG (sec. 6).
- Validation: `python -m xml.etree.ElementTree` parse passes; full RNG check
  deferred to slice 2.
- Owner repo: `csl-standards`.
- Next use: slice 2 — a generator over the pilot set (incl. SKD ingestion); Lex-0
  RNG validation is wired into `validate-external-profiles` (sec. 6).

## 1. What already exists, and the gap

The workbench already emits TEI: [`scripts/export-tei.mjs`](../scripts/export-tei.mjs)
produces 250 entries under `data/pilot/tei/`, validated by
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
the encoding must split the unit into a `<def>` plus a `<bibl>` — and the output
flags this with `<note type="model-loss">`.

The parser ([`scripts/parse-skd-kosa.mjs`](../scripts/parse-skd-kosa.mjs)) makes
this structural rather than asserted: it segments the record on its closing
authorities, so each `<sense>` *is* an authority group (Amara → Medinī →
Hemacandra), and the synonym run plus its `iti amaraḥ` become one sense carrying
the loss note. The split into `<def>` + `<bibl>` is therefore visibly an
encoding artefact of the target standard, not a feature of the source.

This is the same finding the sense-inheritance paper reports at corpus scale
(`csl-atlas` `docs/articles/paper_sense_inheritance.md` §7) and the crosswalk
records for the SKD register: the two Sanskrit lexicographic civilisations differ
not only in citation style but in **whether sense and citation are separable
categories at all**. A faithful indigenous Lex-0 export therefore needs a local
convention — treating the authority formula as a *boundary* of the sense unit
rather than as detachable apparatus — not a defect to be silently flattened.

This convention is now **implemented** (EXTENSION_PROPOSAL §5): each kośa entry
declares it with `<note type="entry-convention">kosa-iti-unit</note>`, every sense
closed by an authority carries it as a typed `<bibl type="kosa-authority">` plus a
`<note type="model-loss">` witnessing the fusion, the ODD's
`csl-lex0-kosa-sense-boundary` Schematron asserts the pairing, and
[`validate-tei-lex0`](../scripts/validate-tei-lex0.mjs) enforces it in `build-pilot`.

## 6. Validation status

- **Done (slice 2):** [`scripts/validate-tei-lex0.mjs`](../scripts/validate-tei-lex0.mjs)
  checks all 256 generated entries for well-formedness and the Lex-0 baseline
  shape — a lemma `form/orth`, a `gramGrp` or `sense`, `@cert` on the lemma orth,
  the profile-version note, and the **absence** of the archival
  `<cit type="source-entry">`. Report: `data/pilot/tei-lex0-review.json`. Note the
  archival validator [`validate-tei-profile.mjs`](../scripts/validate-tei-profile.mjs)
  does **not** apply here (it requires three source-entry cits per entry, which a
  Lex-0 entry has none of).
- **Wired (RNG):** a project Lex-0 ODD
  ([`data/schema/tei-lex0-profile.odd.xml`](../data/schema/tei-lex0-profile.odd.xml))
  is authored and the RNG validation is wired into
  [`validate-external-profiles`](../scripts/validate-external-profiles.mjs): it
  compiles the ODD with `teitorelaxng` (or uses a precompiled schema from
  `CSL_STANDARDS_LEX0_RNG`) and validates every `*.lex0.xml` with `jing`/`xmllint`.
  The run is **gated on the local Java/TEI-Stylesheets toolchain**; where those are
  absent it is recorded as a `skipped` check (not a silent pass), exactly like the
  archival `tei-rng` check.

## 7. Next steps

1. **Done:** a Lex-0 ODD (`data/schema/tei-lex0-profile.odd.xml`) + RNG validation
   wired into `validate-external-profiles`, including the *kośa* sense-boundary
   customisation (sec. 5) as a documented Schematron constraint. Still external:
   actually *running* the RNG needs the Java/TEI-Stylesheets toolchain (see sec. 6).
2. **Done (slice 4):** broadened the *kośa* parser
   ([`scripts/parse-skd-kosa.mjs`](../scripts/parse-skd-kosa.mjs)) beyond *Darmma*
   (L17667) to 6 SKD records (*kīrti* L7806, *kaṇṭha* L6080, *vara* L31183,
   *pāruṣya* L21315, *tūla* L15202), with SLP1→IAST transliteration of glosses,
   a wider authority/work vocabulary, and a work-vs-person `<title>`/`<author>`
   split. Still open: more records (esp. nibandha-heavy entries like *jñāti*
   L13859, whose trailing prose group does not reduce to glosses) and VCP, plus
   sense-level (not entry-level) linkage of an example to its specific sense.
3. **Done:** a Lex-0 loss-report row family for the sense/citation-fusion
   phenomenon — [`scripts/build-loss-reports.mjs`](../scripts/build-loss-reports.mjs)
   emits one `sense-citation-fusion` report per SKD entry (`target: tei`,
   `sourceDictionary: skd`, cause `sanskrit-convention`, `extensionNeeded: true`),
   recording the authority groups the baseline had to split. See
   [`EVIDENCE_LABEL_CROSSWALK.md`](EVIDENCE_LABEL_CROSSWALK.md) and
   [`LOSS_ANALYSIS.md`](LOSS_ANALYSIS.md) §4a.
4. **Partly done:** the neutral model now materializes every `<ls>` named source
   across MW/PWG/PWK as `named-source-citation` objects tagged with their
   dictionary (2501 of them, capped at 12 per dictionary), and the Lex-0 export
   emits them as entry-level `<bibl type="named-source" source="#dict-…">` — so a
   Western lemma uncited in MW (e.g. *arcya*) now carries PWG's named apparatus.
   The `<ls>` parser is now shared across the three generators
   ([`scripts/lib/citations.mjs`](../scripts/lib/citations.mjs)) — build-neutral,
   export-tei, and export-ontolex no longer each re-implement it.
5. **Done:** the MW sense segmenter
   ([`scripts/lib/mw-senses.mjs`](../scripts/lib/mw-senses.mjs)) populates
   `model.senses` from the MW record — splitting on `;`/`<div>`, glossing verbal
   roots as "to …" phrases, and recognising cross-references (`See …`, `= X`,
   `(for … See …)`) as `kind: "cross-reference"`. **224 of 250** Western Lex-0
   entries carry a real `<def>`/`<xr>` (the rest are grammatical stubs — gaṇa
   membership, a homonym number, an etymology-only `cf.`, a name-only entry — that
   have no English gloss). The Lex-0 export renders
   glosses as `<def>` and cross-references as `<xr type="cf"><ref>`.
6. **Done: sense-level citation linkage.** Each MW `<ls>` is now attached to the
   sense (`<div>` segment) it falls under: `extractMwSenses` carries per-sense
   `citations`, and the Lex-0 export renders them inside the `<sense>` (named
   sources as `<bibl type="named-source" source="#dict-mw">`, the hedge as
   `<usg type="hint">`). 117 entries / 244 senses carry sense-linked citations — e.g.
   *ac* attests "to request, ask" and "to speak indistinctly" each with `L.`, and
   "to adorn" with `Dharmaś.`. MW sources are no longer duplicated at entry level;
   the entry-level index keeps the cross-dictionary PWG/PWK sources plus citations
   from stub entries with no senses. This completes the original §7.4 goal.
7. **Done: PWG/PWK sense modeling.** The German Petersburg dictionaries delimit
   senses explicitly (`<div>` + numbered run-ins; German glosses in `{%…%}`), so
   [`scripts/lib/pw-senses.mjs`](../scripts/lib/pw-senses.mjs) extracts them with
   their `<ls>` citations sense-linked, carried on each source record
   (`records.{pwg,pwk}.senses`): PWG 214/250 entries (455 senses, 431 linked),
   PWK 203/250 (939 senses, 216 linked). These live in the neutral model (the
   canonical layer); folding three dictionaries' sense divisions into one Lex-0
   entry is an OntoLex-Lexicog (multi-resource) concern, not the Lex-0 baseline's,
   so the Lex-0 export stays MW-primary. The **OntoLex export now surfaces them**:
   one `lexicog:Entry` per source dictionary (each `lexicog:describes` the lemma and
   lists its `lexicog:component` senses), with `frac:Attestation`s attesting the
   specific sense — sense-level citation linkage on the semantic side.

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
