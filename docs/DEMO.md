# Demo: three hard cases, end to end

This is a guided walkthrough of single entries as they move through the whole
workbench: the raw CDSL dictionary records → the dictionary-neutral model → the
TEI archival and OntoLex/FrAC profiles → the loss reports that record what each
standard cannot hold → the `csl:` extension constructs that answer them.

Three contrasting cases are traced: a **verbal root** (√ac), a **compound**
(*annavid*), and a **continuation / suppressed-headword entry** (*āyana*). Read the
first for the complete stage-by-stage tour; the second and third are tighter and
highlight what is *different* about a compound and about print compression.

Everything below is quoted from regenerable artifacts (`npm run build-pilot`); the
file links point at the exact outputs. The case is
[`mw-pwg-pwk:ac`](../data/pilot/neutral-model.json) — the Sanskrit verbal root
**√ac** "to go, bend, honour". It is a good stress test because it exercises every
loss family at once: it is a *root* (not a word), it carries the MW `L.`
*lexicographer hedge*, its citation apparatus is *abridged* down the PWG → PWK
lineage, and its named sources include both an indigenous *kośa* authority and
plain textual coordinates. It is also one of the cases that attaches six source
dictionaries.

---

## Stage 0 — six raw CDSL records

The same headword is digitised independently in six dictionaries. Each is a flat
`<L>…<LEND>` record in CDSL's project-specific pseudo-markup (truncated here):

```
[mw  L=1767] <L>1767<pc>8,3<k1>ac … (connected with √ aYc) cl. 1. P. Ā. a/cati …
[pwg L=791 ] <L>791 … {#aYc, a/cati#} <ls>NAIGH. 2,14.</ls> … <ls>P. 8,4,58</ls> …
[pwk L=1095] √{#ac#}¦ {#aYc, a/cati …#} — 1〉 {%biegen%}. … — 2〉 {%…%}
[ap90 L=314] {#ac#}¦ U. (acati …) To go, move; to honour; … request …
[gra L=144 ] {@√ac@} (√añc). Als Grundbedeutung … der Begriff: {%biegen%} …
[fri L=71  ] √ac acati, añcati, -te pp. akna … czech/russian/english glosses …
```

MW glosses in English, the two Petersburg dictionaries (PWG large, PWK abridged)
in German, AP90 in English, Grassmann (GRA) is a German Rig-Veda glossary, and
FRI is trilingual (Czech/Russian/English). Note the differences already visible:
PWG carries a dense named apparatus of citations; PWK keeps far fewer; MW reduces
much of it to a bare `L.`

---

## Stage 1 — the dictionary-neutral model

[`build-neutral-model`](../scripts/build-neutral-model.mjs) suspends commitment to
either standard and extracts one commensurable JSON record
([neutral-model.json](../data/pilot/neutral-model.json)):

```jsonc
{
  "id": "mw-pwg-pwk:ac",
  "key": "ac",
  "phenomena": ["hedge", "root", "tri-dict", "pwg-rich", "pwk-abridged", "homophone"],
  "forms": [{ "orth": "ac", "type": "verbal-root", "grammar": "cl.", "verbClass": "1P,1Ā" }],
  "records": { "mw": …, "pwg": …, "pwk": …, "ap90": …, "gra": …, "fri": … },
  "relations": [{ "type": "whitney-root-association", "target": "ac,1" }],
  "senses": [{ "def": "to go, move, tend", "kind": "gloss" }, { "def": "to honour", … }],
  "citations": [ … 23 materialised <ls>, tagged by dictionary … ]
}
```

This is the canonical layer: both profiles and all loss reports are derived from
it, so they are comparable. The `phenomena` tags are what the sampler selected the
case *for*.

---

## Stage 2 — the TEI archival profile

[`export-tei`](../scripts/export-tei.mjs) renders the entry as archival TEI
([mw-pwg-pwk-ac.xml](../data/pilot/tei/mw-pwg-pwk-ac.xml)), preserving each raw
record as an escaped `<quote>` and promoting the structure TEI *can* express. All
six source records appear (the backbone plus the optional AP90/GRA/FRI):

```xml
<etym xml:id="mw-pwg-pwk-ac-root-relation" type="root">
  <lbl>verbal root</lbl>
  <ref type="whitney-root" target="urn:csl:whitney-root:ac,1">ac,1</ref>
</etym>
…
<bibl xml:id="mw-pwg-pwk-ac-cite-pwg-1" type="named-source-citation"
      subtype="textual" corresp="#mw-pwg-pwk-ac-record-pwg">
  <abbr>NAIGH. 2,14.</abbr>
  <citedRange>2,14</citedRange>
</bibl>
```

