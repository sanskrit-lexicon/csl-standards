// Assemble a portable, no-admin RELAX NG toolchain under tools/ (gitignored) so
// `npm run validate-external` can run the TEI ODD -> RNG validation that
// validate-external-profiles otherwise records as "skipped".
//
// Downloads: a Temurin JRE, Saxon-HE (self-contained 10.x), jing, the TEI
// Stylesheets (odd2odd/odd2relax), and the TEI P5 source (p5subset.xml); writes
// a `jing` shim; compiles both project ODDs to RNG. Idempotent — skips a step if
// its output already exists.
//
// Windows-only (matches this repo's working machine). On Linux/WSL the apt route
// is simpler — see docs/EXTERNAL_VALIDATION.md.
//
// Usage: npm run setup-external-tools

import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";

const root = process.cwd();
const T = path.join(root, "tools");
const JAVA = path.join(T, "jdk", "bin", "java.exe");
const SAXON = path.join(T, "saxon", "saxon-he.jar");
const JING = path.join(T, "jing", "jing.jar");
const SS = path.join(T, "tei-stylesheets", "xml", "tei", "stylesheet", "odds");
const P5 = path.join(T, "p5subset.xml");
const SCHE = path.join(T, "schematron");
const SCH_COMMIT = "77dcd36c53d12ed786c144ece3b2af7694abdc56";
const SCH_BASE = `https://raw.githubusercontent.com/Schematron/schematron/${SCH_COMMIT}/trunk/schematron/code`;
const SCH_FILES = new Map([
  ["iso_dsdl_include.xsl", "43ff20a1afd89d8a744d1c0b8df94ac5559ffa6a820d1ffbf508d6431ee4fdd9"],
  ["iso_abstract_expand.xsl", "c5267f124abf23eeb6669884e40a98607c055bfaa1f39e73b7d578feceeb6e46"],
  ["iso_svrl_for_xslt2.xsl", "0588d617924a0686255f6d182633d434c7986d561be8fcc3b363907d3f671b26"],
  ["iso_schematron_skeleton_for_saxon.xsl", "95f3195d9f437ea8ff5f75d1a27f4e68ae20b236fe0d4a217bb4209f498a10a3"],
]);

const JRE_URL = "https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.11%2B10/OpenJDK21U-jre_x64_windows_hotspot_21.0.11_10.zip";
const JRE_SHA256 = "be26677aaa20b39a62edcaab4c8857a8b76673b0f45abc0b6143b142b62717e4";
const SAXON_URL = "https://repo1.maven.org/maven2/net/sf/saxon/Saxon-HE/10.9/Saxon-HE-10.9.jar";
const SAXON_SHA256 = "491d8edf4ec811d15c2b2417b007218b9b938f15e4dfbad004025beb4e70e960";
const JING_URL = "https://repo1.maven.org/maven2/com/thaiopensource/jing/20091111/jing-20091111.jar";
const JING_SHA256 = "fe02d596d2f3b1d433efd0a0fac32b7177627d74f6b9127bb5386e88e07282ba";
const P5_URL = "https://www.tei-c.org/Vault/P5/4.11.0/xml/tei/odd/p5subset.xml";
const P5_SHA256 = "afd1ebb873ca718d61be5cb4f61164a11037fe0c9b612a2623e6af1af19ef301";
const TEI_STYLESHEETS_URL = "https://github.com/TEIC/Stylesheets/releases/download/v7.60.0/tei-xsl-7.60.0.zip";
const TEI_STYLESHEETS_SHA256 = "01fe67e24cbae01840fd799dd83e9f0d59e382659fcfa2855c26c2bb6f6102a4";
const TEI_STYLESHEETS_ODD2ODD_SHA256 = "ef3d7188c856832c0abbaa48136011e5f63be6bc37529f49e665c0471074fb59";

if (process.platform !== "win32") {
  console.error("This script targets Windows. On Linux/WSL: apt install default-jre-headless tei-xsl jing; see docs/EXTERNAL_VALIDATION.md.");
  process.exit(1);
}

