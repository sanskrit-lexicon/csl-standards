import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {spawnSync} from "node:child_process";
import { generatedAt } from "./lib/provenance.mjs";

const root = process.cwd();
const strict = process.argv.includes("--strict");
const checks = [];
const tempDirs = [];

function rel(file) {
  return path.relative(root, file).replace(/\\/g, "/");
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function writeJson(relativePath, value) {
  const file = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(file), {recursive: true});
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function safeCaseId(id) {
  return id.replace(/:/g, "-");
}

function firstLine(text = "") {
  return String(text).split(/\r?\n/).find(Boolean) || "";
}

function commandPath(command) {
  const probe = process.platform === "win32" ? "where" : "which";
  const result = spawnSync(probe, [command], {cwd: root, encoding: "utf8"});
  return result.status === 0 ? firstLine(result.stdout).trim() : "";
}

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    shell: process.platform === "win32",
    maxBuffer: 1024 * 1024 * 16,
    ...options
  });
}

function addCheck(check) {
  checks.push({
    ...check,
    status: check.status || "fail"
  });
}

function skipped(type, message, extra = {}) {
  addCheck({type, status: "skipped", message, ...extra});
}

function failed(type, message, extra = {}) {
  addCheck({type, status: "fail", message, ...extra});
}

function passed(type, message, extra = {}) {
  addCheck({type, status: "pass", message, ...extra});
}

function tail(text = "") {
  const lines = String(text).trim().split(/\r?\n/).filter(Boolean);
  return lines.slice(-8).join("\n");
}

function makeTempDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "csl-standards-external-"));
  tempDirs.push(dir);
  return dir;
}

function tryTeiOddCompile(compiler, oddPath, rngPath) {
  const candidates = [
    {args: [oddPath, rngPath], stdoutToFile: false},
    {args: ["--odd", oddPath, rngPath], stdoutToFile: false},
    {args: [oddPath], stdoutToFile: true}
  ];

  const attempts = [];
  for (const candidate of candidates) {
    const result = run(compiler, candidate.args);
    attempts.push({
      command: `${compiler} ${candidate.args.map(arg => arg.includes(" ") ? `"${arg}"` : arg).join(" ")}`,
      status: result.status,
      stdout: tail(result.stdout),
      stderr: tail(result.stderr)
    });

    if (result.status === 0) {
      if (candidate.stdoutToFile && result.stdout?.trim()) {
        fs.writeFileSync(rngPath, result.stdout, "utf8");
      }
      if (fs.existsSync(rngPath) && fs.statSync(rngPath).size > 0) {
        return {ok: true, attempts};
      }
    }
  }

  return {ok: false, attempts};
}

// Resolve a RELAX NG schema for a profile: prefer a precompiled schema from an
// env var, else compile the project ODD with teitorelaxng, else skip. `type`
// prefixes the recorded check names (e.g. "tei", "lex0").
function resolveRng({type, oddRel, envVar, rngName}) {
  const oddPath = path.join(root, oddRel);
  const envRng = process.env[envVar];
  if (envRng) {
    const resolved = path.resolve(root, envRng);
    if (!fs.existsSync(resolved)) {
      failed(`${type}-rng`, `${envVar} points to a missing file: ${resolved}`);
      return "";
    }
    passed(`${type}-rng`, `Using precompiled RELAX NG schema from ${envVar}.`, {
      schema: rel(resolved)
    });
    return resolved;
  }

  const compiler = commandPath("teitorelaxng");
  if (!compiler) {
    skipped(
      `${type}-odd-compile`,
      `TEI Stylesheets command teitorelaxng is not available; install TEI Stylesheets or set ${envVar} to a precompiled RELAX NG schema.`
    );
    return "";
  }

  const outDir = makeTempDir();
  const rngPath = path.join(outDir, rngName);
  const result = tryTeiOddCompile(compiler, oddPath, rngPath);
  if (!result.ok) {
    failed(`${type}-odd-compile`, `${oddRel} ODD to RELAX NG compilation failed.`, {
      attempts: result.attempts
    });
    return "";
  }

  passed(`${type}-odd-compile`, `${oddRel} compiled to RELAX NG with teitorelaxng.`, {
    compiler,
    source: rel(oddPath)
  });
  return rngPath;
}

function rngValidator() {
  const jing = commandPath("jing");
  if (jing) return {tool: "jing", command: jing};

  const xmllint = commandPath("xmllint");
  if (xmllint) return {tool: "xmllint", command: xmllint};

  skipped("rng-validator", "No external RELAX NG validator found; install jing or xmllint.");
  return null;
}

