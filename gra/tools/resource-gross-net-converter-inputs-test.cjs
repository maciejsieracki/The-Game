'use strict';
/**
 * resource-gross-net-converter-inputs-test.cjs — R-WEB-UI-HUD-NET-CONVERTER-INPUTS-Q1.
 *
 * Run from gra/:  node tools/resource-gross-net-converter-inputs-test.cjs
 *
 * Hipoteza (pomiar R-WEB-ECONOMY-MEASURE-ANALYSIS-Q1): netto HUD dla surowca bazowego/przetworzonego
 * nie odejmowalo nominalnych wejsc konwerterow (np. glina zjadana przez Garncarnie), wiec pokazywalo
 * przyrost nominalny zamiast realnego delta stanu. Test sprawdza:
 *   A. Dane receptur sa prawdziwe (converters.ts): Garncarnia = glina 1 + drewno 1 -> ceramika 1;
 *      Cegielnia = glina 2 + drewno 1 -> cegla 2 (wejscia na cykl).
 *   B. Fixtura Garncarnia 50 cykli/ture x 3 budynki, 1 glina/cykl -> wejscia Gliny = 150/t.
 *      Netto Gliny = produkcja - wejscia - zuzycie (prawdziwy resourceGrossNetPerTurn).
 *   C. Brutto NIE zmienia sie (brutto = wylacznie produkcja surowca + umowy).
 *   D. Brak pola wejsc = dotychczasowa formula (regresja).
 *   E. Statyczne: main.ts zasila wiersze HUD wejsciami konwerterow, naglowek i karta liczą netto
 *      przez resourceGrossNetPerTurn, karta surowca pokazuje wiersz wejsc.
 *   M. Mutant: netto bez odejmowania wejsc MUSI dac wynik inny niz 176 (test B by padl).
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const GRA = path.resolve(__dirname, '..');
const SRC = path.join(GRA, 'src');
const esbuild = require(path.join(GRA, 'node_modules', 'esbuild'));
const NO_MUTANTS = process.argv.includes('--no-mutants');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'res-gn-conv-'));

let fails = 0;
let passes = 0;
function ok(c, m, extra) {
  if (c) { passes++; console.log('  ok   ' + m); }
  else { fails++; console.log('  FAIL ' + m + (extra !== undefined ? ' -- ' + JSON.stringify(extra) : '')); }
}

async function bundle(srcFile, outName) {
  const outFile = path.join(TMP, outName + '.cjs');
  await esbuild.build({
    entryPoints: [srcFile], bundle: true, platform: 'node', format: 'cjs', outfile: outFile, logLevel: 'silent',
    loader: { '.ts': 'ts', '.json': 'json' },
  });
  return require(outFile);
}

(async () => {
  console.log('== A. receptury (converters.ts, dane prawdziwe)');
  const conv = await bundle(path.join(SRC, 'game', 'converters.ts'), 'conv');
  const gar = conv.DEFAULT_CONVERTER_RECIPES.find(r => r.id === 'garncarnia');
  const cegl = conv.DEFAULT_CONVERTER_RECIPES.find(r => r.id === 'cegielnia');
  ok(gar && gar.inputs.glina === 1 && gar.inputs.drewno === 1 && gar.output === 'ceramika' && gar.outputAmount === 1,
    'Garncarnia: glina 1 + drewno 1 -> ceramika 1 / cykl', gar);
  ok(cegl && cegl.inputs.glina === 2 && cegl.inputs.drewno === 1 && cegl.output === 'cegla' && cegl.outputAmount === 2,
    'Cegielnia: glina 2 + drewno 1 -> cegla 2 / cykl', cegl);

  const rgn = await bundle(path.join(SRC, 'game', 'resource-gross-net.ts'), 'rgn');

  console.log('== B. fixtura: 3 Garncarnie x 50 cykli/t -> wejscia Gliny 150/t (prawdziwa funkcja converters.ts)');
  const throughput = 50;
  const raw = { budynki: { budynek_garncarnia_przepustowosc: { easy: 30, normal: throughput, hard: 20 } } };
  const consumed = conv.converterConsumedRatesForBuildings(
    ['garncarnia', 'garncarnia', 'garncarnia', 'tartak', 'zagroda'], raw, 'normal', 1,
  );
  ok(consumed.glina === 150, 'converterConsumedRatesForBuildings: glina = 3 x 50 x 1 = 150 (nie-konwertery pominiete)', consumed);
  ok(consumed.drewno === 150, 'converterConsumedRatesForBuildings: drewno = 3 x 50 x 1 = 150', consumed);
  ok(conv.converterConsumedRatesForBuildings(['tartak'], raw, 'normal', 1).glina === undefined,
    'budynek nie-konwerterowy nie daje wejsc');
  const glinaInputs = consumed.glina;
  const glinaRow = {
    ratePerTurn: 326, // HUD netto przed poprawka (produkcja terytorium, bez wejsc)
    rateProductionPerTurn: 326,
    usage: { buildings: 0, citizens: 0, units: 0 },
    rateConverterInputPerTurn: glinaInputs,
  };
  const gn = rgn.resourceGrossNetPerTurn(glinaRow);
  ok(gn.netto === 326 - 150, 'netto Gliny = produkcja - wejscia - zuzycie (176)', gn);
  ok(gn.wejscia === 150, 'pole wejscia = 150', gn);

  console.log('== C. brutto bez zmian (produkcja + umowy), Ceramika brutto = wyjscie');
  const ceramika = { ratePerTurn: 50, rateProductionPerTurn: 50, rateConverterInputPerTurn: 0 };
  ok(rgn.resourceGrossNetPerTurn(ceramika).brutto === 50, 'Ceramika brutto = 50 (wyjscie)');
  ok(rgn.resourceGrossNetPerTurn(glinaRow).brutto === 326, 'Glina brutto nie odejmuje wejsc (326)');

  console.log('== D. brak pola wejsc = dotychczasowa formula (regresja)');
  const plain = rgn.resourceGrossNetPerTurn({
    ratePerTurn: 10, rateProductionPerTurn: 10, usage: { buildings: 2, citizens: 1, units: 0 },
  });
  ok(plain.netto === 7 && plain.wejscia === 0, 'netto = 10 - 3 = 7 bez wejsc', plain);

  console.log('== E. statyczne: main.ts / panel / modul');
  const main = fs.readFileSync(path.join(SRC, 'main.ts'), 'utf8');
  const mod = fs.readFileSync(path.join(SRC, 'game', 'resource-gross-net.ts'), 'utf8');
  ok(/function empireConverterInputRatesForOwner\(/.test(main), 'main.ts: empireConverterInputRatesForOwner zdefiniowana');
  const fnStart = main.indexOf('function empireConverterInputRatesForOwner(');
  const fnBody = fnStart < 0 ? '' : main.slice(fnStart, fnStart + 1500);
  ok(/cities\.filter\(c => c\.ownerId === ownerId\)/.test(fnBody),
    'main.ts: empireConverterInputRatesForOwner filtruje miasta po wlascicielu (mutant === -> !== zlapany)');
  ok(/return converterAllocatedConsumedRatesForCities\(perCityBuildingIds,/.test(main),
    'main.ts: wejscia konwerterow z WSPOLNEJ funkcji converters.ts (HUD = silnik, pula ownera; bez drugiej kopii formuly)');
  ok(!/inputs\[inputKey\]\s*=/.test(main), 'main.ts: brak lokalnej petli wejsc konwerterow');
  ok(/rateConverterInputPerTurn:\s*converterInputRates\[c\.id\]/.test(main), 'main.ts: wiersz HUD niesie rateConverterInputPerTurn');
  ok(/resourceGrossNetPerTurn\(r\)/.test(main), 'main.ts: naglowek liczy netto przez resourceGrossNetPerTurn');
  ok(/- resourceConverterInputSum\(r\)/.test(mod), 'modul: netto odejmuje resourceConverterInputSum');

  if (!NO_MUTANTS) {
    console.log('== M. mutant: netto BEZ odejmowania wejsc MUSI czerwienic B');
    const mutSrc = fs.readFileSync(path.join(SRC, 'game', 'resource-gross-net.ts'), 'utf8')
      .replace(/ - resourceConverterInputSum\(r\)/, '');
    const mutFile = path.join(TMP, 'mut-rgn.ts');
    fs.writeFileSync(mutFile, mutSrc);
    const mutRgn = await bundle(mutFile, 'mut-rgn');
    const mg = mutRgn.resourceGrossNetPerTurn(glinaRow);
    ok(mg.netto !== 176, 'mutant (bez wejsc) daje netto != 176 -> test B by padl', mg);
  }

  console.log(`\nRESULT: ${passes} ok, ${fails} FAIL`);
  process.exit(fails === 0 ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
