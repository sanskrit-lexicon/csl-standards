# A27 (Serialization Standard / TEI–OntoLex–MDF) — Hostile Review + Re-frame

_Created: 03-07-2026 · Last updated: 03-07-2026_

**Paper:** [docs/PAPER.md](https://github.com/sanskrit-lexicon/csl-standards/blob/main/docs/PAPER.md)
**Reviewer/executor:** Fable 5 (`claude-fable-5`), executing [H144](https://github.com/gasyoun/Uprava/blob/main/handoffs/H144_a27_mdf_reframe.md); two parallel verification agents (also Fable 5, `claude-fable-5`): loss-corpus numbers, references + link integrity (web-checked).
**Verdict: MINOR REVISION + re-frame → all findings fixed same pass.** The paper was far more mature than the index's "3/5 draft, data 2/5" suggested — a full draft over a committed, largely byte-verified loss corpus. The two Majors were an evidence gap behind §11's validation claims (remedied by actually re-running the harness) and the complete absence of the adopted MDF third profile (the H144 re-frame).

---

## 1. Figure re-verification

Against [loss-analysis.json](https://github.com/sanskrit-lexicon/csl-standards/blob/main/data/pilot/loss-analysis.json), [loss-reports.json](https://github.com/sanskrit-lexicon/csl-standards/blob/main/data/pilot/loss-reports.json), [LOSS_ANALYSIS.md](https://github.com/sanskrit-lexicon/csl-standards/blob/main/docs/LOSS_ANALYSIS.md), [SCALE_STABILITY.md](https://github.com/sanskrit-lexicon/csl-standards/blob/main/docs/SCALE_STABILITY.md), [EXTERNAL_VALIDATION.md](https://github.com/sanskrit-lexicon/csl-standards/blob/main/docs/EXTERNAL_VALIDATION.md):

**Confirmed exact:** 1,430 reports; 1007/348/75 status split; the full target×status cross-tab (TEI 75/217/6 · OntoLex 0/662/100 · neutral 0/128/242); by-cause 55/26/8/6/5 + <1/<1; five evidence phenomena = 75.0% (recomputed: 369+363+234+91+16 = 1073/1430); §8 lineage in full (250 abridgement = 123 drop + 127 subset; *ac* 35→8→3; 119 `mw-uncited-pwg-cited`; 369 = 250+119); coverage 722/722 and 369/369 (`uncovered: 0`, `unmodeled: 0`); SKD 6 = the only TEI-lossy reports; the three RNG bugs documented verbatim; scale-stability 500/1000 (evidence share 69.7/69.9%, coverage complete); optional dicts 133/109/87/142 of 250; all 20 relative links resolve.

## 2. Major findings

**M1 — §11's RNG/Schematron validation claims were not backed by the committed artifact.** The checked-in `external-validation-review.json` recorded `{checks: 254, passed: 250, skipped: 4}` — the four skips being exactly the RNG, ODD-compile, and Schematron layers ("no external RELAX NG validator found"); only SHACL 250/250 was evidenced. A referee running the repo's own `validate-external` would catch the gap. *Fix (applied — the strong form):* installed the portable toolchain (`npm run setup-external-tools`: jing, Saxon, ISO-Schematron skeleton, all sha256-verified) and **re-ran the harness: 1,014 checks, 1,014 passed, 0 skipped, 0 failed** (250 tei-xml RNG + 256 lex0-xml RNG + 256 Schematron + 250 SHACL + 2 schema compiles). The refreshed review JSON is committed as the evidence artifact and §11 now cites it with the re-run date.

**M2 — The adopted MDF third profile was absent from the paper (zero mentions).** The MDF export mapping ([MDF_EXPORT_MAPPING.md](https://github.com/sanskrit-lexicon/csl-standards/blob/main/docs/MDF_EXPORT_MAPPING.md)) was adopted on 2026-07-02 ([csl-standards#1](https://github.com/sanskrit-lexicon/csl-standards/pull/1#issuecomment-4864119443), mapping adopted / serializer deferred), yet the paper still presented a two-profile world — the narrow "TEI vs OntoLex" framing the untouched-index row flagged. *Fix (applied — the H144 re-frame):* retitled to **"A Serialization Standard for the Petersburg-Family Sanskrit Dictionaries: Evidence, Derivation, and Compression across TEI, OntoLex, and MDF"** (former title preserved in the preamble; MG veto welcome); abstract re-led with the serialization-standard contribution; §2 gained the MDF paragraph (Toolbox/FLEx lineage, MUDIDI corroboration, flat-schema stress test, lossiness-is-the-finding); §12 states honestly that MDF is at mapping-design stage — a prediction, not a measured lane; §14 links the mapping. References gained Coward & Grimes (2000) and Setiawan et al. (2026, arXiv:2606.09435 — citation form taken from the A01-verified list).

## 3. Minor findings (all fixed)

**m1 — "source-collapse (27%)"** contradicted both the JSON (369/1430 = 25.8%) and the sibling LOSS_ANALYSIS.md (26%) → 26%.
**m2 — "The 250-case pilot yields 1,430 loss reports"** — the corpus spans 256 cases (250 Western + 6 kośa; the 6 are inside the 1,430) → restated.
**m3 — Steiner 2020 cited by its circulated English title** — the citable ZDMG record is the German original: "Woher hat er das?" Zum Charakter des Sanskrit-English Dictionary von Monier-Williams, ZDMG 170(1), **107–118** (not 107–117) → corrected, English version noted ([ZDMG record](https://zdmg.harrassowitz-library.com/article/ZDMG/2020/1/7)).
**m4 — TEI Lex-0 Etym citation** missed the fourth author (Tasovac) and the formal venue — now Bowers, Herold, Tasovac & Romary (2022), *jTEI* Rolling Issue, [article 4300](https://journals.openedition.org/jtei/4300) (was a ResearchGate link).
**m5 — Grassmann "Leipzig, 1873"** → Leipzig: Brockhaus, **1873–1875**.
**m6 — "Lemon" → "lemon"** (Springer's casing) in McCrae et al. 2011.

## 4. Checked and sound (no action)

- The central asymmetry (TEI-never-lossy / OntoLex-never-clean) and the evidence-first diagnosis verify to the digit and hold at 2× and 4× scale.
- The 722/722 + 369/369 coverage claims are regenerable, with the close-a-gap vs record-a-loss distinction correctly drawn.
- The kośa §9 is properly framed as tradition-bound, not model-vocabulary, loss.
- Funderburk & Malten 2008 URL verified live via Wayback/Google (Cologne host blocks direct probes — known behavior); McCrae 2011 and Chiarcos 2022 verify exactly.

## 5. Remaining gates

- **MG:** byline (paper has none — the standing @DO); optional title veto; venue re-aim post-reframe (the serialization-standard framing opens LREC/LDL/*Semantic Web* -type venues beyond jTEI) — @DECIDE when submission nears.
- **Agent (separate, key-gated):** the MDF serializer itself — [H135](https://github.com/gasyoun/Uprava/blob/main/handoffs/H135_csl_standards_mdf_export_profile.md); once it lands, §12's "prediction, not measured lane" sentence graduates into a fourth loss-corpus lane.

_Dr. Mārcis Gasūns_
