# Citation-mass canon — the three-way classification and the residue method

_Created: 05-11-2026 · Last updated: 05-11-2026_

This note is the normative canon for **measuring citation mass** in a Sanskrit
dictionary: how citation-siglum occurrences are classified, how coverage and
residue are computed, and what any published percentage must carry with it. It
generalizes the method measured on the Poona Dictionary (PD) letter-*a* text in
A68 into a reusable standard; the measured instance is cited throughout as the
reference application, never as part of the norm. Companion artifacts:
[`docs/POLICY_MATCHED_DENSITY.md`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/docs/POLICY_MATCHED_DENSITY.md)
(the density-comparison method built on the same corpus) and
[`data/schema/denominator-ledger.schema.json`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/data/schema/denominator-ledger.schema.json)
(the machine-checkable form of §1).

## 1 — The rule: no percentage without its base

Every coverage, share, or ratio published under this canon names its denominator
in the same display. "25.2%" is a defect; "88,929 / 353,512 = 25.2%" is a
measurement. The denominator is not metadata — it is half the claim, because the
same numerator supports incompatible readings over different bases (§5 below:
the same PD coverage is 25.2%, 8.0%, and 77.9% over three legitimate
denominators). Each measurement is recorded as a row in a **denominator ledger**
— one row per measure, carrying value, base, percentage kind, and machine source
— validated by
[`scripts/validate-denominator-ledger.mjs`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/scripts/validate-denominator-ledger.mjs)
against
[`data/schema/denominator-ledger.schema.json`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/data/schema/denominator-ledger.schema.json).
The reference ledger is the PD canon ledger in
[csl-atlas/data/pd/pd_canon_ledger.tsv](https://github.com/sanskrit-lexicon/csl-atlas/blob/main/data/pd/pd_canon_ledger.tsv).

## 2 — The three-way classification

Every citation-siglum occurrence in the corpus is assigned **exactly one** of
three classes. The unit is the occurrence, not the distinct siglum: a work cited
3,506 times counts 3,506 times — frequency-weighting is the dictionary's own
documented practice, not an imposed canonicity ranking.

| Class | Criterion | Examples |
| --- | --- | --- |
| **primary** | the siglum names a Sanskrit work (any period, any genre, including commentaries and śāstra) | *MahāBhā.*, *ṚV.*, *PadmP.*, *Kāśi.*, *Manu.*, *ŚatBr.*, *SuśruS.*, *BaudhŚS.*, *Rām.* |
| **structural** | the token is citation apparatus, not a work: grammatical case labels, locus sub-parts, Roman-numeral book/volume numbers, editorial markers | case labels *Acc.Loc.*; *A.*, *B.*; *i.*, *ii.*, *x.*; *I.*, *II.*, *X.*; *P.*, *K.*, *Vā.*, *Bh.* (grammarian-locus letters); *Ed.*, *App.*, *Vol.*, *p.*, *on* |
| **secondary** | the siglum names modern scholarship *about* Sanskrit | *EI.* (Epigraphia Indica), *MW.* (Monier-Williams), *PW.* (the Petersburg dictionary), *POK.* (Pokorny), *VIŚVA.* (Vishva Bandhu), *MAYR.* (Mayrhofer) |

The trichotomy's load-bearing distinction is the A68 framing "books *in*
Sanskrit, not books *on* Sanskrit": the **primary** class isolates the
dictionary's citation of the tradition itself; **structural** tokens are removed
so that apparatus never inflates a canon estimate; **secondary** scholarship is
excluded from canon measures but kept, quantified, as its own reported mass (a
supplement like the Halle *Nachtragswörterbuch* lives on the dictionaries it
continues — a different object of study, not a smaller canon).

Assignment is per-occurrence and exclusive; a siglum's class follows the
referent, so one printed abbreviation lumping two referents (the *MAYR.* siglum
covers both KEWA and EWA where they disagree) stays one class, with the lumping
recorded as the source's own editorial decision.

## 3 — The masses

Classified over the whole corpus, the masses add up by construction:

| Measure | Value |
| --- | --- |
| All classified siglum occurrences | **398,359** |
| — primary occurrences | **353,512** (88.7% of all sigla) |
| — structural apparatus | **39,987** |
| — modern secondary scholarship | **4,860** |

These four numbers are pinned in the A68 claim ledger
([A68_CLAIM_LEDGER.tsv](https://github.com/gasyoun/Uprava/blob/main/papers/A68/A68_CLAIM_LEDGER.tsv),
rows `P-allsigla`, `P-primary`); any artifact quoting a diverging value is
defective against this canon. Prose uses the one-decimal form; ledgers keep
exact counts.

## 4 — Counting rules, stated and reconciled

Two counting rules apply to one tokenisation and their totals must be reported
together when both are used:

- **census occurrences** — every siglum occurrence counted where it stands:
  398,359;
- **siglum-bearing loci** — citation positions (the `<ls>`-shaped loci): 384,217,
  plus 35,673 further references that inherit a siglum after a semicolon
  (Reader's Guide X.v re-invocation), for 419,890 attestations in total.

The two occurrence totals differ by 14,142 (3.6%) — an **aggregate consistency
check, not item-level agreement**, and it is published as such (ledger row
`P-count-rules`). A citation-siglum occurrence is also not a quotation: a
quotation is a maximal run of consecutive SLP1 blocks separated only by
whitespace and closed by a siglum-plus-locus (the block also carries headword
and etymology morphemes, so blocks are not the unit). On the reference corpus:
302,442 quotations, 419,890 attestations, 107,630 entries / 104,959 distinct
headwords (2,671 records repeat an earlier headword string; per-entry counts use
records, lemma totals use distinct headwords).

## 5 — Coverage metrics: three denominators, three honest numbers

Over the primary class, coverage against a held corpus (DCS in the reference
application) is reported in three units, each with its base in the same display:

| Metric | Value | Denominator |
| --- | --- | --- |
| Citation-weighted coverage | **88,929 / 353,512 = 25.2%** | primary occurrences |
| Title-level overlap | **118 matched works** | no unqualified lower bound — work-count and entry-row units are incompatible |
| Token-weighted coverage (2026) | **4,430,111 / 5,688,416 = 77.9%** | DCS-held tokens (74.1% in 2021) |

The three numbers do not compete; they answer different questions (how much of
the dictionary's citation mass, how many of the works, how much of the held
text). The title-level count carries an explicit "not an established lower
bound" caveat: denominators in works vs entry-rows cannot be nested.

## 6 — The residue method

**Primary residue** is the primary-citation mass *not* covered by the held
corpus, in occurrences, with its share over the all-siglum denominator:

> residue = primary − covered = 353,512 − 88,929 = **264,583 occurrences**
> = **66.4% of 398,359** (all classified siglum occurrences).

Two disciplines make the residue a measurement rather than a lament:

1. **It is a holdings gap, not a canonicity verdict.** The residue says which
   citation mass a *specific held corpus* does not cover. In the reference
   application the residue concentrates in the purāṇas, the kośa tradition,
   classical kāvya, and the Mahābhāṣya — that concentration is a digitisation
   agenda, ranked by the dictionary's own citation practice.
2. **It is computed only after classification.** Only primary occurrences enter
   the residue; structural apparatus and secondary scholarship are never
   "residue" — they were never candidate canon mass. An unclassified residue is
   a defect: classify first (§2), then subtract.

## 7 — Applying the canon to another dictionary

The method transfers as a pipeline, not a number set:

1. tokenize citation-siglum occurrences on the machine-readable text;
2. assign each occurrence exactly one class (§2), recording lumped referents as
   editorial decisions;
3. reconcile the two counting rules and publish the difference (§4);
4. compute coverage per available denominator, each with its base (§5);
5. compute the residue over classified primary mass only (§6);
6. record every measure as a denominator-ledger row (§1), validated against
   [`data/schema/denominator-ledger.schema.json`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/data/schema/denominator-ledger.schema.json),
   and cite the ledger — not prose memory — as the authority for each number.

Reference artifacts (measured instance): PD letter-*a* text and canon ledger in
[csl-atlas/data/pd/](https://github.com/sanskrit-lexicon/csl-atlas/tree/main/data/pd);
pins in
[A68_CLAIM_LEDGER.tsv](https://github.com/gasyoun/Uprava/blob/main/papers/A68/A68_CLAIM_LEDGER.tsv);
method prose in the A68 paper (§4.2, §5.2). Facts dossier:
[A68_PD_TRENDS_GRILL_FACTBASE_2026-11-05.md](https://github.com/gasyoun/Uprava/blob/main/reports/A68_PD_TRENDS_GRILL_FACTBASE_2026-11-05.md) §2–§3.

_Dr. Mārcis Gasūns_
