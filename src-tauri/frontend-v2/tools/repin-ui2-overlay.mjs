#!/usr/bin/env node
/**
 * repin-ui2-overlay.mjs — buduje katalog odniesienia „pin `edb8fb56` + nakładka REPIN UI-2" dla starszych harnessów
 * (`run.mjs`, `run-level1a.mjs`, `run-cycles.mjs`, `run-hud-empire.mjs`, …), które porównują frontend-v2 z pinem.
 *
 * Po repinie (R-RUSTPORT-REPIN-UI-2-A-Q1) pliki z `tools/repin-ui2-manifest.json` są kopiami z `origin/main`, więc
 * w odniesieniu pinu zastępujemy WYŁĄCZNIE te pliki ich wersją z weba (sha256 sprawdzane z manifestem). Reszta drzewa
 * pinu bez zmian — każda inna różnica harnessu nadal jest regresją.
 *
 * Użycie (z `src-tauri/frontend-v2/`):
 *   node tools/repin-ui2-overlay.mjs --pin-dir <PIN_DIR> --web-dir <WEB_DIR> --out <NOWY_KATALOG>
 * EXIT 0 <=> nakładka zbudowana i każdy plik zgodny z manifestem.
 */
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const [pinDir, webDir, out] = [argOf('--pin-dir'), argOf('--web-dir'), argOf('--out')];
if (!pinDir || !webDir || !out) {
  console.error('Użycie: node tools/repin-ui2-overlay.mjs --pin-dir <PIN_DIR> --web-dir <WEB_DIR> --out <NOWY_KATALOG>');
  process.exit(2);
}
if (existsSync(out)) {
  console.error(`--out ${out} już istnieje (wymagany nowy katalog)`);
  process.exit(2);
}
const manifest = JSON.parse(readFileSync(new URL('./repin-ui2-manifest.json', import.meta.url), 'utf8'));
cpSync(resolve(pinDir), resolve(out), { recursive: true });
let bad = 0;
for (const f of manifest.files) {
  const srcPath = f.pin.slice(f.pin.indexOf(':') + 1);
  const buf = readFileSync(join(resolve(webDir), srcPath));
  const sha = createHash('sha256').update(buf).digest('hex');
  if (sha !== f.sha256) {
    bad++;
    console.error(`SHA ${srcPath} web=${sha} manifest=${f.sha256}`);
    continue;
  }
  const dst = join(resolve(out), srcPath);
  mkdirSync(dirname(dst), { recursive: true });
  writeFileSync(dst, buf);
  console.log(`nakładka ${srcPath} (${buf.length} B)`);
}
// R-RUSTPORT-REPIN-UI-2-F-Q1 (addytywnie): porty DOM przepięte na web (`tools/repin-ui2*-ported.json`, jeden plik na
// partię) — w odniesieniu pinu podmieniany plik WEBA (sha256 weba z listy), port zostaje portem.
let ported = 0;
const toolsDir = new URL('./', import.meta.url);
for (const name of readdirSync(toolsDir).filter((n) => /^repin-ui2.*-ported\.json$/.test(n)).sort()) {
  const list = JSON.parse(readFileSync(new URL(name, toolsDir), 'utf8'));
  for (const f of list.files) {
    const buf = readFileSync(join(resolve(webDir), f.web));
    const sha = createHash('sha256').update(buf).digest('hex');
    if (sha !== f.sha256 || buf.length !== f.bytes) {
      bad++;
      console.error(`SHA ${f.web} web=${sha}/${buf.length} ${name}=${f.sha256}/${f.bytes}`);
      continue;
    }
    const dst = join(resolve(out), f.web);
    mkdirSync(dirname(dst), { recursive: true });
    writeFileSync(dst, buf);
    ported++;
    console.log(`nakładka (port DOM, ${name}) ${f.web} (${buf.length} B)`);
  }
}
console.log(`repin-ui2-overlay: plików=${manifest.files.length} portów_DOM=${ported} niezgodnych=${bad} out=${out}`);
process.exitCode = bad === 0 ? 0 : 1;
