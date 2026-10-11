_Created: 11-10-2026 · Last updated: 11-10-2026_

# PROVENANCE — PWG→RU LOD graph, tech-preview build 2026-10-11

The build-of-record behind [void.ttl](https://github.com/sanskrit-lexicon/csl-standards/blob/main/standards/pwg-ru-lod/void.ttl) and the static surface at `https://sanskrit-lexicon.github.io/pwg-ru-lod/`. Executed under [H6484](https://github.com/gasyoun/Uprava/blob/main/handoffs/H6484-OxAlpha_csl-standards_publishing-lod-wave0-rulings-exec_11.10.26.md) per the four MG rulings of 11-10-2026 ([PR #161](https://github.com/sanskrit-lexicon/csl-standards/pull/161)); **namespace correction:** MG ruled interactively 11-10-2026 that the permanent namespace is `https://w3id.org/sanskrit-lexicon/repwg/` ("rePWG", the 27-07-2026 namespace ruling, [SanskritLexicography #837](https://github.com/gasyoun/SanskritLexicography/pull/837)), superseding the `pwg-ru/` string carried in the runbook sample — the runbook's "placeholder already matches" claim was stale.

## Build

```
python src/export_lod.py all \
    --base-iri https://w3id.org/sanskrit-lexicon/repwg/ \
    --out-dir release \
    --cards  <pwg-ru-data>/corpus/assembled_cards.jsonl \
    --store  <pwg-ru-data>/tm/pwg_ru_translated.jsonl \
    --rel    src/pwg_ru_relationships.jsonl \
    --stratum src/pwg_sense_stratum.jsonl \
    --freq   src/dcs_freq.json
```

Machine: Apple M3 MacBook Air, 16 GB. Generator: [export_lod.py](https://github.com/gasyoun/SanskritLexicography/blob/master/RussianTranslation/src/export_lod.py) at commit `ecc8bdfb4` (origin/master, 11-10-2026). Static surface: [render_static_lod.py](https://github.com/gasyoun/SanskritLexicography/blob/master/RussianTranslation/src/render_static_lod.py) over `release/pwg_ru_lod.ttl`.

## Inputs (with integrity receipts)

| Input | Rows | Receipt |
|---|---:|---|
| `assembled_cards.jsonl` (PWG skeletons, public domain) | 120,172 | sha256 `020b5bd18141f3321dbac6ba5b59c4982c5d8268a40d3e739c09ea51660790d5` — matches the committed `.sha256` sidecar |
| `pwg_ru_translated.jsonl` (own RU translations, gitignored store) | 11,519 | `<pwg-ru-data>/tm/` canonical store (H2175 R2.2 layout) |
| `pwg_ru_relationships.jsonl` (vartrans relations) | 6,326 | regenerated 11-10-2026 via `build_relationships.py` (deterministic, store-derived) |
| `dcs_freq.json` (DCS lemma frequencies) | 90,349 lemmas / 5,688,416 tokens | regenerated 11-10-2026 via `build_dcs_freq.py` from the DCS-2026 SQLite master (see §1c below) |
| `pwg_sense_stratum.jsonl` (Renou strata) | **0 — KNOWN GAP** | see Gaps |

## Outputs + counts (in [void.ttl](https://github.com/sanskrit-lexicon/csl-standards/blob/main/standards/pwg-ru-lod/void.ttl))

Lexical graph 324,279 triples — 120,172 `ontolex:LexicalEntry`, 48,579 `ontolex:LexicalSense`, 35,778 `pwglex:Citation`, 106,081 lemma-bank nodes, 9,888 `rel/` vartrans relations. DCS-frequency graph 43,708 triples over 43,693 lemma records. Total 367,987 triples, 363,633 distinct subjects. The DE-enrichment and grammar graphs (188,952 DE senses; 106,082 grammar lemmas) were built in the same `all` run but are **out of wave-0 publish scope** — the VoID dataset is the two-graph lexical+DCS join.

## Acceptance gate — PASS

`python src/lod_acceptance.py` (canonical fixture mode, [runbook §8](https://github.com/sanskrit-lexicon/csl-standards/blob/main/docs/PUBLISHING_LOD.md)): **ACCEPTANCE PASSED, exit 0** — federated RU sense × citation × DCS-freq join returns rows; DE and grammar joins return rows; lossless RDF round-trip; structural invariants; SHACL profile validates. B1/B3 source-coverage checks skipped in the documented standalone mode (gitignored sources off-path).

## §1b `/publish-safety-check` — **GO**

Run on the release bundle before any public action, 11-10-2026:

1. **Intended visibility** — new PUBLIC repo `sanskrit-lexicon/pwg-ru-lod` (static Pages) + a public PR to `perma-id/w3id.org`: both are the explicit deliverable of the MG-ruled runbook + H6484 (the ruling is the standing visibility decision). No intentional-private repo is touched.
2. **Rights facts (recorded once)** — PWG (Böhtlingk–Roth) public domain; RU translations = own work, machine-generated, graded non-citable; Kochergina (`koch`), Frisch (`fri`), Smirnov (`smirnov`) gloss layers carry **recorded copyright approvals for extensive use in the publishable edition** ([RIGHTS_APPROVALS.md](https://github.com/gasyoun/SanskritLexicography/blob/master/RussianTranslation/RIGHTS_APPROVALS.md), A42 ship-all, MG 08-08-2026 — "never reask"); Knauer/Kossowich public domain; DCS frequency = CC BY 4.0 (§1c below). Per-sense attribution rides as `dct:source`. No confirmed prohibition, no restricted-data designation.
3. **Personal data** — scan of both publish-bound dumps: 0 emails, 0 phone numbers; only scholarly identity (ORCID byline in VoID).
4. **Secrets** — scan: 0 credential patterns (regex hits were dictionary glosses, e.g. "keep (a secret)").
5. **Gitignored-bulk leakage** — the bundle ships only derived graph documents; the raw store, cards, raws/ and corpus/ (mixed-copyright per `pwg-ru-data` README) stay private; no Samudra corpus translation text is an input to this graph (its inputs are the dictionary senses only).

## §1c DCS license composition — **COMPOSE**

Verbatim record of the terms attached to the exact artifact consumed (`VisualDCS` [README](https://github.com/gasyoun/VisualDCS#license) § License, [CITATION.cff](https://github.com/gasyoun/VisualDCS/blob/main/CITATION.cff)):

> **The DCS-2026 SQLite master and its exports**: **CC BY 4.0**, inherited from the upstream Digital Corpus of Sanskrit (Hellwig, CC BY 4.0). Cite it per `CITATION.cff`, and cite the underlying corpus annotation separately.

> If you use the DCS-2026 SQLite master or its exports, please cite it as below, and cite the underlying corpus annotation separately (Hellwig, Oliver. The Digital Corpus of Sanskrit (DCS). 2010-2024. CC BY 4.0).

**Composition verdict: COMPOSE.** The DCS-frequency contribution is attribution-only (CC BY 4.0, no share-alike, no non-commercial term) — it adds **no term stricter than CC BY-SA 4.0**, so the composed graph ships as a single CC BY-SA 4.0 release with the DCS citation carried in `void.ttl` (`dcterms:rights`) and this file. The separate-or-omit fallback is not triggered.

## Release posture (§1a ruling B) — non-citable technical preview

Every translated sense is graded `gr:machine-preview` (machine translation, no human review); dictionary-layer senses are `gr:dict-attested`. The machine-preview non-citable banner is carried in the VoID description, the landing HTML, and **every** per-entry HTML page. The citable filter — `?s pwglex:evidenceGrade ?g . FILTER(?g IN (gr:approved, gr:human-reviewed))` — is documented on the same surfaces and is currently **empty**; a real content release waits on G5 human approvals.

## Known gaps (recorded honestly)

- **Renou strata absent from this build**: `sense_stratum.py` matches `<div n="1">… N)` sense markers that the csl-orig `pwg.txt` markup migration of 19-06-2026 changed to `… N〉` form, so the stratum sidecar regenerates empty; the wave-0 graph carries no `pwglex:StratumAttestation` triples. Fixture-era strata remain in the committed fixture/acceptance surface. Follow-up minted for the loader fix.
- `<ab>` tooltip table unavailable at build time (worktree sibling `csl-pywork` not materialized) — affects DE-side rendering hints only, no lexical-graph impact.
- Lemma/citation/grade documents are Turtle-only on the static surface; per-entry documents carry the full Turtle/HTML conneg. `rel/` resources are served via the dataset document.

_Dr. Mārcis Gasūns_
