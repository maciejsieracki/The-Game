'use strict';
/**
 * danina-podatek-nazwa-test.cjs — regresja nazwy strumienia "Danina/Podatek"
 * (decyzje wlasciciela 65B/66B, 2026-07-25: "Handel -> Danina -> Podatek").
 * node tools/danina-podatek-nazwa-test.cjs
 *
 * Sprawdza game/danina-nazwa.ts: bramka Danina->Podatek (Waluta odkryta ORAZ
 * Mennica zbudowana W STOLICY tej cywilizacji), PARYTET AI (ownerId-agnostic),
 * oraz ze strumien z tras handlowych ("Handel") jest od tej bramki niezalezny.
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.danina-podatek-nazwa-entry.ts');
const BUNDLE = path.resolve(__dirname, '.danina-podatek-nazwa-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  isPodatekActive, daninaLabel, mennicaWStolicy, daninaLabelForOwnerByCityList,
} from '../src/game/danina-nazwa';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  outfile: BUNDLE,
  absWorkingDir: GRA,
  logLevel: 'silent',
});

const M = require(BUNDLE);

let pass = 0, fail = 0;
function ok(c, m) {
  if (c) { pass++; console.log('  PASS:', m); }
  else { fail++; console.error('  FAIL:', m); }
}

// Pomocnicze: symulacja imperium z 1 stolica + 1 miasto regionalne + 1 miasto oddalone.
function makeCities(ownerId) {
  return [
    { id: `${ownerId}-stolica`, ownerId },
    { id: `${ownerId}-region`, ownerId },
    { id: `${ownerId}-oddalone`, ownerId },
  ];
}

// 1) Cywilizacja BEZ Waluty -> "Danina" (nawet z Mennica w stolicy -- bramka wymaga OBU warunkow).
{
  const capitalId = '0-stolica';
  const built = new Map([[capitalId, ['mennica']]]);
  const label = M.daninaLabelForOwnerByCityList(0, false, makeCities(0), built, capitalId);
  ok(label === 'Danina', '1) brak Waluty -> Danina (mimo Mennicy w stolicy)');
  ok(M.isPodatekActive(false, true) === false, '1b) isPodatekActive(false, true) === false');
}

// 2) Waluta odkryta, ale BRAK Mennicy w stolicy -> "Danina".
{
  const capitalId = '1-stolica';
  const built = new Map([[capitalId, []]]);
  const label = M.daninaLabelForOwnerByCityList(1, true, makeCities(1), built, capitalId);
  ok(label === 'Danina', '2) Waluta bez Mennicy w stolicy -> Danina');
  ok(M.mennicaWStolicy(capitalId, []) === false, '2b) mennicaWStolicy(capitalId, []) === false');
}

// 3) Mennica zbudowana, ale w mieście REGIONALNYM (nie w stolicy) -> "Danina".
{
  const capitalId = '2-stolica';
  const regionId = '2-region';
  const built = new Map([
    [capitalId, []],
    [regionId, ['mennica']],
  ]);
  const label = M.daninaLabelForOwnerByCityList(2, true, makeCities(2), built, capitalId);
  ok(label === 'Danina', '3) Mennica w miescie regionalnym (nie w stolicy) -> Danina');
  ok(M.mennicaWStolicy(capitalId, built.get(capitalId)) === false, '3b) stolica bez Mennicy mimo Mennicy gdzie indziej w imperium');
}

// 4) Waluta + Mennica W STOLICY -> "Podatek", we WSZYSTKICH miastach tej cywilizacji
//    (rowniez oddalonych -- nazwa jest CYWILIZACYJNA, nie per-miasto).
{
  const ownerId = 3;
  const capitalId = `${ownerId}-stolica`;
  const built = new Map([[capitalId, ['mennica']]]);
  const cities = makeCities(ownerId);
  ok(M.mennicaWStolicy(capitalId, built.get(capitalId)) === true, '4a) Mennica w stolicy wykryta');
  const labelStolica = M.daninaLabelForOwnerByCityList(ownerId, true, cities, built, capitalId);
  ok(labelStolica === 'Podatek', '4b) Waluta+Mennica w stolicy -> Podatek (stolica)');
  // Miasto oddalone tej samej cywilizacji -- ta sama bramka, ta sama nazwa (cywilizacyjna, nie per-miasto).
  const oddaloneBuilt = built.get('3-oddalone') ?? [];
  ok(!oddaloneBuilt.includes('mennica'), '4c) miasto oddalone samo nie ma Mennicy');
  const labelOddalone = M.daninaLabelForOwnerByCityList(ownerId, true, cities, built, capitalId);
  ok(labelOddalone === 'Podatek', '4d) miasto oddalone tej samej cywilizacji tez pokazuje Podatek');
}

// 5) PARYTET AI: cywilizacja AI (ownerId != 0) w tej samej sytuacji dostaje "Podatek" tak samo.
{
  const aiOwnerId = 7;
  const capitalId = `${aiOwnerId}-stolica`;
  const built = new Map([[capitalId, ['mennica']]]);
  const cities = makeCities(aiOwnerId);
  const label = M.daninaLabelForOwnerByCityList(aiOwnerId, true, cities, built, capitalId);
  ok(label === 'Podatek', '5) AI (ownerId=7) z Waluta+Mennica w stolicy -> Podatek (parytet)');
  // Ten sam wynik co gracz (ownerId=0) w identycznej sytuacji strukturalnej.
  const playerCapitalId = '0-stolica';
  const playerBuilt = new Map([[playerCapitalId, ['mennica']]]);
  const playerLabel = M.daninaLabelForOwnerByCityList(0, true, makeCities(0), playerBuilt, playerCapitalId);
  ok(playerLabel === label, '5b) gracz i AI w tej samej sytuacji daja identyczna etykiete (PARYTET)');
}

// 6) Strumien z tras handlowych nazywa sie "Handel" NIEZALEZNIE od Waluty/Mennicy --
//    danina-nazwa.ts w ogole nie zna pojecia "trasy handlowe" (osobny mechanizm,
//    trade-routes.ts), wiec ten test dokumentuje kontrakt: modul nie eksportuje
//    zadnej etykiety dla tras, a jedyne dwie wartosci jakie zwraca to 'Danina'/'Podatek'.
{
  const TRADE_ROUTE_LABEL = 'Handel';
  const capitalId = '9-stolica';
  const built = new Map([[capitalId, ['mennica']]]);
  const label = M.daninaLabelForOwnerByCityList(9, true, makeCities(9), built, capitalId);
  ok(label !== TRADE_ROUTE_LABEL, '6a) etykieta strumienia miasta nigdy nie jest "Handel"');
  ok(label === 'Podatek', '6b) (kontekst 6a) tu akurat Podatek -- ale nigdy "Handel", niezaleznie od bramki');
  // Bez Waluty/Mennicy tez nigdy "Handel" -- zawsze "Danina" (default), nigdy nazwa tras.
  const labelDefault = M.daninaLabelForOwnerByCityList(9, false, makeCities(9), new Map(), null);
  ok(labelDefault === 'Danina' && labelDefault !== TRADE_ROUTE_LABEL, '6c) domyslnie "Danina", nigdy "Handel"');
}

console.log(`\ndanina-podatek-nazwa-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
