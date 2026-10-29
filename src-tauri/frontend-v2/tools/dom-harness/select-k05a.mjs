#!/usr/bin/env node
/**
 * select-k05a.mjs — deterministyczny wybór jednostek K05A (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K05A-Q1, r1).
 * Logika: `k01a-select-lib.mjs` z parametrem `block` = 5 (K05 wg pomiaru r2, 45 jednostek).
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/select-k05a.mjs --pin-dir <PIN_DIR> [--pomiar <pomiar-r2.json>] [--out-dir <katalog>]
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { selectK01a, loadPomiar } from './k01a-select-lib.mjs';

const K05_BLOCK = 5;
const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const PIN_DIR = argOf('--pin-dir');
if (!PIN_DIR) {
  console.error('Użycie: node tools/dom-harness/select-k05a.mjs --pin-dir <katalog z gra/src i gra/data z edb8fb56>');
  process.exit(2);
}
const POMIAR = resolve(
  argOf('--pomiar') ??
    fileURLToPath(new URL('../../../../dyspozycje/autobot/runs/R-RUSTPORT-P5-8-CITYPANEL-K01A-Q1/r3-logi/pomiar-r2.json', import.meta.url)),
);
const OUT = resolve(argOf('--out-dir') ?? fileURLToPath(new URL('../../../../dyspozycje/autobot/runs/R-RUSTPORT-P5-8-CITYPANEL-K05A-Q1/r1-logi', import.meta.url)));

const r = selectK01a({ pinDir: resolve(PIN_DIR), pomiar: loadPomiar(POMIAR), block: K05_BLOCK });
mkdirSync(OUT, { recursive: true });
writeFileSync(resolve(OUT, 'wybrane.json'), JSON.stringify(r.selected, null, 1) + '\n');
writeFileSync(resolve(OUT, 'odroczone.json'), JSON.stringify(r.deferred, null, 1) + '\n');
const reasons = {};
for (const d of r.deferred) {
  const k = d.reason.split(':')[0];
  reasons[k] = (reasons[k] ?? 0) + 1;
}
const summary = {
  pin: r.pin,
  block: K05_BLOCK,
  pinUnits: r.pinUnits,
  k05Units: r.k01Units,
  k05Loc: r.k01Loc,
  domUnits: r.domUnits,
  domLoc: r.domLoc,
  selectedUnits: r.selected.length,
  selectedLoc: r.selectedLoc,
  deferredUnits: r.deferred.length,
  deferredLoc: r.deferredLoc,
  deferredByClass: reasons,
  missingInPin: r.missingInPin,
};
writeFileSync(resolve(OUT, 'podsumowanie.json'), JSON.stringify(summary, null, 1) + '\n');
console.log(JSON.stringify(summary, null, 1));
console.log(`zapisano: ${OUT}`);
