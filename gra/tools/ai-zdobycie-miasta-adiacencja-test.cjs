'use strict';
/**
 * ai-zdobycie-miasta-adiacencja-test.cjs — P-AI-BRAK-SCIEZKI-ZDOBYCIA-MIASTA-ADIACENCJA-Q1
 * (Operator Opus 5, effort high, runda 1, worktree /home/user/wt-ai-adiacencja).
 *
 * ZAKRES — JEDNO ZDANIE: rozkaz `move` AI (cywilizacja major) na sąsiedni, niebroniony,
 * nieufortyfikowany obcy heks miasta ma skutkować PRZEJĘCIEM, tak jak u gracza.
 * Bramka NIE dotyczy ataku dystansowego, miast bronionych ani priorytetów celów AI —
 * dla dwóch pierwszych trzyma asercje NEGATYWNE (K4), żeby naprawa nie urosła po cichu.
 *
 * DLACZEGO ISTNIEJE: `ai-city-capture-integration-test.cjs` sprawdza sam egzekutor
 * (`executeAiCityMove`) na ręcznie złożonych argumentach. Nie sprawdza ANI planisty
 * (`decideAITurn` — czy rozkaz w ogóle powstaje), ANI wpięcia w `main.ts` (czy egzekutor
 * dostaje `tryAutoCaptureEmptyCityAt` jako `onCapture`). Usunięcie wpięcia w `main.ts`
 * zostawiłoby tamtą bramkę ZIELONĄ, a AI znowu bez ścieżki zdobycia miasta. Ta bramka
 * zamyka oba końce łańcucha: ai.ts → main.ts → egzekutor → przejęcie.
 *
 * REGUŁA PRZECIW SAMOOSZUKIWANIU (00-dispatch.md):
 *  - tryb „naprawa na papierze": K2 sprawdza `cities[].ownerId` PRZED i PO, czyli FAKT
 *    przejęcia — nie fakt „rozkaz nie został odrzucony";
 *  - tryb „rozluźnienie dla wszystkich": K3 wykonuje REALNĄ `canUnitOccupyCityHex`
 *    i `canCaptureCityWithoutBattle` dla gracza (0), barbarzyńcy (-1) i AI major (1) —
 *    zniesienie reguły dla wszystkich czerwieni A3;
 *  - tryb „rozlanie zakresu": K4 (miasto bronione / z murami / nieadiacencja).
 *  - C-046 (tautologia testowa): ZERO kopii formuł. Każdy predykat jest importowany
 *    z prawdziwego modułu przez esbuild, a wpięcie w `main.ts` (żyjące w domknięciu
 *    `main()`, więc nieimportowalne) jest sprawdzane asercją na ŹRÓDLE.
 *
 * IZOLACJA: mutanty to KOPIE plików z sufiksem PID (C-036), kasowane w `finally`
 * i przez `process.on('exit')`. Bramka nie dotyka żadnego śledzonego pliku.
 * Nie buduje gry (C-001) — tylko esbuild bundle modułów domenowych.
 *
 * Bramka (z katalogu gra/): node tools/ai-zdobycie-miasta-adiacencja-test.cjs
 */

const fs = require('fs');
const path = require('path');

const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = path.resolve(GRA_ROOT, 'src');
const esbuild = (() => {
  try { return require(path.resolve(GRA_ROOT, 'node_modules', 'esbuild')); }
  catch (_) {
    console.error('[ai-zdobycie-miasta-adiacencja] brak esbuild — uruchom npm install w gra/');
    process.exit(1);
  }
})();

const TAG = `ai-adiacencja-${process.pid}`;
const EXECUTOR_TS = path.join(SRC, 'game', 'ai-city-capture-executor.ts');
const MAIN_TS = path.join(SRC, 'main.ts');
const temps = [];
function tmpFile(p) { temps.push(p); return p; }
function cleanup() {
  for (const f of temps) { try { fs.unlinkSync(f); } catch (_) {} }
}
process.on('exit', cleanup);

