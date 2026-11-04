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
import { existsSync, readFileSync } from 'node:fs';
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
console.log(`verify-repin-ui2-copies: pin=${manifest.pin} plików=${manifest.files.length} źródło_sprawdzone=${gitChecked} niezgodnych=${bad}`);
process.exitCode = bad === 0 ? 0 : 1;
