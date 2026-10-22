# Provenance — TEILex0-v0.9.5.rng

- **What:** the official compiled TEI Lex-0 RelaxNG schema, **version v0.9.5**,
  vendored so CI validates against a pinned schema version (no network at
  validate time). This file carries a vendored-provenance comment block near the
  top (added by this repo); all upstream bytes are verbatim.
- **Version:** v0.9.5 — repo `bcdh/tei-lex-0`, tag `v0.9.5`
  (commit `8c2c50bd80`, released **2026-02-08**; `CITATION.cff` at the tag:
  `version: 0.9.5`, `date-released: 2026-02-08`).
  https://github.com/bcdh/tei-lex-0/tree/v0.9.5
- **Compiled-schema source:** https://lex-0.org/schema/lex-0.rng — the official
  site build, whose embedded header reads "Schema generated from ODD source
  **2026-02-08T16:26:17Z**, TEI Edition: P5 Version 4.10.2". The `odd/lex-0.odd`
  at tag `v0.9.5` is byte-identical to the repo `main` HEAD (diffed
  2026-10-11: zero lines), so this site build is the v0.9.5 schema. (The older
  home `DARIAH-ERIC/lexicalresources` has no v0.9.5 tag — latest there is
  v0.9.4; the project now lives at `bcdh/tei-lex-0` + lex-0.org.)
- **Upstream SHA-256** (verbatim lex-0.org fetch, before the comment block was
  added): `9cad484ab6f843ec4ba2aa4ca96ec2598b23b42e3a2b2ae8e3265ae0fb0d7201`
- **Vendored SHA-256** (this file, provenance comment included):
  `af0554bc915da24a9dd71815088b87e11c1feea49b0bc44fd2f36acb53e67a2a`
- **License:** BSD 3-Clause (© 2025 Boris Lehečka; see the repo's `LICENSE`).
- **Validator:** `scripts/validate-tei-lex0-schema.mjs` (xmllint `--relaxng`).
  The RNG embeds ISO Schematron `<pattern>` blocks; `xmllint`/libxml2 run the
  RelaxNG grammar only — Schematron-level constraints are a documented
  limitation, not a silent pass (`schematronChecked: false` in the report).
- **Re-pin history:** supersedes `TEILex0-v0.9.4.rng` (vendored by H5320,
  24-09-2026, from `DARIAH-ERIC/lexicalresources` tag v0.9.4). Re-pinned to
  v0.9.5 by H6196, 11-10-2026.