// --- bundling ---------------------------------------------------------------
function bundleEntry(entrySource, label) {
  const entry = tmpFile(path.join(__dirname, `.${TAG}-${label}-entry.ts`));
  const out = tmpFile(path.join(__dirname, `.${TAG}-${label}-bundle.cjs`));
  fs.writeFileSync(entry, entrySource, 'utf8');
  esbuild.buildSync({
    entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs',
    target: 'node18', outfile: out, absWorkingDir: GRA_ROOT, logLevel: 'silent',
  });
  return require(out);
}

const REAL = bundleEntry(
  `export { decideAITurn } from ${JSON.stringify(SRC + '/game/ai')};\n`
  + `export { executeAiCityMove } from ${JSON.stringify(SRC + '/game/ai-city-capture-executor')};\n`
  + `export { canUnitOccupyCityHex, canAiEnterEmptyEnemyCity, addForeignCityBlocks } from ${JSON.stringify(SRC + '/game/city-hex-movement')};\n`
  + `export { canCaptureCityWithoutBattle, hasCityDefenders } from ${JSON.stringify(SRC + '/game/siegeDefenders')};\n`
  + `export { aiCityCaptureAllowed } from ${JSON.stringify(SRC + '/game/ai-fog')};\n`
  + `export { keyOf, hexDistance } from ${JSON.stringify(SRC + '/units/setup')};\n`,
  'real',
);

/** Egzekutor z podmienionym CIAŁEM pliku produkcyjnego (mutant leży obok oryginału,
 *  żeby importy względne `./city-hex-movement` nadal się rozwiązywały). */
function bundleExecutorVariant(transform, label) {
  const source = fs.readFileSync(EXECUTOR_TS, 'utf8');
  const mutated = transform(source);
  if (mutated === source) throw new Error(`[${label}] kotwica mutacji nie znaleziona`);
  const mutantPath = tmpFile(path.join(SRC, 'game', `.${TAG}-${label}.ts`));
  fs.writeFileSync(mutantPath, mutated, 'utf8');
  return bundleEntry(
    `export { executeAiCityMove } from ${JSON.stringify(mutantPath.replace(/\.ts$/, ''))};\n`,
    label,
  ).executeAiCityMove;
}

// --- asercje ----------------------------------------------------------------
let ok = 0;
let fail = 0;
function eq(actual, expected, msg) {
  if (actual === expected) { ok++; console.log('  [OK] ' + msg); }
  else { fail++; console.error(`  [FAIL] ${msg} — got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)}`); }
}
function assert(cond, msg) { eq(!!cond, true, msg); }

// --- świat testowy ----------------------------------------------------------
const AI_OWNER = 1;      // cywilizacja major
const WROG_OWNER = 2;    // druga cywilizacja major
const GRACZ_OWNER = 0;
const BARB_OWNER = -1;

function makeMap(w, h) {
  const hexes = {};
  for (let q = 0; q < w; q++) {
    for (let r = 0; r < h; r++) {
      hexes[`${q},${r}`] = {
        coords: { q, r }, terenBazowy: 'laka', nakladka: 'brak', ulepszenie: 'brak',
        wlasciciel: null, wioska: { istnieje: false, ludnosc: 0 },
        widocznosc: {}, rzeka: { obecna: false, krawedzie: [] },
      };
    }
  }
  return { szerokoscQ: w, wysokoscR: h, hexes, seed: 42, riverPaths: [] };
}
const GAME_DATA = {
  units: [{ Jednostka: 'Wojownik', Health: 30, Ruch: 2 }],
  buildings: [{ id: 'koszary', nazwa: 'Koszary' }],
  terrainYields: { terrain_types: [{ Teren: 'laka', Zywnosc: 4, Praca: 1, Handel: 1 }] },
  aiParams: {},
};
function makeWorld() {
  return {
    map: makeMap(10, 10),
    cities: [
      { id: 'ai-c1', ownerId: AI_OWNER, q: 1, r: 1, name: 'Stolica AI', population: 3 },
      { id: 'wrog-c1', ownerId: WROG_OWNER, q: 5, r: 5, name: 'Cel', population: 3 },
    ],
    units: [
      { id: 'ai-u1', ownerId: AI_OWNER, typeId: 'Wojownik', category: 'miecznik', q: 5, r: 4, ruch: 2, ruchLeft: 2 },
    ],
  };
}

