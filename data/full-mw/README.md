# Full Monier-Williams TEI Lex-0 + OntoLex export (H7105)

Generated from `csl-orig/v02/mw/mw.txt` (286,560 `<L>` records,
sha256 `6457c145c517acf311ffe7bfd8efec630347a1de8dc546c90e3c4b49a7bd6683`)
by `scripts/build-full-mw.mjs`.

| Artifact | Location |
|---|---|
| Dataset manifest (chunk hashes, coverage, runtime, memory) | `manifest.json` |
| Loss distribution | `loss-report.json` |
| Run summary | `run-report.json` |
| Validation verdict | `validation-report.json` |

## Result

- **Coverage:** 286,560 / 286,560 MW records (100%).
- **TEI Lex-0:** 287 chunk documents, all valid against the pinned official
  TEI Lex-0 v0.9.4 RNG (`xmllint --relaxng`, or lxml RelaxNG on boxes without
  `libxml2-utils`).
- **OntoLex:** 286,560 JSON-LD documents across 287 chunks, validated against
  the `ontolex-frac-profile-v0.1` contract in full-MW mode.
- **Runtime / memory:** 217.6 s, max RSS 243,752,960 bytes.
- **Losses:** 33,736 MW entries have no extractable gloss (exported as a
  `sense-status` stub, never invented content); 59,814 entries carry no cited
  source (zero FrAC attestations — an upstream absence).

## Scope and deliberate choices

- MW only: no PWG/PWK join, no optional dictionaries, no RDF publication.
- OntoLex source records carry `csl:rawSha256` + `csl:rawLength` instead of
  duplicating the 48 MB raw corpus into every JSON-LD document; the raw corpus
  is pinned by the manifest's source hash.
- Generated chunk files are not committed (they total ~1.2 GB); rerun:

```bash
node scripts/build-full-mw.mjs --csl-orig ../csl-orig --out /tmp/csl-full-mw
node scripts/validate-full-mw.mjs --build /tmp/csl-full-mw
```

The build is chunked and resumable (`.done.json` per chunk), deterministic in
source order, memory-bounded by `--chunk-size` (default 500), and stops on the
first invalid TEI chunk.
