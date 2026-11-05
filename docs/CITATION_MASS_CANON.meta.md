# CITATION_MASS_CANON.meta.md -- metadoc about `CITATION_MASS_CANON`

_Created: 05-11-2026 · Last updated: 05-11-2026_

This is a **metadoc** -- a document *about* a document. Its subject is [CITATION_MASS_CANON](https://github.com/sanskrit-lexicon/csl-standards/blob/main/docs/CITATION_MASS_CANON.md). It does not duplicate the subject's content; it records everything *around* it.

## Subject
- **Document:** [CITATION_MASS_CANON](https://github.com/sanskrit-lexicon/csl-standards/blob/main/docs/CITATION_MASS_CANON.md)
- **Purpose:** normative canon for measuring citation mass in a Sanskrit dictionary — the primary/structural/secondary trichotomy, the counting-rule reconciliation, the three coverage denominators, and the residue method — generalized from the A68/PD letter-*a* measurement.
- **Audience:** anyone measuring citation coverage or canon mass on CDSL-scale dictionaries (A68 follow-ups, csl-atlas PD lanes, future dictionary comparisons); reviewers of coverage claims.
- **Format / contract:** repo standards note; the machine-checkable half is [denominator-ledger.schema.json](https://github.com/sanskrit-lexicon/csl-standards/blob/main/data/schema/denominator-ledger.schema.json) + `npm run validate-denominator-ledger` — the note explains, the validator enforces.

## Provenance
- **Created:** 05-11-2026 (handoff [H7727](https://github.com/gasyoun/Uprava/blob/main/handoffs/H7727-GLM_csl-standards_v1-7-knowledge-layer_05.11.26.md), GLM 5.3 via ZCode; MG grill verdict Q2a 05-11). Numbers pinned to [A68_CLAIM_LEDGER.tsv](https://github.com/gasyoun/Uprava/blob/main/papers/A68/A68_CLAIM_LEDGER.tsv) rows P-allsigla / P-primary / P-covered / P-count-rules; measured instance in [csl-atlas/data/pd/](https://github.com/sanskrit-lexicon/csl-atlas/tree/main/data/pd).
- **Known tension:** A68 §5.2 prose also prints a "2.3%" secondary-scholarship figure that is *not* a ledger pin; this canon deliberately quotes only pinned/derivable numbers.

## Improvement backlog (ranked)
1. Second measured application (another dictionary's citation mass run through §7) — the canon is untested as a pipeline on anything but PD letter-*a*.
2. Machine-readable crosswalk from `<ls>` siglum to the three classes (a register in the small-class-register style) — currently classification is described, not encoded.

_Dr. Mārcis Gasūns_