/**
 * REALNY planista: `decideAITurn` z ai.ts. Zwraca komendę `move` na heks obcego miasta.
 * `unitActed` odtwarzamy z faktu, że ai.ts po tej gałęzi NIE emituje już nic dla tej
 * jednostki — czyli komenda `move` na miasto jest JEDYNĄ komendą tej jednostki w turze.
 */
function planAiCityMove(world) {
  const cmds = REAL.decideAITurn(
    AI_OWNER, world.units, world.cities, world.map, GAME_DATA, { civType: 'rzymianie' },
  );
  const unitCmds = cmds.filter(c => c.unitId === 'ai-u1');
  return { cmds, unitCmds, move: unitCmds.find(c => c.type === 'move') };
}

/**
 * REALNE wpięcie z `main.ts` (linie ~31501-31545) odtworzone WYWOŁANIAMI tych samych
 * funkcji modułowych — bez kopiowania ich formuł. Jedyne, czego nie da się zaimportować,
 * to `tryAutoCaptureEmptyCityAt` (domknięcie w `main()`), więc `onCapture` wykonuje jego
 * DWA realne warunki (`canCaptureCityWithoutBattle` + jednostka niecywilna) i dopiero
 * wtedy przepisuje `ownerId` — a asercje A5/A6 pilnują, że `main.ts` faktycznie tam
 * wpina `tryAutoCaptureEmptyCityAt` i że ta funkcja nie ma filtra po ownerze.
 */
function runEngineMove(executeAiCityMove, world, move, opts = {}) {
  const unit = world.units.find(u => u.id === move.unitId);
  const destinationCity = world.cities.find(
    c => c.q === move.toQ && c.r === move.toR && c.ownerId !== unit.ownerId,
  );
  const visible = new Set(world.cities.map(c => REAL.keyOf(c.q, c.r)));
  const targetVisible = destinationCity === undefined
    || REAL.aiCityCaptureAllowed(move.targetCityId, destinationCity, visible, true, REAL.keyOf);
  if (!targetVisible) return { moved: false, captured: false, path: [], rejected: 'fog' };

  const blockedKeys = REAL.addForeignCityBlocks(new Set(), unit.ownerId, world.cities);
  for (const other of world.units) {
    if (other.id !== unit.id) blockedKeys.add(REAL.keyOf(other.q, other.r));
  }
  const captureLog = [];
  const result = executeAiCityMove({
    command: move,
    unit,
    cities: world.cities,
    cityBuiltIds: destinationCity ? (opts.cityBuiltIds ?? []) : [],
    hasCityDefenders: destinationCity !== undefined
      && REAL.hasCityDefenders(destinationCity, world.units),
    targetVisible,
    canOccupyCityHex: REAL.canUnitOccupyCityHex(unit.ownerId, move.toQ, move.toR, world.cities),
    blockedKeys,
    destinationKey: REAL.keyOf(move.toQ, move.toR),
    computePath: (_u, toQ, toR, blocked) => (
      blocked.has(REAL.keyOf(toQ, toR)) || REAL.hexDistance(unit.q, unit.r, toQ, toR) !== 1
        ? []
        : [{ q: toQ, r: toR }]
    ),
    onCapture: (city, anchor) => {
      if (!REAL.canCaptureCityWithoutBattle(city, world.units)) return false;
      city.ownerId = anchor.ownerId;
      captureLog.push(`${city.id}:${anchor.ownerId}`);
      return true;
    },
  });
  return { ...result, captureLog };
}

console.log('\n[ai-zdobycie-miasta-adiacencja-test] P-AI-BRAK-SCIEZKI-ZDOBYCIA-MIASTA-ADIACENCJA-Q1\n');

