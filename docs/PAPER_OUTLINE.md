# Paper Outline

Working title:

**Sanskrit Lexicography Between TEI and OntoLex: Evidence, Derivation, and Compression in MW, PWG, and PWK**

## Abstract Draft

This paper uses three related CDSL Sanskrit dictionaries, Monier-Williams 1899 (MW), the large Petersburg dictionary (PWG), and the shorter Petersburg dictionary (PWK), as a stress test for lexicographic interoperability. Rather than converting dictionary XML mechanically, it asks whether the lexicographic meaning of these works can be preserved across two complementary models: TEI as an archival representation of dictionary text and OntoLex as a semantic graph representation of lexical knowledge. The test sample is deliberately composed of difficult cases: MW's generic lexicographer-only hedge `L.`, PWG's named kosha citations, verbal roots, compounds, continuation entries, and citation-compression patterns between PWG and PWK. The paper argues that Sanskrit lexicography exposes a class of evidential and derivational structures that are only partially captured by current dictionary standards. The accompanying public standards workbench publishes the raw CDSL snippets, a neutral JSON model, TEI/OntoLex views, and explicit loss reports for each case.

## Argument

The main argument is not that TEI or OntoLex fails. It is that they succeed differently:

- TEI is strong for preserving the dictionary as an edition.
- OntoLex is strong for exposing reusable semantic relations.
- Sanskrit lexicography needs an explicit evidence/provenance layer between them.

## Draft

### 1. Introduction

Historical Sanskrit dictionaries represent dense, highly compressed knowledge systems that evolved through a complex textual lineage. Among these, Monier-Williams 1899 (MW), the large Petersburg dictionary (PWG), and the shorter Petersburg dictionary (PWK) stand as monumental achievements of 19th-century lexicography. These three dictionaries provide an excellent test group for exploring the challenges of digital lexicographic interoperability, as they share a direct intellectual lineage yet employ vastly different representational strategies for derivation, evidence, and abbreviation. This paper asks whether the lexicographic meaning encoded in these works can be robustly preserved across two complementary standard models: the Text Encoding Initiative (TEI) guidelines for archival representation of dictionary text, and the OntoLex-Lemon model for semantic graph representation of lexical knowledge. We argue that true interoperability must preserve not just structural tags, but the underlying lexicographic meaning—specifically the evidential and derivational assertions that these historical dictionaries make. 

### 2. Data And Prior Work

The primary data for this study derives from the digitized editions maintained by the Cologne Digital Sanskrit Dictionaries (CDSL) project. While CDSL provides invaluable digitized XML records, the encoding schemas remain highly project-specific. Previous microanalysis of the MW dictionary has highlighted structural anomalies, such as the use of the `L.` (lexicographer-only) hedge, which serves as a unique evidential marker rather than a standard bibliographic citation. Further studies into the lineage of MW, PWG, and PWK have revealed how PWG's expansive named apparatus of kosha citations was systematically compressed in PWK, and subsequently re-interpreted in MW. In addressing these interoperability challenges, we evaluate the TEI dictionary module, which models the physical and editorial structure of the text, alongside OntoLex-Lexicog and the Frequency, Attestation and Corpus (FrAC) extension, which model the conceptual and semantic relations between lexical entries.

### 3. Method

To systematically test the limits of TEI and OntoLex representations, we developed an automated sampling pipeline that targets "hard cases" of interoperability. We generated a 50-case deterministic slice specifically designed to challenge standard schemas. For each case, we first extracted a "neutral model"—a JSON representation of the raw CDSL data that suspends commitment to either TEI or OntoLex structures. From this neutral model, we generated two divergent profiles: a TEI archival mapping that preserves the editorial structure and source records as escaped quotes, and an OntoLex semantic mapping that constructs a linked-data graph of lexical entries, senses, and attestations. Finally, we employed a loss-report methodology to explicitly track and classify (as clean, partial, or lossy) any lexicographic meaning that was discarded or degraded during the conversion process.

### 4. Evidence And Provenance

The treatment of evidence is a primary stress point in historical Sanskrit lexicography. We focus on core cases involving the MW `L.` hedge, PWG's named kosha citations, and PWK's selective retention or dropping of source evidence. In PWG, a named kosha citation is an explicit bibliographic attestation, whereas the MW `L.` hedge acts as a generalized marker indicating that a word is known only from native lexicographers and lacks textual attestation. When mapped to standard models, these evidential markers are often reduced to generic bibliography links or dropped entirely. We claim that the evidence class is not a mere decorative citation layer; it is a fundamental component of lexical meaning in Sanskrit lexicography. An interoperability standard must therefore distinguish between a direct textual attestation and a secondary lexicographic hedge.

### 5. Roots And Derivation