The `@subtype` and `<citedRange>` are already the `csl:` evidence-class extension
on the TEI side (see Stage 5). TEI holds the dictionary *as an edition* — every
record survives verbatim — but a citation's *evidential role* is only expressible
through the extension attributes, not in vanilla TEI.

---

## Stage 3 — the OntoLex/FrAC semantic profile

[`export-ontolex`](../scripts/export-ontolex.mjs) renders the same entry as a
linked-data graph ([mw-pwg-pwk-ac.json](../data/pilot/ontolex/mw-pwg-pwk-ac.json),
JSON-LD + Turtle). Here the root becomes a lexical entry **plus** an explicit
relation, and each citation becomes a typed `frac:Attestation`:

```jsonc
// the root as a derivational base
{ "@type": "csl:RootRelation", "csl:whitneyRoot": "ac,1",
  "csl:modelingNote": "Root is modeled as lexical entry plus derivational/grammatical relation." }

// a named kośa citation, evidence class made explicit
{ "@type": "frac:Attestation", "frac:evidence": "AK. 3,1,34.",
  "csl:sourceDictionary": "pwg", "csl:evidenceClass": "kosha",
  "csl:citedWork": "AK.", "csl:citedRange": "3,1,34" }

// the PWG → PWK abridgement, made queryable
{ "@type": "csl:LineageRelation", "csl:lineageFrom": "pwg", "csl:lineageTo": "pwk",
  "csl:transition": "abridgement",
  "csl:sourceCitationCount": 35, "csl:retainedCitationCount": 8, "csl:droppedCitationCount": 27 }
```

OntoLex *never merely transcribes*: it relates the data or drops what it cannot
relate. The graph carries all six `csl:SourceRecord`s and conforms under the
SHACL profile (pySHACL).

---

## Stage 4 — what gets lost (the loss reports)

[`build-loss-reports`](../scripts/build-loss-reports.mjs) records every degradation
as an evidence-bound report. √ac generates **seven**
([loss-reports.json](../data/pilot/loss-reports.json)):

| target | phenomenon | cause | answered by |
|---|---|---|---|
| tei | generic-lexicographer-hedge | cdsl-markup-gap | — (string preserved, semantics not) |
| ontolex | generic-lexicographer-hedge | model-vocabulary-gap | `csl:evidenceClass "hedge"` |
| tei | root-as-entry | model-vocabulary-gap | (root preservable; role implicit) |
| ontolex | root-as-derivational-base | model-vocabulary-gap | `csl:RootRelation` + `csl:whitneyRoot` |
| neutral | source-collapse | editorial-compression | `csl:LineageRelation (abridgement)` |
| ontolex | named-kosha-citation | model-vocabulary-gap | `csl:evidenceClass "kosha"` |
| ontolex | citation-coordinate | model-vocabulary-gap | `csl:citedWork` + `csl:citedRange` |

Read together they show the asymmetry in miniature: the TEI side is `partial` (it
keeps everything as text, but cannot *type* the hedge or the root role); the
OntoLex side is never `clean` (it must model or drop); and the `neutral` lane
records a loss that is neither standard's fault — PWK dropped **27 of PWG's 35**
named citations a century before any digitisation.

---

## Stage 5 — the remedy, on the same case

The point of the workbench is that the diagnosis ends in *running code*. Each
`model-vocabulary-gap` loss above names, in its `mappedAs` field, a concrete
`csl:` construct that is implemented in both exporters and schema-validated
(pySHACL for OntoLex, jing for TEI). For √ac the four such losses are answered by:

- **`csl:evidenceClass`** (`textual` | `hedge` | `kosha` | `editorial`) — the MW
  `L.` becomes `hedge`; `AK. 3,1,34.` becomes `kosha`, distinguished from a
  textual attestation.
- **`csl:citedWork` + `csl:citedRange`** — `DHĀTUP. 7,6.` is parsed into a work
  siglum and a structured locus instead of a flat string.
- **`csl:RootRelation` + `csl:whitneyRoot`** — the root is a lexical entry *and* a
  derivational base pointing at Whitney's root index `ac,1`.

The one `neutral` loss (the PWG → PWK abridgement) is not a standards gap, so it is
*modeled, not extended*: **`csl:LineageRelation`** makes the editorial collapse an
explicit, queryable relation with retained/dropped counts.