// ===========================================================================
// K1 — REPRODUKCJA STANU SPRZED NAPRAWY (bezwarunkowa blokada obcego heksu miasta)
// ===========================================================================
console.log('--- K1: reprodukcja stanu sprzed naprawy (rozkaz odrzucany, tura stracona) ---');
const PREFIX_EXECUTOR = bundleExecutorVariant(
  src => src.replace(
    '  if (!canEnterEmptyCity && !opts.canOccupyCityHex) {\n    return { moved: false, captured: false, path: [] };\n  }',
    '  if (!opts.canOccupyCityHex) {\n    return { moved: false, captured: false, path: [] };\n  }',
  ),
  'prefix',
);
{
  const world = makeWorld();
  const plan = planAiCityMove(world);
  const target = world.cities.find(c => c.id === 'wrog-c1');
  const ownerBefore = target.ownerId;
  const posBefore = `${world.units[0].q},${world.units[0].r}`;
  assert(plan.move !== undefined, 'K1a: REALNY decideAITurn emituje rozkaz move na heks obcego miasta');
  eq(plan.move.targetCityId, 'wrog-c1', 'K1b: rozkaz niesie targetCityId celu');
  eq(plan.unitCmds.length, 1, 'K1c: to JEDYNA komenda tej jednostki w turze (unitActed — brak akcji zastępczej)');
  const res = runEngineMove(PREFIX_EXECUTOR, world, plan.move);
  eq(res.moved, false, 'K1d: STAN SPRZED NAPRAWY — rozkaz odrzucony przez bezwarunkową blokadę heksu miasta');
  eq(res.captured, false, 'K1e: STAN SPRZED NAPRAWY — brak przejęcia');
  eq(target.ownerId, ownerBefore, 'K1f: STAN SPRZED NAPRAWY — cities[].ownerId bez zmiany (2)');
  eq(`${world.units[0].q},${world.units[0].r}`, posBefore, 'K1g: STAN SPRZED NAPRAWY — jednostka nie ruszyła się (tura stracona)');
  console.log(`       ślad: ownerId ${ownerBefore} -> ${target.ownerId}, jednostka ${posBefore} -> ${world.units[0].q},${world.units[0].r}, komend jednostki=${plan.unitCmds.length}`);
}

// ===========================================================================
// K2 — PO NAPRAWIE: ta sama jednostka PRZEJMUJE miasto (fakt, nie brak odrzucenia)
// ===========================================================================
console.log('\n--- K2: po naprawie — przejęcie, stan cities[].ownerId przed i po ---');
{
  const world = makeWorld();
  const plan = planAiCityMove(world);
  const target = world.cities.find(c => c.id === 'wrog-c1');
  const ownerBefore = target.ownerId;
  const posBefore = `${world.units[0].q},${world.units[0].r}`;
  const res = runEngineMove(REAL.executeAiCityMove, world, plan.move);
  eq(ownerBefore, WROG_OWNER, 'K2a: PRZED — cities[wrog-c1].ownerId === 2');
  eq(res.moved, true, 'K2b: rozkaz przyjęty przez egzekutor');
  eq(res.captured, true, 'K2c: egzekutor raportuje przejęcie');
  eq(target.ownerId, AI_OWNER, 'K2d: PO — cities[wrog-c1].ownerId === 1 (AI major faktycznie przejęło miasto)');
  eq(`${world.units[0].q},${world.units[0].r}`, '5,5', 'K2e: PO — jednostka stoi na heksie zdobytego miasta');
  eq(world.units[0].ruchLeft, 0, 'K2f: PO — ruch jednostki zużyty (nie „stracona tura bez efektu")');
  eq(res.captureLog.join(','), 'wrog-c1:1', 'K2g: przejęcie przeszło przez realną canCaptureCityWithoutBattle');
  console.log(`       ślad: ownerId ${ownerBefore} -> ${target.ownerId}, jednostka ${posBefore} -> ${world.units[0].q},${world.units[0].r}, ruchLeft=${world.units[0].ruchLeft}`);
}

