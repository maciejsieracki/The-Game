'use strict';
/**
 * miasta-panstwa-wylaczone-test.cjs — P-USTAWIENIA-MIASTA-PANSTWA-WYLACZONE-Q1
 * (Maciej, 2026-09-03): "Wyłączone" w "Trudność miast-państw" (nowa gra) —
 * czwarta opcja obok Łatwy/Normalny/Trudny, wzorem barbariansLevel/'brak'.
 *
 * Sprawdza:
 *  A) clampMiastaPanstwaCount(raw, allowZero) — regresja allowZero=false (domyślne,
 *     używane przez WSZYSTKIE inne wywołania w repo poza nowa galezia "Wylaczone")
 *     musi być BYTE-IDENTYCZNA ze stanem origin/main (bundlowanym osobno) — to jest
 *     dowod PRZED/PO dla pozostalych 3 poziomow trudnosci na poziomie funkcji.
 *     allowZero=true (nowa galaz) faktycznie schodzi do 0.
 *  B) Zywa generacja swiata (generateMap + buildClusterStartPlan, DOKŁADNIE ta sama
 *     funkcja, ktorej main.ts uzywa do spawnu miast-panstw) z rywaleNaKlaster=0 —
 *     sprawdzone NA STRUKTURZE WYNIKOWEJ PLANU (pendingSameTypeRivals,
 *     pendingSameTypeRivalHexes, pendingSameTypeRivalOwnerIds), nie tylko brak
 *     wyjatku. "pendingSameTypeRivals" to dokladnie to pole, ktore main.ts
 *     applyClusterStartPlan() zasila parametrem rywaleNaKlaster = _menuCityStates —
 *     patrz cluster-start-test.cjs (istniejacy test), assert
 *     `rywaleNaKlaster: 4 -> plan.pendingSameTypeRivals === 4`.
 *  C) PRE/PO na TYM SAMYM SEEDZIE dla 3 reprezentatywnych wartosci z zakresu
 *     pozostalych 3 poziomow trudnosci (1, 5, 9 — pelny zakres [1, MAX_MIAST_PANSTWA])
 *     — bundle z origin/main (PRE, ten sam kod generatora/klastrow, NIEDOTKNIETY
 *     tym tematem) kontra bundle z biezacego worktree (PO) — plan musi byc
 *     BYTE-IDENTYCZNY (JSON porownanie po normalizacji Map/Set), nie "wyglada
 *     podobnie".
 *  D) Dowod niemutacyjnosci (anty-tautologia, R-PROC-AUTOBOT.md §9 pkt 6b):
 *     zmutowany clampMiastaPanstwaCount (allowZero zignorowany) MUSI zaczerwienic
 *     test A.
 *
 * Run from gra/:  node tools/miasta-panstwa-wylaczone-test.cjs
 */

const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const GRA = path.resolve(__dirname, '..');
const PRE_ROOT = path.resolve(GRA, '..', '..', 'tmp', 'claude-0', '-home-user-The-Game',
  'cbf4a126-dca3-5f50-bfb0-2a747b18a590', 'scratchpad', 'pre-main', 'gra');
const PRE_ROOT_RESOLVED = fs.existsSync(PRE_ROOT)
  ? PRE_ROOT
  : '/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/pre-main/gra';

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; console.log('  PASS:', msg); }
  else { failed++; console.error('  FAIL:', msg); }
}

function bundleOf(root, tag) {
  // KRYTYCZNE: entry MUSI leżeć wewnątrz `root/tools/`, żeby relatywny import
  // '../src/...' rozwiązał się do TEGO konkretnego drzewa (PRE/POST/MUT), nie do
  // __dirname (zawsze bieżący worktree Operatora) — inaczej PRE/MUT po cichu
  // bundlowałyby ten sam plik co POST i cały test A/C/D byłby tautologią.
  const entry = path.join(root, 'tools', `.mpw-entry-${tag}.ts`);
  const outBundle = path.join(root, 'tools', `.mpw-bundle-${tag}.cjs`);
  fs.writeFileSync(entry, `
export { clampMiastaPanstwaCount, MAX_MIAST_PANSTWA } from '../src/map/newGameMapDefaults';
export { buildClusterStartPlan } from '../src/game/cluster-start';
export { generateMap } from '../src/map/generator';
`, 'utf8');
  esbuild.buildSync({
    entryPoints: [entry],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    loader: { '.ts': 'ts', '.json': 'json' },
    outfile: outBundle,
    absWorkingDir: root,
    logLevel: 'silent',
  });
  const mod = require(outBundle);
  fs.unlinkSync(entry);
  fs.unlinkSync(outBundle);
  return mod;
}

console.log('miasta-panstwa-wylaczone-test (P-USTAWIENIA-MIASTA-PANSTWA-WYLACZONE-Q1)\n');