async function sha256File(file) {
  return createHash("sha256").update(await fs.readFile(file)).digest("hex");
}

async function assertSha256(file, expected) {
  const actual = await sha256File(file);
  if (actual !== expected.toLowerCase()) {
    throw new Error(`sha256 mismatch for ${path.relative(root, file)}: expected ${expected}, got ${actual}`);
  }
}

async function download(url, dest, sha256) {
  if (existsSync(dest)) {
    await assertSha256(dest, sha256);
    console.log(`  have ${path.relative(root, dest)} (sha256 ok)`);
    return;
  }
  console.log(`  fetch ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download failed (${res.status}): ${url}`);
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, Buffer.from(await res.arrayBuffer()));
  await assertSha256(dest, sha256);
  console.log(`  verified ${path.relative(root, dest)} (sha256 ok)`);
}

function ps(command) {
  const r = spawnSync("powershell", ["-NoProfile", "-Command", command], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`powershell failed: ${r.stderr || r.stdout}`);
  return r.stdout;
}

function fileUri(file) {
  return `file:///${path.resolve(file).replace(/\\/g, "/")}`;
}

// Download + extract a zip whose single top-level folder is renamed to `into`.
async function verifyJreInstall(into) {
  const release = await fs.readFile(path.join(into, "release"), "utf8");
  if (!release.includes('FULL_VERSION="21.0.11+10-LTS"') || !release.includes('IMAGE_TYPE="JRE"')) {
    throw new Error(`${path.relative(root, into)} is not the pinned Temurin JRE 21.0.11+10 image`);
  }
  console.log(`  have ${path.relative(root, into)} (Temurin JRE 21.0.11+10 ok)`);
}

async function verifyTeiStylesheetsInstall(into) {
  await assertSha256(path.join(into, "xml", "tei", "stylesheet", "odds", "odd2odd.xsl"), TEI_STYLESHEETS_ODD2ODD_SHA256);
  console.log(`  have ${path.relative(root, into)} (TEI Stylesheets 7.60.0 ok)`);
}

async function unzipSingle(url, zip, into, sha256, verifyExisting) {
  if (existsSync(into)) {
    if (verifyExisting) await verifyExisting(into);
    else console.log(`  have ${path.relative(root, into)}`);
    return;
  }
  await download(url, zip, sha256);
  const tmp = `${into}-tmp`;
  ps(`Expand-Archive -Path '${zip}' -DestinationPath '${tmp}' -Force`);
  const entries = await fs.readdir(tmp);
  const inner = entries.length === 1 ? path.join(tmp, entries[0]) : tmp;
  await fs.rename(inner, into).catch(async () => { await fs.cp(inner, into, { recursive: true }); });
  await fs.rm(tmp, { recursive: true, force: true }).catch(() => {});
  await fs.rm(zip, { force: true });
  if (verifyExisting) await verifyExisting(into);
}

function compileOdd(oddRel, rngName) {
  const odd = path.join(root, oddRel);
  const expanded = path.join(T, "rng", `${rngName}.expanded.odd`);
  const outUri = `${fileUri(path.join(T, "rng"))}/`;
  const run = (args) => {
    const r = spawnSync(JAVA, ["-jar", SAXON, ...args], { encoding: "utf8" });
    if (r.status !== 0) throw new Error(`saxon failed: ${r.stderr || r.stdout}`);
  };
  run([`-s:${odd}`, `-xsl:${path.join(SS, "odd2odd.xsl")}`, `-o:${expanded}`, `defaultSource=${fileUri(P5)}`]);
  run([`-s:${expanded}`, `-xsl:${path.join(SS, "odd2relax.xsl")}`, `-o:${path.join(T, "rng", "_main.out")}`, `outputDir=${outUri}`]);
}

