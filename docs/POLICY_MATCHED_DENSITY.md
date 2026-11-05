# Policy-matched density — the stratified comparison method

_Created: 05-11-2026 · Last updated: 05-11-2026_

This note is the normative method for comparing **citation density** between two
dictionaries without the comparison being an artefact of their lemmatisation
policies. It generalizes the PD-vs-PWG comparison measured in A68 / H7297 into a
reusable standard; the measured instance is cited as the reference application,
never as part of the norm. Companion canon:
[`docs/CITATION_MASS_CANON.md`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/docs/CITATION_MASS_CANON.md)
(classification and denominators).

## 1 — The problem: a raw multiple conflates policy with density

Two dictionaries with different lemmatisation policies produce incomparable
lemma lists: a dictionary that compounds aggressively (PD: ~78% compounds inside
the *anna* family) puts its attestations on many light compound lemmas, while a
sparer dictionary concentrates attestations on fewer lemmas. A raw
attestation-multiple over the shared lemma set (reference instance: PD:PWG
= 8.55× raw, 9.53× on quotations) answers "how much more quoted text does PD
attach to the lemmas both dictionaries know" — a real number, but it embeds the
family mix of the shared set. The policy-matched method exists to separate the
two.

## 2 — The method

1. **Shared-lemma matching.** Compare only lemmas attested in **both**
   dictionaries (reference instance: 4,093 shared lemmas; homograph policy and
   source hash frozen in the measurement envelope).
2. **Morphological stratification.** Assign every shared lemma exactly one
   stratum from its dictionary-printed analysis parenthesis — **simplex** /
   **derivative** / **compound** — with an explicit *unclassified* bucket that
   is reported, never silently dropped (reference instance: the H7110 frozen
   class rule, [`pd_policy_matched_class.tsv`](https://github.com/sanskrit-lexicon/csl-atlas/blob/main/data/pd/pd_policy_matched_class.tsv)).
3. **Within-stratum ratios.** Compute the attestation ratio (attestations in
   dictionary A / attestations in dictionary B) inside each stratum separately.
   The policy-matched claim is the pattern across strata: in the reference
   instance A is denser **inside every stratum**, which no family-mix story can
   explain away.
4. **Stratified lemma bootstrap.** Resample lemmas within strata (reference
   instance: 2,000 reps) for a 95% CI on each stratum ratio and on the pool.
   The bootstrap unit is the lemma, not the attestation — attestation counts
   within a lemma are not independent draws.
5. **Two pools, side by side.** Report the **standardised equal-weight pool**
   (each stratum weighted equally, the policy-matched headline) and the **raw
   ratio-of-sums** (all shared lemmas pooled raw). They answer different
   questions; publishing one while hiding the other is a defect.
6. **Below-parity reporting.** Count and freeze the membership of shared lemmas
   where the denser dictionary is *below* parity (fewer attestations than its
   counterpart); the count travels with the headline (reference instance: 340
   below-parity lemmas, membership hash frozen).

## 3 — The measured instance (PD vs PWG, letter *a*)

| Stratum | Shared lemmas | PD attestations | PWG attestations | Ratio | 95% CI |
| --- | --- | --- | --- | --- | --- |
| simplex | 773 | 46,236 | 6,144 | **7.53×** | 6.22–9.09 |
| derivative | 357 | 12,276 | 1,434 | **8.56×** | 6.95–10.65 |
| compound | 2,929 | 97,674 | 10,699 | **9.13×** | 8.64–9.65 |
| unclassified (reported) | 34 | 1,294 | 146 | 8.86× | — |
| **standardised equal-weight pool** | 4,093 | 157,480 | 18,423 | **8.41×** | 7.68–9.27 |
| raw ratio-of-sums | 4,093 | 157,480 | 18,423 | 8.55× | 7.99–9.15 |

Pinned headline (A68 claim ledger row `P-density-strata`): **7.5 / 8.6 / 9.1,
pooled 8.4** — prose uses the one-decimal form, ledgers keep exact values. The
quotation-unit multiple (9.53× raw) is a separate unit and never substitutes for
the attestation multiple.

## 4 — Reporting requirements

Under this canon, a density comparison is publishable only when it carries: the
shared-set size and matching policy; the stratification rule and its
unclassified share; every stratum ratio with its CI; both pools; the
below-parity count; and the pin of the headline multiple. A bare "8× denser"
without these is a defect. Every ratio is a denominator-ledger row under
[`data/schema/denominator-ledger.schema.json`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/data/schema/denominator-ledger.schema.json)
(no percentage without its base, §1 of the citation-mass canon).

## 5 — Reference artifacts

Measured instance and regeneration (cross-repo, csl-atlas):
[`pd_policy_matched_density.tsv`](https://github.com/sanskrit-lexicon/csl-atlas/blob/main/data/pd/pd_policy_matched_density.tsv)
·
[`pd_policy_matched_density.json`](https://github.com/sanskrit-lexicon/csl-atlas/blob/main/data/pd/pd_policy_matched_density.json)
(envelope: homograph policy, class rule, bootstrap settings, frozen below-parity
membership) · regeneration
[`scripts/pd_policy_matched_density.py --check`](https://github.com/sanskrit-lexicon/csl-atlas/blob/main/scripts/pd_policy_matched_density.py)
· write-up
[PD_POLICY_MATCHED_DENSITY_2026.md](https://github.com/sanskrit-lexicon/csl-atlas/blob/main/reports/PD_POLICY_MATCHED_DENSITY_2026.md)
(H7297) · pins in
[A68_CLAIM_LEDGER.tsv](https://github.com/gasyoun/Uprava/blob/main/papers/A68/A68_CLAIM_LEDGER.tsv)
· facts dossier
[A68_PD_TRENDS_GRILL_FACTBASE_2026-11-05.md](https://github.com/gasyoun/Uprava/blob/main/reports/A68_PD_TRENDS_GRILL_FACTBASE_2026-11-05.md) §2.

_Dr. Mārcis Gasūns_