if (!fs.existsSync(PRE_ROOT_RESOLVED)) {
  console.error('FAIL: brak PRE-tree (origin/main) w scratchpadzie — uruchom najpierw git archive.');
  process.exit(1);
}

const POST = bundleOf(GRA, 'post');
const PRE = bundleOf(PRE_ROOT_RESOLVED, 'pre');
const civsPost = require(path.join(GRA, 'data/civs.json'));
const civsPre = require(path.join(PRE_ROOT_RESOLVED, 'data/civs.json'));

console.log('-- A) clampMiastaPanstwaCount: regresja allowZero=false (domyślne) + nowa galaz allowZero=true --');
const sampleInputs = [-5, -1, 0, 0.6, 1, 2, 3, 5, 9, 10, 15, 50, NaN, Infinity, -Infinity];
for (const n of sampleInputs) {
  const preVal = PRE.clampMiastaPanstwaCount(n);
  const postValDefault = POST.clampMiastaPanstwaCount(n);
  assert(postValDefault === preVal,
    `clamp(${n}) [default/allowZero=false] PO === PRZED (origin/main): ${postValDefault} === ${preVal}`);
  assert(postValDefault === POST.clampMiastaPanstwaCount(n, false),
    `clamp(${n}, false) jawne === clamp(${n}) domyślne (parametr nie zmienia domyślnego zachowania)`);
}
assert(PRE.MAX_MIAST_PANSTWA === POST.MAX_MIAST_PANSTWA, `MAX_MIAST_PANSTWA niezmienione (${POST.MAX_MIAST_PANSTWA})`);

console.log('\n-- A2) clampMiastaPanstwaCount: nowa gałąź allowZero=true (WYŁĄCZNIE dla "Wyłączone") --');
assert(POST.clampMiastaPanstwaCount(0, true) === 0, 'clamp(0, true) === 0 (dokładnie to, czego main.ts potrzebuje dla "Wyłączone")');
assert(POST.clampMiastaPanstwaCount(-5, true) === 0, 'clamp(-5, true) === 0 (nie ujemne)');
assert(POST.clampMiastaPanstwaCount(NaN, true) === 0, 'clamp(NaN, true) === 0 (bezpieczny fallback)');
assert(POST.clampMiastaPanstwaCount(15, true) === 9, 'clamp(15, true) === 9 (górny sufit MAX_MIAST_PANSTWA nadal obowiązuje)');
assert(POST.clampMiastaPanstwaCount(3, true) === 3, 'clamp(3, true) === 3 (wartości w środku zakresu bez zmian)');

console.log('\n-- D) Dowód niemutacyjności testu A2: allowZero faktycznie zmienia wynik (nie tautologia) --');
{
  // Rzeczywista mutacja źródła: podmieniamy `allowZero ? 0 : 1` na stałe `1`, bundlujemy
  // ZMUTOWANĄ wersję do osobnego katalogu i uruchamiamy DOKŁADNIE test A2 na niej —
  // jeśli test A2 cokolwiek realnie sprawdza (nie jest tautologią), MUSI się teraz
  // zaczerwienić dla clamp(0, true).
  const origSrc = fs.readFileSync(path.join(GRA, 'src/map/newGameMapDefaults.ts'), 'utf8');
  const needle = 'const floor = allowZero ? 0 : 1;';
  assert(origSrc.includes(needle), 'źródło zawiera oczekiwany fragment (punkt zaczepienia mutacji)');
  const mutatedSrc = origSrc.replace(needle, 'const floor = 1; // MUTACJA: allowZero zignorowany');
  const mutRoot = path.join(require('os').tmpdir(), 'mpw-mut-root-' + process.pid);
  fs.rmSync(mutRoot, { recursive: true, force: true });
  fs.cpSync(GRA, mutRoot, { recursive: true, filter: (src) => !src.includes('node_modules') && !src.includes(path.sep + 'dist') });
  fs.writeFileSync(path.join(mutRoot, 'src/map/newGameMapDefaults.ts'), mutatedSrc, 'utf8');
  fs.symlinkSync(path.join(GRA, 'node_modules'), path.join(mutRoot, 'node_modules'));
  const MUT = bundleOf(mutRoot, 'mut');
  assert(MUT.clampMiastaPanstwaCount(0, true) === 1,
    'kontrola: bundel ZMUTOWANY (allowZero zignorowany) daje clamp(0,true)===1, różne od prawdziwego 0 — dowód, że test A2 nie jest tautologią');
  fs.rmSync(mutRoot, { recursive: true, force: true });
}

