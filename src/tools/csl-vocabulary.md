---
title: csl vocabulary
---

# `csl:` Vocabulary

Namespace: `https://sanskrit-lexicon.github.io/csl-standards/ns#`

This page indexes the project-local `csl:` terms used by the TEI/OntoLex pilot and links
each construct to the loss phenomenon it repairs or preserves.

## Terms

| Term | Role | Meaning |
|---|---|---|
| `csl:SourceRecord` | provenance class | Source dictionary record node. |
| `csl:sourceRecord` | provenance property | Link from entry/value to source record. |
| `csl:dictionary` | provenance property | Dictionary code. |
| `csl:recordNumber` | provenance property | Source record number. |
| `csl:evidenceType` | evidence property | Coarse attestation type. |
| `csl:evidenceClass` | evidence property | `textual`, `hedge`, `kosha`, or `editorial`. |
| `csl:citedWork` | evidence property | Parsed work label. |
| `csl:citedRange` | evidence property | Parsed cited locus. |
| `csl:RootRelation` | relation class | Root/derivational-base relation. |
| `csl:whitneyRoot` | relation property | Whitney root-index pointer. |
| `csl:ContinuationRelation` | relation class | Recovered continuation-parent relation. |
| `csl:recoveryStatus` | relation property | `recovered`, `conjectured`, or `unresolved`. |
| `csl:LineageRelation` | relation class | Cross-dictionary lineage relation. |
| `csl:lineageFrom` | lineage property | Source stage. |
| `csl:lineageTo` | lineage property | Target stage. |
| `csl:transition` | lineage property | `abridgement` or `recomposition`. |
| `csl:sourceCitationCount` | lineage property | Citation count before transition. |
| `csl:retainedCitationCount` | lineage property | Citation count retained after transition. |
| `csl:droppedCitationCount` | lineage property | Citation count dropped by transition. |
| `csl:sourceDictionary` | source property | Dictionary attached to a sense/value. |
| `csl:senseKind` | sense property | Sense role marker. |
| `csl:modelingNote` | note property | Human-readable modeling caveat. |

## Crosswalk

| Loss phenomenon | Construct | Rule anchor |
|---|---|---|
| `generic-lexicographer-hedge` | `csl:evidenceClass "hedge"` | `csl:AttestationShape` |
| `named-kosha-citation` | `csl:evidenceClass "kosha"` + `csl:citedWork` | `csl:AttestationShape` |
| `citation-coordinate` | `csl:citedWork` + `csl:citedRange` | `csl:AttestationShape` |
| `editorial-reference` | `csl:evidenceClass "editorial"` | `csl:AttestationShape` |
| `root-as-derivational-base` | `csl:RootRelation` + `csl:whitneyRoot` | OntoLex exporter + SHACL profile |
| `compound-decomposition` | `decomp:ComponentList` + `csl:modelingNote` | OntoLex decomposition profile |
| `continuation-parent` | `csl:ContinuationRelation` + `csl:recoveryStatus` | `csl:ContinuationRelationShape` |
| `source-collapse` | `csl:LineageRelation` + retained/dropped counts | `csl:LineageRelationShape` |
| `sense-citation-fusion` | TEI Lex-0 kośa fixture + visible loss report | TEI Lex-0 validation |

Full documentation: [CSL vocabulary index](https://github.com/sanskrit-lexicon/csl-standards/blob/main/docs/CSL_VOCABULARY.md).
