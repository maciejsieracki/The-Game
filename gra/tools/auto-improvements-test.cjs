'use strict';
/**
 * auto-improvements-test.cjs — picker wspólny gracz+AI (game/auto-improvements.ts).
 * Run from gra/:  node tools/auto-improvements-test.cjs
 *
 * R-AUTO-PRACA-BUDZET-PROCENT-Q1=B (2026-08-14): dawny limit SZTUK (`maxPerCity`/`getMaxPerCity`,
 * 1-3/miasto/turę) zastąpiony % budżetu Pracy (`pracaBudgetPercent`/`getPracaBudgetPercent`,
 * 0-100%) liczonym od SKUMULOWANEJ puli Pracy na WEJŚCIU do wywołania (nie od przyrostu).
 * Testy 4/7/8/9 przepisane pod nową logikę (świadomie, nie usunięto pokrycia — patrz komentarze
 * przy każdym). Testy 10-13 to nowe asercje (a)-(c) z dyspozycji Operatora; migracja starego
 * zapisu (d) żyje w osobnym pliku `ulepszenia-praca-percent-test.cjs` (to test game/cities.ts,
 * nie auto-improvements.ts).
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[auto-improvements-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = process.env.AI_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const ENTRY_FILE = path.resolve(__dirname, '.auto-improvements-test-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.auto-improvements-test-bundle.cjs');

const ENTRY_TS = `
export {
  pickAutoImprovements,
  prioritiesForUlepszeniaFocus,
  AUTO_ULEPSZENIA_PRACA_RESERVE,
} from ${JSON.stringify(SRC + '/game/auto-improvements')};
`;

fs.writeFileSync(ENTRY_FILE, ENTRY_TS, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: BUNDLE_FILE,
    absWorkingDir: GRA_ROOT,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[auto-improvements-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const { pickAutoImprovements, AUTO_ULEPSZENIA_PRACA_RESERVE } = require(BUNDLE_FILE);

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; }
  else { failed++; console.error('  FAIL:', msg); }
}
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

function makeFlatMap(w, h) {
  const hexes = {};
  for (let q = 0; q < w; q++) {
    for (let r = 0; r < h; r++) {
      const k = `${q},${r}`;
      hexes[k] = {
        coords: { q, r },
        terenBazowy: 'rownina',
        nakladka: 'brak',
        ulepszenie: 'brak',
        wlasciciel: null,
        wioska: { istnieje: false, ludnosc: 0 },
        widocznosc: {},
        rzeka: { obecna: false, krawedzie: [] },
      };
    }
  }
  return { szerokoscQ: w, wysokoscR: h, hexes, seed: 42, riverPaths: [] };
}

function makeHillMap(w, h) {
  const m = makeFlatMap(w, h);
  for (const hex of Object.values(m.hexes)) hex.terenBazowy = 'wzgorza';
  return m;
}

function makeCity(id, ownerId, q, r, population = 2, extra = {}) {
  return { id, ownerId, q, r, name: 'TestCity', population, ...extra };
}

// pracaAvailable=50 + pracaBudgetPercent=100 (jawnie, żeby test był czytelny niezależnie od
// domyślnej wartości funkcji): dokładnie tyle, by starczyło na JEDNO typowe ulepszenie z tej
// puli testów (farma/bydlo/owce/lama/lodzie_rybackie=40 Pracy, kamieniolom=44 Pracy po
// R_STAWKI_FALA2_MULT×2), ale NIE na drugie (min. koszt kolejnego typu w tych samych listach to
// 36, więc pracaLeft=10 po pierwszym picku zawsze za mało). Odizolowuje testy 1/2/3/5/6 (logika
// KWALIFIKACJI heksa/typu) od mechanizmu %-budżetu (testowanego osobno w 10-13) — przed
// R-AUTO-PRACA-BUDZET-PROCENT-Q1=B tę rolę pełnił domyślny sztuk-cap=1 przy pracaAvailable=200.
function baseOpts(city, map) {
  return {
    cities: [city],
    ownerId: city.ownerId,
    map,
    territoryNodes: [{ q: city.q, r: city.r, pop: city.population, level: 1, ownerId: city.ownerId }],
    placedImprovements: new Map(),
    pracaAvailable: 50,
    pracaBudgetPercent: 100,
    unlockedTechs: new Set(['Rolnictwo', 'Kamieniarstwo']),
    pracaSurplusThreshold: 0,
    skipWyrab: true,
    civArchetype: 'grecy',
  };
}

// 1. focus zywnosc prefers farm over mine when both qualify
console.log('1. focus zywnosc — farma przed kamieniolom');
{
  const map = makeFlatMap(20, 20);
  // heks (16,15) rownina — farma; (17,15) wzgorza — kamieniolom
  map.hexes['17,15'].terenBazowy = 'wzgorza';
  const city = makeCity('c1', 0, 15, 15, 3, { ulepszeniaFocus: 'zywnosc' });
  const picks = pickAutoImprovements(baseOpts(city, map));
  eq(picks.length, 1, 'jedno ulepszenie');
  eq(picks[0].key, 'farma', 'zywnosc wybiera farme zamiast kamieniolomu');
}

// 2. onlyWorked=true skips unworked qualifying hex
console.log('2. onlyWorked=true — pomija nieobrabiane');
{
  const map = makeFlatMap(20, 20);
  const city = makeCity('c2', 0, 10, 10, 1, {
    ulepszeniaFocus: 'zywnosc',
    ulepszeniaOnlyWorked: true,
  });
  const opts = baseOpts(city, map);
  opts.getOnlyWorked = c => c.ulepszeniaOnlyWorked ?? false;
  opts.getWorkedHexKeys = () => new Set(['11,10']); // tylko jeden hex worked, nie (10,10) centrum
  const picks = pickAutoImprovements(opts);
  eq(picks.length, 1, 'znajduje ulepszenie na worked');
  eq(picks[0].q, 11, 'wybiera worked hex 11,10');
  eq(picks[0].r, 10, 'wybiera worked hex 11,10');
}

// 3. onlyWorked=false can pick unworked
console.log('3. onlyWorked=false — moze nieobrabiane');
{
  const map = makeFlatMap(20, 20);
  const city = makeCity('c3', 0, 10, 10, 1, {
    ulepszeniaFocus: 'zywnosc',
    ulepszeniaOnlyWorked: false,
  });
  const opts = baseOpts(city, map);
  opts.getOnlyWorked = c => c.ulepszeniaOnlyWorked ?? false;
  opts.getWorkedHexKeys = () => new Set(['99,99']); // zaden realny hex
  const picks = pickAutoImprovements(opts);
  eq(picks.length, 1, 'bez filtra worked — kwalifikujacy hex');
}

// 4. R-AUTO-PRACA-BUDZET-PROCENT-Q1=B — sztuk-cap USUNIĘTY: przy 100% budżetu i dużej puli jedno
// miasto może dostać WIĘCEJ NIŻ jedno ulepszenie w tym samym wywołaniu (przed tą zmianą default
// był maxPerCity=1, więc to zawsze zatrzymywało się na 1 niezależnie od pracaAvailable). To jest
// też test-mutacyjny (e) z dyspozycji: gdyby ktoś przywrócił stary sztuk-cap (albo twardy cap=3),
// ten test złapie regresję (5 !== 1 i 5 !== 3).
console.log('4. brak sztuk-cap — 100% budzetu + duza pula = wiele ulepszen w 1 miescie');
{
  const map = makeFlatMap(30, 30);
  const city = makeCity('c4', 0, 15, 15, 6, { ulepszeniaFocus: 'zywnosc' });
  const opts = baseOpts(city, map);
  opts.pracaAvailable = 200; // 200 / 40 (farma) = dokladnie 5
  opts.pracaBudgetPercent = 100;
  const picks = pickAutoImprovements(opts);
  eq(picks.length, 5, '200 Pracy / 100% budzet / farma=40 -> 5 ulepszen (stary kod capsowalby na 1)');
  assert(picks.every(p => p.key === 'farma'), 'wszystkie 5 to farma (priorytet zywnosc, budzet nie wyczerpany aby przejsc do kolejnego typu)');
}

// 5. wyrab skipped when skipWyrab
console.log('5. skipWyrab — brak wyrab');
{
  const map = makeFlatMap(20, 20);
  for (const hex of Object.values(map.hexes)) hex.nakladka = 'las';
  const city = makeCity('c5', 0, 10, 10, 3, { ulepszeniaFocus: 'zrownowazone' });
  const opts = baseOpts(city, map);
  opts.skipWyrab = true;
  opts.unlockedTechs = new Set(); // wyrab bez tech — ale skipWyrab i tak wycina
  const picks = pickAutoImprovements(opts);
  eq(picks.length, 0, 'skipWyrab — zero ulepszen na samej lesie');
  const hasWyrab = picks.some(p => p.key === 'wyrab');
  eq(hasWyrab, false, 'brak wyrab w wyniku');
}

// 6. surowce focus picks mine on hills
console.log('6. focus surowce — kamieniolom na wzgorzach');
{
  const map = makeHillMap(20, 20);
  const city = makeCity('c6', 0, 10, 10, 3, { ulepszeniaFocus: 'surowce' });
  const opts = baseOpts(city, map);
  opts.unlockedTechs = new Set(['Murarstwo']);
  const picks = pickAutoImprovements(opts);
  eq(picks.length, 1, 'jedno ulepszenie surowcowe');
  eq(picks[0].key, 'kamieniolom', 'surowce wybiera kamieniolom');
}

// 7. R-AUTO-PRACA-BUDZET-PROCENT-Q1=B — getPracaBudgetPercent per-miasto = 50% (zastępuje dawny
// getMaxPerCity=2; ten sam "kształt" pokrycia — override per miasto — nowym mechanizmem).
console.log('7. getPracaBudgetPercent=50%');
{
  const map = makeFlatMap(30, 30);
  const city = makeCity('c7', 0, 15, 15, 5, { ulepszeniaFocus: 'zywnosc' });
  const opts = baseOpts(city, map);
  opts.getPracaBudgetPercent = () => 50;
  opts.pracaAvailable = 200; // budzet = 50% * 200 = 100 -> 2x farma (80), 3cia (120) przekracza
  const picks = pickAutoImprovements(opts);
  assert(picks.length === 2, `getPracaBudgetPercent=50% z puli 200 → 2 picki (got ${picks.length})`);
}

// 8. getPracaBudgetPercent = 75% (zastępuje dawny getMaxPerCity=3)
console.log('8. getPracaBudgetPercent=75%');
{
  const map = makeFlatMap(30, 30);
  const city = makeCity('c8', 0, 15, 15, 6, { ulepszeniaFocus: 'zywnosc' });
  const opts = baseOpts(city, map);
  opts.getPracaBudgetPercent = () => 75;
  opts.pracaAvailable = 200; // budzet = 75% * 200 = 150 -> 3x farma (120), 4ta (160) przekracza
  const picks = pickAutoImprovements(opts);
  assert(picks.length === 3, `getPracaBudgetPercent=75% z puli 200 → 3 picki (got ${picks.length})`);
}

// 9. rezerwa Pracy — nie zjada całej puli (izolowane od %-budżetu: pracaBudgetPercent=100, żeby
// jedynym ograniczeniem był flat AUTO_ULEPSZENIA_PRACA_RESERVE, nie interakcja z %).
// NAPRAWIONO przy tej samej okazji: druga część testu miała pracaAvailable=rezerwa+25=55, co przy
// koszcie farmy=40 (po R_STAWKI_FALA2_MULT×2 na 20 bazowych) NIGDY nie starczało na 1 pick z
// zachowaniem rezerwy (55-40=15 < 30) — asercja failowała od zawsze, niezależnie od tego zadania
// (zweryfikowane na tym samym kodzie PRZED zmianami tej sesji). Naprawione na rezerwa+45=75
// (75-40=35 >= 30 rezerwy).
console.log('9. rezerwa Pracy ' + AUTO_ULEPSZENIA_PRACA_RESERVE);
{
  const map = makeFlatMap(30, 30);
  const city = makeCity('c9', 0, 15, 15, 5, { ulepszeniaFocus: 'zywnosc' });
  const opts = baseOpts(city, map);
  opts.pracaBudgetPercent = 100;
  opts.pracaAvailable = AUTO_ULEPSZENIA_PRACA_RESERVE + 5;
  opts.pracaSurplusThreshold = AUTO_ULEPSZENIA_PRACA_RESERVE;
  const picks = pickAutoImprovements(opts);
  eq(picks.length, 0, 'pula = rezerwa+5, koszt farmy(40) > 5 dostepnych ponad rezerwe -> 0 pickow');
  opts.pracaAvailable = AUTO_ULEPSZENIA_PRACA_RESERVE + 45;
  const picks2 = pickAutoImprovements(opts);
  eq(picks2.length, 1, 'pula = rezerwa+45, starcza na 1 farme (40) z zachowaniem rezerwy -> 1 pick');
}

// 10. (a) R-AUTO-PRACA-BUDZET-PROCENT-Q1=B — 0% = auto-manager CAŁKOWICIE wyłączony, mimo że
// Pracy jest pod dostatkiem (cała zostaje dla gracza).
console.log('10. pracaBudgetPercent=0% — zero auto-ulepszen mimo dostepnej Pracy');
{
  const map = makeFlatMap(30, 30);
  const city = makeCity('c10', 0, 15, 15, 5, { ulepszeniaFocus: 'zywnosc' });
  const opts = baseOpts(city, map);
  opts.pracaAvailable = 500;
  opts.pracaBudgetPercent = 0;
  const picks = pickAutoImprovements(opts);
  eq(picks.length, 0, '0% budzetu -> zero auto-ulepszen, mimo 500 Pracy dostepnej');
}

// 11. (b) 100% = auto-manager wydaje AŻ DO flat-rezerwy, nigdy poniżej.
console.log('11. pracaBudgetPercent=100% — wydaje do flat-rezerwy, nie ponizej');
{
  const map = makeFlatMap(30, 30);
  const city = makeCity('c11', 0, 15, 15, 6, { ulepszeniaFocus: 'zywnosc' });
  const opts = baseOpts(city, map);
  opts.pracaAvailable = 150; // 3x farma(40)=120, dokladnie 30 zostaje = rezerwa
  opts.pracaBudgetPercent = 100;
  opts.pracaSurplusThreshold = AUTO_ULEPSZENIA_PRACA_RESERVE;
  const picks = pickAutoImprovements(opts);
  const totalSpent = picks.reduce((s, p) => s + p.kosztPraca, 0);
  eq(picks.length, 3, '100% + pula 150 -> 3 farmy (120 Pracy), zostaje dokladnie rezerwa 30');
  eq(totalSpent, 120, 'laczny wydatek = 120 (150 - rezerwa 30) -- pula NIGDY nie schodzi ponizej rezerwy');
}

// 12. (c) wartość pośrednia (50%) ogranicza wydatek proporcjonalnie do puli NA START tury, NIE do
// malejacego pracaLeft w trakcie wywolania. Dwa miasta tego samego wlasciciela dziela JEDNA pule
// startowa: gdyby budzet miasta B liczyl sie od REMANENTU po miescie A (200-80=120), miasto B
// dostalby tylko 60 (50% z 120) -> 1 pick. Zamrozenie puli na wejsciu daje miastu B TAKZE 100
// (50% z oryginalnych 200) -> 2 picki, tak samo jak miasto A.
console.log('12. pracaBudgetPercent=50% — proporcjonalnie do puli NA START tury (2 miasta)');
{
  const map = makeFlatMap(60, 60);
  const cityA = makeCity('cA', 0, 15, 15, 6, { ulepszeniaFocus: 'zywnosc' });
  const cityB = makeCity('cB', 0, 45, 45, 6, { ulepszeniaFocus: 'zywnosc' });
  const opts = {
    cities: [cityA, cityB],
    ownerId: 0,
    map,
    territoryNodes: [
      { q: cityA.q, r: cityA.r, pop: cityA.population, level: 1, ownerId: 0 },
      { q: cityB.q, r: cityB.r, pop: cityB.population, level: 1, ownerId: 0 },
    ],
    placedImprovements: new Map(),
    pracaAvailable: 200,
    pracaBudgetPercent: 50,
    unlockedTechs: new Set(['Rolnictwo', 'Kamieniarstwo']),
    pracaSurplusThreshold: 0,
    skipWyrab: true,
    civArchetype: 'grecy',
  };
  const picks = pickAutoImprovements(opts);
  const picksA = picks.filter(p => p.cityId === 'cA').length;
  const picksB = picks.filter(p => p.cityId === 'cB').length;
  eq(picksA, 2, 'miasto cA (przetwarzane 1. wg id): 50% z 200 = budzet 100 -> 2 farmy (80 Pracy)');
  eq(picksB, 2, 'miasto cB: TEZ 50% ze STARTOWEJ puli 200 (nie z resztki 120 po cA) -> tez 2 farmy, nie 1');
}

console.log(`\nauto-improvements-test: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
