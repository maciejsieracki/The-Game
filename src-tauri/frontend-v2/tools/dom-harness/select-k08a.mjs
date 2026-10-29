#!/usr/bin/env node
/**
 * select-k08a.mjs — deterministyczny wybór jednostek K08A (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K08A-Q1).
 * Logika: `k01a-select-lib.mjs` z parametrem `block` = 8 (K08 wg pomiaru r2: 39 jednostek, 24 DOM → K08B).
 *
 * Tryby:
 *   r2 (domyślnie) — wynik lib (jednostki bez DOM i bez blokerów logiki): 10 jednostek.
 *   --r3          — wynik r2 ∪ jednostki odroczone klasą T/P (stan modułu / kontroler: `uxSectionRefresh`,
 *                   `activeCity`, `activeOnClose`, `rerender`, `clearGarrisonPanel`), których zależności rozstrzyga
 *                   adapter K08A-Z3/Z4 (nie odraczamy z powodu łańcucha zależności — wymaganie z doświadczenia K01A–K07A).
 *                   Jednostki klasy DOM zostają odłożone (K08B, osobny temat).
 * Brak lokalnych kopii typów i zmian nazw (`PORT_NAME_OF` puste): nazwy pinu zachowane.
 * Zakresy: koniec bloku = ostatnia linia kończąca się `}`/`};`/`;`/`)` (bez komentarzy następnej deklaracji).
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/select-k08a.mjs --pin-dir <PIN_DIR> [--pomiar <pomiar.json>] [--out-dir <katalog>] [--r3]
 */
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { selectK01a, loadPomiar } from './k01a-select-lib.mjs';
import { codeEndLine } from './k08a-subs.mjs';

const K08_BLOCK = 8;
/** K08A: brak lokalnych kopii typów pinu w wyborze (typy `CityPanelIconTab` itd. są w bloku jednostek). */
const K08A_LOCAL_COPIES = [];
/** K08A: jednostki klasy R rozstrzygane adapterem (pusta: w bloku K08 nie ma klasy R poza DOM). */
const K08A_RESOLVED_BY_ADAPTER = new Set();
/** Nazwa w porcie dla jednostek przenoszonych z pinem o innej nazwie: brak (nazwy pinu zachowane). */
const PORT_NAME_OF = {};
const K08A_DTO_SUBST = {};

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const PIN_DIR = argOf('--pin-dir');
if (!PIN_DIR) {
  console.error('Użycie: node tools/dom-harness/select-k08a.mjs --pin-dir <katalog z gra/src i gra/data z edb8fb56>');
  process.exit(2);
}
const POMIAR = resolve(
  argOf('--pomiar') ??
    fileURLToPath(new URL('../../../../dyspozycje/autobot/runs/R-RUSTPORT-P5-8-CITYPANEL-K08A-Q1/r1-logi/pomiar-r2.json', import.meta.url)),
);
const R3 = args.includes('--r3');
const OUT = resolve(
  argOf('--out-dir') ??
    fileURLToPath(new URL('../../../../dyspozycje/autobot/runs/R-RUSTPORT-P5-8-CITYPANEL-K08A-Q1/r1-logi', import.meta.url)),
);

const r = selectK01a({ pinDir: resolve(PIN_DIR), pomiar: loadPomiar(POMIAR), block: K08_BLOCK, localTypes: K08A_LOCAL_COPIES, dtoSubst: K08A_DTO_SUBST });
const pinLines = readFileSync(resolve(PIN_DIR, 'gra/src/ui/cityPanel.ts'), 'utf8').split('\n');

/** Koniec bloku: ostatnia linia kończąca się `}`/`};`/`;`/`)` w zakresie lib (bez komentarza następnej deklaracji). */
const trimEnd = (a, b) => codeEndLine(pinLines, a, b);
const kindOf = (a) => (/^(export )?let /.test(pinLines[a - 1]) ? 'let' : /^(export )?const /.test(pinLines[a - 1]) ? 'const' : /^(export )?type |^(export )?interface /.test(pinLines[a - 1]) ? 'type' : 'function');
const toUnit = (d) => {
  const b = trimEnd(d.a, d.b);
  return { name: d.name, port: PORT_NAME_OF[d.name] ?? d.name, a: d.a, b, loc: b - d.a + 1, kind: kindOf(d.a) };
};

let selected = r.selected.map(toUnit);
let deferred = r.deferred;
if (R3) {
  // Klasy T/P = zależność od stanu modułu/kontrolera pinu (uxSectionRefresh, activeCity, activeOnClose, rerender):
  // rozstrzyga adapter K08A-Z3/Z4 (wiązanie w kontrolerze, nie w K08A).
  const takenByAdapter = (d) => /^(T|P):/.test(d.reason) || K08A_RESOLVED_BY_ADAPTER.has(d.name);
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
  mode: R3 ? 'r3' : 'r2',
  pin: r.pin,
  block: K08_BLOCK,
  pinUnits: r.pinUnits,
  k08Units: r.k01Units,
  k08Loc: r.k01Loc,
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
