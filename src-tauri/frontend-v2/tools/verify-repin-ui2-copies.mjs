#!/usr/bin/env node
/**
 * verify-repin-ui2-copies.mjs — bramka KOPII BAJTOWYCH partii REPIN UI-2 (R-RUSTPORT-REPIN-UI-2-A-Q1; UI-2-B: +3 kopie
 * i `portDomRefs` — sha256 źródła weba plików portu DOM używanych przez nakładkę, patrz niżej).
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
// R-RUSTPORT-REPIN-UI-2-C-Q1 (addytywnie): wpisy `tools/repin-ui2-overlay-ports/*.json` (pliki webu przepięte PORTEM DOM,
// odniesienie starszych harnessów) — sha256/rozmiar = `git show <pin>:<src>` (albo `--web-dir`); port w `src/` istnieje.
let portsChecked = 0;
const portsDir = new URL('./repin-ui2-overlay-ports/', import.meta.url);
if (existsSync(portsDir)) {
  for (const name of readdirSync(portsDir).filter((n) => n.endsWith('.json')).sort()) {
    const part = JSON.parse(readFileSync(new URL(name, portsDir), 'utf8'));
    for (const f of part.files) {
      let ref = null;
      if (webDir) ref = existsSync(join(webDir, f.src)) ? readFileSync(join(webDir, f.src)) : null;
      else if (!noGit) {
        try {
          ref = execFileSync('git', ['show', `${part.pin}:${f.src}`], { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 });
        } catch {
          console.error(`PORT NIE_ZMIERZONO ${part.pin}:${f.src} (brak obiektu)`);
        }
      }
      if (ref) {
        portsChecked++;
        if (sha256(ref) !== f.sha256 || ref.length !== f.bytes) fail(`PORT ${name} ${f.src} sha/rozmiar ≠ ${part.pin}`);
      }
      const portPath = f.src.startsWith('gra/src/ui/') ? join(ROOT, 'src/ui', f.src.slice('gra/src/ui/'.length)) : null;
      if (portPath && !existsSync(portPath)) fail(`PORT ${name} brak portu ${portPath}`);
    }
  }
}
// R-RUSTPORT-REPIN-UI-2-D-Q1 (addytywnie): sekcje `overlayPorts*` — porty DOM repinowane do main (NIE kopie). Sprawdzamy, że
// odniesienie nakładki (sha256/rozmiar webu) zgadza się ze źródłem (`git show`/`--web-dir`), że port istnieje i NIE jest
// w `pin-manifest.json` ani w `files` (kopie) — inaczej starsze harnessy porównywałyby z nieaktualnym odniesieniem.
const copyPaths = new Set(manifest.files.map((f) => f.path));
let portsCheckedD = 0;
for (const [key, sec] of Object.entries(manifest)) {
  if (!key.startsWith('overlayPorts') || !sec || !Array.isArray(sec.files)) continue;
  for (const f of sec.files) {
    if (!existsSync(join(ROOT, f.path))) fail(`${key} BRAK portu ${f.path}`);
    if (pinPaths.has(f.path)) fail(`${key} DISJ ${f.path} występuje w pin-manifest.json`);
    if (copyPaths.has(f.path)) fail(`${key} DISJ ${f.path} występuje w files (kopie)`);
    const [obj, srcPath] = [f.pin.slice(0, f.pin.indexOf(':')), f.pin.slice(f.pin.indexOf(':') + 1)];
    let ref = null;
    if (webDir) {
      const p = join(webDir, srcPath);
      if (existsSync(p)) ref = readFileSync(p);
      else fail(`${key} WEB brak ${p}`);
    } else if (!noGit) {
      try {
        ref = execFileSync('git', ['show', `${obj}:${srcPath}`], { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 });
      } catch {
        console.error(`${key} GIT NIE_ZMIERZONO ${f.pin}`);
      }
    }
    if (ref) {
      portsCheckedD++;
      if (sha256(ref) !== f.sha256 || ref.length !== f.bytes) fail(`${key} SHA ${srcPath} źródło ${sha256(ref)}/${ref.length} manifest ${f.sha256}/${f.bytes}`);
    }
  }
}
console.log(`verify-repin-ui2-copies: overlayPorts* odniesień sprawdzonych=${portsCheckedD}`);
// R-RUSTPORT-REPIN-UI-2-B-Q1: `portDomRefs` = wersje weba plików portu DOM (odniesienie nakładki dla starszych harnessów).
// Plik portu NIE jest kopią (DTO), więc sprawdzamy: REF sha256/rozmiar źródła weba = wpis, DISJ z pin-manifest.json,
// rozłączność z `files` oraz istnienie pliku portu.
const refs = manifest.portDomRefs ?? [];
const filePaths = new Set(manifest.files.map((f) => f.path));
let refChecked = 0;
for (const f of refs) {
  if (!existsSync(join(ROOT, f.path))) fail(`BRAK portu ${f.path}`);
  if (pinPaths.has(f.path)) fail(`DISJ ${f.path} (portDomRefs) występuje w pin-manifest.json`);
  if (filePaths.has(f.path)) fail(`DISJ ${f.path} jednocześnie w files i portDomRefs`);
  const obj = f.pin.slice(0, f.pin.indexOf(':'));
  const srcPath = f.pin.slice(f.pin.indexOf(':') + 1);
  if (obj !== manifest.pin) fail(`PIN ${f.path} (portDomRefs) wpis ${obj} != manifest ${manifest.pin}`);
  let ref = null;
  if (webDir) {
    const p = join(webDir, srcPath);
    if (!existsSync(p)) fail(`WEB brak ${p}`);
    else ref = readFileSync(p);
  } else if (!noGit) {
    try {
      ref = execFileSync('git', ['show', f.pin], { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 });
    } catch {
      console.error(`GIT NIE_ZMIERZONO ${f.pin} (portDomRefs)`);
    }
  }
  if (ref) {
    refChecked++;
    if (sha256(ref) !== f.sha256 || ref.length !== f.bytes) fail(`REF ${f.pin} sha256/rozmiar != wpis portDomRefs`);
  }
}
console.log(`verify-repin-ui2-copies: pin=${manifest.pin} plików=${manifest.files.length} źródło_sprawdzone=${gitChecked} portDomRefs=${refs.length} ref_sprawdzone=${refChecked} porty_nakładki=${portsChecked} niezgodnych=${bad}`);
process.exitCode = bad === 0 ? 0 : 1;
