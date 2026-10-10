# SMALL_CLASS_ABBREV_REGISTER_NOTE.meta.md -- metadoc about `SMALL_CLASS_ABBREV_REGISTER_NOTE`

_Created: 10-10-2026 · Last updated: 10-10-2026_

This is a **metadoc** -- a document *about* a document. Its subject is [SMALL_CLASS_ABBREV_REGISTER_NOTE](https://github.com/sanskrit-lexicon/csl-standards/blob/main/docs/SMALL_CLASS_ABBREV_REGISTER_NOTE.md).
It does not duplicate the subject's content; it records everything *around* it: why it
exists, who built it, what's still wrong with it, how it should evolve. Kept per the
standing "one metadoc per important document" convention (`~/.claude/CLAUDE.md`).

## Subject
- **Document:** [SMALL_CLASS_ABBREV_REGISTER_NOTE](https://github.com/sanskrit-lexicon/csl-standards/blob/main/docs/SMALL_CLASS_ABBREV_REGISTER_NOTE.md)
- **Purpose:** design record for the H6419 controlled abbreviation register (data/abbrev/small-class-register.json) and its deterministic collision measurement — the grounding rules, the declared conflicts, and the honest reading of the numbers.
- **Audience:** future sessions extending the register (the E4a/E4b paper lanes re-read it), reviewers of the register artifact, and anyone re-running the measurement.
- **Format / contract:** repo docs note; its normative counterpart is the register artifact + validator (`npm run validate-small-class-register`) — the note explains, the validator enforces.

## Provenance
- **Created:** 10-10-2026 (handoff [H6419](https://github.com/gasyoun/Uprava/blob/main/handoffs/H6419-OxAlpha_csl-standards_small-classes-controlled-register_10.10.26.md), GLM-5.3-Flash via ZCode; PR #151, release v1.5.0 #152).
- **Next hardening:** none queued; extension of the scheme (gender/features, work titles) is a research decision, not a hardening step.

## Improvement backlog (ranked)
| # | Improvement | Why | Status |
|---|---|---|---|
| 1 | Extend the register beyond the scheme-as-printed (gender, middle, feature labels) | 91.3% of the collision mass is uncovered residue | queued — research decision for the E4a/E4b lanes |
| 2 | SKOS/Turtle serialization for LOD serving | JSON-LD context is declared but no .ttl export exists | not queued (PUBLISHING_LOD phase owns dereferenceable serving) |
| 3 | Re-pin provenance when csl-atlas re-cuts the census | validator/measurement hard-fail on drift by design | standing rule, no ticket needed |

## Known limitations / caveats
- The register is deliberately the **scheme-as-printed** (2006 §2.3): forms without paper-proposed notation do not become concepts; 8 forms are declared unresolved (incl. `pn.` contradicting the census, and the `Ppf.` pluperfect/participe-parfait conflict).
- The measurement covers the census collision universe only (448 strings of 4752 legend-carrying ones); the 18/44 machine-readable legend denominator bounds every claim.
- JS `toLowerCase()` stands in for Python `casefold()`; verified equal on every census character class, and the validator pins key existence against the payload either way.
- The census payload is read cross-repo and never committed here.

## Intended use / known misuse
- **For:** deciding whether/how to extend the 2006 scheme; citing measured collision numbers for the 2006 paper's claim in the E4 papers.
- **Misuse:** treating the register as a normative cataloging standard for new dictionaries (it is a research register of one 2006 proposal); quoting the reduction percentages without the coverage denominators; editing the generated report instead of re-running the script (drift = payload moved; re-pin, never hand-edit).

## Maintenance & sunset plan
- Kept alive by csl-standards (register + scripts are repo artifacts); re-pin `provenance.census` when csl-atlas re-cuts the census. "Archived" looks like: the E4 papers published and the register superseded by an extended scheme — then flip `Deprecation status` here.

## Deprecation status
`active`

## Related documents
- Subject sibling artifacts: [small-class-register.json](https://github.com/sanskrit-lexicon/csl-standards/blob/main/data/abbrev/small-class-register.json), [collision report](https://github.com/sanskrit-lexicon/csl-standards/blob/main/data/abbrev/small-class-collision-report.md)
- Upstream census: [csl-atlas abbrev_census.json](https://github.com/sanskrit-lexicon/csl-atlas/blob/main/data/abbrev/abbrev_census.json) (H6409)
- Agenda: [Gasūns-2006 evolution dossier §4](https://github.com/gasyoun/Uprava/blob/main/research/gasuns-2006-latin-terms-evolution-dossier.md)
- Adjacent layer: [H5335 lexicographic-types register brief](https://github.com/gasyoun/SanskritLexicography/blob/master/docs/DECISION_BRIEF_LEXICOGRAPHIC_TYPES_REGISTER_H5335_24-09-2026.md)

## Revision history of this metadoc
| Date | Event | Who |
|---|---|---|
| 10-10-2026 | metadoc created (`metadoc_emit.py`) | GLM-5.3-Flash via ZCode |

_Dr. Mārcis Gasūns_