// Validate a set of XML files against an RNG schema. `type` prefixes the check
// names; `files` is a list of {id, path}.
function runRngValidation({type, rngPath, validator, files}) {
  if (!rngPath || !validator) return;
  for (const {id, path: xmlPath} of files) {
    if (!fs.existsSync(xmlPath)) {
      failed(`${type}-xml`, `Missing ${type} XML file for ${id}.`, {id, file: rel(xmlPath)});
      continue;
    }
    const args = validator.tool === "jing"
      ? [rngPath, xmlPath]
      : ["--noout", "--relaxng", rngPath, xmlPath];
    const result = run(validator.command, args);
    if (result.status === 0) {
      passed(`${type}-xml`, `External ${type} XML validation passed for ${id}.`, {
        id, tool: validator.tool, file: rel(xmlPath)
      });
    } else {
      failed(`${type}-xml`, `External ${type} XML validation failed for ${id}.`, {
        id, tool: validator.tool, file: rel(xmlPath),
        stdout: tail(result.stdout), stderr: tail(result.stderr)
      });
    }
  }
}

function teiFiles(models) {
  return models.map(model => ({
    id: model.id,
    path: path.join(root, "data/pilot/tei", `${safeCaseId(model.id)}.xml`)
  }));
}

// Every generated Lex-0 entry (*.lex0.xml), excluding the hand-authored
// *.lex0.tei.xml exemplar.
function lex0Files() {
  const dir = path.join(root, "data/pilot/tei-lex0");
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(name => name.endsWith(".lex0.xml"))
    .sort()
    .map(name => ({id: name.replace(/\.lex0\.xml$/, ""), path: path.join(dir, name)}));
}

// Resolve a pySHACL runner: a `pyshacl` command on PATH, or `python -m pyshacl`
// (pip --user installs the script outside PATH, so the module fallback matters).
function shaclRunner() {
  const direct = commandPath("pyshacl");
  if (direct) return { cmd: direct, pre: [] };
  for (const py of ["python", "python3", "py"]) {
    if (commandPath(py) && run(py, ["-m", "pyshacl", "--version"]).status === 0) {
      return { cmd: py, pre: ["-m", "pyshacl"] };
    }
  }
  return null;
}

function runShaclValidation(models) {
  const runner = shaclRunner();
  const shapesPath = path.join(root, "data/schema/ontolex-frac-profile.shacl.ttl");
  if (!runner) {
    skipped("shacl-engine", "pySHACL is not available; install pyshacl (pip install pyshacl) to run an external SHACL engine.");
    return;
  }

  for (const model of models) {
    const ttlPath = path.join(root, "data/pilot/rdf", `${safeCaseId(model.id)}.ttl`);
    if (!fs.existsSync(ttlPath)) {
      failed("shacl", `Missing RDF/Turtle file for ${model.id}.`, {id: model.id, file: rel(ttlPath)});
      continue;
    }

    const result = run(runner.cmd, [...runner.pre, "-s", shapesPath, "-f", "human", ttlPath]);
    if (result.status === 0) {
      passed("shacl", `External SHACL validation passed for ${model.id}.`, {
        id: model.id,
        tool: "pyshacl",
        file: rel(ttlPath)
      });
    } else {
      failed("shacl", `External SHACL validation failed for ${model.id}.`, {
        id: model.id,
        tool: "pyshacl",
        file: rel(ttlPath),
        stdout: tail(result.stdout),
        stderr: tail(result.stderr)
      });
    }
  }
}

const models = readJson("data/pilot/neutral-model.json");
const validator = rngValidator();

const teiRng = resolveRng({
  type: "tei",
  oddRel: "data/schema/tei-archival-profile.odd.xml",
  envVar: "CSL_STANDARDS_TEI_RNG",
  rngName: "csl-tei-archival-profile.rng"
});
runRngValidation({type: "tei", rngPath: teiRng, validator, files: teiFiles(models)});

const lex0Rng = resolveRng({
  type: "lex0",
  oddRel: "data/schema/tei-lex0-profile.odd.xml",
  envVar: "CSL_STANDARDS_LEX0_RNG",
  rngName: "csl-tei-lex0-profile.rng"
});
runRngValidation({type: "lex0", rngPath: lex0Rng, validator, files: lex0Files()});

runShaclValidation(models);

const failedChecks = checks.filter(check => check.status === "fail");
const skippedChecks = checks.filter(check => check.status === "skipped");
const report = {
  generatedAt: generatedAt(),
  generator: "scripts/validate-external-profiles.mjs",
  strict,
  caveat: "External validation depends on locally installed TEI and SHACL tooling. Skipped checks are recorded explicitly and fail only in --strict mode.",
  tools: {
    teiOddCompiler: commandPath("teitorelaxng") || null,
    teiXmlValidator: commandPath("jing") || commandPath("xmllint") || null,
    shaclValidator: commandPath("pyshacl") || null
  },
  totals: {
    checks: checks.length,
    passed: checks.filter(check => check.status === "pass").length,
    failed: failedChecks.length,
    skipped: skippedChecks.length
  },
  checks
};

writeJson("data/pilot/external-validation-review.json", report);
writeJson("src/data/pilot/external-validation-review.json", report);

for (const dir of tempDirs) {
  fs.rmSync(dir, {recursive: true, force: true});
}

if (failedChecks.length || (strict && skippedChecks.length)) {
  console.error(`External validation incomplete: ${failedChecks.length} failed, ${skippedChecks.length} skipped.`);
  process.exit(1);
}

console.log(`External validation report written: ${report.totals.passed} passed, ${report.totals.skipped} skipped.`);
