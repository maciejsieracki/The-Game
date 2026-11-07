#!/usr/bin/env node
/**
 * verify-repin-ui3-copies.mjs — bramka REPIN UI-3 (R-RUSTPORT-REPIN-WEB-UI-3-Q1): pliki `src/ui/**` przepięte na web
 * `origin/main` `9b019a7d8` (FALA 509–532), manifest `tools/repin-ui3-manifest.json`.
 *
 * Klasy:
 *   files     KOPIA BAJTOWA weba (`git show <pin>:<src>`).
 *   adapters  ADAPTER: plik weba, w którym JEDYNA zmiana to zastąpienie wskazanego importu logiki (`../game/*`, zakaz
 *             `check-no-logic-imports`) blokami `// pin-adapter <rev> <źródło>:<A>-<B>` — każdy blok = linie A..B źródła
 *             z usuniętym słowem `export ` (deklaracja lokalna).
 *
 * Bramka (EXIT 0 <=> wszystkie poniższe):
 *   SHA      sha256 i rozmiar pliku w drzewie = wpis manifestu (kopie i adaptery);
 *   DISJ     ścieżka nie występuje w `pin-manifest.json` ani w żadnej sekcji `repin-ui2-manifest.json`
 *            (`files`, `portDomRefs`, `overlayPorts*`, `overlayPd`), `repin-ui2-overlay-ports/*.json`, `repin-ui2*-ported.json`;
 *   GIT      (git albo `--web-dir`) kopia bajtowo = źródło weba;
 *   ADAPTER  (git albo `--web-dir`) port bez bloków markerów = web bez importu `removedImport`; każdy blok = źródło A..B
 *            (po `export ` → ``); sha256 źródła weba = `webSha256`.
 * `--no-git` bez `--web-dir` pomija GIT/ADAPTER (jawny komunikat NIE_ZMIERZONO).
 *
 * Użycie (z `src-tauri/frontend-v2/`): node tools/verify-repin-ui3-copies.mjs [--no-git] [--web-dir <katalog z gra/src>]
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const ROOT = fileURLToPath(new URL('../', import.meta.url));
const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');
const man = JSON.parse(readFileSync(new URL('./repin-ui3-manifest.json', import.meta.url), 'utf8'));
const noGit = args.includes('--no-git');
const webDir = argOf('--web-dir');
let bad = 0;
const fail = (m) => {
  bad++;
  console.error(m);
};

// Ścieżki zajęte przez inne manifesty (DISJ).
const taken = new Map();
const take = (p, who) => taken.set(p, [...(taken.get(p) ?? []), who]);
for (const f of JSON.parse(readFileSync(new URL('./pin-manifest.json', import.meta.url), 'utf8')).files) take(f.path, 'pin-manifest');
const ui2 = JSON.parse(readFileSync(new URL('./repin-ui2-manifest.json', import.meta.url), 'utf8'));
for (const f of ui2.files ?? []) take(f.path, 'repin-ui2.files');
for (const f of ui2.portDomRefs ?? []) take(f.path, 'repin-ui2.portDomRefs');
for (const f of ui2.overlayPd ?? []) take(f.path, 'repin-ui2.overlayPd');
for (const [k, sec] of Object.entries(ui2)) if (k.startsWith('overlayPorts') && Array.isArray(sec?.files)) for (const f of sec.files) take(f.path, `repin-ui2.${k}`);
const pdir = new URL('./repin-ui2-overlay-ports/', import.meta.url);
if (existsSync(pdir)) for (const n of readdirSync(pdir).filter((x) => x.endsWith('.json'))) for (const f of JSON.parse(readFileSync(new URL(n, pdir), 'utf8')).files) if (f.src.startsWith('gra/src/ui/')) take('src/ui/' + f.src.slice(11), n);
for (const n of readdirSync(new URL('./', import.meta.url)).filter((x) => /^repin-ui2.*-ported\.json$/.test(x))) for (const f of JSON.parse(readFileSync(new URL(n, import.meta.url), 'utf8')).files) if (f.web?.startsWith('gra/src/ui/')) take('src/ui/' + f.web.slice(11), n);

const webSrc = (rel) => {
  if (webDir) return existsSync(join(webDir, rel)) ? readFileSync(join(webDir, rel)) : null;
  if (noGit) return null;
  try {
    return execFileSync('git', ['show', `${man.pin}:${rel}`], { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 });
  } catch {
    console.error(`GIT NIE_ZMIERZONO ${man.pin}:${rel} (brak obiektu — git fetch origin main albo --web-dir)`);
    return null;
  }
};

let copies = 0;
let gitChecked = 0;
let adChecked = 0;
let blocks = 0;
const seen = new Set();
for (const f of [...man.files, ...man.adapters]) {
  if (seen.has(f.path)) fail(`DUP ${f.path}`);
  seen.add(f.path);
  if (taken.has(f.path)) fail(`DISJ ${f.path} także w: ${taken.get(f.path).join(', ')}`);
  const abs = join(ROOT, f.path);
  if (!existsSync(abs)) {
    fail(`BRAK ${f.path}`);
    continue;
  }
  const buf = readFileSync(abs);
  if (sha256(buf) !== f.sha256 || buf.length !== f.bytes) fail(`SHA ${f.path} oczekiwano ${f.sha256}/${f.bytes} jest ${sha256(buf)}/${buf.length}`);
}
for (const f of man.files) {
  copies++;
  const ref = webSrc(f.src);
  if (!ref) continue;
  gitChecked++;
  if (!existsSync(join(ROOT, f.path)) || Buffer.compare(ref, readFileSync(join(ROOT, f.path))) !== 0) fail(`GIT ${f.path} różni się od ${man.pin}:${f.src}`);
}
const MARK = /^\/\/ pin-adapter (\S+) (gra\/src\/\S+):(\d+)-(\d+)$/;
for (const a of man.adapters) {
  const web = webSrc(a.src);
  if (!web || !existsSync(join(ROOT, a.path))) continue;
  adChecked++;
  if (sha256(web) !== a.webSha256 || web.length !== a.webBytes) fail(`ADAPTER ${a.path}: źródło weba ${sha256(web)}/${web.length} ≠ manifest ${a.webSha256}/${a.webBytes}`);
  const webTxt = web.toString('utf8');
  if (webTxt.split(a.removedImport).length !== 2) fail(`ADAPTER ${a.path}: import „${a.removedImport}” nie występuje dokładnie raz w webie`);
  const port = readFileSync(join(ROOT, a.path), 'utf8').split('\n');
  // Region adaptera: od pierwszej linii komentarza nagłówka (`a.headerLines`) do końca ostatniego bloku.
  const start = port.findIndex((l) => l.startsWith('// REPIN UI-3'));
  const marks = [];
  port.forEach((l, i) => {
    const m = MARK.exec(l);
    if (m) marks.push({ i, rev: m[1], rel: m[2], a: +m[3], b: +m[4] });
  });
  if (start < 0 || marks.length !== a.markers) {
    fail(`ADAPTER ${a.path}: nagłówek ${start >= 0} markerów ${marks.length} (manifest ${a.markers})`);
    continue;
  }
  let end = start;
  for (const mk of marks) {
    if (!man.pin.startsWith(mk.rev)) fail(`ADAPTER ${a.path}:${mk.i + 1} rewizja ${mk.rev} ≠ ${man.pin}`);
    const src = webSrc(mk.rel);
    if (!src) continue;
    const want = src.toString('utf8').split('\n').slice(mk.a - 1, mk.b).map((l) => l.replace(/^export /, ''));
    const got = port.slice(mk.i + 1, mk.i + 1 + want.length);
    blocks++;
    if (want.join('\n') !== got.join('\n')) fail(`ADAPTER ${a.path}:${mk.i + 1} blok ≠ ${mk.rel}:${mk.a}-${mk.b}`);
    end = mk.i + want.length;
  }
  const rest = [...port.slice(0, start), a.removedImport, ...port.slice(end + 1)].join('\n');
  if (rest !== webTxt) fail(`ADAPTER ${a.path}: poza blokami adaptera plik ≠ web ${man.pin}:${a.src}`);
}
// DEPS: zależności weba wstawiane tylko do odniesienia nakładki (`overlayDeps`) — sha256 = źródło; NIE w `src/` portu.
let deps = 0;
for (const d of man.overlayDeps ?? []) {
  const ref = webSrc(d.src);
  if (ref) {
    deps++;
    if (sha256(ref) !== d.sha256 || ref.length !== d.bytes) fail(`DEPS ${d.src} ${sha256(ref)}/${ref.length} ≠ manifest`);
  }
}
// PORTDOM (R-RUSTPORT-REPIN-WEB-UI-3-C-Q1, addytywnie): sekcje `portDom*` — porty DOM (NIE kopie): SHA/rozmiar pliku portu
// = `sha256`/`bytes`; DUP/DISJ jak wyżej (także między sekcjami); źródło weba (git albo `--web-dir`) = `webSha256`/`webBytes`;
// `overlayDeps` sekcji = źródło weba. Port ≠ web jest dozwolony (treść portu sprawdza harness partii, np. `run-repin-ui3c`).
let pd = 0;
let pdWeb = 0;
for (const [key, sec] of Object.entries(man)) {
  if (!key.startsWith('portDom') || !sec || !Array.isArray(sec.files)) continue;
  for (const f of sec.files) {
    pd++;
    if (seen.has(f.path)) fail(`DUP ${key} ${f.path}`);
    seen.add(f.path);
    if (taken.has(f.path)) fail(`DISJ ${key} ${f.path} także w: ${taken.get(f.path).join(', ')}`);
    const abs = join(ROOT, f.path);
    if (!existsSync(abs)) {
      fail(`BRAK ${key} ${f.path}`);
      continue;
    }
    const buf = readFileSync(abs);
    if (sha256(buf) !== f.sha256 || buf.length !== f.bytes) fail(`SHA ${key} ${f.path} oczekiwano ${f.sha256}/${f.bytes} jest ${sha256(buf)}/${buf.length}`);
    const ref = webSrc(f.src);
    if (!ref) continue;
    pdWeb++;
    if (sha256(ref) !== f.webSha256 || ref.length !== f.webBytes) fail(`PORTDOM ${key} ${f.src}: źródło weba ${sha256(ref)}/${ref.length} ≠ manifest ${f.webSha256}/${f.webBytes}`);
  }
  for (const d of sec.overlayDeps ?? []) {
    const ref = webSrc(d.src);
    if (!ref) continue;
    deps++;
    if (sha256(ref) !== d.sha256 || ref.length !== d.bytes) fail(`DEPS ${key} ${d.src} ${sha256(ref)}/${ref.length} ≠ manifest`);
  }
}
if (pd) console.log(`verify-repin-ui3-copies: portDom plików=${pd} źródło_sprawdzone=${pdWeb}`);
if (!webDir && noGit) console.log('verify-repin-ui3-copies: GIT/ADAPTER NIE_ZMIERZONO (--no-git bez --web-dir)');
console.log(`verify-repin-ui3-copies: pin=${man.pin.slice(0, 9)} kopii=${copies} źródło_sprawdzone=${gitChecked} adapterów=${man.adapters.length} adapter_sprawdzone=${adChecked} bloków=${blocks} deps=${deps} niezgodnych=${bad}`);
process.exitCode = bad === 0 ? 0 : 1;
