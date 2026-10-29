#!/usr/bin/env node
/**
 * select-k07a.mjs — deterministyczny wybór jednostek K07A (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K07A-Q1).
 * Logika: `k01a-select-lib.mjs` z parametrem `block` = 7 (K07 wg pomiaru r2: 23 jednostki, 15 DOM).
 *
 * Tryby:
 *   r2 (domyślnie) — wynik lib (jednostki bez DOM i bez blokerów logiki).
 *   --k07b        — jednostki klasy DOM bloku K07 (P5-8 K07B; rozłączne z K07A).
 *   --r3          — wynik r2 ∪ jednostki odroczone klasą R, których zależności rozstrzyga adapter K07A-Z2/Z4
 *                   (`K07A_RESOLVED_BY_ADAPTER`). Klasy T/P: brak w pomiarze K07 (sprawdzane, puste).
 * Lokalna kopia typu pinu `City` (K07A-Z1 → `CityK07`) i nazwy portu (`PORT_NAME_OF`) są jawnymi stałymi tego skryptu.
 * Zakresy: koniec bloku = ostatnia linia kończąca się `}`/`};`/`;`/`)` (bez komentarzy następnej deklaracji).
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/select-k07a.mjs --pin-dir <PIN_DIR> [--pomiar <pomiar.json>] [--out-dir <katalog>] [--r3]
 */
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { selectK01a, loadPomiar } from './k01a-select-lib.mjs';
import { codeEndLine } from './k07a-subs.mjs';

const K07_BLOCK = 7;
/**
 * K07A-Z1: lokalna kopia typu pinu `City` → `CityK07` w porcie. PUSTA: lib dopuszcza lokalne kopie tylko dla importów typów
 * z logiki; `CityK07` nie jest importem. Zmierzone r3: wynik lib identyczny dla `[]` i `[{name:'City'}]` (3 i 3 jednostki przy wariancie R3 „tylko klasa R”).
 * Nazwy kopii są w `k07a-subs.mjs` (LOCAL_NAMES).
 */
const K07A_LOCAL_COPIES = [];
/** K07A-Z2/Z4: jednostki klasy R (import logiki), których zależności wchodzą przez adaptery portu (nie przez import z pinu). */
const K07A_RESOLVED_BY_ADAPTER = new Set(['w3CityChip']);
/** Nazwa w porcie dla jednostek przenoszonych z pinem o innej nazwie (K07A-Z1/Z3). */
const PORT_NAME_OF = {
  W3_STAT_RES_KEY: 'W3_STAT_RES_KEY_K07',
  resolveActiveCity: 'resolveK07aActiveCity',
  w3CityChip: 'w3CityChipK07',
  capitalBadgeOrButtonHtml: 'capitalBadgeOrButtonHtmlK07',
};
const K07A_DTO_SUBST = {};

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const PIN_DIR = argOf('--pin-dir');
if (!PIN_DIR) {
  console.error('Użycie: node tools/dom-harness/select-k07a.mjs --pin-dir <katalog z gra/src i gra/data z edb8fb56>');
  process.exit(2);
}
const POMIAR = resolve(
  argOf('--pomiar') ??
    fileURLToPath(new URL('../../../../dyspozycje/autobot/runs/R-RUSTPORT-P5-8-CITYPANEL-K07A-Q1/r1-logi/pomiar-r2.json', import.meta.url)),
);
const R3 = args.includes('--r3');
/** K07B (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K07B-Q1): jednostki DOM bloku K07 = odroczone klasą DOM (15 jednostek, 1 074 LOC). */
const K07B = args.includes('--k07b');
const OUT = resolve(
  argOf('--out-dir') ??
    fileURLToPath(new URL('../../../../dyspozycje/autobot/runs/R-RUSTPORT-P5-8-CITYPANEL-K07A-Q1/r1-logi', import.meta.url)),
);

const r = selectK01a({ pinDir: resolve(PIN_DIR), pomiar: loadPomiar(POMIAR), block: K07_BLOCK, localTypes: K07A_LOCAL_COPIES, dtoSubst: K07A_DTO_SUBST });
const pinLines = readFileSync(resolve(PIN_DIR, 'gra/src/ui/cityPanel.ts'), 'utf8').split('\n');

/** Koniec bloku: ostatnia linia kończąca się `}`/`};`/`;`/`)` w zakresie lib (bez komentarza następnej deklaracji). */
const trimEnd = (a, b) => codeEndLine(pinLines, a, b);
const kindOf = (a) => (/^(export )?let /.test(pinLines[a - 1]) ? 'let' : /^(export )?const /.test(pinLines[a - 1]) ? 'const' : 'function');
const toUnit = (d) => {
  const b = trimEnd(d.a, d.b);
  return { name: d.name, port: PORT_NAME_OF[d.name] ?? d.name, a: d.a, b, loc: b - d.a + 1, kind: kindOf(d.a) };
};

let selected = r.selected.map(toUnit);
let deferred = r.deferred;
if (K07B) {
  // Tryb K07B: rozłączny z K07A (8 jednostek nie-DOM) — wybór = wszystkie jednostki klasy DOM bloku K07.
  selected = r.deferred.filter((d) => d.reason === 'DOM').map(toUnit).sort((x, y) => x.a - y.a);
  deferred = r.deferred.filter((d) => d.reason !== 'DOM');
} else if (R3) {
  // Klasy T/P = zależność od nazwy pinu spoza K07 (cfg, activeCity, CityView): rozstrzyga adapter K07A-Z1..Z4.
  const takenByAdapter = (d) => /^(T|P):/.test(d.reason) || K07A_RESOLVED_BY_ADAPTER.has(d.name);
  selected = [...selected, ...r.deferred.filter(takenByAdapter).map(toUnit)].sort((x, y) => x.a - y.a);
  deferred = r.deferred.filter((d) => !takenByAdapter(d));
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
  mode: K07B ? 'k07b' : R3 ? 'r3' : 'r2',
  pin: r.pin,
  block: K07_BLOCK,
  pinUnits: r.pinUnits,
  k07Units: r.k01Units,
  k07Loc: r.k01Loc,
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
