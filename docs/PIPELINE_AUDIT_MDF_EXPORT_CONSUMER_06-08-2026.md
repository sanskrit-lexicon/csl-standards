# Pipeline audit — MDF export → Lexique Pro consumer (Fable lane, H2022)

_Created: 06-08-2026 · Last updated: 06-08-2026_

**Executor:** Fable 5 (`claude-fable-5`), Claude Code. Skill: [/pipeline-audit](https://github.com/gasyoun/claude-config/blob/main/commands/pipeline-audit.md).
**Handoff:** [H2022](https://github.com/gasyoun/Uprava/blob/main/handoffs/H2022-Fable_Uprava_pipeline-hygiene-audit-non-pwg_31.07.26.md) — non-PWG pipeline hygiene audits, export-consumer target.
**Dual-run:** independent second lane against the Grok 4.5 (`grok-4.5`) audit of 01-08-2026 and its shipped fix [csl-standards #119](https://github.com/sanskrit-lexicon/csl-standards/pull/119). This lane audited the **post-fix** code and did not read the Grok memo before forming its own findings.

Audit-only: nothing was patched by this pass.

---

## 1. The real call graph

```
data/pilot/neutral-model.json ──┐
data/pilot/hard-cases.json  ────┤
data/pilot/review-cases.json ───┤
                                ▼
        scripts/export-mdf.mjs (npm run export-mdf)
          ├─ loadSourceIndexes()  :100-110  reads hard-cases.sources.mw
          │     = "../csl-orig/v02/mw/mw.txt"   ← SIBLING REPO, outside this repo
          ├─ rm -rf data/pilot/mdf              :243   (destructive, then recreate)
          └─ per model → mdfRecord()  :122-235 → data/pilot/mdf/<id>.mdf  :255
                                ▼
        scripts/validate-mdf-profile.mjs (npm run validate-mdf-profile)   ← CI GATE
          reads data/schema/mdf-export-profile.json + the .mdf files on disk
          → data/pilot/mdf-review.json, src/data/pilot/mdf-review.json    :275-276
          exit 1 on errors; warnings never fail                           :278-284
                                ▼
        scripts/smoke-mdf-consumer-display.mjs (npm run smoke-mdf-consumer-display)
          machine proxy for Lexique Pro's one-field-per-label rule        :4-9
          NOT a CI step — see D1
                                ▼
        Lexique Pro (the real consumer)  — never actually executed anywhere
```

Invocation: `npm run build-pilot` ([package.json:25](https://github.com/sanskrit-lexicon/csl-standards/blob/main/package.json)) chains export → validate → smoke in the right order. CI ([.github/workflows/ci.yml](https://github.com/sanskrit-lexicon/csl-standards/blob/main/.github/workflows/ci.yml)) runs `npm test`, `validate-pilot`, `validate-tei-profile`, `validate-ontolex-profile`, `validate-mdf-profile`, `validate-tei-lex0`, `npm run build` — and **no export step and no smoke step**.

---

## 2. Doc-vs-code divergences

| # | Claim | Reality | Consequence |
|---|---|---|---|
| **D1** | `CLAUDE.md` lists `smoke-mdf-consumer-display` as the consumer gate that runs "after schema validate", and the script's own header calls schema-green "never enough" | The smoke is in `build-pilot` only. `ci.yml` runs `validate-mdf-profile` (line 42) and stops there | The gate built specifically to catch validator-green ≠ consumer-green **is itself outside the automated gate**. A PR can reintroduce stacked `\bb` and CI stays green. The failure class was fixed in the emitter and left unguarded in CI. |
| **D2** | The pipeline is described as source → export → validate | CI never runs `export-mdf`; it validates the **committed** `data/pilot/mdf/*.mdf` (250 files, all tracked) | CI validates yesterday's artifacts. Edit the exporter, forget to re-run it, and every gate passes against output the new code did not produce. Compounded by D3, CI *cannot* regenerate even if it wanted to. |
| **D3** | `hard-cases.json` `sources.mw` = `../csl-orig/v02/mw/mw.txt` | A sibling-repo path resolved against `process.cwd()` ([export-mdf.mjs:103](https://github.com/sanskrit-lexicon/csl-standards/blob/main/scripts/export-mdf.mjs)). CI checks out only this repo | `export-mdf` is not runnable in CI at all — it would throw on the missing sibling. The export stage is a local-only, machine-dependent step feeding a CI-validated artifact. |
| **D4** | `CLAUDE.md`: "Loss/coverage/scale numbers throughout `docs/` are measured … regenerate the relevant `npm run` script rather than hand-editing" | Same regeneration is local-only for the MDF lane (D3) and unverified by CI (D2) | The measured-numbers discipline depends entirely on the author remembering; no gate distinguishes a regenerated number from a stale one. |

---

## 3. Silent-failure census

| # | file:line | class | What is lost when it fires | Observed / hypothetical |
|---|---|---|---|---|
| 1 | `.github/workflows/ci.yml:42` (and absence after it) | gate not wired | Consumer-display regressions (multi-`\bb`, multi-`\lf Compound`, unjoined `\le`) merge green. The H722/H1499/H2087 fix survives only by convention | observed |
| 2 | CI validates committed `data/pilot/mdf/` without regenerating | generated-vs-canonical drift | Exporter changes validated against stale artifacts; a broken emitter passes every gate until someone runs `build-pilot` locally | observed |
| 3 | [export-mdf.mjs:101-102](https://github.com/sanskrit-lexicon/csl-standards/blob/main/scripts/export-mdf.mjs) `if (!source) return new Map()` | silent empty | With no `sources.mw`, the index is empty and every record falls back to `model.records?.mw?.raw` ([:112-115](https://github.com/sanskrit-lexicon/csl-standards/blob/main/scripts/export-mdf.mjs)). `\hm`, `\lc`, `\cf`, `\et`, `\es` and the `<lex>`-derived `\ps` are all parsed out of `rawMw` — they silently thin or vanish, and the profile validator does not fail: the homonym check is `caseWarn` only ([validate-mdf-profile.mjs:222](https://github.com/sanskrit-lexicon/csl-standards/blob/main/scripts/validate-mdf-profile.mjs)) and `\lc`/`\cf`/`\et`/`\es` have no presence assertion at all | hypothetical, high blast radius |
| 4 | [validate-mdf-profile.mjs:222](https://github.com/sanskrit-lexicon/csl-standards/blob/main/scripts/validate-mdf-profile.mjs) + `:278-284` | warnings never fail | A systematic `\hm` loss across all 250 records produces 250 warnings and exit 0 | observed |
| 5 | [export-mdf.mjs:243](https://github.com/sanskrit-lexicon/csl-standards/blob/main/scripts/export-mdf.mjs) `fs.rm(outputDir, {recursive:true, force:true})` | destructive-then-rebuild, no atomicity | A crash mid-loop leaves a partial export. Caught downstream (`validate-mdf-profile` reports missing files; the smoke asserts exactly 250) — but only if those stages run, which in CI they do not for a fresh export | hypothetical, mitigated |
| 6 | [export-mdf.mjs:37-39](https://github.com/sanskrit-lexicon/csl-standards/blob/main/scripts/export-mdf.mjs) `oneLine()` | deliberate lossy flattening | Internal line structure collapses to one physical line. Correct for MDF (line-oriented markers) and documented — recorded here for completeness, not as a defect | observed, intended |
| 7 | [smoke-mdf-consumer-display.mjs:4-9](https://github.com/sanskrit-lexicon/csl-standards/blob/main/scripts/smoke-mdf-consumer-display.mjs) | proxy, not the consumer | The smoke asserts *emit shape* under Lexique's known display rule; Lexique Pro is never launched. A display failure mode nobody has characterised yet cannot be caught | observed, honestly declared in the header |
| 8 | [smoke-mdf-consumer-display.mjs:39](https://github.com/sanskrit-lexicon/csl-standards/blob/main/scripts/smoke-mdf-consumer-display.mjs) `files.length === 250` | hardcoded pilot size | The smoke breaks (not silently — it fails loudly) the moment the pilot grows. Correct direction, but it means the consumer gate is pinned to one pilot size and will be *disabled by failure* rather than scaled | observed |
| 9 | [smoke-mdf-consumer-display.mjs:114](https://github.com/sanskrit-lexicon/csl-standards/blob/main/scripts/smoke-mdf-consumer-display.mjs) `esCount >= 1` | asserts a display-dead field keeps being emitted | Deliberate and documented (`\es` is correct MDF, invisible in Lexique; "do not fix by dropping the field"). Recorded so a future session does not read it as a bug | observed, intended |

**Live run at audit time.** `node scripts/smoke-mdf-consumer-display.mjs` → PASSED. Census: `multiBb=0 multiLf=0 joinedBb=44 joinedLe=65 hedgeToken=116`, residual `\es` on 14/250. The H2087 fix is genuinely in effect on the committed artifacts — the exposure is that nothing keeps it that way.

---

## 4. Capability inventory (honest, today)

**Can do:** emit one MDF record per neutral-model case in App. B field order from a documented marker profile; type compound decomposition as `\lf Compound` + joined `\le` instead of flattening to `\cf`; keep every named bibliography reference visible under Lexique's one-field-per-label rule by joining into a single `\bb` with the `L.` hedge leading; mark every lossy adequacy call with an explicit `\nt model-loss:` note; validate marker inventory, field order, sense/`\sn` structure, meta provenance and the consumer-display invariants against a JSON schema; run a machine proxy for the Lexique display contract with named pilot fixtures (`Ap`, `DIratA`, `dih`).

**Cannot do:** run the export in CI (needs a csl-orig sibling clone); prove the committed `.mdf` artifacts match what the current exporter would produce; fail a build on consumer-display regression (the smoke is not a CI step); detect a silently thinned export caused by a missing source index; fail on warnings; render anything in Lexique Pro — the real consumer is still never executed, by any stage, on any machine.

---

## 5. Ranked gap specs

1. **Wire the consumer smoke into CI.** `.github/workflows/ci.yml` — add `npm run smoke-mdf-consumer-display` immediately after the `validate-mdf-profile` step (line 42). *Verify:* revert the H2087 join locally (emit stacked `\bb`), push a branch ⇒ CI red on the smoke step, not green.
2. **Close the stale-artifact gap.** Either (a) commit a checked-in fixture slice of the MW source so `export-mdf` can run in CI and the job re-exports then diffs against the committed `.mdf` (`git diff --exit-code data/pilot/mdf`), or (b) add a provenance stamp — exporter file hash written into the `\nt meta:` line — and have `validate-mdf-profile` fail when the stamp does not match the current `export-mdf.mjs` hash. (b) is cheaper and does not require vendoring dictionary text. *Verify:* edit `export-mdf.mjs` without re-exporting ⇒ validation fails naming the stale artifact.
3. **Fail loud on a missing source index.** [export-mdf.mjs:101-102](https://github.com/sanskrit-lexicon/csl-standards/blob/main/scripts/export-mdf.mjs) — throw instead of returning an empty Map, and assert the built index is non-empty before the record loop. *Verify:* remove `sources.mw` from a copy of `hard-cases.json` ⇒ non-zero exit naming the missing source, instead of 250 quietly thinned records.
4. **Promote the structural warnings that indicate data loss.** [validate-mdf-profile.mjs:222](https://github.com/sanskrit-lexicon/csl-standards/blob/main/scripts/validate-mdf-profile.mjs) — keep `\hm` as a warning per record, but add an aggregate error when the *rate* of records-with-`<h>`-but-no-`\hm` exceeds a small threshold, which is the signature of spec 3's failure rather than of one odd record. *Verify:* run against an export built with an empty index ⇒ exit 1.
5. **Scale the smoke off the pilot size.** [smoke-mdf-consumer-display.mjs:39](https://github.com/sanskrit-lexicon/csl-standards/blob/main/scripts/smoke-mdf-consumer-display.mjs) — compare against `neutral-model.json`'s length rather than the literal `250`. *Verify:* grow the pilot ⇒ the smoke still runs instead of failing on the count.
6. **Characterise the real consumer once.** The `\es` residual is documented from Lexique behaviour, but no artifact records an actual Lexique session. One dated screenshot-plus-notes appendix in [docs/MDF_EXPORT_MAPPING.md](https://github.com/sanskrit-lexicon/csl-standards/blob/main/docs/MDF_EXPORT_MAPPING.md), naming the Lexique version, would convert three inherited claims into evidence. *Verify:* the appendix exists and names version + date; `/export-consumer-smoke` cites it.

---

## 6. Dual-run adjudication vs the Grok 4.5 lane

Comparison against [PIPELINE_AUDIT_MDF_EXPORT_01-08-2026.md](https://github.com/gasyoun/Uprava/blob/main/docs/PIPELINE_AUDIT_MDF_EXPORT_01-08-2026.md) (Grok 4.5, `grok-4.5`) and its shipped fix [#119](https://github.com/sanskrit-lexicon/csl-standards/pull/119), read only after this lane's findings were formed.

| Grok finding | Class | Adjudication |
|---|---|---|
| Stacked `\bb` — validator green, Lexique shows only one | **identical, and genuinely fixed** | Verified live: `multiBb=0` across 250 records; the `dih` fixture shows `L.; Dhātup. …` joined. Emitter [:196-213](https://github.com/sanskrit-lexicon/csl-standards/blob/main/scripts/export-mdf.mjs) and validator [:196](https://github.com/sanskrit-lexicon/csl-standards/blob/main/scripts/validate-mdf-profile.mjs) both enforce ≤1. No further work. |
| Multi `\lf`/`\le` collapses to last component | **identical, and genuinely fixed** | Verified: `multiLf=0`, `joinedLe=65`, `DIratA` = `DIra + tA`. No further work. |
| `\es` never shown by Lexique | **identical, deliberately unfixed** | Confirmed as a documented residual with an assertion keeping it emitted ([smoke:114](https://github.com/sanskrit-lexicon/csl-standards/blob/main/scripts/smoke-mdf-consumer-display.mjs)). Correct call; this lane adds only that the underlying Lexique behaviour has no recorded evidence artifact (spec 6). |
| — | **net-new (this lane)** | D1 — the consumer smoke that closes this whole failure class is not a CI step. The fix is real and completely unguarded. |
| — | **net-new (this lane)** | D2/D3 — CI validates committed artifacts and cannot regenerate them (sibling-repo source path), so exporter-vs-artifact drift is undetectable. |
| — | **net-new (this lane)** | #3 — missing source index degrades the export silently; the validator's only relevant check is a warning. |

**Kept from both:** all three Grok findings stand; two are confirmed fixed by live execution rather than by reading the PR, and the third is confirmed as an intentional residual. **Kept from this lane:** the three net-new items, of which spec 1 is a one-line change with the highest ratio of protection to effort in this audit. Nothing was discarded.

---

## 7. Not audited

- The other four export profiles (TEI, TEI-Lex0, OntoLex, LIFT) and their validators — only the MDF lane was in scope. Findings D2/D3 (CI validates committed artifacts; export needs a csl-orig sibling) are structural and **likely apply to them too**, but that was not verified.
- `scripts/build-neutral-model.mjs`, `sample-hard-cases.mjs`, `select-review-cases.mjs`, `build-loss-reports.mjs` — upstream stages treated as trusted inputs; their own silent-failure surface was not censused. `build-loss-reports.mjs` is flagged as this repo's worst hotspot (3.9/10) and deserves its own pass.
- `data/schema/mdf-export-profile.json` was read only through the validator's assertions about it, not directly.
- `test/` was not read; no claim here rests on a test's existence.
- Lexique Pro was not installed or run — as with the Grok lane, every claim about Lexique's display behaviour is inherited from H722/H1499 and not re-measured (spec 6 exists to close exactly this).
- Per the dual-run independence constraint, no `PIPELINE_AUDIT_*.md` and no Uprava handoff H2083–H2090 was read until after §1–§5 were written.

---

_Dr. Mārcis Gasūns_