// Extract the ODD's Schematron (its <sch:pattern> blocks), then compile it to an
// SVRL-emitting XSLT with the ISO Schematron skeleton (3 Saxon stages), so the
// harness can run the constraints with a real engine.
async function compileSchematron(oddRel, schName) {
  const out = path.join(SCHE, `${schName}.svrl.xsl`);
  if (existsSync(out)) { console.log(`  have ${path.relative(root, out)}`); return; }
  const odd = await fs.readFile(path.join(root, oddRel), "utf8");
  const patterns = [...odd.matchAll(/<sch:pattern[\s\S]*?<\/sch:pattern>/g)].map(m => m[0]);
  if (!patterns.length) { console.log(`  no <sch:pattern> in ${oddRel}; skipping`); return; }
  const sch = `<sch:schema xmlns:sch="http://purl.oclc.org/dsdl/schematron" queryBinding="xslt2">\n  <sch:ns prefix="tei" uri="http://www.tei-c.org/ns/1.0"/>\n${patterns.join("\n")}\n</sch:schema>\n`;
  const schFile = path.join(SCHE, `${schName}.sch`);
  await fs.writeFile(schFile, sch, "utf8");
  const run = (src, xsl, dst) => {
    const r = spawnSync(JAVA, ["-jar", SAXON, `-s:${src}`, `-xsl:${xsl}`, `-o:${dst}`], { encoding: "utf8" });
    if (r.status !== 0) throw new Error(`saxon failed: ${r.stderr || r.stdout}`);
  };
  const s1 = path.join(SCHE, `${schName}._1.sch`);
  const s2 = path.join(SCHE, `${schName}._2.sch`);
  run(schFile, path.join(SCHE, "iso_dsdl_include.xsl"), s1);
  run(s1, path.join(SCHE, "iso_abstract_expand.xsl"), s2);
  run(s2, path.join(SCHE, "iso_svrl_for_xslt2.xsl"), out);
}

async function main() {
  await fs.mkdir(path.join(T, "rng"), { recursive: true });
  await fs.mkdir(path.join(T, "bin"), { recursive: true });
  await fs.mkdir(SCHE, { recursive: true });

  console.log("Java (Temurin JRE 21):");
  await unzipSingle(JRE_URL, path.join(T, "jre.zip"), path.join(T, "jdk"), JRE_SHA256, verifyJreInstall);
  console.log("Saxon-HE 10.9:"); await download(SAXON_URL, SAXON, SAXON_SHA256);
  console.log("jing:"); await download(JING_URL, JING, JING_SHA256);
  console.log("p5subset.xml (TEI P5 4.11.0):"); await download(P5_URL, P5, P5_SHA256);
  console.log("TEI Stylesheets:");
  await unzipSingle(TEI_STYLESHEETS_URL, path.join(T, "tei-xsl.zip"), path.join(T, "tei-stylesheets"),
    TEI_STYLESHEETS_SHA256, verifyTeiStylesheetsInstall);

  // jing shim so `where jing` resolves for validate-external-profiles.
  await fs.writeFile(path.join(T, "bin", "jing.cmd"),
    `@"%~dp0..\\jdk\\bin\\java.exe" -jar "%~dp0..\\jing\\jing.jar" %*\r\n`, "utf8");

  console.log("Compiling ODD -> RNG:");
  compileOdd("data/schema/tei-archival-profile.odd.xml", "csl-tei-archival-profile-v0.1");
  compileOdd("data/schema/tei-lex0-profile.odd.xml", "csl-tei-lex0-profile-v0.1");

  console.log("Schematron skeleton + Lex-0 SVRL transform:");
  for (const [f, sha256] of SCH_FILES) await download(`${SCH_BASE}/${f}`, path.join(SCHE, f), sha256);
  await compileSchematron("data/schema/tei-lex0-profile.odd.xml", "csl-tei-lex0");

  console.log("Done. tools/ ready. Run: npm run validate-external");
}

main().catch(error => { console.error(error.message || error); process.exit(1); });
