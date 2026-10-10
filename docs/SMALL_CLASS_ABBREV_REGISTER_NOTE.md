_Created: 10-10-2026 · Last updated: 10-10-2026_

# The 2006 "small classes" abbreviation register, with measured collision reduction

Dr. Mārcis Gasūns

> **Status.** Computed research register (Uprava handoff [H6419](https://github.com/gasyoun/Uprava/blob/main/handoffs/H6419-OxAlpha_csl-standards_small-classes-controlled-register_10.10.26.md), E3 of the Gasūns-2006 acl-uplift agenda, following E2 = the H6409 census in csl-atlas). The register is a machine-checked artifact; the collision table is generated, byte-stable, and makes no normative claim beyond what it measures. Two-gates principle respected: nothing here touches the export/shipping gates.

## 1. What this is

The 2006 paper [*Latin Terms in Sanskrit Dictionaries*](https://euralex.org/elx_proceedings/Euralex2006/096_2006_V2_Marcis%20GASUNS_Latin%20Terms%20in%20Sanskrit%20Dictionaries.pdf) (EURALEX XII, Torino, pp. 773–778, §2.3) proposed that abbreviations be organized in "small classes" of 1, 2, 3 and 4 letters keyed to concept class — cases and voices on one letter, persons and participles on two, moods and languages on three, and so on. The paper could only assert this. The [csl-atlas abbreviation census](https://github.com/sanskrit-lexicon/csl-atlas/blob/main/data/abbrev/abbrev_census.json) (H6409: 448 of 4752 legend-carrying strings collide across the digitized CSDL canon) makes the claim measurable. This directory turns the scheme into a controlled register and runs the measurement:

- [`data/abbrev/small-class-register.json`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/data/abbrev/small-class-register.json) — the register: 20 SKOS-shaped concepts (skos:Concept, skos:notation = the paper's proposed form, skos:prefLabel = expansion, band = the 2006 1/2/3/4-letter small class) in a JSKOS-style JSON-LD context, plus 8 declared-unresolved forms and the 7 canary exhibits (§2.1/§2: `V.` `c.` `P.` `S.` `N.` `M.` `f.`).
- [`scripts/validate-small-class-register.mjs`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/scripts/validate-small-class-register.mjs) — structural validation (unique notations, disjoint attested keys, ≤1 prefLabel per language per SKOS S14, band consistency) **and** mechanical grounding: every evidence row must exist verbatim in the census payload, every attested key must occur in its legend layer, and the pinned census identity (generatedAt + corpusCommit) must match.
- [`scripts/measure-small-class-collisions.mjs`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/scripts/measure-small-class-collisions.mjs) — the measurement; regenerates [`data/abbrev/small-class-collision-report.json`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/data/abbrev/small-class-collision-report.json) (+ `.md`) deterministically.

## 2. Grounding rules (what may enter the register)

- **A concept exists only if the paper proposes its notation** in §2.3 (or names it as an alternative form, kept as `altForm` with its band and source). The register is the scheme-as-printed, not our improvement of it.
- **A concept's meaning exists only if the census evidences it**: `attestedKeys` are expansion keys under the census's own `expansion_key` semantics, and the validator re-derives them from the payload. A sense the census does not evidence cannot enter — the handoff's fail condition.
- **What the paper leaves open stays open.** Eight forms are declared unresolved with reasons (`pn.` — the census's only legend reads "pronoun, pronominal.", contradicting the paper's participium row; `Inj.`, `Prc`, `ppfa.`, `pfph.` — unattested and unglossed; `NA.`, `GL.`, `IDAbl.` — combinations of cases the paper does not individually propose). One conflict is declared rather than hidden: the paper's mood-row `Ppf.` is registered as pluperfect on the Plusquamperfekt attestations, with the census's own `Ppf.` = "participe parfait" reading kept unbound and flagged in `censusConflict`.
- **Grouping is recorded, never silent**: cross-language variants of one Latin term (Causal/causativ/causatif) are one concept whose `altLabel`s carry the attested forms; each binding remains individually census-linked.

## 3. The measurement

Baseline = the census collision universe read straight from the payload (448 colliding strings, 1128 senses, denominators = the payload's own). The register maps a sense to a concept when its expansion key is one of the concept's `attestedKeys`; every other sense stays exactly as recorded. Two views are reported, neither cherry-picked:

- **Concept view** — per raw string, how many distinct concepts its senses denote after binding.
- **Notation view** — per notation string after remapping, how many concepts share it; with a pairwise check that the mapping introduces **no concept pair that never collided on a raw string** (it introduces none: the 4 notation groups spanning several census strings are canonical notations absorbing their own variants, e.g. genitive senses of `Gen.` `gen.` `g.` `gén.` joining `G.`).

## 4. Result (regenerated 10-10-2026, byte-identical re-run verified)

| Metric | Value |
|---|---|
| Baseline | 448 colliding strings, 1128 senses (excess 680), 205 cross-category |
| Register coverage | 98 senses bound (8.69%), on 48 strings; 20 concepts, 19 touching the universe |
| Concept view | 432 strings still colliding; excess 680 → 634 (−6.76%); 16 strings resolved, 32 reduced |
| Notation view | 414 notations still carry ≥2 concepts; **0 new concept pairs** |
| Canary | `V.` 7→7, `c.` 4→2, `P.` 11→10, `S.` 5→5, `N.` 10→10, `M.` 11→11, `f.` 6→6 — census polysemy numbers pinned verbatim in the register |

The honest reading: the scheme-as-printed resolves the strings it actually proposes forms for (`caus.` 4→1, `Inf.` 3→1, `sg.`/`du.`/`pl.` 3→1, `pp.` 6→2) but covers a minority (8.69%) of the collision mass — work titles, gender/features (feminine, masculine, neuter, middle) and the paper's own unresolved forms dominate the residue. That residue is the measurable case for extending the scheme, which is exactly what the census was computed for; no such extension is proposed here.

## 5. Reproduce

```sh
npm run validate-small-class-register -- --census <csl-atlas>/data/abbrev/abbrev_census.json
npm run measure-small-class-collisions -- --census <csl-atlas>/data/abbrev/abbrev_census.json
```

Re-running the measurement must be byte-identical; any drift is a consistency failure (the payload changed under the register's pinned provenance), not a report update. `generatedAt` in generated files honours `SOURCE_DATE_EPOCH` (the house convention) and is omitted on local runs.

## 6. Format provenance (github-first, read 10-10-2026 before fixing the format)

W3C SKOS Recommendation (skos-reference): notation typed literals unique within a scheme, ≤1 prefLabel per language, Collections for grouping, ConceptScheme + inScheme for membership. TEI Lex-0 ([DARIAH-ERIC/lexicalresources](https://github.com/DARIAH-ERIC/lexicalresources), baseline 0.9.5 — the estate pin per [A70](https://github.com/sanskrit-lexicon/csl-standards/blob/main/docs/A70_TEI_LEX0_INDIGENOUS_APPARATUS_NOTE.md)): the register's controlled values stay compatible in shape with Lex-0's gram-typology practice (typed controlled values); no Lex-0 schema change is claimed or required. JSON-LD field conventions follow JSKOS ([gbv/jskos](https://github.com/gbv/jskos): notation @set, prefLabel/altLabel @language), plus two consumers of SKOS vocabularies reviewed for shape (zbw/swdskos, FAIR-DM/django-controlled-vocabularies). Adjacent, deliberately not duplicated: the H5335 lexicographic-types register (dictionary-genre taxonomy — a different layer).

_Dr. Mārcis Gasūns_
