#!/usr/bin/env node
/**
 * verify-repin-ui2-copies.mjs — bramka KOPII BAJTOWYCH partii REPIN UI-2 (R-RUSTPORT-REPIN-UI-2-A-Q1).
 *
 * Pliki z `tools/repin-ui2-manifest.json` zostały skopiowane BAJT W BAJT z aktualnego weba (`origin/main`,
 * SHA w polu `pin` manifestu), a nie z pinu `edb8fb56` (`pin-manifest.json`). Plik nie może występować
 * w obu manifestach naraz (inaczej `verify-pin-copies` i ta bramka wymagałyby dwóch różnych treści).
 *
 * Bramka (EXIT 0 <=> wszystkie poniższe):
 *   SHA     sha256 i rozmiar pliku w drzewie = wpis manifestu;
 *   DISJ    żaden plik manifestu UI-2 nie występuje w `pin-manifest.json`;
 *   GIT     (gdy dostępny git i obiekt `pin`) `git show <pin>:<gra/…>` jest bajtowo równy plikowi
 *           (niezależne od manifestu porównanie ze źródłem); `--no-git` pomija, `--web-dir <dir>` porównuje
 *           z katalogiem `git archive <pin> gra/src` zamiast gita.
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`):
 *   node tools/verify-repin-ui2-copies.mjs [--no-git] [--web-dir <katalog z gra/src>]
 *   node tools/verify-repin-ui2-copies.mjs --gen <sha> <ścieżka src/…> [...]   (wypisuje manifest na stdout)
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const ROOT = fileURLToPath(new URL('../', import.meta.url));
const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

if (args[0] === '--gen') {
  const [, pin, ...paths] = args;
  const files = paths.map((p) => {
    const buf = readFileSync(join(ROOT, p));
    return { path: p, pin: `${pin}:gra/${p}`, sha256: sha256(buf), bytes: buf.length };
  });
  process.stdout.write(JSON.stringify({ pin, source: 'git show <pin>:<gra/path> (origin/main w chwili kopiowania)', topic: 'R-RUSTPORT-REPIN-UI-2-A-Q1', files }, null, 2) + '\n');
  process.exit(0);
}

const manifest = JSON.parse(readFileSync(new URL('./repin-ui2-manifest.json', import.meta.url), 'utf8'));
const pinManifest = JSON.parse(readFileSync(new URL('./pin-manifest.json', import.meta.url), 'utf8'));
const pinPaths = new Set(pinManifest.files.map((f) => f.path));
const noGit = args.includes('--no-git');
const webDir = argOf('--web-dir');
let bad = 0;
let gitChecked = 0;
const fail = (msg) => {
  bad++;
  console.error(msg);
};
for (const f of manifest.files) {
  const abs = join(ROOT, f.path);
  if (!existsSync(abs)) {
    fail(`BRAK ${f.path}`);
    continue;
  }
  const buf = readFileSync(abs);
  if (sha256(buf) !== f.sha256 || buf.length !== f.bytes) fail(`SHA ${f.path} oczekiwano ${f.sha256}/${f.bytes} jest ${sha256(buf)}/${buf.length}`);
  if (pinPaths.has(f.path)) fail(`DISJ ${f.path} występuje także w pin-manifest.json`);
  const [obj, srcPath] = [f.pin.slice(0, f.pin.indexOf(':')), f.pin.slice(f.pin.indexOf(':') + 1)];
  if (obj !== manifest.pin) fail(`PIN ${f.path} wpis ${obj} != manifest ${manifest.pin}`);
  let ref = null;
  if (webDir) {
    const p = join(webDir, srcPath);
    if (!existsSync(p)) fail(`WEB brak ${p}`);
    else ref = readFileSync(p);
  } else if (!noGit) {
    try {
      ref = execFileSync('git', ['show', f.pin], { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 });
    } catch {
      console.error(`GIT NIE_ZMIERZONO ${f.pin} (brak obiektu — uruchom git fetch origin main albo --web-dir)`);
    }
  }
  if (ref) {
    gitChecked++;
    if (Buffer.compare(ref, buf) !== 0) fail(`GIT ${f.path} różni się od ${f.pin}`);
  }
}
// ─── R-RUSTPORT-REPIN-UI-2-G-Q1: bloki K przepięte na web (`tools/repin-ui2g-kblocks-manifest.json`) ─────────────
// REV    każdy marker bloku w pliku ma rewizję manifestu, liczba markerów = wpis (plik nie miesza pinu i webu);
// RANGE  (git albo --web-dir) zakres A-B istnieje w pliku źródłowym tej rewizji, a pierwsza deklaracja bloku portu
//        (bez `export`) jest zadeklarowana w liniach A..B źródła — treść bloków sprawdzają weryfikatory partii.
let kChecked = 0;
let kFiles = 0;
const kManPath = new URL('./repin-ui2g-kblocks-manifest.json', import.meta.url);
if (existsSync(kManPath)) {
  const km = JSON.parse(readFileSync(kManPath, 'utf8'));
  const MARK = /^\/\/ (?:kopia typu \([^)]*\) )?pin(?:-adapter)? (\S+) (gra\/src\/[^:\s]+):(\d+)-(\d+)/;
  const DECLN = /^(?:export\s+)?(?:declare\s+)?(?:async\s+)?(?:function\s*\*?\s*|const\s+|let\s+|var\s+|interface\s+|type\s+|class\s+|enum\s+)([A-Za-z_$][\w$]*)/;
  const srcCache = new Map();
  const srcLines = (rel) => {
    if (srcCache.has(rel)) return srcCache.get(rel);
    let txt = null;
    if (webDir) txt = existsSync(join(webDir, rel)) ? readFileSync(join(webDir, rel), 'utf8') : null;
    else if (!noGit) {
      try {
        txt = execFileSync('git', ['show', `${km.revFull}:${rel}`], { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 }).toString('utf8');
      } catch {
        txt = null;
      }
    }
    const v = txt === null ? null : txt.split(/\r?\n/);
    srcCache.set(rel, v);
    return v;
  };
  for (const f of km.files) {
    kFiles++;
    const abs = join(ROOT, f.path);
    if (!existsSync(abs)) {
      fail(`KBLOK BRAK ${f.path}`);
      continue;
    }
    const lines = readFileSync(abs, 'utf8').split('\n');
    const marks = [];
    lines.forEach((l, i) => {
      const m = MARK.exec(l);
      if (m) marks.push({ i, rev: m[1], rel: m[2], a: +m[3], b: +m[4] });
    });
    if (marks.length !== f.markers) fail(`KBLOK REV ${f.path}: markerów ${marks.length}, manifest ${f.markers}`);
    for (const mk of marks) if (mk.rev !== km.rev) fail(`KBLOK REV ${f.path}:${mk.i + 1} rewizja ${mk.rev} != ${km.rev}`);
    marks.forEach((mk, k) => {
      const ref = srcLines(mk.rel);
      if (ref === null) return;
      kChecked++;
      if (mk.b > ref.length || mk.a < 1 || mk.a > mk.b) {
        fail(`KBLOK RANGE ${f.path}:${mk.i + 1} ${mk.rel}:${mk.a}-${mk.b} poza plikiem (${ref.length} linii)`);
        return;
      }
      const end = k + 1 < marks.length ? marks[k + 1].i : lines.length;
      const portName = lines.slice(mk.i + 1, end).map((l) => DECLN.exec(l)?.[1]).find(Boolean);
      if (!portName) return;
      const name = km.renames?.[portName] ?? portName;
      const rx = new RegExp(`^(?:export\\s+)?(?:declare\\s+)?(?:async\\s+)?(?:function\\s*\\*?\\s*|const\\s+|let\\s+|var\\s+|interface\\s+|type\\s+|class\\s+|enum\\s+)${name.replace(/\$/g, '\\$')}\\b`);
      if (!ref.slice(mk.a - 1, mk.b).some((l) => rx.test(l))) fail(`KBLOK RANGE ${f.path}:${mk.i + 1} deklaracja ${name} nie leży w ${mk.rel}:${mk.a}-${mk.b} (${km.rev})`);
    });
  }
}
// CONTENT (R-RUSTPORT-REPIN-UI-2-G-Q1 r2, zarzut Z5): treść bloków K = weryfikatory partii z manifestu (`contentGates`)
//        uruchamiane na źródle rewizji manifestu: `--web-dir` albo `git archive <revFull> gra/src gra/data` do katalogu tymczasowego
//        (usuwany po bramce). K01A (`run-k01a`) potrzebuje też pinu (`--k-pin-dir` albo `git archive <pinFull>`).
//        `--no-git` bez `--web-dir` = CONTENT POMINIĘTE (jawny komunikat, jak RANGE). Każdy weryfikator: EXIT 0, inaczej FAIL.
let kContent = 0;
let kContentSkipped = 0;
if (existsSync(kManPath)) {
  const km = JSON.parse(readFileSync(kManPath, 'utf8'));
  const gates = km.contentGates ?? [];
  const tmps = [];
  const archive = (rev) => {
    const dir = mkdtempSync(join(tmpdir(), 'repin-ui2g-content-'));
    tmps.push(dir);
    const top = execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: ROOT, encoding: 'utf8' }).trim();
    const tar = execFileSync('git', ['archive', '--format=tar', rev, 'gra/src', 'gra/data'], { cwd: top, maxBuffer: 512 * 1024 * 1024 });
    const x = spawnSync('tar', ['-x', '-C', dir], { input: tar });
    if (x.status !== 0) throw new Error(`tar: ${x.stderr}`);
    return dir;
  };
  try {
    let web = webDir ?? null;
    if (!web && !noGit && gates.length) {
      try { web = archive(km.revFull); } catch (e) { fail(`KBLOK CONTENT git archive ${km.rev}: ${String(e.message ?? e).split('\n')[0]}`); }
    }
    let pin = argOf('--k-pin-dir') ?? null;
    const needPin = gates.some((g) => g.args.some((a) => a.includes('{PIN}')));
    if (!pin && needPin && !noGit && !webDir) {
      try { pin = archive(km.pinFull); } catch (e) { fail(`KBLOK CONTENT git archive ${km.pin}: ${String(e.message ?? e).split('\n')[0]}`); }
    }
    for (const g of gates) {
      if (!web || (g.args.some((a) => a.includes('{PIN}')) && !pin)) { kContentSkipped++; continue; }
      const a = g.args.map((s) => s.replaceAll('{WEB}', web).replaceAll('{PIN}', pin ?? ''));
      const r = spawnSync(process.execPath, [g.script, ...a], { cwd: ROOT, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
      kContent++;
      if (r.status !== 0) {
        const tail = (r.stdout + r.stderr).trim().split('\n').slice(-3).join(' | ');
        fail(`KBLOK CONTENT ${g.id} EXIT ${r.status}: ${tail.slice(0, 400)}`);
      }
    }
  } finally {
    for (const d of tmps) rmSync(d, { recursive: true, force: true });
  }
  if (kContentSkipped) console.log(`verify-repin-ui2-copies: kblocks CONTENT POMINIĘTE ${kContentSkipped} bramek (brak źródła: --no-git bez --web-dir / --k-pin-dir)`);
}
if (kFiles) console.log(`verify-repin-ui2-copies: kblocks rev=${existsSync(kManPath) ? JSON.parse(readFileSync(kManPath, 'utf8')).rev : '-'} plików=${kFiles} zakresów_sprawdzonych=${kChecked} treść_bramek=${kContent}`);
console.log(`verify-repin-ui2-copies: pin=${manifest.pin} plików=${manifest.files.length} źródło_sprawdzone=${gitChecked} niezgodnych=${bad}`);
process.exitCode = bad === 0 ? 0 : 1;