The full extension layer and its standardise-vs-project-local disposition are in
[EXTENSION_PROPOSAL.md](EXTENSION_PROPOSAL.md); the corpus-wide numbers are in
[LOSS_ANALYSIS.md](LOSS_ANALYSIS.md).

---

# A second case — the compound *annavid*

Where √ac stressed *evidence*, the compound **annavid** ("food-knowing") stresses
*derivation* and *editorial divergence*. It is a tri-dict case
([`mw-pwg-pwk:annavid`](../data/pilot/neutral-model.json)); no optional dictionary
shares the headword. Three raw records, one per backbone dictionary:

```
[mw  L=8540] annavid <k2>anna—vi/d (√ 1. vid), knowing food. <info lex="inh"/>
[pwg L=3514] annavi/d ({#anna + vid#}) <lex>adj.</lex> {%Speise besitzend%} <ls>AV. 6,116,1.</ls>
[pwk L=5576] annavi/d <lex>Adj.</lex> {%Speise erwerbend%}.
```

Two things are visible already. First, the headword is a **compound**, `anna`
("food") + `vi/d`. Second — the payoff of this case — the three dictionaries
**disagree on the meaning**: MW reads `vid` as √vid₁ "to know" (*knowing food*);
PWG reads it as √vid₂ "to find / possess" (*Speise besitzend*, "food-possessing");
PWK as "food-acquiring" (*Speise erwerbend*). The compound's second member is
itself ambiguous, and each editor resolved it differently.

## What the neutral model captures

```jsonc
{
  "id": "mw-pwg-pwk:annavid", "key": "annavid",
  "phenomena": ["compound", "tri-dict", "pwg-rich", "pwk-abridged",
                "mw-uncited-pwg-cited", "homophone"],
  "forms": [{ "orth": "annavid", "type": "compound" }],
  "relations": [{ "type": "lexical-decomposition", "components": ["anna", "vi/d"] }],
  "senses": [{ "def": "knowing food", "kind": "gloss" }],
  "citations": [{ "source": "AV. 6,116,1.", "dictionary": "pwg" }]
}
```

The `mw-uncited-pwg-cited` tag is the editorial story in one phrase: only **PWG**
carries the textual attestation (*Atharvaveda* 6,116,1); MW gives the gloss with no
source, and PWK drops the citation entirely.

## Compound in TEI, decomposition in OntoLex

TEI holds the compound as an editorial structure — `compound-subentry` is the one
loss report classified **`clean`** in this case, because the archival profile can
carry it directly:

```xml
<etym xml:id="mw-pwg-pwk-annavid-compound-relation" type="compound">
  <seg type="component">anna</seg>
  <seg type="component">vi/d</seg>
</etym>
```

OntoLex makes the segmentation an explicit, linkable graph — each component
*corresponds to* its own lexeme, the construct the flat model lacks:

```jsonc
{ "@type": "decomp:ComponentList", "csl:modelingNote": "Machine segmentation exported for review.",
  "decomp:constituent": [
    { "@type": "decomp:Component", "rdfs:label": "anna",  "ontolex:correspondsTo": { "@id": ".../lexeme/anna" } },
    { "@type": "decomp:Component", "rdfs:label": "vi/d", "ontolex:correspondsTo": { "@id": ".../lexeme/vi%2Fd" } }
  ] }
```

## The five loss reports

| target | phenomenon | cause | answered by |
|---|---|---|---|
| tei | compound-subentry | none (**clean**) | — TEI holds it as a subentry |
| ontolex | compound-decomposition | model-vocabulary-gap | `decomp:ComponentList` of `decomp:Component` |
| neutral | source-collapse | editorial-compression | `csl:LineageRelation (recomposition)` — PWG attests, MW carries none |
| neutral | source-collapse | editorial-compression | `csl:LineageRelation (abridgement)` — PWG 1 citation → PWK 0 |
| ontolex | citation-coordinate | model-vocabulary-gap | `csl:citedWork` + `csl:citedRange` (`AV.` / `6,116,1`) |

The contrast with √ac is the lesson. The compound itself maps *cleanly* into TEI —
derivation is the **easy** part. The losses cluster instead around (a) the semantic
graph that OntoLex needs and vanilla `frac:Attestation` cannot type, and (b) the
same PWG → PWK → MW editorial collapse, here visible as MW silently dropping the
one *Atharvaveda* attestation PWG recorded. Two `csl:LineageRelation`s make both
halves of that collapse explicit and queryable — and the three dictionaries'
divergent glosses survive side by side in the neutral model rather than being
flattened to one "winner".

