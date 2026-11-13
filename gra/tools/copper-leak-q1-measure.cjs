'use strict';
/**
 * copper-leak-q1-measure.cjs -- R-WEB-AUDIT-COPPER-INCOME-LEAK-Q1: narzedzie pomiaru stanu miedzi (`ruda`) per cywilizacja.
 * Tylko KOPIA gry poza repo; repo gry (src/) pozostaje nietkniete.
 *
 *  1) node tools/copper-leak-q1-measure.cjs --prepare <kopia-gra>
 *     (uruchamia longrun-100-turns-leak-q1-measure.cjs --prepare: hak __leakDump + licznik faz AI,
 *      potem dokleja do __leakDump.dump() odczyt City.surowce.ruda zsumowany per ownerId
 *      i zapisuje go w window.__phaseT.ruda = { "<ownerId>": ilosc }. Pole trafia do kazdej linii
 *      zdarzenia "turn" w jsonl jako phase.ruda -- bez zmian w civ-test-hooks.ts ani w kodzie gry.)
 *  2) (w kopii) node ./node_modules/vite/bin/vite.js build --outDir <poza repo>/dist --emptyOutDir
 *  3) node tools/longrun-100-turns-leak-q1-measure.cjs --run --pw <gra z node_modules/playwright>
 *        --dist <dist> --out <katalog> --seed <N> --turns <T> --cpuprof 0
 *     Wynik: <out>/seed<N>.jsonl; tabela tura -> miedz per owner: phase.ruda.
 * Uwaga: ok. 50 s na jedna ture przy 42 miastach (headless, swiftshader) -- patrz raport R-WEB-AUDIT-COPPER-INCOME-LEAK-Q1.
 */
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const i = process.argv.indexOf('--prepare');
if (i < 0 || !process.argv[i + 1]) {
  console.error('usage: node tools/copper-leak-q1-measure.cjs --prepare <kopia-gra>');
  process.exit(2);
}
const root = path.resolve(process.argv[i + 1]);
cp.execFileSync('node', [path.join(__dirname, 'longrun-100-turns-leak-q1-measure.cjs'), '--prepare', root], { stdio: 'inherit' });

const file = path.join(root, 'src', 'main.ts');
let s = fs.readFileSync(file, 'utf8');
if (s.includes('__phaseT.ruda')) { console.log('juz zapatchowany (ruda)'); process.exit(0); }
const needle = '      return { turn, units: units.length, cities: cities.length, sizes, phase: (window as any).__phaseT };';
const hits = s.split(needle).length - 1;
if (hits !== 1) throw new Error('needle dump return: znaleziono ' + hits);
const add = '      { const __cu: Record<string, number> = {}; for (const c of cities as any[]) { const k = String(c.ownerId); __cu[k] = (__cu[k] || 0) + Number((c.surowce && c.surowce.ruda) || 0); } (window as any).__phaseT.ruda = __cu; const __er: Record<string, number> = {}; for (const k of Object.keys(__cu)) { try { __er[k] = empireEpochForOwner(Number(k)); } catch (_) { __er[k] = -1; } } (window as any).__phaseT.era = __er; (window as any).__phaseT.ry = JSON.parse(JSON.stringify((globalThis as any).__ry || {})); (globalThis as any).__ry = {}; (window as any).__phaseT.mines = JSON.parse(JSON.stringify((globalThis as any).__mines || {})); }\n';
s = s.replace(needle, () => add + needle);
fs.writeFileSync(file, s);
console.log('dopisano odczyt ruda per owner w', file);

// Runda 4: instrumentacja zrodla przyrostu (TYLKO kopia poza repo): surowy kredyt `ruda` z terytorium per owner
// (suma terrYield.ruda i liczba miast) -> phase.ry, oraz heksy kopalni miedzi (owner, zloze, nakladka) -> phase.mines.
const te = path.join(root, 'src', 'game', 'turn-economy.ts');
let t = fs.readFileSync(te, 'utf8');
const a = "    creditTerritory('ruda', terrYield.ruda);\n";
if (t.split(a).length !== 2) throw new Error('needle turn-economy ruda');
t = t.replace(a, () => "    if (!stopAfterProduction && terrYield.ruda && terrYield.ruda > 0) { const __g: any = globalThis as any; const __m = (__g.__ry = __g.__ry || {}); const __o = (__m[ownerId] = __m[ownerId] || { raw: 0, n: 0 }); __o.raw += terrYield.ruda; __o.n++; }\n" + a);
const b = "      if (!yieldRow) continue;\n      const rec = out.get(cityId) ?? {};";
if (t.split(b).length !== 2) throw new Error('needle turn-economy yieldRow');
t = t.replace(b, () => "      if (!yieldRow) continue;\n      if (yieldRow.resourceKey === 'ruda') { const __g: any = globalThis as any; const __mm = (__g.__mines = __g.__mines || {}); __mm[q + ',' + r] = { o: owner, c: cityId, z: String((hex as any).zloze ?? ''), n: String((hex as any).nakladka ?? ''), a: yieldRow.amount }; }\n      const rec = out.get(cityId) ?? {};");
fs.writeFileSync(te, t);
console.log('dopisano ry/mines w', te);
