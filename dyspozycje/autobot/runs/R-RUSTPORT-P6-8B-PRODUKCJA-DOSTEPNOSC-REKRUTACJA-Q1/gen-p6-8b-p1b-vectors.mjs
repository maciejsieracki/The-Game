// P6.8B-P1b (pin 91dc998a): wektory z URUCHOMIONEGO weba dla symboli P1b bez zaleznosci zewnetrznych:
// unitStockShortfallLabel (production.ts 682-693 w pinie, z UNIT_STOCK_GATE_LABEL i empireStockHas/stripDiacritics),
// UNIT_POPULATION_COST (production.ts 1977 w pinie) + populationCostOf (1980-1982 w pinie); wartosc z gra/data/miasto-params.json.
// Dodatkowo: stripDiacritics na CALEJ płaszczyźnie BMP (bez surogatow): lista znakow, dla ktorych wynik webu != toLowerCase(znak).
// Uruchomienie (Node 22, katalog tego runu, bez builda gra/):
//   node --experimental-transform-types --no-warnings --import ./repin-b-loader-register.mjs \
//        ./gen-p6-8b-p1b-vectors.mjs <WEB_ROOT (git archive 91dc998a gra)> <KATALOG_WYJSCIA> <KATALOG_ROBOCZY_POZA_REPO>
// Kodowanie liczb jak w gen-p6-8b-helpers-vectors.mjs. Funkcje wycinane z zrodla weba bez zmian (regex) + `export`.
// Prototypowe klucze UNIT_STOCK_GATE_LABEL (constructor, __proto__, toString...) daja w webie etykiete z wartoscia
// dziedziczona -- zapisywane jako {"$dev": "<wynik webu>"}; Rust zwraca None (odstepstwo przypiete testem).
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join, resolve as presolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const webRoot = presolve(process.argv[2]);
const outDir = presolve(process.argv[3]);
const scratch = presolve(process.argv[4] ?? '');
if (!process.argv[4]) throw new Error('podaj 3. argument: katalog roboczy poza repo');
mkdirSync(outDir, { recursive: true });
mkdirSync(scratch, { recursive: true });

const prodText = readFileSync(join(webRoot, 'gra/src/game/production.ts'), 'utf8');
const miastoParams = JSON.parse(readFileSync(join(webRoot, 'gra/data/miasto-params.json'), 'utf8'));

const grab = (re, what) => {
  const m = prodText.match(re);
  if (!m) throw new Error(`nie znaleziono: ${what}`);
  return m[0];
};

// --- 1. moduł webowy: wycinki bez zmian + export -----------------------------------
const gate = grab(/const UNIT_STOCK_GATE_LABEL: [\s\S]*?\n\};\n/, 'UNIT_STOCK_GATE_LABEL');
const stock = grab(/function empireStockHas\([\s\S]*?\n\}\n/, 'empireStockHas');
const strip = grab(/function stripDiacritics\(s: string\): string \{[\s\S]*?\n\}\n/, 'stripDiacritics');
const shortfall = grab(/export function unitStockShortfallLabel\([\s\S]*?\n\}\n/, 'unitStockShortfallLabel')
  .replace(/^export function/, 'export function');
const popCostConst = grab(/export const UNIT_POPULATION_COST = [^\n]*\n/, 'UNIT_POPULATION_COST');
const popCostFn = grab(/export function populationCostOf\([\s\S]*?\n\}\n/, 'populationCostOf');

const modText = [
  `const miastoParams: any = ${JSON.stringify(miastoParams)};`,
  `export ${strip}`,
  gate.replace(/^const /m, 'export const '),
  stock.replace(/^function /m, 'export function '),
  shortfall,
  popCostConst,
  popCostFn,
].join('\n');
writeFileSync(join(scratch, 'p1b-web.ts'), modText);
const W = await import(pathToFileURL(join(scratch, 'p1b-web.ts')).href);

// --- 2. kodowanie ----------------------------------------------------------------
const enc = (x) => {
  if (typeof x !== 'number') return x;
  if (Object.is(x, -0)) return { $n: '-0' };
  if (Number.isNaN(x)) return { $n: 'NaN' };
  if (x === Infinity) return { $n: 'Infinity' };
  if (x === -Infinity) return { $n: '-Infinity' };
  if (Number.isInteger(x)) return x;
  return { $f: String(x) };
};

