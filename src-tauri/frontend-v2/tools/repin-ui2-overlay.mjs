#!/usr/bin/env node
/**
 * repin-ui2-overlay.mjs — buduje katalog odniesienia „pin `edb8fb56` + nakładka REPIN UI-2" dla starszych harnessów
 * (`run.mjs`, `run-level1a.mjs`, `run-cycles.mjs`, `run-hud-empire.mjs`, …), które porównują frontend-v2 z pinem.
 *
 * Po repinie (R-RUSTPORT-REPIN-UI-2-A-Q1) pliki z `tools/repin-ui2-manifest.json` są kopiami z `origin/main`, więc
 * w odniesieniu pinu zastępujemy WYŁĄCZNIE te pliki ich wersją z weba (sha256 sprawdzane z manifestem). Reszta drzewa
 * pinu bez zmian — każda inna różnica harnessu nadal jest regresją.
 * R-RUSTPORT-REPIN-UI-2-B-Q1: także `portDomRefs` manifestu (wersje weba plików portu DOM `unitReplacePicker.ts`,
 * `siegeMapPanel.ts`); `run-level1a.mjs` podpina wtedy estymator Milicji webu tym samym wzorem, co DTO „Rust”.
 *
 * Użycie (z `src-tauri/frontend-v2/`):
 *   node tools/repin-ui2-overlay.mjs --pin-dir <PIN_DIR> --web-dir <WEB_DIR> --out <NOWY_KATALOG>
 * EXIT 0 <=> nakładka zbudowana i każdy plik zgodny z manifestem.
 */
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
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
// R-RUSTPORT-REPIN-UI-2-B-Q1: oprócz kopii bajtowych (`files`) nakładka wstawia wersje weba plików portu DOM
// (`portDomRefs`: `unitReplacePicker.ts`, `siegeMapPanel.ts`) — starsze harnessy porównują port z TĄ wersją weba.
const entries = [...manifest.files, ...(manifest.portDomRefs ?? [])];
for (const f of entries) {
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
console.log(`repin-ui2-overlay: plików=${entries.length} niezgodnych=${bad} out=${out}`);
process.exitCode = bad === 0 ? 0 : 1;