// ===========================================================================
// K3 — PARYTET TRZECH ŚCIEŻEK (gracz / barbarzyńcy / AI major)
// ===========================================================================
console.log('\n--- K3: parytet gracz / barbarzyńcy / AI major na WSPÓLNYCH bramkach ---');
{
  const pusteMiasto = { id: 'c', ownerId: WROG_OWNER, q: 5, r: 5 };
  const bronioneMiasto = { id: 'c', ownerId: WROG_OWNER, q: 5, r: 5, garrisonHp: 10 };
  const obronca = { id: 'def', ownerId: WROG_OWNER, typeId: 'Wojownik', category: 'miecznik', q: 5, r: 5, hp: 10 };
  for (const [label, ownerId] of [['gracz(0)', GRACZ_OWNER], ['barbarzyńca(-1)', BARB_OWNER], ['AI major(1)', AI_OWNER]]) {
    // 1. wspólna bramka przejęcia — ta sama funkcja, ten sam wynik dla wszystkich trzech
    eq(REAL.canCaptureCityWithoutBattle(pusteMiasto, []), true,
      `K3a ${label}: canCaptureCityWithoutBattle(puste) === true (bramka nie zależy od ownera napastnika)`);
    eq(REAL.canCaptureCityWithoutBattle(bronioneMiasto, [obronca]), false,
      `K3b ${label}: canCaptureCityWithoutBattle(bronione) === false`);
    // 2. reguła bazowa NIE została zniesiona dla nikogo (tryb drugi samooszukiwania)
    eq(REAL.canUnitOccupyCityHex(ownerId, 5, 5, [pusteMiasto]), false,
      `K3c ${label}: canUnitOccupyCityHex nadal blokuje obcy heks miasta — reguła nie została zniesiona`);
    eq(REAL.canUnitOccupyCityHex(ownerId, 3, 3, [pusteMiasto]), true,
      `K3d ${label}: canUnitOccupyCityHex przepuszcza pusty heks`);
  }
  // 3. Wyjątek dla AI jest DODANY, nie zastępuje reguły — i jest WĘŻSZY niż u gracza:
  //    wymaga adiacencji, braku obrońców i braku fortyfikacji. Świadoma asymetria,
  //    opisana w raporcie 01-operator-runda1.md (K3) — AI jest ostrożniejsze, nie luźniejsze.
  eq(REAL.canAiEnterEmptyEnemyCity(AI_OWNER, 5, 4, { id: 'c', ownerId: WROG_OWNER, q: 5, r: 5 }, [], false), true,
    'K3e: ścieżka DODANA dla AI major (adiacencja + brak obrońców + brak fortyfikacji)');
  eq(REAL.canAiEnterEmptyEnemyCity(AI_OWNER, 5, 4, { id: 'c', ownerId: AI_OWNER, q: 5, r: 5 }, [], false), false,
    'K3f: wyjątek nie dotyczy własnego miasta');
}