// --- 3. unitStockShortfallLabel ------------------------------------------------------
// Pole Surowiec: 'absent' = klucz nieobecny; inne wartosci jak w danych.
const surowiecInputs = [
  'absent', null, '', '   ', 'Brąz', ' Brąz ', 'BRĄZ', 'Brąz', 'braz', 'Braz', ' braz\t',
  'Żelazo', 'zelazo', 'Zelazo', 'ŻELAZO', 'Drewno', 'drewno', ' Drewno ', 'Kamień', 'Kamien',
  'Brąź', 'Żelazȯ', 'Drewno-x', 'brązu', '—', '-',
];
const stockInputs = [
  'absent', null, {}, { braz: 0 }, { braz: -1 }, { braz: 0.0001 }, { braz: NaN }, { braz: Infinity },
  { braz: 1 }, { zelazo: 5 }, { drewno: 0.5 }, { drewno: 0 }, { 'Brąz': 5 }, { braz: -0 },
  { braz: 1, zelazo: 0, drewno: 2 }, { zelazo: 3, drewno: 0 },
];
const mkU = (s) => (s === 'absent' ? {} : { Surowiec: s });
const mkStock = (s) => (s === 'absent' ? undefined : s);

const protoKeys = new Set(['constructor', '__proto__', 'toString', 'hasOwnProperty', 'valueOf', 'isPrototypeOf']);
const shortfallCases = [];
const devCases = [];
for (const s of surowiecInputs) {
  for (const st of stockInputs) {
    const out = W.unitStockShortfallLabel(mkU(s), mkStock(st));
    const stockEnc = st === 'absent' ? { absent: true }
      : st === null ? null
        : Object.fromEntries(Object.entries(st).map(([k, v]) => [k, enc(v)]));
    shortfallCases.push({ surowiec: s === 'absent' ? { absent: true } : s, stock: stockEnc, out });
  }
}
// Klucze prototypowe: web daje etykiete z wartoscia dziedziczona (dev), nie null.
// Uwaga: stripDiacritics zamienia klucz na lowercase, wiec tylko 'constructor' i '__proto__' sa prototypowe.
for (const k of ['constructor', '__proto__']) {
  const out = W.unitStockShortfallLabel({ Surowiec: k }, undefined);
  devCases.push({ surowiec: k, stock: 'absent', out: { $dev: String(out) }, outIsString: typeof out === 'string' });
  if (!protoKeys.has(k)) throw new Error('bad key');
}
// Wynik null/brak etykiety dla kluczy zwyklych jest w shortfallCases.

// --- 4. populationCostOf / UNIT_POPULATION_COST -----------------------------------
const popItems = [
  { kind: 'jednostka', id: 'Wojownik', nazwa: 'Wojownik', koszt: 10 },
  { kind: 'jednostka', id: 'Zwiadowca', nazwa: 'Zwiadowca', koszt: 0 },
  { kind: 'budynek', id: 'koszary', nazwa: 'Koszary', koszt: 30 },
  { kind: 'budynek', id: 'palac', nazwa: 'Palac', koszt: 0 },
  { kind: 'jednostka', id: 'x', nazwa: 'x', koszt: NaN },
];
const popCases = popItems.map((it) => ({ item: { ...it, koszt: enc(it.koszt) }, out: enc(W.populationCostOf(it)) }));

// --- 5. stripDiacritics: pelna plaszczyzna BMP -------------------------------------
// Rust sprawdza wszystkie znaki BMP; oczekiwany wynik = wpis z tej listy, a dla pozostalych toLowerCase(znak).
const stripChanged = [];
for (let c = 0; c <= 0xFFFF; c++) {
  if (c >= 0xD800 && c <= 0xDFFF) continue;
  const ch = String.fromCharCode(c);
  const out = W.stripDiacritics(ch);
  if (out !== ch.toLowerCase()) stripChanged.push({ c, out });
}

const doc = {
  pin: '91dc998a5f1b51ad29e0f4785edfd45655445c53',
  zrodlo: 'gra/src/game/production.ts 682-693 (unitStockShortfallLabel + UNIT_STOCK_GATE_LABEL, empireStockHas, stripDiacritics), 1977 (UNIT_POPULATION_COST), 1980-1982 (populationCostOf); miasto-params.json; stripDiacriticsChanged: pelny BMP',
  unitPopulationCost: enc(W.UNIT_POPULATION_COST),
  stockShortfall: shortfallCases,
  stockShortfallProto: devCases,
  populationCost: popCases,
  stripDiacriticsChanged: stripChanged,
};
const outFile = join(outDir, 'p1b.json');
writeFileSync(outFile, JSON.stringify(doc));
console.log('zapisano', outFile, 'liczniki:', {
  shortfall: shortfallCases.length, proto: devCases.length, pop: popCases.length,
  unitPopulationCost: W.UNIT_POPULATION_COST,
});
