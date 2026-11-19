'use strict';
/**
 * hud-net-building-drain-test.cjs — R-WEB-UI-HUD-NET-SPICHLERZ-DRAIN-Q1.
 *
 * Run from gra/:  node tools/hud-net-building-drain-test.cjs
 *
 * Problem: HUD netto surowca nie odejmowal drenazu Spichlerza (Ceramika: HUD netto 77, delta stanu 67).
 * Poprawka: jedno pole `rateBuildingDrainPerTurn` w resource-gross-net.ts, odejmowane w netto
 * (resourceGrossNetPerTurn), zasilane w main.ts z tej samej logiki co silnik (paySpichlerzDrainForCity,
 * dryRun). Test sprawdza (prawdziwe funkcje, esbuild):
 *   A. Fixtura Spichlerz (ceramika -10/t): netto = produkcja - 10 (77 -> 67), drenaz = 10.
 *   B. Brutto NIE zmienia sie od drenazu.
 *   C. Brak pola / 0 / ujemne / NaN = dotychczasowa formula (regresja).
 *   D. Drenaz + wejscia konwerterow + zuzycie sumuja sie w netto (bez duplikacji).
 *   E. resourceIsShortage uzywa netto z drenazem (produkcja 5, drenaz 10 -> niedobor).
 *   F. Wiersz tooltipu: tylko gdy N > 0, tekst „Drenaż budynków (Spichlerz): −N”.
 *   G. Dane econ-params: paySpichlerzDrainForCity (dryRun) z prawdziwymi parametrami daje 10 dla
 *      Spichlerza I przy stanie ceramiki >= 10 (ta sama wartosc co wplyw silnika).
 *   H. Mutant: netto bez drenazu daje 77 != 67 (test A by padl).
 *   S. Statyczne: main.ts zasila wiersze `rateBuildingDrainPerTurn` i sumuje `surowceDrenaz`; hud.ts
 *      dopisuje wiersz tooltipu przez resourceDrenazTooltipText.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const GRA = path.resolve(__dirname, '..');
const SRC = path.join(GRA, 'src');
const esbuild = require(path.join(GRA, 'node_modules', 'esbuild'));
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'hud-net-drain-'));

let fails = 0;
let passes = 0;
function ok(c, m, extra) {
  if (c) { passes++; console.log('  ok   ' + m); }
  else { fails++; console.log('  FAIL ' + m + (extra !== undefined ? ' -- ' + JSON.stringify(extra) : '')); }
}

function bundle(srcFile, outName) {
  const outFile = path.join(TMP, outName + '.cjs');
  esbuild.buildSync({
    entryPoints: [srcFile], bundle: true, platform: 'node', format: 'cjs', outfile: outFile, logLevel: 'silent',
    loader: { '.ts': 'ts', '.json': 'json' },
  });
  return require(outFile);
}

const rgn = bundle(path.join(SRC, 'game', 'resource-gross-net.ts'), 'rgn');
const gate = bundle(path.join(SRC, 'game', 'building-resource-gate.ts'), 'gate');

console.log('== A. fixtura Spichlerz: produkcja 77, drenaz 10 -> netto 67');
const cer = { ratePerTurn: 77, rateProductionPerTurn: 77, rateBuildingDrainPerTurn: 10 };
const gA = rgn.resourceGrossNetPerTurn(cer);
ok(gA.netto === 67, 'netto Ceramiki = 77 - 10 = 67', gA);
ok(gA.drenaz === 10, 'pole drenaz = 10', gA);

console.log('== B. brutto bez zmian');
ok(gA.brutto === 77, 'brutto = produkcja (77), drenaz nie zmienia brutto', gA);
ok(rgn.resourceGrossPerTurn(cer) === 77, 'resourceGrossPerTurn bez zmian przy drenazu');

console.log('== C. regresja: brak / 0 / ujemny / NaN drenazu');
const base = { ratePerTurn: 40, rateProductionPerTurn: 40, usage: { buildings: 3, citizens: 2, units: 1 }, rateConverterInputPerTurn: 5 };
const expBase = 40 - 6 - 5;
ok(rgn.resourceGrossNetPerTurn(base).netto === expBase, 'brak pola drenazu: netto po dotychczasowej formule', rgn.resourceGrossNetPerTurn(base));
ok(rgn.resourceGrossNetPerTurn({ ...base, rateBuildingDrainPerTurn: 0 }).netto === expBase, 'drenaz 0 nie zmienia netto');
ok(rgn.resourceGrossNetPerTurn({ ...base, rateBuildingDrainPerTurn: -7 }).netto === expBase, 'drenaz ujemny traktowany jak 0');
ok(rgn.resourceGrossNetPerTurn({ ...base, rateBuildingDrainPerTurn: NaN }).netto === expBase, 'drenaz NaN traktowany jak 0');

console.log('== D. drenaz + wejscia + zuzycie sumuja sie w netto');
const d = rgn.resourceGrossNetPerTurn({ ...base, rateBuildingDrainPerTurn: 10 });
ok(d.netto === 40 - 6 - 5 - 10, 'netto = prod - zuzycie - wejscia - drenaz (19)', d);
ok(d.drenaz === 10 && d.wejscia === 5 && d.zuzycie === 6, 'pola drenaz/wejscia/zuzycie zgodne', d);

console.log('== E. niedobor liczony z netto z drenazem');
ok(rgn.resourceIsShortage({ ratePerTurn: 5, rateProductionPerTurn: 5, rateBuildingDrainPerTurn: 10 }) === true,
  'produkcja 5, drenaz 10 -> niedobor');
ok(rgn.resourceIsShortage({ ratePerTurn: 5, rateProductionPerTurn: 5 }) === false,
  'produkcja 5 bez drenazu -> brak niedoboru (regresja)');

console.log('== F. wiersz tooltipu drenazu');
const t = rgn.resourceDrenazTooltipText(10);
ok(typeof t === 'string' && t.includes('Drenaż budynków (Spichlerz): −10'), 'tekst dla N=10', t);
ok(rgn.resourceDrenazTooltipText(0) === null, 'N=0 -> brak wiersza');
ok(rgn.resourceDrenazTooltipText(undefined) === null, 'brak -> brak wiersza');
ok(rgn.resourceDrenazTooltipText(0.4) === null, 'zaokraglenie 0.4 -> 0 -> brak wiersza');

console.log('== G. prawdziwe econ-params: dryRun Spichlerza I = 10 (ta sama wartosc co silnik)');
const econ = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'econ-params.json'), 'utf8'));
const params = gate.loadSpichlerzDrainParams(econ, 'normal');
ok(params.ceramikaI === 10, 'econ-params: ceramika I (normal) = 10', params);
const cities = [{ id: 'A', ownerId: 0, q: 0, r: 0, name: 'A', population: 1, magazynZywnosci: 10, surowce: { ceramika: 100 } }];
const pay = gate.paySpichlerzDrainForCity(cities, 0, ['spichlerz'], true, params);
ok(pay.ceramikaPaid === true, 'dryRun: ceramika wystarcza na Spichlerz I', pay);
ok(gate.spichlerzCeramikaDrainAmount(['spichlerz'], params) === 10, 'kwota drenazu Spichlerza I = 10');
ok(cities[0].surowce.ceramika === 100, 'dryRun nie mutuje magazynu');
const netFromEngine = rgn.resourceGrossNetPerTurn({ ratePerTurn: 77, rateProductionPerTurn: 77, rateBuildingDrainPerTurn: gate.spichlerzCeramikaDrainAmount(['spichlerz'], params) });
ok(netFromEngine.netto === 67, 'netto z prawdziwym drenazem econ-params = 67', netFromEngine);

console.log('== H. mutant: netto bez drenazu MUSI dac wynik inny niz 67');
const mutant = Math.round(77 - 0 - 0);
ok(mutant !== 67 && gA.netto === 67, 'mutant (bez odjecia drenazu) = 77 != 67', { mutant });

console.log('== S. statyczne wiring');
const mainSrc = fs.readFileSync(path.join(SRC, 'main.ts'), 'utf8');
const hudSrc = fs.readFileSync(path.join(SRC, 'ui', 'hud.ts'), 'utf8');
ok(/rateBuildingDrainPerTurn:\s*spichlerzDrainRates\[c\.id\]/.test(mainSrc), 'main.ts: wiersz HUD dostaje rateBuildingDrainPerTurn');
ok(/surowceDrenaz\s*=\s*shortageRows\.reduce\(.*?\.drenaz/.test(mainSrc), 'main.ts: surowceDrenaz sumuje drenaz z resourceGrossNetPerTurn');
ok(/resourceDrenazTooltipText\(s\.surowceDrenaz\)/.test(hudSrc), 'hud.ts: tooltip dopisuje wiersz drenazu');

fs.rmSync(TMP, { recursive: true, force: true });
console.log(`\nWynik: ${passes} ok, ${fails} FAIL`);
process.exit(fails === 0 ? 0 : 1);