// ===========================================================================
// K4 — ASERCJE NEGATYWNE: granica zakresu
// ===========================================================================
console.log('\n--- K4: granica zakresu — bronione / ufortyfikowane / nieadiacentne NIE są przejmowane ---');
{
  // miasto BRONIONE (obrońca na heksie miasta)
  const world = makeWorld();
  world.units.push({ id: 'wrog-u1', ownerId: WROG_OWNER, typeId: 'Wojownik', category: 'miecznik', q: 5, r: 5, ruch: 2, ruchLeft: 2, hp: 10 });
  const target = world.cities.find(c => c.id === 'wrog-c1');
  const plan = planAiCityMove(world);
  const move = plan.move ?? { type: 'move', unitId: 'ai-u1', toQ: 5, toR: 5, targetCityId: 'wrog-c1' };
  const res = runEngineMove(REAL.executeAiCityMove, world, move);
  eq(res.captured, false, 'K4a: miasto BRONIONE nie jest przejmowane rozkazem move');
  eq(target.ownerId, WROG_OWNER, 'K4b: miasto BRONIONE zachowuje ownerId === 2');
}
{
  // miasto z MURAMI (fortyfikacja z cityBuilt)
  const world = makeWorld();
  const target = world.cities.find(c => c.id === 'wrog-c1');
  const plan = planAiCityMove(world);
  const res = runEngineMove(REAL.executeAiCityMove, world, plan.move, { cityBuiltIds: ['mury'] });
  eq(res.captured, false, 'K4c: miasto z MURAMI nie jest przejmowane rozkazem move');
  eq(target.ownerId, WROG_OWNER, 'K4d: miasto z MURAMI zachowuje ownerId === 2');
}
{
  // flaga maMur
  const world = makeWorld();
  const target = world.cities.find(c => c.id === 'wrog-c1');
  target.maMur = true;
  const plan = planAiCityMove(world);
  const res = runEngineMove(REAL.executeAiCityMove, world, plan.move);
  eq(res.captured, false, 'K4e: miasto z flagą maMur nie jest przejmowane rozkazem move');
  eq(target.ownerId, WROG_OWNER, 'K4f: miasto z flagą maMur zachowuje ownerId === 2');
}
{
  // brak adiacencji — zakaz „teleportu" na odległe miasto (zakaz rozlania na atak dystansowy)
  const world = makeWorld();
  world.units[0].q = 5;
  world.units[0].r = 2; // dystans 3 od miasta
  const target = world.cities.find(c => c.id === 'wrog-c1');
  const res = runEngineMove(REAL.executeAiCityMove, world, {
    type: 'move', unitId: 'ai-u1', toQ: 5, toR: 5, targetCityId: 'wrog-c1',
  });
  eq(res.captured, false, 'K4g: miasto ODDALONE (dystans 3) nie jest przejmowane — brak ataku dystansowego');
  eq(target.ownerId, WROG_OWNER, 'K4h: miasto ODDALONE zachowuje ownerId === 2');
}
{
  // rozkaz bez targetCityId — zwykły przemarsz nie może cicho przejąć miasta
  const world = makeWorld();
  const target = world.cities.find(c => c.id === 'wrog-c1');
  const res = runEngineMove(REAL.executeAiCityMove, world, {
    type: 'move', unitId: 'ai-u1', toQ: 5, toR: 5,
  });
  eq(res.captured, false, 'K4i: rozkaz move BEZ targetCityId nie przejmuje miasta');
  eq(target.ownerId, WROG_OWNER, 'K4j: rozkaz move BEZ targetCityId zostawia ownerId === 2');
}

