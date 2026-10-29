#!/usr/bin/env node
/**
 * select-k01a.mjs — CLI deterministycznego wyboru jednostek K01A (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K01A-Q1 r3).
 * Logika: `k01a-select-lib.mjs` (ta sama, której używa gate S w `run-k01a.mjs`).
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/select-k01a.mjs --pin-dir <PIN_DIR> [--pomiar <pomiar-r2.json>] [--out-dir <katalog>]
 *
 * Zapisuje do `--out-dir` (domyślnie katalog `r3-logi` runu): `wybrane.json`, `odroczone.json`, `podsumowanie.json`.
 * Wynik na stdout: liczby (jednostki, LOC) i rozkład powodów odroczenia.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { selectK01a, loadPomiar } from './k01a-select-lib.mjs';

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const PIN_DIR = argOf('--pin-dir');
if (!PIN_DIR) {
  console.error('Użycie: node tools/dom-harness/select-k01a.mjs --pin-dir <katalog z gra/src i gra/data z edb8fb56>');
  process.exit(2);
}
const POMIAR = resolve(
  argOf('--pomiar') ??
    fileURLToPath(new URL('../../../../dyspozycje/autobot/runs/R-RUSTPORT-P5-8-CITYPANEL-K01A-Q1/r3-logi/pomiar-r2.json', import.meta.url)),
);
const OUT = resolve(argOf('--out-dir') ?? fileURLToPath(new URL('../../../../dyspozycje/autobot/runs/R-RUSTPORT-P5-8-CITYPANEL-K01A-Q1/r3-logi', import.meta.url)));

const r = selectK01a({ pinDir: resolve(PIN_DIR), pomiar: loadPomiar(POMIAR) });
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
  pomiar: POMIAR.split('/').slice(-4).join('/'),
  pinUnits: r.pinUnits,
  k01Units: r.k01Units,
  k01Loc: r.k01Loc,
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