Sanskrit lexicography is deeply structured around the concept of verbal roots (dhātu). Our core cases include MW roots explicitly marked with `<info verb="genuineroot"/>` and their counterparts in PWG and PWK, which exhibit varying citation densities. In standard dictionary models, a root is typically treated as just another lexical entry. However, in the MW-PWG-PWK lineage, roots function simultaneously as standalone entries and as the derivational infrastructure for grouping families of words. When OntoLex models a root simply as an `ontolex:LexicalEntry`, the hierarchical and derivational scaffolding is lost. We argue that a Sanskrit root cannot be modeled solely as a lexical entry without losing its critical grammatical and derivational function.

### 6. Compounds And Continuations

The dense compression of MW, PWG, and PWK relies heavily on nested subentries for compounds and continuations. Core cases examined include MW's `<e>3*` compound subentries, `k2` compound segmentations, and `<e>1A` continuation entries. These structures represent a tension between the physical layout of the dictionary and its semantic ontology. TEI excels at preserving the subentry and adjacency structure as it appears on the printed page, while OntoLex is well-suited to expose the semantic decomposition and parent-child relations. However, forcing these complex, deeply nested entries into a single flat entry model—as is often required by simplified conversion pipelines—results in the loss of both archival fidelity and semantic relation. 

### 7. PWG To PWK To MW Transformations

Tracing entries across the three dictionaries reveals that compression and translation are not semantically neutral operations. PWK serves as an abridgement and reinterpretation of PWG, often discarding specific kosha citations in favor of generalized summaries. MW, in turn, acts as an English recomposition of the Petersburg dictionaries, further simplifying the evidential apparatus (e.g., collapsing specific references into the `L.` hedge). This editorial compression is semantically meaningful; tracking the transformation from PWG to PWK to MW demonstrates how evidential certainty degrades across the lineage. An interoperable model must be capable of representing these cross-dictionary lineage transformations.

### 8. Standards Critique

Our dual-profile mapping reveals what maps cleanly, what maps partially, and what becomes lossy. Across the 124 loss reports for the 50-case pilot, the two models fail **asymmetrically**: the TEI archival profile is never `lossy` (15 clean, 47 partial, 0 lossy), while the OntoLex semantic profile is never `clean` (0 clean, 42 partial, 20 lossy). TEI can always at least preserve the dictionary as an edition; OntoLex never merely transcribes, so it either relates the data or drops what it cannot relate. By cause, a majority of losses (53%) are **model-vocabulary gaps** — the target standards lack a concept — against 22% CDSL-markup and 13% print-compression, so the remedy is primarily an extension layer on the standards rather than better source encoding. The single largest stress point is the MW `L.` hedge (44% of reports). To address these gaps, we propose a Sanskrit lexicographic extension layer for both standards. This layer introduces specific modeling for the evidence class, root relation types, compound decomposition status, continuation parent status, and source-collapse relations, ensuring that the unique features of Sanskrit lexicography are preserved in digital formats. The full breakdown, and the honest coverage limits of the current instrument, are in [LOSS_ANALYSIS.md](LOSS_ANALYSIS.md).

### 9. The Standards Workbench

To support this research and ensure reproducibility, we publish the accompanying CSL Standards workbench. The workbench provides access to the generated hard-case samples and the raw JSON, TEI, and RDF/Turtle outputs. It includes an interactive view that allows researchers to trace the pipeline from the original CDSL records through the neutral model to the final XML and RDF representations.

### 10. Conclusion

Sanskrit dictionaries are not mere edge cases to be normalized away by rigid digital standards. The structural complexities of works like MW, PWG, and PWK reveal fundamental areas where dictionary interoperability needs finer, more expressive concepts of evidence, derivation, and editorial compression. By utilizing both TEI for archival preservation and OntoLex for semantic mapping, and by introducing targeted extensions, we can build digital lexicographic models that respect and preserve the deep intellectual architecture of the original texts.

## Figures

1. Three-view architecture: CDSL -> neutral model -> TEI/OntoLex.
2. Evidence-class comparison: PWG named kosha citations vs MW `L.` — 23/50 cases
   are `mw-uncited-pwg-cited` (PWG names a source MW reduces to `L.` or drops).
   Data: [LOSS_ANALYSIS.md](LOSS_ANALYSIS.md) §4.
3. Root modeling diagram.
4. Compound archival/semantic split.
5. Loss-report distribution: the TEI-never-lossy / OntoLex-never-clean asymmetry
   and the by-cause breakdown. Data: [LOSS_ANALYSIS.md](LOSS_ANALYSIS.md) §1–2,
   generated by `npm run analyze-loss`.

## Minimum Submission Dataset

- 50 generated hard cases.
- 15 deterministic profile-validated review-slice mappings.
- Full 50-case machine-reviewed TEI and OntoLex/FrAC outputs.
- External validation report when the TEI/SHACL toolchain is available.
- Human philological review status clearly separated from machine/profile validation.
- 5 fully discussed paper cases.
- Public archive of JSON, TEI, and OntoLex outputs.
