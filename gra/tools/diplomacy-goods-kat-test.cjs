'use strict';
/**
 * diplomacy-goods-kat-test.cjs — R-DYPLO-DOBRA-KAT: kategorie dóbr handlowe bez cap 7.
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const BUNDLE = path.resolve(__dirname, '.dip-goods-kat-bundle.cjs');
const entry = path.resolve(__dirname, '.dip-goods-kat-entry.ts');
fs.writeFileSync(entry, `
export {
  tradableGoodsForOwner,
  tradeGoodsCategoriesFromParts,
  formatTradeGoodDisplayLabel,
} from '../src/game/diplomacy-goods.ts';
export { PASTWISKO_S } from '../src/render/pastwisko-modele.ts';
`);
esbuild.buildSync({
  entryPoints: [entry],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: BUNDLE,
  absWorkingDir: path.resolve(__dirname, '..'),
  logLevel: 'silent',
});
const {
  tradableGoodsForOwner,
  tradeGoodsCategoriesFromParts,
  formatTradeGoodDisplayLabel,
  PASTWISKO_S,
} = require(BUNDLE);

let pass = 0;
let fail = 0;
function ok(c, m) { if (c) { pass++; console.log('  OK:', m); } else { fail++; console.error('  FAIL:', m); } }

console.log('diplomacy-goods-kat-test');

const goods = tradableGoodsForOwner({
  activeResourceLabels: ['Drewno', 'Glina', 'Kamień', 'Ruda', 'Sól', 'Koń'],
  citySurowceSum: { drewno: 42, glina: 10, kamien: 5 },
});
ok(goods.length >= 6, 'indeks surowców bez cap slice');

const techs = ['T1', 'T2', 'T3', 'T4', 'T5'];
const cats = tradeGoodsCategoriesFromParts(goods, techs);
ok(cats.surowce.length === goods.length, 'wszystkie surowce w kategorii Surowce');
ok(cats.technologie.length === 5, 'wszystkie techy bez cap 3');
ok(cats.inne.length === 0, 'Inne puste (slot na przyszłość)');
ok(
  cats.surowce[0] === formatTradeGoodDisplayLabel(goods[0]),
  'etykieta z ilością gdy magazyn > 0',
);
ok(cats.surowce.some(l => l.includes('Drewno ×42')), 'Drewno ×42 w Surowce');

// R-WEB-DIPLO-GOODS-LABEL-RUDA-MIEDZI-Q1: etykieta „Ruda" → „Ruda miedzi" (klucz `ruda` bez zmian).
const rudaZero = tradableGoodsForOwner({ activeResourceLabels: ['Ruda'], citySurowceSum: {} });
ok(rudaZero.length === 1 && rudaZero[0].label === 'Ruda miedzi', 'Ruda → etykieta Ruda miedzi');
ok(rudaZero[0].key === 'ruda', 'klucz danych ruda bez zmian');
ok(formatTradeGoodDisplayLabel(rudaZero[0]) === 'Ruda miedzi ×0', 'aktywny surowiec z zapasem 0 → ×0');
ok(!goods.some(g => g.label === 'Ruda'), 'brak osobnej etykiety „Ruda" w dobrach');
const rudaStock = tradableGoodsForOwner({ activeResourceLabels: ['Ruda'], citySurowceSum: { ruda: 7 } });
ok(formatTradeGoodDisplayLabel(rudaStock[0]) === 'Ruda miedzi ×7', 'surowiec z zapasem >0 bez zmian (×7)');
const rudaFallback = tradableGoodsForOwner({ activeResourceLabels: [], citySurowceSum: { ruda: 3 } });
ok(rudaFallback[0].label === 'Ruda miedzi' && rudaFallback[0].ilosc === 3, 'magazyn bez aktywnego dostępu → Ruda miedzi ×3');
const cer = tradableGoodsForOwner({ activeResourceLabels: ['Ceramika'], citySurowceSum: {} });
ok(cer[0].ilosc === undefined, 'Ceramika: brak liczenia sztuk (ilosc undefined)');
const sol0 = tradableGoodsForOwner({ activeResourceLabels: ['Sól'], citySurowceSum: {} });
ok(sol0[0].ilosc === 0 && (sol0[0].ilosc ?? 0) === 0, 'zapas 0 nie jest oferowalny (ilosc 0 = brak)');

const emptyCats = tradeGoodsCategoriesFromParts([], []);
ok(emptyCats.surowce.length === 0 && emptyCats.technologie.length === 0, 'puste kategorie zachowane');

const baseS = 2.05 / 3;
ok(Math.abs(PASTWISKO_S - baseS * 1.5) < 1e-9, 'PASTWISKO_S ×1.5 (R-TRZODA-SCALE-MAP-Q1=B)');

try { fs.unlinkSync(entry); } catch (_) { /* ignore */ }
try { fs.unlinkSync(BUNDLE); } catch (_) { /* ignore */ }

console.log('PASS', pass, 'FAIL', fail);
process.exit(fail > 0 ? 1 : 0);
