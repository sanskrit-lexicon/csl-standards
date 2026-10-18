_Created: 10-10-2026 · Last updated: 11-10-2026_

# The 2006 "small classes" abbreviation register, with measured collision reduction

Dr. Mārcis Gasūns

> **Status.** Computed research register (Uprava handoffs [H6419](https://github.com/gasyoun/Uprava/blob/main/handoffs/H6419-OxAlpha_csl-standards_small-classes-controlled-register_10.10.26.md) v1 + [H6447](https://github.com/gasyoun/Uprava/blob/main/handoffs/H6447-OxAlpha_csl-standards_small-class-register-v2-extension_11.10.26.md) v2, E3 of the Gasūns-2006 acl-uplift agenda, following E2 = the H6409 census in csl-atlas). The register is a machine-checked artifact; the collision table is generated, byte-stable, and makes no normative claim beyond what it measures. Two-gates principle respected: nothing here touches the export/shipping gates.

## 1. What this is

The 2006 paper [*Latin Terms in Sanskrit Dictionaries*](https://euralex.org/elx_proceedings/Euralex2006/096_2006_V2_Marcis%20GASUNS_Latin%20Terms%20in%20Sanskrit%20Dictionaries.pdf) (EURALEX XII, Torino, pp. 773–778, §2.3) proposed that abbreviations be organized in "small classes" of 1, 2, 3 and 4 letters keyed to concept class — cases and voices on one letter, persons and participles on two, moods and languages on three, and so on. The paper could only assert this. The [csl-atlas abbreviation census](https://github.com/sanskrit-lexicon/csl-atlas/blob/main/data/abbrev/abbrev_census.json) (H6409: 448 of 4752 legend-carrying strings collide across the digitized CSDL canon) makes the claim measurable. This directory turns the scheme into a controlled register and runs the measurement:

- [`data/abbrev/small-class-register.json`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/data/abbrev/small-class-register.json) — the register: v1's 20 SKOS-shaped concepts of the 2006 scheme-as-printed, plus (v2, H6447) 15 concepts in three measured-residue classes — gender/features (feminine `f.`, masculine `m.`, neuter `n.`, middle `med.`), work titles (`M.` Manu, `Nal.`, `Naiṣ.`, `Pāṇ.`, `Vikr.`, `Mālav.`, `Matsy.`, `AV.`), authors/editors (`Vop.` Vopadeva, `B.` Böhtlingk, `Br.` Brockhaus) — in a JSKOS-style JSON-LD context, plus 8 declared-unresolved forms (all externally grounded since v2) and the 7 canary exhibits (§2.1/§2: `V.` `c.` `P.` `S.` `N.` `M.` `f.`).
- [`scripts/validate-small-class-register.mjs`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/scripts/validate-small-class-register.mjs) — structural validation (unique notations, disjoint attested keys, ≤1 prefLabel per language per SKOS S14, band consistency) **and** mechanical grounding: every evidence row must exist verbatim in the census payload, every attested key must occur in its legend layer, and the pinned census identity (generatedAt + corpusCommit) must match. Since v2 it also enforces the `externalGrounding` contract: every unresolved form carries ≥1 entry with a verbatim quote, an edition, and a source from the paper's own reference list (Whitney 1879, Macdonell 1916, Stenzler, Knauer).
- [`scripts/measure-small-class-collisions.mjs`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/scripts/measure-small-class-collisions.mjs) — the measurement; regenerates [`data/abbrev/small-class-collision-report.json`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/data/abbrev/small-class-collision-report.json) (+ `.md`) deterministically.

## 2. Grounding rules (what may enter the register)

- **v1: a concept exists only if the paper proposes its notation** in §2.3 (or names it as an alternative form, kept as `altForm` with its band and source). v2 (H6447, MG verdicts 10-10-2026) extends beyond the scheme-as-printed with the measured-residue classes — gender/features, work titles, authors/editors — as new bands under the same census rules; v1 concepts and bindings are untouched (additive only).
- **A concept's meaning exists only if the census evidences it**: `attestedKeys` are expansion keys under the census's own `expansion_key` semantics, and the validator re-derives them from the payload. A sense the census does not evidence cannot enter — the handoff's fail condition. This applies to the v2 bands unchanged: `Sārasvata`/`Savitrī`/`MS.` (Maitrāyaṇīsaṁhitā) are named by the paper's §2.1 exhibits but have no census legend, so they are not v2 concepts.
- **What the paper leaves open stays open — but no longer unanchored.** Eight forms remain declared-unresolved with reasons (`pn.` — the census's only legend reads "pronoun, pronominal.", contradicting the paper's participium row; `Inj.`, `Prc`, `ppfa.`, `pfph.` — unattested and unglossed; `NA.`, `GL.`, `IDAbl.` — combinations of cases the paper does not individually propose). Since v2 each carries `externalGrounding`: verbatim citations from the paper's own reference grammars — Whitney 1879 (§330/§482 d for the N.A.V./I.D.Ab./G.L. syncretism groups; §490 pronouns; §567 precative; §942 b future active participle; §961 gerundives), Macdonell 1916 (List of Abbreviations `inj., injunctive`; §122 a four moods; Appendix I order of parts attesting `ppf.`/`prc.`), and the Knauer 1908 combination-train practice via the 2021 Bibliotheca Sanscritica apparatus (`IDAblL.`). Stenzler's 1915 Abkürzungen list carries no inj./prc./ppfa./pfph. entries — a recorded negative result. Grounding anchors a form's category; it never converts a proposed form into a bound concept: the pn. and Ppf. conflicts stay declared, `pfph.`'s expansion stays open.
- **Grouping is recorded, never silent**: cross-language variants of one Latin term (Causal/causativ/causatif; feminine/Femininum/féminin) are one concept whose `altLabel`s carry the attested forms; each binding remains individually census-linked.

## 3. The measurement

Baseline = the census collision universe read straight from the payload (448 colliding strings, 1128 senses, denominators = the payload's own). The register maps a sense to a concept when its expansion key is one of the concept's `attestedKeys`; every other sense stays exactly as recorded. Two views are reported, neither cherry-picked:

- **Concept view** — per raw string, how many distinct concepts its senses denote after binding.
- **Notation view** — per notation string after remapping, how many concepts share it; with a pairwise check that the mapping introduces **no concept pair that never collided on a raw string** (it introduces none: the 4 notation groups spanning several census strings are canonical notations absorbing their own variants, e.g. genitive senses of `Gen.` `gen.` `g.` `gén.` joining `G.`).

## 4. Result (v2, regenerated 11-10-2026, byte-identical re-run verified)

| Metric | v1 (H6419, 10-10-2026) | v2 (H6447, 11-10-2026) |
|---|---|---|
| Baseline (same payload) | 448 colliding strings, 1128 senses (excess 680), 205 cross-category | identical — denominators pinned, generatedAt 2026-10-10T19:00:00.879Z, corpusCommit f4c08c57 |
| Register coverage | 98 senses bound (8.69%), on 48 strings; 16 of 20 concepts touching | **148 senses bound (13.12%), on 66 strings; 31 of 35 concepts touching** (+50 senses, +4.43 pp) |
| Concept view | 432 strings still colliding; excess 680 → 634 (−6.76%); 32 reduced, 16 resolved | 428 still colliding; excess 680 → 611 (−10.15%); 43 reduced, 20 resolved |
| Notation view | 414 notations carry ≥2 concepts; **0 new concept pairs** | 407 carry ≥2 concepts (11 spanning groups — canonical notations absorbing their own variants); **0 new concept pairs** |
| Canary | `V.` 7→7, `c.` 4→2, `P.` 11→10, `S.` 5→5, `N.` 10→10, `M.` 11→11, `f.` 6→6 | `M.` 11→8, `N.` 10→8, `P.` 11→8, `f.` 6→3, `V.` 7→7 (2 senses bound) — census polysemy numbers pinned verbatim in the register |

The honest reading stands in both versions: the scheme-as-printed resolves the strings it actually proposes forms for, and the residue was dominated by work titles and gender/features. v2 converts exactly that measured residue into census-evidenced concepts — the extension the v1 numbers called for, under the same grounding rules — and the mapping-introduction invariant survives it (0 new concept pairs, both versions). What v2 deliberately does **not** do: bind paper-named items the census does not evidence (`Sārasvata`, `Savitrī`, `MS.`), split fused two-meaning legends (`feminine; also = for.`), or convert the externally-grounded unresolved forms into concepts; 86.88% of the collision mass remains unbound, so the residue story continues.

## 5. Reproduce

```sh
npm run validate-small-class-register -- --census <csl-atlas>/data/abbrev/abbrev_census.json
npm run measure-small-class-collisions -- --census <csl-atlas>/data/abbrev/abbrev_census.json
```

Re-running the measurement must be byte-identical; any drift is a consistency failure (the payload changed under the register's pinned provenance), not a report update. `generatedAt` in generated files honours `SOURCE_DATE_EPOCH` (the house convention) and is omitted on local runs.

## 6. Format provenance (github-first, read 10-10-2026 before fixing the format; re-checked 11-10-2026 for the v2 bands — SKOS Rec S32/S37: any concepts may be members, collections may overlap, Collection stays disjoint from Concept/ConceptScheme; consumers zbw/swdskos and FAIR-DM/django-controlled-vocabularies re-probed live, unaffected by additive collections and the custom externalGrounding context term)

W3C SKOS Recommendation (skos-reference): notation typed literals unique within a scheme, ≤1 prefLabel per language, Collections for grouping, ConceptScheme + inScheme for membership. TEI Lex-0 ([DARIAH-ERIC/lexicalresources](https://github.com/DARIAH-ERIC/lexicalresources), baseline 0.9.5 — the estate pin per [A70](https://github.com/sanskrit-lexicon/csl-standards/blob/main/docs/A70_TEI_LEX0_INDIGENOUS_APPARATUS_NOTE.md)): the register's controlled values stay compatible in shape with Lex-0's gram-typology practice (typed controlled values); no Lex-0 schema change is claimed or required. JSON-LD field conventions follow JSKOS ([gbv/jskos](https://github.com/gbv/jskos): notation @set, prefLabel/altLabel @language), plus two consumers of SKOS vocabularies reviewed for shape (zbw/swdskos, FAIR-DM/django-controlled-vocabularies). Adjacent, deliberately not duplicated: the H5335 lexicographic-types register (dictionary-genre taxonomy — a different layer).

_Dr. Mārcis Gasūns_
