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
 *   H. Prawdziwy mutant kopii resource-gross-net.ts (bez odjecia drenazu): netto != 67.
 *   I. Helper spichlerzDrainRatesForOwner: pojedynczy/podwojny Spichlerz (kumulacja puli), Spichlerz II + sol,
 *      cudzy owner, brak mutacji wejscia; mutanty (zwrot {}, dryRun bez kumulacji) wykrywane.
 *   S. Statyczne: main.ts zasila wiersze `rateBuildingDrainPerTurn`, sumuje `surowceDrenaz` i deleguje do helpera;
 *      hud.ts dopisuje wiersz tooltipu przez resourceDrenazTooltipText.
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

// Mutanty: podmiana fragmentu zrodla, bundle z absolutnymi importami (kopia lezy w TMP, nie w src).
function mutantModule(src, from, to, outName) {
  if (!src.includes(from)) return null;
  const mutated = src.replace(from, to).replace(/from '\.\//g, "from '" + path.join(SRC, 'game') + '/');
  const f = path.join(TMP, outName + '.ts');
  fs.writeFileSync(f, mutated);
  return bundle(f, outName + '-mod');
}

console.log('== H. mutant netto bez odjecia drenazu (prawdziwa mutacja kopii resource-gross-net.ts)');
const gnSrc = fs.readFileSync(path.join(SRC, 'game', 'resource-gross-net.ts'), 'utf8');
const hMod = mutantModule(gnSrc, 'netto: przedDrenazem.netto - drenaz }', 'netto: przedDrenazem.netto }', 'mutH');
ok(hMod !== null, 'wzorzec mutanta H trafil w resource-gross-net.ts');
if (hMod) {
  const hn = hMod.resourceGrossNetPerTurn(cer).netto;
  ok(hn !== 67, 'mutant H (bez drenazu) daje netto != 67 => test A wykrywa mutacje', { netto: hn });
}

console.log('== I. helper spichlerzDrainRatesForOwner (prawdziwe funkcje + econ-params)');
const spichlerzParams = params;
const gateDeps = {
  cityHasSpichlerzBuilding: gate.cityHasSpichlerzBuilding,
  paySpichlerzDrainForCity: gate.paySpichlerzDrainForCity,
  spichlerzCeramikaDrainAmount: gate.spichlerzCeramikaDrainAmount,
};
const mk = (id, ownerId, surowce) => ({ id, ownerId, surowce });
const builtMap = { A: ['spichlerz'], B: ['spichlerz'], C: ['spichlerz_ii'], D: [] };
const builtOf = c => builtMap[c.id] || [];
const ceraI = spichlerzParams.ceramikaI;
const ceraII = spichlerzParams.ceramikaII;
const solII = spichlerzParams.solII;

const r1 = rgn.spichlerzDrainRatesForOwner([mk('A', 0, { ceramika: 100 })], 0, builtOf, spichlerzParams, gateDeps);
ok(r1.ceramika === ceraI, 'I.1 jeden Spichlerz I przy zapasie: ceramika = ceramikaI', r1);
ok(r1.sol === undefined, 'I.1 brak soli bez Spichlerza II', r1);

const r2 = rgn.spichlerzDrainRatesForOwner([mk('A', 0, { ceramika: 15 }), mk('B', 0, { ceramika: 0 })], 0, builtOf, spichlerzParams, gateDeps);
ok(r2.ceramika === ceraI, 'I.2 dwa Spichlerze, pula 15 (< 2x' + ceraI + '): kumulatywnie tylko jeden placi', r2);

const r3 = rgn.spichlerzDrainRatesForOwner([mk('C', 0, { ceramika: 100, sol: 50 })], 0, builtOf, spichlerzParams, gateDeps);
ok(r3.ceramika === ceraII && r3.sol === solII, 'I.3 Spichlerz II: ceramikaII + sol = solII', r3);

const r4 = rgn.spichlerzDrainRatesForOwner([mk('C', 0, { ceramika: 100, sol: 0 })], 0, builtOf, spichlerzParams, gateDeps);
ok(r4.ceramika === ceraII && r4.sol === undefined, 'I.4 Spichlerz II bez soli: brak drenazu soli', r4);

const r5 = rgn.spichlerzDrainRatesForOwner([mk('A', 1, { ceramika: 100 }), mk('D', 0, { ceramika: 100 })], 0, builtOf, spichlerzParams, gateDeps);
ok(Object.keys(r5).length === 0, 'I.5 cudzy owner i miasto bez Spichlerza -> brak drenazu', r5);

const inCities = [mk('A', 0, { ceramika: 100 })];
rgn.spichlerzDrainRatesForOwner(inCities, 0, builtOf, spichlerzParams, gateDeps);
ok(inCities[0].surowce.ceramika === 100, 'I.6 wejscie nie jest mutowane', inCities[0]);

// Mutanty helpera: (a) zwrot pustego obiektu, (b) brak kumulacji (dryRun w petli).
const hA = mutantModule(gnSrc, '  return rates;\n}', '  return {};\n}', 'mutIA');
ok(hA !== null && hA.spichlerzDrainRatesForOwner([mk('A', 0, { ceramika: 100 })], 0, builtOf, spichlerzParams, gateDeps).ceramika !== ceraI,
  'I.M1 mutant „zwrot {}” wykryty (test I.1 pada)');
const hB = mutantModule(gnSrc, 'deps.paySpichlerzDrainForCity(pool, ownerId, built, false, params)', 'deps.paySpichlerzDrainForCity(pool, ownerId, built, true, params)', 'mutIB');
ok(hB !== null && hB.spichlerzDrainRatesForOwner([mk('A', 0, { ceramika: 15 }), mk('B', 0, { ceramika: 0 })], 0, builtOf, spichlerzParams, gateDeps).ceramika !== ceraI,
  'I.M2 mutant „dryRun bez kumulacji” wykryty (test I.2 pada)');

console.log('== S. statyczne wiring');
const mainSrc = fs.readFileSync(path.join(SRC, 'main.ts'), 'utf8');
const hudSrc = fs.readFileSync(path.join(SRC, 'ui', 'hud.ts'), 'utf8');
ok(/rateBuildingDrainPerTurn:\s*spichlerzDrainRates\[c\.id\]/.test(mainSrc), 'main.ts: wiersz HUD dostaje rateBuildingDrainPerTurn');
ok(/surowceDrenaz\s*=\s*shortageRows\.reduce\(.*?\.drenaz/.test(mainSrc), 'main.ts: surowceDrenaz sumuje drenaz z resourceGrossNetPerTurn');
ok(/return spichlerzDrainRatesForOwner\(/.test(mainSrc), 'main.ts: empireSpichlerzDrainRatesForOwner deleguje do helpera');
ok(/resourceDrenazTooltipText\(s\.surowceDrenaz\)/.test(hudSrc), 'hud.ts: tooltip dopisuje wiersz drenazu');

fs.rmSync(TMP, { recursive: true, force: true });
console.log(`\nWynik: ${passes} ok, ${fails} FAIL`);
process.exit(fails === 0 ? 0 : 1);