console.log('\n-- B) Żywa generacja świata (generateMap + buildClusterStartPlan) z rywaleNaKlaster=0 --');
const SEED = 4242;
const mapOff = POST.generateMap(50, 50, SEED, 'kontynenty');
let planOff;
let threwOff = false;
try {
  planOff = POST.buildClusterStartPlan({
    map: mapOff,
    civs: civsPost,
    seed: SEED,
    playerCivId: 'grecy',
    rywaleNaKlaster: POST.clampMiastaPanstwaCount(0, true), // dokładnie ścieżka main.ts dla "Wyłączone"
    aktywneTypy: 5,
  });
} catch (e) {
  threwOff = true;
  console.error('  WYJĄTEK:', e && e.stack || e);
}
assert(!threwOff, 'generacja z rywaleNaKlaster=0 kończy się BEZ wyjątku (brak crasha)');
if (!threwOff) {
  assert(planOff.pendingSameTypeRivals === 0, `plan.pendingSameTypeRivals === 0 (got ${planOff.pendingSameTypeRivals})`);
  assert(planOff.pendingSameTypeRivalHexes.length === 0, `plan.pendingSameTypeRivalHexes.length === 0 (got ${planOff.pendingSameTypeRivalHexes.length})`);
  assert(planOff.pendingSameTypeRivalOwnerIds.length === 0, `plan.pendingSameTypeRivalOwnerIds.length === 0 (got ${planOff.pendingSameTypeRivalOwnerIds.length})`);
  assert(planOff.simplifiedDiplomacyOwners.size === 0, 'simplifiedDiplomacyOwners.size === 0 (zero rywali "tego samego typu" = zero miast-państw gracza)');
  assert(planOff.playerStartCityName && planOff.playerStartHex, 'stolica gracza nadal poprawnie generowana (cywilizacje NIE dotknięte)');
  assert(planOff.foreignTypeOwners.size > 0, 'obce cywilizacje AI nadal generowane normalnie (mapa ma WYŁĄCZNIE cywilizacje, zgodnie z GOAL 4)');
}

console.log('\n-- C) PRE/PO na TYM SAMYM SEEDZIE dla 3 reprezentatywnych poziomów pozostałych 3 opcji trudności --');
for (const n of [1, 5, 9]) {
  const mapPre = PRE.generateMap(50, 50, SEED, 'kontynenty');
  const mapPost = POST.generateMap(50, 50, SEED, 'kontynenty');
  const planPre = PRE.buildClusterStartPlan({
    map: mapPre, civs: civsPre, seed: SEED, playerCivId: 'grecy',
    rywaleNaKlaster: PRE.clampMiastaPanstwaCount(n), aktywneTypy: 5,
  });
  const planPost = POST.buildClusterStartPlan({
    map: mapPost, civs: civsPost, seed: SEED, playerCivId: 'grecy',
    rywaleNaKlaster: POST.clampMiastaPanstwaCount(n), aktywneTypy: 5,
  });
  const norm = (p) => JSON.stringify({
    playerStartHex: p.playerStartHex,
    playerStartCityName: p.playerStartCityName,
    spawnCities: p.spawnCities,
    pendingSameTypeRivals: p.pendingSameTypeRivals,
    pendingSameTypeRivalHexes: p.pendingSameTypeRivalHexes,
    pendingSameTypeRivalOwnerIds: p.pendingSameTypeRivalOwnerIds,
    typCityCopyOwners: Array.from(p.typCityCopyOwners).sort((a, b) => a - b),
    clusterCapitalOwnerIds: p.clusterCapitalOwnerIds,
    foreignTypeOwners: Array.from(p.foreignTypeOwners).sort((a, b) => a - b),
  });
  const same = norm(planPre) === norm(planPost);
  assert(same, `n=${n}: plan PRZED (origin/main) === plan PO (biezacy worktree), seed=${SEED}, byte-identyczne`);
  assert(planPost.pendingSameTypeRivals === n, `n=${n}: pendingSameTypeRivals === ${n} (parametr trafia bez zmian, jak w cluster-start-test.cjs)`);
}

