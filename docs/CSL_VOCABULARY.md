# `csl:` Vocabulary Index

Date: 2026-06-20
Namespace: `https://sanskrit-lexicon.github.io/csl-standards/ns#`

This is a compact public index for the extension terms already used by the TEI/OntoLex
pilot. It does not mint a new standard; it documents the project-local vocabulary that
answers specific loss phenomena in the validated profiles.

## Core Terms

| Term | Kind | Used in | Meaning |
|---|---|---|---|
| `csl:sourceRecord` | property | OntoLex/SHACL | Links an entry or value to the source dictionary record. |
| `csl:SourceRecord` | class | OntoLex/SHACL | Provenance node for one source dictionary record. |
| `csl:dictionary` | property | OntoLex/SHACL | Dictionary code on a source record or lexicographic resource. |
| `csl:recordNumber` | property | OntoLex/SHACL | Source record number / entry id. |
| `csl:profileVersion` | property | OntoLex/SHACL | Export/profile version marker. |
| `csl:validationScope` | property | OntoLex/SHACL | Scope marker for validated pilot graphs. |
| `csl:evidenceType` | property | OntoLex/FrAC | Coarse evidence source type. |
| `csl:evidenceClass` | property | TEI/OntoLex | Evidence subtype: `textual`, `hedge`, `kosha`, `editorial`. |
| `csl:citedWork` | property | TEI/OntoLex | Parsed cited work label, such as `AV.`. |
| `csl:citedRange` | property | TEI/OntoLex | Parsed cited locus/range, such as `6,116,1`. |
| `csl:RootRelation` | class | OntoLex/SHACL | Relation node for Sanskrit root/derivational-base modeling. |
| `csl:whitneyRoot` | property | TEI/OntoLex | Pointer into Whitney's root index. |
| `csl:ContinuationRelation` | class | OntoLex/SHACL | Relation node for recovered MW continuation-parent links. |
| `csl:relatesEntry` | property | OntoLex/SHACL | Entry linked by a relation node. |
| `csl:recoveryStatus` | property | TEI/OntoLex | Recovery status: `recovered`, `conjectured`, `unresolved`. |
| `csl:LineageRelation` | class | OntoLex/SHACL | Relation node for PWG → PWK → MW source lineage. |
| `csl:lineageFrom` | property | OntoLex/SHACL | Source dictionary or stage before a lineage transition. |
| `csl:lineageTo` | property | OntoLex/SHACL | Target dictionary or stage after a lineage transition. |
| `csl:transition` | property | OntoLex/SHACL | Lineage transition, currently `abridgement` or `recomposition`. |
| `csl:sourceCitationCount` | property | OntoLex | Citation count before a lineage transition. |
| `csl:retainedCitationCount` | property | OntoLex | Citation count retained after a lineage transition. |
| `csl:droppedCitationCount` | property | OntoLex/SHACL | Citation count dropped by a lineage transition. |
| `csl:sourceDictionary` | property | OntoLex/SHACL | Dictionary source for a sense, attestation, or value. |
| `csl:senseKind` | property | OntoLex/SHACL | Sense role/type marker emitted by the neutral model. |
| `csl:modelingNote` | property | TEI/OntoLex | Human-readable note for a modeling repair or caveat. |

## Loss Crosswalk

| Loss phenomenon | `csl:` construct | Validation rule / profile anchor |
|---|---|---|
| `generic-lexicographer-hedge` | `csl:evidenceClass "hedge"` | `csl:AttestationShape` requires `csl:evidenceClass`. |
| `named-kosha-citation` | `csl:evidenceClass "kosha"` + `csl:citedWork` | `csl:AttestationShape` validates evidence class and optional citation fields. |
| `citation-coordinate` | `csl:citedWork` + `csl:citedRange` | `csl:AttestationShape` allows a single cited work/range pair. |
| `editorial-reference` | `csl:evidenceClass "editorial"` | `csl:AttestationShape` validates the evidence-class vocabulary. |
| `root-as-entry` / `root-as-derivational-base` | `csl:RootRelation` + `csl:whitneyRoot` | Root relation emitted by the OntoLex exporter and described in the extension proposal. |
| `compound-decomposition` | `decomp:ComponentList` plus `csl:modelingNote` | OntoLex decomposition profile plus project note. |
| `continuation-parent` | `csl:ContinuationRelation` + `csl:recoveryStatus` | `csl:ContinuationRelationShape` constrains recovery status. |
| `source-collapse` | `csl:LineageRelation` + lineage count properties | `csl:LineageRelationShape` validates relation shape and transition vocabulary. |
| `sense-citation-fusion` | TEI Lex-0 kośa fixtures, with `csl:modelingNote` when exported downstream | TEI Lex-0 validation report and loss report keep the fusion visible. |

## Source Files

- SHACL profile: [`../data/schema/ontolex-frac-profile.shacl.ttl`](../data/schema/ontolex-frac-profile.shacl.ttl)
- Extension proposal: [`EXTENSION_PROPOSAL.md`](EXTENSION_PROPOSAL.md)
- Scale stability report: [`SCALE_STABILITY.md`](SCALE_STABILITY.md)