// ===========================================================================
// A5/A6 — WPIĘCIE W main.ts (jedyny fragment łańcucha nieimportowalny jako moduł)
// ===========================================================================
console.log('\n--- A5/A6: wpięcie w main.ts (anty-„naprawa na papierze") ---');
{
  const mainSrc = fs.readFileSync(MAIN_TS, 'utf8');
  const callIdx = mainSrc.indexOf('const moveResult = executeAiCityMove({');
  assert(callIdx > 0, 'A5a: main.ts wywołuje executeAiCityMove w pętli komend AI');
  const window = mainSrc.slice(callIdx, callIdx + 1400);
  assert(window.includes('canOccupyCityHex: canUnitOccupyCityHex(u.ownerId, cmd.toQ, cmd.toR, cities),'),
    'A5b: egzekutor dostaje REALNĄ canUnitOccupyCityHex (reguła bazowa nadal liczona)');
  assert(/onCapture:\s*\(city\)\s*=>\s*tryAutoCaptureEmptyCityAt\(/.test(window),
    'A5c: onCapture jest wpięty w tryAutoCaptureEmptyCityAt — bez tego rozkaz przechodzi, ale miasto NIE zmienia właściciela');
  assert(window.includes('hasCityDefenders(destinationCity, units)'),
    'A5d: hasCityDefenders liczone z realnego stanu jednostek');

  const fnIdx = mainSrc.indexOf('function tryAutoCaptureEmptyCityAt(');
  assert(fnIdx > 0, 'A6a: tryAutoCaptureEmptyCityAt istnieje w main.ts');
  const captureIdx = mainSrc.indexOf('captureCityWithoutBattle(city, anchor, atkRoster);', fnIdx);
  assert(captureIdx > fnIdx, 'A6b: tryAutoCaptureEmptyCityAt kończy się realnym captureCityWithoutBattle');
  const body = mainSrc.slice(fnIdx, captureIdx);
  assert(body.includes('if (!canCaptureCityWithoutBattle(city, units)) return false;'),
    'A6c: jedyną bramką obrońców jest canCaptureCityWithoutBattle (wspólna dla gracza, barbarzyńców i AI)');
  // Filtr po ownerze napastnika odciąłby AI od przejęcia — dokładnie defekt tego tematu.
  // Jedyne dozwolone porównanie `ownerId` to blok „miasto już moje" (city.ownerId ===
  // anchor.ownerId), który KOŃCZY SIĘ `return false` i nie jest ścieżką przejęcia.
  const sameOwnerIdx = body.indexOf('if (city.ownerId === anchor.ownerId) {');
  assert(sameOwnerIdx > 0, 'A6d: rozpoznano blok „miasto już należy do napastnika"');
  const head = body.slice(0, sameOwnerIdx);
  const tailIdx = body.indexOf('if (!canCaptureCityWithoutBattle(city, units)) return false;');
  const tail = body.slice(tailIdx);
  eq(/anchor\.ownerId/.test(head), false,
    'A6e: przed blokiem własnego miasta NIE ma warunku po ownerId napastnika');
  eq(/ownerId/.test(tail), false,
    'A6f: między bramką obrońców a przejęciem NIE ma filtra po ownerId — ścieżka osiągalna dla cywilizacji major');
}

// ===========================================================================
// K6 — MUTACJE: bramka MUSI czerwienieć po cofnięciu naprawy
// ===========================================================================
console.log('\n--- K6: mutacje egzekutora (dowód nietautologiczności) ---');
function countRedsUnderExecutor(executor) {
  let reds = 0;
  const world = makeWorld();
  const plan = planAiCityMove(world);
  const target = world.cities.find(c => c.id === 'wrog-c1');
  const res = runEngineMove(executor, world, plan.move);
  if (res.moved !== true) reds++;
  if (res.captured !== true) reds++;
  if (target.ownerId !== AI_OWNER) reds++;
  if (`${world.units[0].q},${world.units[0].r}` !== '5,5') reds++;
  return reds;
}
{
  const redsPrefix = countRedsUnderExecutor(PREFIX_EXECUTOR);
  eq(redsPrefix, 4, 'K6a: MUT-1 (bezwarunkowa blokada obcego heksu, stan sprzed naprawy) — 4 czerwone asercje K2');

  const MUT_NO_CAPTURE = bundleExecutorVariant(
    src => src.replace('&& opts.onCapture?.(destinationCity, unit) === true;', '&& false;'),
    'nocapture',
  );
  eq(countRedsUnderExecutor(MUT_NO_CAPTURE), 2,
    'K6b: MUT-2 („naprawa na papierze" — ruch przechodzi, callback przejęcia wycięty) — 2 czerwone asercje K2 (captured + ownerId)');

  const MUT_NO_UNBLOCK = bundleExecutorVariant(
    src => src.replace('if (canEnterEmptyCity) blockedKeys.delete(opts.destinationKey);', ''),
    'nounblock',
  );
  eq(countRedsUnderExecutor(MUT_NO_UNBLOCK), 4,
    'K6c: MUT-3 (heks celu pozostaje zablokowany dla pathfindingu) — 4 czerwone asercje K2');

  const MUT_DROP_ADJACENCY = bundleExecutorVariant(
    src => src.replace(
      "const canEnterEmptyCity = destinationCity !== undefined\n    && command.targetCityId === destinationCity.id",
      "const canEnterEmptyCity = destinationCity !== undefined",
    ),
    'dropTarget',
  );
  // Ten mutant ROZLUŹNIA regułę (przejęcie bez targetCityId) — musi zaczerwienić K4i/K4j.
  const world = makeWorld();
  const target = world.cities.find(c => c.id === 'wrog-c1');
  const res = runEngineMove(MUT_DROP_ADJACENCY, world, {
    type: 'move', unitId: 'ai-u1', toQ: 5, toR: 5,
  });
  eq(res.captured, true, 'K6d: MUT-4 (rozluźnienie — przejęcie bez targetCityId) faktycznie przejmuje, czyli K4i/K4j złapałyby rozlanie');
  eq(target.ownerId, AI_OWNER, 'K6e: MUT-4 zmienia ownerId, potwierdzając że asercje K4i/K4j nie są puste');
}

cleanup();
console.log(fail
  ? `\nFAIL ${ok}/${ok + fail}`
  : `\nAI-ZDOBYCIE-MIASTA-ADIACENCJA OK (${ok}/${ok})`);
process.exit(fail ? 1 : 0);
