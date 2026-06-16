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

const root = process.cwd();
const T = path.join(root, "tools");
const JAVA = path.join(T, "jdk", "bin", "java.exe");
const SAXON = path.join(T, "saxon", "saxon-he.jar");
const JING = path.join(T, "jing", "jing.jar");
const SS = path.join(T, "tei-stylesheets", "xml", "tei", "stylesheet", "odds");
const P5 = path.join(T, "p5subset.xml");

const SAXON_URL = "https://repo1.maven.org/maven2/net/sf/saxon/Saxon-HE/10.9/Saxon-HE-10.9.jar";
const JING_URL = "https://repo1.maven.org/maven2/com/thaiopensource/jing/20091111/jing-20091111.jar";
const P5_URL = "https://www.tei-c.org/Vault/P5/current/xml/tei/odd/p5subset.xml";

if (process.platform !== "win32") {
  console.error("This script targets Windows. On Linux/WSL: apt install default-jre-headless tei-xsl jing; see docs/EXTERNAL_VALIDATION.md.");
  process.exit(1);
}

async function download(url, dest) {
  if (existsSync(dest)) { console.log(`  have ${path.relative(root, dest)}`); return; }
  console.log(`  fetch ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download failed (${res.status}): ${url}`);
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, Buffer.from(await res.arrayBuffer()));
}

function ps(command) {
  const r = spawnSync("powershell", ["-NoProfile", "-Command", command], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`powershell failed: ${r.stderr || r.stdout}`);
  return r.stdout;
}

// Download + extract a zip whose single top-level folder is renamed to `into`.
async function unzipSingle(url, zip, into) {
  if (existsSync(into)) { console.log(`  have ${path.relative(root, into)}`); return; }
  await download(url, zip);
  const tmp = `${into}-tmp`;
  ps(`Expand-Archive -Path '${zip}' -DestinationPath '${tmp}' -Force`);
  const entries = await fs.readdir(tmp);
  const inner = entries.length === 1 ? path.join(tmp, entries[0]) : tmp;
  await fs.rename(inner, into).catch(async () => { await fs.cp(inner, into, { recursive: true }); });
  await fs.rm(tmp, { recursive: true, force: true }).catch(() => {});
  await fs.rm(zip, { force: true });
}

async function resolveJreUrl() {
  const api = "https://api.adoptium.net/v3/assets/feature_releases/21/ga?architecture=x64&image_type=jre&os=windows&vendor=eclipse&page_size=1";
  const j = await (await fetch(api)).json();
  return j[0].binaries[0].package.link;
}

function compileOdd(oddRel, rngName) {
  const odd = path.join(root, oddRel);
  const expanded = path.join(T, "rng", `${rngName}.expanded.odd`);
  const outUri = "file:///" + path.join(T, "rng").replace(/\\/g, "/") + "/";
  const run = (args) => {
    const r = spawnSync(JAVA, ["-jar", SAXON, ...args], { encoding: "utf8" });
    if (r.status !== 0) throw new Error(`saxon failed: ${r.stderr || r.stdout}`);
  };
  run([`-s:${odd}`, `-xsl:${path.join(SS, "odd2odd.xsl")}`, `-o:${expanded}`, `defaultSource=${P5}`]);
  run([`-s:${expanded}`, `-xsl:${path.join(SS, "odd2relax.xsl")}`, `-o:${path.join(T, "rng", "_main.out")}`, `outputDir=${outUri}`]);
}

async function main() {
  await fs.mkdir(path.join(T, "rng"), { recursive: true });
  await fs.mkdir(path.join(T, "bin"), { recursive: true });

  console.log("Java (Temurin JRE 21):");
  await unzipSingle(await resolveJreUrl(), path.join(T, "jre.zip"), path.join(T, "jdk"));
  console.log("Saxon-HE 10.9:"); await download(SAXON_URL, SAXON);
  console.log("jing:"); await download(JING_URL, JING);
  console.log("p5subset.xml:"); await download(P5_URL, P5);
  console.log("TEI Stylesheets:");
  await unzipSingle("https://github.com/TEIC/Stylesheets/releases/download/v7.60.0/tei-xsl-7.60.0.zip",
    path.join(T, "tei-xsl.zip"), path.join(T, "tei-stylesheets"));

  // jing shim so `where jing` resolves for validate-external-profiles.
  await fs.writeFile(path.join(T, "bin", "jing.cmd"),
    `@"%~dp0..\\jdk\\bin\\java.exe" -jar "%~dp0..\\jing\\jing.jar" %*\r\n`, "utf8");

  console.log("Compiling ODD -> RNG:");
  compileOdd("data/schema/tei-archival-profile.odd.xml", "csl-tei-archival-profile-v0.1");
  compileOdd("data/schema/tei-lex0-profile.odd.xml", "csl-tei-lex0-profile-v0.1");

  console.log("Done. tools/ ready. Run: npm run validate-external");
}

main().catch(error => { console.error(error.message || error); process.exit(1); });
