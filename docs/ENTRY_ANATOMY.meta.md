# ENTRY_ANATOMY.meta.md -- metadoc about `ENTRY_ANATOMY`

_Created: 05-11-2026 · Last updated: 05-11-2026_

This is a **metadoc** -- a document *about* a document. Its subject is [ENTRY_ANATOMY](https://github.com/sanskrit-lexicon/csl-standards/blob/main/docs/ENTRY_ANATOMY.md). It does not duplicate the subject's content; it records everything *around* it.

## Subject
- **Document:** [ENTRY_ANATOMY](https://github.com/sanskrit-lexicon/csl-standards/blob/main/docs/ENTRY_ANATOMY.md)
- **Purpose:** the graduated, repo-side canon of the CDSL entry anatomy — the uniform `<L>…<LEND>` skeleton, the ten-part taxonomy, per-dictionary inline markers, the new-dictionary extension recipe, consumers and caveats. Fixes the "entry-anatomy canon is machine-local skills" fragmentation named in the 05-11 grill factbase §3.
- **Audience:** future implementers of anatomy renderers (any harness, not just the original skill); the four registered consumers (csl-guides, Systema-Sanscriticum, kosha, pwg_ru/pwg_en); anyone teaching how to read a Cologne entry.
- **Format / contract:** repo standards note; the **producer** remains the machine-local [`entry-anatomy` skill](https://github.com/gasyoun/claude-config/blob/main/skills/entry-anatomy/SKILL.md) (H791) — graduation contract: nothing dropped, the two stay in sync, this document is the normative surface.

## Provenance
- **Created:** 05-11-2026 (handoff [H7727](https://github.com/gasyoun/Uprava/blob/main/handoffs/H7727-GLM_csl-standards_v1-7-knowledge-layer_05.11.26.md), GLM 5.3 via ZCode; MG grill verdict Q2a 05-11). Source skill last updated 29-08-2026; the diff at graduation is re-checkable against that file.

## Improvement backlog (ranked)
1. The skill's `DICT_MAPS` covers 4 dictionaries; the skeleton claim covers ~44 — encode more families as they are verified.
2. Port the producer script into this repo (it currently lives only in the machine-local skill tree) once a consumer outside the harness needs it.

_Dr. Mārcis Gasūns_