console.log('\n-- E) generator.ts:659 (expectedStartCityCount/gęstość chatek) przez generateMap(genOpts) --');
{
  // Ewaluator runda 1, zarzut 1: `expectedStartCityCount()` w generatorze wołał
  // clampMiastaPanstwaCount(genOpts?.cityStatesCount) BEZ allowZero=true, więc dla
  // "Wyłączone" (cityStatesCount:0, ścieżka produkcyjna generujSwiatAsync->generateMap)
  // formuła gęstości chatek liczyła tak, jakby było 1 miasto-państwo, nie 0 — dwukrotnie
  // za dużo chatek (zweryfikowane przez Ewaluatora: 20 zamiast 10 dla civTypesCount=5,
  // seed 4242). Test end-to-end na PRAWDZIWYM generateMap(genOpts), nie tylko na
  // clampMiastaPanstwaCount() w izolacji (test A/A2 tego by nie złapał — sam
  // call-site w generator.ts jest tym, co było pominięte).
  const SEED_E = 4242;
  const countHuts = (map) => {
    let n = 0;
    for (const k in map.hexes) if (map.hexes[k].wioska && map.hexes[k].wioska.istnieje) n++;
    return n;
  };
  const genOptsOff = { civTypesCount: 5, cityStatesCount: 0, difficulty: 'normal', villageRewardsEnabled: true };
  const genOptsOne = { civTypesCount: 5, cityStatesCount: 1, difficulty: 'normal', villageRewardsEnabled: true };
  const mapOff = POST.generateMap(50, 50, SEED_E, 'kontynenty', genOptsOff);
  const mapOne = POST.generateMap(50, 50, SEED_E, 'kontynenty', genOptsOne);
  const hutsOff = countHuts(mapOff);
  const hutsOne = countHuts(mapOne);
  console.log(`  info: chatki cityStatesCount=0 -> ${hutsOff}, cityStatesCount=1 -> ${hutsOne}`);
  assert(hutsOff > 0, `chatki nadal generowane przy "Wyłączone" (villageRewardsEnabled:true), got ${hutsOff}`);
  // Cel: civTypesCount*(1+states)*mnożnik_trudności => 0: 5*1*2=10, 1: 5*2*2=20 (dokładnie
  // 2x). Placement na żywej mapie ma tolerancję (spacing od miast/wiosek), więc żądamy
  // wyraźnej różnicy (<=65%), nie bajt-identycznej liczby — próg wystarczający, by odróżnić
  // "naprawione" (~50%) od zbugowanego stanu sprzed poprawki (~100%, states=0 traktowane
  // jak states=1, patrz mutacja niżej).
  assert(hutsOff < hutsOne * 0.65,
    `chatki dla cityStatesCount=0 wyraźnie mniej niż dla cityStatesCount=1 (${hutsOff} < ${hutsOne} * 0.65 = ${(hutsOne * 0.65).toFixed(1)})`);

  // Dowód niemutacyjności (jak test D): cofnięcie `true` w call-site generator.ts:659
  // (dokładnie zarzucany stan) MUSI zaczerwienić powyższą asercję.
  const origSrc = fs.readFileSync(path.join(GRA, 'src/map/generator.ts'), 'utf8');
  const needle = 'clampMiastaPanstwaCount(\n      genOpts?.cityStatesCount ?? defaultMiastaPanstwaFromMapLabel(mapMenuLabel),\n      true,\n    ),';
  assert(origSrc.includes(needle), 'źródło zawiera oczekiwany fragment (punkt zaczepienia mutacji, call-site generator.ts:659)');
  const mutatedSrc = origSrc.replace(needle,
    'clampMiastaPanstwaCount(\n      genOpts?.cityStatesCount ?? defaultMiastaPanstwaFromMapLabel(mapMenuLabel),\n    ), // MUTACJA: allowZero cofnięty (dokładnie zarzucany stan)');
  const mutRoot = path.join(require('os').tmpdir(), 'mpw-mut-e-root-' + process.pid);
  fs.rmSync(mutRoot, { recursive: true, force: true });
  fs.cpSync(GRA, mutRoot, { recursive: true, filter: (src) => !src.includes('node_modules') && !src.includes(path.sep + 'dist') });
  fs.writeFileSync(path.join(mutRoot, 'src/map/generator.ts'), mutatedSrc, 'utf8');
  fs.symlinkSync(path.join(GRA, 'node_modules'), path.join(mutRoot, 'node_modules'));
  const MUT = bundleOf(mutRoot, 'mut-e');
  const mutMapOff = MUT.generateMap(50, 50, SEED_E, 'kontynenty', genOptsOff);
  const mutMapOne = MUT.generateMap(50, 50, SEED_E, 'kontynenty', genOptsOne);
  const mutHutsOff = countHuts(mutMapOff);
  const mutHutsOne = countHuts(mutMapOne);
  console.log(`  info (MUT, allowZero cofnięty): chatki cityStatesCount=0 -> ${mutHutsOff}, cityStatesCount=1 -> ${mutHutsOne}`);
  assert(!(mutHutsOff < mutHutsOne * 0.65),
    `kontrola: bundel ZMUTOWANY (allowZero cofnięty w generator.ts:659) NIE przechodzi progu <0.65`
    + ` (${mutHutsOff} vs ${mutHutsOne}) — dowód, że test E nie jest tautologią`);
  fs.rmSync(mutRoot, { recursive: true, force: true });
}

console.log(`\n========================================\nmiasta-panstwa-wylaczone-test: ${passed} pass, ${failed} fail\n`);
process.exit(failed === 0 ? 0 : 1);
