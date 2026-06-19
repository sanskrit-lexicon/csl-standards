# External RELAX NG / Schematron / SHACL Validation

`npm run validate-pilot` / `validate-tei-profile` / `validate-tei-lex0` are
*structural* checks (substring/shape assertions). They are fast and run in CI, but
they do **not** validate against the actual TEI RELAX NG schema, the Lex-0 ODD's
Schematron, or the SHACL profile with real engines — so they can pass while the XML
is not schema-valid. `validate-external-profiles` closes that gap by running the
real RNG, the Schematron via an SVRL engine, and SHACL (when each tool is
available). It records missing tools as `skipped` (only `--strict` fails on skips).

This doc gives two ways to get the tooling: a portable, no-admin toolchain (set up
by a script in this repo) and the apt route for Linux/WSL.

## What it checks

- Compiles `data/schema/tei-archival-profile.odd.xml` and
  `data/schema/tei-lex0-profile.odd.xml` to RELAX NG (TEI Stylesheets +
  `p5subset.xml`).
- Validates all 250 `data/pilot/tei/*.xml` and 256 `data/pilot/tei-lex0/*.lex0.xml`
  against those schemas with `jing` (or `xmllint`).
- Runs the Lex-0 ODD's Schematron over the 256 `*.lex0.xml` with a real **SVRL
  engine** (Saxon + the ISO Schematron skeleton): the ODD's `<sch:pattern>` blocks
  are extracted and compiled to an SVRL-emitting XSLT, and any `svrl:failed-assert`
  is a failure. This enforces the kośa sense-boundary customisation (§5) and the
  baseline-shape rules with the real engine, not only the in-pipeline validator.
- Validates `data/pilot/rdf/*.ttl` against the SHACL profile with `pyshacl` (if
  installed).

> The first real RNG run found bugs the structural validators missed (a duplicate
> `xml:id`, a `sourceDesc` content-model violation, a misplaced `@target`), now
> fixed. Re-run it after any change to the exporters or the ODDs.

## Option A — portable toolchain (Windows, no admin)

```
npm run setup-external-tools      # downloads JRE + Saxon + jing + TEI Stylesheets + p5subset into tools/ (gitignored), compiles both RNGs
npm run validate-external         # runs the harness against the local toolchain; add  -- --strict  to fail on skips
```
`tools/` is git-ignored and self-contained; delete it to reset. The setup is
idempotent (re-run to repair) and verifies every downloaded artifact with a pinned
SHA-256 before using it. For the RDF/SHACL layer, `pip install --user pyshacl` —
the harness finds it on PATH **or** via `python -m pyshacl`, so the `pip --user`
script location does not need to be on PATH. Without pyshacl the SHACL checks are
recorded as `skipped`.

What `setup-external-tools` assembles under `tools/`:

| Tool | Version | Role |
|---|---|---|
| Temurin JRE | 21 | runs Saxon + jing |
| Saxon-HE | 10.9 | runs the ODD→RNG XSLTs; compiles + runs the Schematron SVRL |
| TEI Stylesheets | 7.60.0 | `odd2odd` + `odd2relax` |
| p5subset.xml | TEI P5 4.11.0 | TEI source for module expansion |
| jing | 20091111 | RELAX NG validator |
| ISO Schematron skeleton | Schematron/schematron `77dcd36c` | compiles the ODD's Schematron to an SVRL XSLT |

The setup extracts the Lex-0 ODD's `<sch:pattern>` into a standalone schema and
compiles it to `tools/schematron/csl-tei-lex0.svrl.xsl` (the 3-stage ISO skeleton
pipeline); the harness then applies it with Saxon.

## Option B — Linux / WSL (apt)

Simpler where apt is available (these ship `teitorelaxng`, so the harness compiles
the ODDs itself — no `setup-external-tools` needed):

```bash
sudo apt-get update
sudo apt-get install -y default-jre-headless tei-xsl jing libxml2-utils
# optional, for the RDF layer:  pip install pyshacl
node scripts/validate-external-profiles.mjs
```

## Precompiled-schema escape hatch

If you have a `.rng` from elsewhere, skip the compiler entirely and point the
harness at it (then only a validator is needed):

```bash
CSL_STANDARDS_TEI_RNG=path/to/archival.rng \
CSL_STANDARDS_LEX0_RNG=path/to/lex0.rng \
  node scripts/validate-external-profiles.mjs
```

Likewise, point the Schematron layer at a precompiled SVRL transform and a Saxon
jar (else it is `skipped`):

```bash
CSL_STANDARDS_LEX0_SVRL=path/to/csl-tei-lex0.svrl.xsl \
CSL_STANDARDS_SAXON_JAR=path/to/saxon-he.jar \
  node scripts/validate-external-profiles.mjs
```

## Output

Results land in `data/pilot/external-validation-review.json` (and its `src/`
mirror). Check the totals:

```bash
node -e "console.log(require('./data/pilot/external-validation-review.json').totals)"
```
