#!/usr/bin/env node
/**
 * select-k05a.mjs — deterministyczny wybór jednostek K05A (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K05A-Q1, r2).
 * Logika: `k01a-select-lib.mjs` z parametrem `block` = 5 (K05 wg pomiaru r2, 45 jednostek), lokalne kopie i DTO-podstawienia K05A-Z1/Z2.
 *
 * Tryb `--r3` (obrona zarzutu 4): wybór rundy 3 = wybór r2 (8) ∪ odroczone klasy T i P (18) = 26 jednostek bez DOM.
 * Zapis do `r3-logi/` (domyślnie); `kind` (const/function) wyprowadzany z linii deklaracji w pinie; LOC wg tego skryptu.
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/select-k05a.mjs --pin-dir <PIN_DIR> [--pomiar <pomiar-r2.json>] [--out-dir <katalog>] [--r3]
 */
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { selectK01a, loadPomiar } from './k01a-select-lib.mjs';

const K05_BLOCK = 5;
/** K05A-Z1: lokalne kopie typów/enum z pinu (zweryfikowane bajtowo przez verify-k05a-copies.mjs). */
const K05A_LOCAL_COPIES = [
  { name: 'TerenBazowy', pin: 'gra/src/types/hex.ts', a: 12, b: 24 },
  { name: 'OkolicaTryb', pin: 'gra/src/game/cities.ts', a: 48, b: 48 },
];
/** K05A-Z2: parametr `City` w danej jednostce zastąpiony DTO `CityHexRef` (weryfikuje verify-k05a-copies.mjs). */
const K05A_DTO_SUBST = { okolicaPreviewRadius: ['City'] };
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
const R3 = args.includes('--r3');
/** Tryb `--k05b` (P5-8 K05B, R-RUSTPORT-P5-8-CITYPANEL-K05B-Q1): wybór = 19 jednostek z DOM (odroczone klasy DOM z K05A). */
const K05B = args.includes('--k05b');
const OUT = resolve(
  argOf('--out-dir') ??
    fileURLToPath(
      new URL(
        K05B
          ? '../../../../dyspozycje/autobot/runs/R-RUSTPORT-P5-8-CITYPANEL-K05B-Q1/k05b-logi'
          : `../../../../dyspozycje/autobot/runs/R-RUSTPORT-P5-8-CITYPANEL-K05A-Q1/${R3 ? 'r3' : 'r2'}-logi`,
        import.meta.url,
      ),
    ),
);

const r = selectK01a({ pinDir: resolve(PIN_DIR), pomiar: loadPomiar(POMIAR), block: K05_BLOCK, localTypes: K05A_LOCAL_COPIES, dtoSubst: K05A_DTO_SUBST });
let selected = r.selected;
let deferred = r.deferred;
if (K05B) {
  // K05B: wybór = odroczone jednostki klasy DOM; reszta (T/P) zostaje w K05A r3 (bez zmian).
  const pinSrc = readFileSync(resolve(PIN_DIR, 'gra/src/ui/cityPanel.ts'), 'utf8').split('\n');
  selected = r.deferred
    .filter((d) => d.reason === 'DOM')
    .map((d) => ({ name: d.name, a: d.a, b: d.b, loc: d.loc, kind: /^(export )?const /.test(pinSrc[d.a - 1]) ? 'const' : 'function' }));
  deferred = r.deferred.filter((d) => d.reason !== 'DOM');
} else if (R3) {
  const isTP = (d) => /^(T|P):/.test(d.reason);
  const pinSrc = readFileSync(resolve(PIN_DIR, 'gra/src/ui/cityPanel.ts'), 'utf8').split('\n');
  const extra = r.deferred.filter(isTP).map((d) => ({
    name: d.name,
    a: d.a,
    b: d.b,
    loc: d.loc,
    kind: /^(export )?const /.test(pinSrc[d.a - 1]) ? 'const' : 'function',
  }));
  selected = [...r.selected, ...extra];
  deferred = r.deferred.filter((d) => !isTP(d));
}
const sumLoc = (xs) => xs.reduce((acc, x) => acc + x.loc, 0);
mkdirSync(OUT, { recursive: true });
writeFileSync(resolve(OUT, 'wybrane.json'), JSON.stringify(selected, null, 1) + '\n');
writeFileSync(resolve(OUT, 'odroczone.json'), JSON.stringify(deferred, null, 1) + '\n');
const reasons = {};
for (const d of deferred) {
  const k = d.reason.split(':')[0];
  reasons[k] = (reasons[k] ?? 0) + 1;
}
const summary = {
  mode: K05B ? 'k05b' : R3 ? 'r3' : 'r2',
  pin: r.pin,
  block: K05_BLOCK,
  pinUnits: r.pinUnits,
  k05Units: r.k01Units,
  k05Loc: r.k01Loc,
  domUnits: r.domUnits,
  domLoc: r.domLoc,
  selectedUnits: selected.length,
  selectedLoc: sumLoc(selected),
  deferredUnits: deferred.length,
  deferredLoc: sumLoc(deferred),
  deferredByClass: reasons,
  missingInPin: r.missingInPin,
};
writeFileSync(resolve(OUT, 'podsumowanie.json'), JSON.stringify(summary, null, 1) + '\n');
console.log(JSON.stringify(summary, null, 1));
console.log(`zapisano: ${OUT}`);