---

# A third case — the suppressed headword *āyana*

The third loss family is **print compression**: a dictionary that, to save column
space, *suppresses* an entry, leaving its content to be recovered from its
neighbours. The case is the tri-dict (plus GRA) entry
[`mw-pwg-pwk:Ayana`](../data/pilot/neutral-model.json). What MW prints for *āyana*
is not an entry at all — it is a bare pointer:

```
[mw  L=25763] Ayana <k2>Ayana <e>1A ¦ (for 1. Āyana See under Aya.)  <info lex="inh"/>
[pwg L=9024 ] Ā/yana (von i mit ā) n. {%das Kommen%}  <ls>ṚV. 10,142,8.</ls> <ls>VS. 22,7.</ls> <ls>AV. 6,122,2.</ls>
[pwk L=15295] 2. Āyana Adj. {%zum Solstitium in Beziehung stehend%}.
```

MW gives no gloss and no citation — only *"for 1. Āyana, see under Aya"* and an
`<info lex="inh"/>` flag marking the headword as **inherited** (a run-on
continuation in the printed page). PWG, by contrast, carries the full entry: the
derivation (√i with the prefix *ā-*, "to come"), the gloss *das Kommen* ("the
coming"), and three Vedic attestations. PWK records a different homonym entirely —
*āyana* "relating to the solstice" (the sun's *ayana*, its course). Three
dictionaries, three resolutions, and the one that "owns" the headword in the
Cologne keying (MW) is the one that says the least.

## How the suppression is modeled

The neutral model records the continuation as a relation, not a fact:

```jsonc
"relations": [{ "type": "adjacency-continuation-parent", "eCode": "1A" }]
```

TEI preserves MW's pointer as a cross-reference whose `@subtype` is honest about
its epistemic status — the parent is **conjectured** (the entry-code is known, the
parent lemma is *not* asserted as if printed):

```xml
<xr xml:id="mw-pwg-pwk-Ayana-continuation-relation"
    type="adjacency-continuation-parent" subtype="conjectured">
  <ref target="#e-1A">MW e=1A</ref>
</xr>
```

OntoLex makes the recovery status a first-class, queryable property — the §4
construct of the extension proposal:

```jsonc
{ "@type": "csl:ContinuationRelation", "csl:mwECode": "1A",
  "csl:recoveryStatus": "conjectured",
  "csl:modelingNote": "Continuation parent must be recovered from MW adjacency before semantic assertion." }
```

## The five loss reports

| target | phenomenon | cause | status | answered by |
|---|---|---|---|---|
| tei | continuation-parent | print-compression | partial | `<xr>` `@subtype="conjectured"` (pointer kept, parent layout-derived) |
| ontolex | continuation-parent | print-compression | **lossy** | `csl:ContinuationRelation` + `csl:recoveryStatus` |
| neutral | source-collapse | editorial-compression | lossy | `csl:LineageRelation (recomposition)` — PWG attests, MW carries none |
| neutral | source-collapse | editorial-compression | lossy | `csl:LineageRelation (abridgement)` — PWG 3 citations → PWK 0 |
| ontolex | citation-coordinate | model-vocabulary-gap | partial | `csl:citedWork` + `csl:citedRange` (ṚV. / VS. / AV.) |

The lesson of this case is *epistemic honesty under compression*. A naive
conversion would either drop MW's contentless entry or silently invent a parent;
the workbench does neither. It keeps the pointer, **marks the recovery as
`conjectured`** rather than asserted, and records the three Vedic attestations PWG
preserved (`ṚV. 10,142,8`, `VS. 22,7`, `AV. 6,122,2`) that MW's suppression and
PWK's homonym both lost. Print compression is not a modelling gap in the standards
— TEI and OntoLex *can* hold the entry — so the remedy is a relation that states
exactly how much was recovered and how much remains conjecture.

---

## Reproduce it

```sh
npm run build-pilot          # regenerate every artifact below

# then inspect any case (swap the id: ac / annavid / Ayana):
node -e "console.log(require('./data/pilot/neutral-model.json').find(x=>x.id==='mw-pwg-pwk:Ayana'))"
cat data/pilot/tei/mw-pwg-pwk-Ayana.xml
cat data/pilot/ontolex/mw-pwg-pwk-Ayana.json
node -e "console.log(require('./data/pilot/loss-reports.json').filter(x=>x.caseId==='mw-pwg-pwk:Ayana'))"
```

Every number and fragment in all three walkthroughs comes straight from those files.
