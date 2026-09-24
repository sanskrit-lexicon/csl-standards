# Provenance — TEILex0-v0.9.4.rng

- **What:** the official compiled TEI Lex-0 RelaxNG schema, vendored verbatim so
  CI validates against a pinned schema version (no network at validate time).
- **Source:** DARIAH-ERIC/lexicalresources, tag `v0.9.4`
  (`Schemas/TEILex0/out/TEILex0.rng`)
  — https://github.com/DARIAH-ERIC/lexicalresources/blob/v0.9.4/Schemas/TEILex0/out/TEILex0.rng
- **SHA-256:** `f5270a718c377d18d3137d4fbbd883e3d39a01dca890fa62f5f580d43d1aa30a`
- **License:** BSD 2-Clause (© 2017 DARIAH-ERIC).
- **Validator:** `scripts/validate-tei-lex0-schema.mjs` (xmllint `--relaxng`).
  The RNG embeds ISO Schematron `<pattern>` blocks; `xmllint`/libxml2 run the
  RelaxNG grammar only — Schematron-level constraints are a documented
  limitation, not a silent pass.
- **Vendored:** H5320, 24-09-2026.
