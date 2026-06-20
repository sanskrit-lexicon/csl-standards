# Salt API — CSL ↔ C-SALT Loss Report

Version: 0.1.0
Date: 2026-06-20
Status: updated first pass, combining the live MW contract (verified 2026-06-11), Phase 1 implementation findings from 2026-06-20, and the 2026-06-20 host-deploy checkpoint.

Companion to [`SALT_API_PROFILE.md`](SALT_API_PROFILE.md). Following the repository's working
principle, **a lossy mapping is a finding, not a bug.** This report catalogues where the
Cologne original (CSL) and the CCeH derivative (C-SALT / Kosh) diverge, so the divergences
are explicit and feed the interoperability paper.

---

## 1. Method

The C-SALT MW REST and GraphQL contracts were read directly from the running service
(`/dicts/mw/restful/spec` and a GraphQL introspection) and from real `entries` responses
for `agni`, `indra`, `ka`, `aMSa`. CSL fields are from `COLOGNE/api/getword.md` and
`csl-apidev` (`getword`, `restfulparm.md`).

## Deployment checkpoint (2026-06-20)

After the `csl-apidev` Phase 1 PR stack was applied (#59 into `salt-api-phase1`,
then #46 to `master`), external checks against
`https://sanskrit-lexicon.uni-koeln.de/dicts/mw/...` did not yet reach the Phase 1
controllers. The `entries` route returned the Cologne TYPO3/Apache HTTP 404
"Document not found" page. The `ids` and `graphql` checks timed out or failed TLS
from this host, and `data/pilot/parity_mw.py` timed out before producing a parity
table.

This is recorded as a host deployment/rewrite blocker, not a CSL/C-SALT semantic
divergence. Do not add parity findings for `-L{lnum}`, `prefix` `size`, homonym
ordering, or Phase 1 HTTP 400 behavior until the public routes answer the positive
and negative smoke checks from the handoff document.

## 2. The two entry shapes

| C-SALT/Kosh flat entry | CSL `getword` result |
|---|---|
| `id` (`lemma-agni`) | `recordId` / `lnum` (`144239`) |
| `headword_slp1` | `key` (already SLP1) |
| `sense[]` (parsed from TEI `<sense>`) | — (rendered in `html`/`text`, not split) |
| `re_headwords_slp1[]` | run-on / sub-headwords |
| `created` (index timestamp) | — |
| `xml` (**TEI-P5**) | `xml` (**CSL display-XML**) |
| — | `pageNumber`, `columnId` |
| — | `imgUrl` (scanned page) |
| — | `html`, `text` (rendered) |
| — | `references[]` |
| — | accent, multiple transliterations |

## 3. Findings

### F1. CSL is a superset at the flat level
Everything Kosh exposes flatly, CSL has or can derive. The reverse is false: scan
page/column, the scanned-image URL, rendered HTML/text, the flat `references[]` list, Vedic
accent, and multi-script transliteration have **no slot in the Kosh model**. The profile
preserves them in the additive `csl` object so the top level stays drop-in compatible.

### F2. The page, accent, and L-number are *not* lost — they live inside the TEI
C-SALT's flat fields drop the scan apparatus, but its `xml` (TEI) retains it. The live
`agni` TEI carries `<ref type="facs">5,1</ref>` (page 5, column 1), `key2 = agn/i` (the
accented form), `hc1 = 1` (homonym number), and `<idno ana="L" xml:id="monier_890">890</idno>`
(the L-number). So the loss is in the *flat projection*, not in the archival TEI.

### F3. C-SALT's TEI is generated from CSL's own conventions
The TEI markers (`ana="H1"`, `key1`/`key2`, `hc1`/`hc3`, `as0`/`as1`, `L` / `monier_<n>`)
are Cologne digitization conventions. C-SALT's TEI is therefore **downstream of the same
source CSL serves**. Consequence: CSL's own (clean-room) CDSL→TEI conversion (roadmap
Phase 5) can be validated field-by-field against C-SALT's TEI as a **parity oracle**, and
the public `id` and `lnum` line up mechanically (`lemma-agni` ↔ headword; `monier_890` ↔
`lnum 890`).

### F4. The `id` scheme is reproducible, with one Phase 1 uniqueness fallback
C-SALT id = `lemma-{headword_slp1}`, or `lemma-{headword_slp1}-{n}` for homonyms (verified:
`ka` → `lemma-ka-1`…`-4`; `agni`, `aMSa` carry no suffix). CSL reconstructs this from `key`
+ the homonym counter where the source has one. Phase 1 additionally mints
`lemma-{headword_slp1}-L{lnum}` for un-numbered CSL sub-records so the `ids` face can address
one record without collisions. **Open verification (Phase 3):** confirm homonym ordering and
settle whether the `-L{lnum}` fallback is exposed, mapped, or hidden for strict C-SALT parity.
### F5. `sense[]` quality gap
Kosh's `sense[]` is parsed from the TEI `<sense>` elements. Before Phase 5, CSL can only
approximate sense segmentation from `getword` rendering; TEI-grade `sense[]` arrives with
the TEI conversion. The gap between rough and TEI-grade senses is itself a finding for the
paper's "what OntoLex/TEI capture" section.

### F6. Coverage: 7 vs ~40
C-SALT serves 7 dictionaries; CSL serves ~40. For the 7 shared ids the contract is
identical; beyond them, CSL is the only source. This is the original's primary advantage
and the main behavioural divergence a client will observe.

### F7. `query_type` backend dependence
All seven modes (`term, fuzzy, match, match_phrase, prefix, wildcard, regexp`) are in the
target contract, but `regexp` and body-text modes (`match`/`match_phrase` over `field=sense`/`xml`)
require an index CSL does not build for the MW pilot. Until Phase 4 (Elasticsearch or SQLite
FTS5), those MUST return HTTP 400 rather than silently empty results — silence would read as
"no matches," a false negative.

### F8. Phase 1 parity ledger items
The deploy parity pass must record three implementation-stage divergences explicitly:
`-L{lnum}` id fallback for un-numbered sub-records; `prefix` `size` semantics (records vs.
distinct headwords); and explicit HTTP 400 responses for valid C-SALT enum values whose
field/index is not implemented in Phase 1.
## 4. Model-adequacy summary

| Aspect | Status | Note |
|---|---|---|
| Flat entry fields | clean (CSL→Salt) | superset; extras namespaced under `csl` |
| `id` / `lnum` | clean | reproducible; homonym ordering to confirm |
| TEI `xml` | partial → clean at Phase 5 | `null` until conversion ships; oracle available |
| `sense[]` | lossy → clean at Phase 5 | rough before TEI |
| Scan / accent / transliteration | clean (CSL-only) | absent in Kosh; preserved in `csl` |
| Coverage | n/a | CSL strictly larger |

These rows mirror the model-adequacy scale in `INTEROPERABILITY_MODEL.md` and feed the
paper's standards-critique section.
