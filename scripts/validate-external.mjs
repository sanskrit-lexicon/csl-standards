// Run the external RELAX NG / SHACL validation using the portable toolchain that
// `npm run setup-external-tools` builds under tools/ (gitignored). It puts the
// local jing + Java on PATH and points the harness at the precompiled RNGs, then
// delegates to validate-external-profiles.mjs. Pass --strict to fail on skips.
//
// Usage: npm run validate-external [-- --strict]

import { existsSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const T = path.join(root, "tools");
const teiRng = path.join(T, "rng", "csl-tei-archival-profile-v0.1.rng");
const lex0Rng = path.join(T, "rng", "csl-tei-lex0-profile-v0.1.rng");
const sep = process.platform === "win32" ? ";" : ":";

if (!existsSync(teiRng) || !existsSync(lex0Rng) || !existsSync(path.join(T, "jing", "jing.jar"))) {
  console.error("Portable toolchain not found. Run `npm run setup-external-tools` first (or see docs/EXTERNAL_VALIDATION.md for the WSL/Linux route).");
  process.exit(1);
}

const env = {
  ...process.env,
  PATH: [path.join(T, "bin"), path.join(T, "jdk", "bin"), process.env.PATH].join(sep),
  CSL_STANDARDS_TEI_RNG: path.relative(root, teiRng),
  CSL_STANDARDS_LEX0_RNG: path.relative(root, lex0Rng)
};

const args = ["scripts/validate-external-profiles.mjs", ...process.argv.slice(2)];
const r = spawnSync(process.execPath, args, { cwd: root, env, stdio: "inherit" });
process.exit(r.status ?? 1);
