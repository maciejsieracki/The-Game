'use strict';
/**
 * city-siege-wall-rules-test.cjs
 *
 * R-WEB-PALISADE-BATTLE-WALL-RULES-Q1, runda 1 (R1-R3): reguly oblezenia miasta z
 * MUREM / PALISADA (decyzja wlasciciela 2026-11-03). R4 (wieze strzeleckie) = runda 2,
 * NIE testowane tutaj.
 *
 *  R1 obwarowane miasto nie padnie bez wylomu -- potrzebne machiny oblezenicze (units.json Typ=Siege);
 *  R2 melee nie atakuje obroncy na murze/za palisada, dystansowy i machina tak; po wylomie melee wchodzi;
 *  R3 bonus obrony na murze/palisadzie NALICZANY w bitwie: +200% mur / +100% palisada
 *     (miasto-params.json) -- sprawdzone w kodzie _singleBlow i computeInstantResult.
 *
 * Scenariusze liczone PRAWDZIWYMI funkcjami (city-fortification.ts, city-defense.ts,
 * unit-power.ts isSiegeUnit na realnych definicjach z units.json); okablowanie sceny/main
 * przypiete do zrodla z mutacja (usuniecie => czerwono).
 *
 * Usage (z gra/): node tools/city-siege-wall-rules-test.cjs
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const GRA = path.resolve(__dirname, '..');
let pass = 0; let fail = 0;
function assert(c, m) { if (c) { pass++; console.log('  [OK]', m); } else { fail++; console.error('  [FAIL]', m); } }

const RUN = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
const OUT = path.join(os.tmpdir(), `city-siege-wall-${RUN}`);
fs.mkdirSync(OUT, { recursive: true });
process.on('exit', () => { try { fs.rmSync(OUT, { recursive: true, force: true }); } catch { /* best-effort */ } });
function bundle(entry, name) {
  const outfile = path.join(OUT, name + '.cjs');
  esbuild.buildSync({ entryPoints: [path.join(GRA, entry)], bundle: true, platform: 'node', format: 'cjs', outfile, logLevel: 'silent', loader: { '.json': 'json' } });
  return require(outfile);
}
const F = bundle('src/game/city-fortification.ts', 'fort');
const D = bundle('src/game/city-defense.ts', 'def');
const UP = bundle('src/game/unit-power.ts', 'up');
const units = JSON.parse(fs.readFileSync(path.join(GRA, 'data/units.json'), 'utf8'));
const ul = Array.isArray(units) ? units : Object.values(units)[0];
const params = JSON.parse(fs.readFileSync(path.join(GRA, 'data/miasto-params.json'), 'utf8'));
const P = {
  mur: params.bonus_obrona_mur_proc.wartosc, cytadela: params.bonus_obrona_cytadela_proc.wartosc,
  baszta: params.bonus_obrona_baszta_proc.wartosc, palisada: params.bonus_obrona_palisada_proc.wartosc,
};
const byName = n => ul.find(u => u.Jednostka === n);

console.log('\nR1 -- zdobycie wymaga wylomu (machiny)');
const machines = ul.filter(u => UP.isSiegeUnit(u)).map(u => u.Jednostka);
assert(['Taran', 'Katapulta', 'Wieża oblężnicza'].every(n => machines.includes(n)), 'units.json: machiny oblezenicze rozpoznane: ' + machines.join(', '));
const wojownik = byName('Wojownik');
assert(wojownik && !UP.isSiegeUnit(wojownik), 'zwykla piechota nie jest machina');
const scenario = (built, roster) => {
  const hasMachine = roster.some(u => UP.isSiegeUnit(u));
  return F.canCaptureCity(F.cityHasFortification(built), F.autoStormBreach(hasMachine));
};
for (const [lbl, built] of [['MUR', ['mury']], ['PALISADA', ['palisada']]]) {
  assert(scenario(built, [wojownik]) === false, `${lbl}, bez machin: miasto NIE do zdobycia`);
  assert(scenario(built, [wojownik, byName('Taran')]) === true, `${lbl}, z taranem (wylom): zdobycie`);
  assert(scenario(built, [wojownik, byName('Katapulta')]) === true, `${lbl}, z katapulta: zdobycie`);
  assert(scenario(built, [wojownik, byName('Wieża oblężnicza')]) === true, `${lbl}, z wieza oblezniczna: zdobycie (zalozenie dispatchu)`);
}
assert(scenario([], [wojownik]) === true, 'bez obwarowania, bez machin: zdobycie jak dotad (bez zmian)');
assert(F.canCaptureCity(true, false) === false && F.canCaptureCity(true, true) === true, 'canCaptureCity: wylom taktyczny (BattleResult.wallBreached) otwiera miasto');

console.log('\nR2 -- melee vs obronca na murze/za palisada');
const luk = ul.find(u => /Łucznik|Lucznik/.test(String(u.Jednostka)));
for (const lbl of ['MUR', 'PALISADA']) {
  assert(F.meleeBlockedByWall({ attackerIsMelee: true, attackerOnWall: false, defenderOnWall: true }) === true, `${lbl}: melee zablokowane`);
  assert(F.meleeBlockedByWall({ attackerIsMelee: false, attackerOnWall: false, defenderOnWall: true }) === false, `${lbl}: dystansowy/machina moga`);
  assert(F.meleeBlockedByWall({ attackerIsMelee: true, attackerOnWall: false, defenderOnWall: false }) === false, `${lbl}: po wylomie melee wchodzi i walczy`);
}
// Runda 2 (zarzut 3): obroncy na koronie muru NIE schodza z niej -- po wylomie
// blokada musi zniknac takze dla nich (onWallWalkway nadal true).
assert(F.meleeBlockedByWall({ attackerIsMelee: true, attackerOnWall: false, defenderOnWall: true, wallBreached: false }) === true, 'bez wylomu: melee nadal zablokowane');
assert(F.meleeBlockedByWall({ attackerIsMelee: true, attackerOnWall: false, defenderOnWall: true, wallBreached: true }) === false, 'PO wylomie: melee bije obroncy nadal stojacego na koronie muru');
assert(!!luk, 'units.json zawiera lucznika (jednostka dystansowa) do scenariusza');

console.log('\nR3 -- bonus obrony na murze/palisadzie naliczany w bitwie');
assert(D.cityWallDefenseBonusPercent(['mury'], P) === 200, `mur +${P.mur}%`);
assert(D.cityWallDefenseBonusPercent(['palisada'], P) === 100, `palisada +${P.palisada}%`);
const BS = fs.readFileSync(path.join(GRA, 'src/battle/battleScene.ts'), 'utf8');
const pins = [
  ['konstruktor: wallDefenseTotalProc z builtBuildingIds (palisada w P)', /cityWallDefenseBonusPercent\(opts\.siege\?\.builtBuildingIds, \{\s*\n\s*mur: murProc, cytadela: cytadelaProc, baszta: basztaProc, palisada: palisadaProc,/],
  ['_singleBlow: bonus tylko dla obroncy onWallWalkway', /\(defender\.onWallWalkway \? this\.wallDefenseTotalProc : 0\)/],
  ['skip(): computeInstantResult dostaje wallDefenseTotalProc', /this\.wallDefenseTotalProc,\s*\n\s*this\.isCityDefenseBattle,/],
];
for (const [name, re] of pins) {
  const ok = re.test(BS);
  assert(ok, 'bonus naliczany -- ' + name);
  assert(ok && !re.test(BS.replace(re, '/*MUT*/')), 'mutacja lamie: ' + name);
}
const MAIN = fs.readFileSync(path.join(GRA, 'src/main.ts'), 'utf8');
const bsPins = [
  ['scena przekazuje wallBreached do meleeBlockedByWall', BS, /return meleeBlockedByWall\(\{\s*\n[^\n]*\n[^\n]*\n\s*wallBreached: this\.wallEverBreached,/],
];
for (const [name, src, re] of bsPins) {
  const ok = re.test(src);
  assert(ok, 'R2 okablowanie -- ' + name);
  assert(ok && !re.test(src.replace(re, '/*MUT*/')), 'mutacja lamie: ' + name);
}
const mainPins = [
  ['AI bez machin nie szturmuje obwarowanego miasta', /if \(fortifiedCityCaptureBlocked\(city, appendReadyMachinesToRoster\(atkRoster, city, anchor\.ownerId, false\)\)\) \{\s*\n\s*if \(!city\.oblegane\) startMapSiege\(ctx\);/],
  ['szturm gracza: puste obwarowane miasto bez machin nie pada', /if \(!cityHasDefenders\(city\) \|\| collectSiegeDefRoster\(city\)\.length === 0\) \{\s*\n\s*if \(fortifiedCityCaptureBlocked\(city, atkRoster\)\)/],
  ['atak z allowCityCapture (barbarzyncy hard) nie zdobywa obwarowanego miasta bez machin', /opts\?\.allowCityCapture === true\s*\n\s*&& opts\?\.siegeContext !== true\s*\n\s*&& cityOnHex !== null\s*\n\s*&& !canCaptureCity\(/],
  ['capture w applyMapBattleOutcome respektuje fortifiedCaptureBlocked', /&& !fortifiedCaptureBlocked\s*\n\s*\) \{\s*\n\s*const atkOwner/],
  ['holdPositionAfterWin z fortifiedCaptureBlocked', /holdPositionAfterWin: fortifiedCaptureBlocked,/],
  ['ruch barbarzyncy: obwarowanie przekazane do canBarbarianWalkIntoEmptyCity', /moveDestCity, units, _menuDifficulty,\s*\n\s*moveDestCity !== undefined\s*\n\s*&& cityIsFortified\(moveDestCity\.maMur, cityBuilt\.get\(moveDestCity\.id\)\)/],
  ['wynik szturmu: wylom z BattleResult albo machina (Auto)', /res\.wallBreached\s*\n\s*\?\? autoStormBreach\(/],
];
for (const [name, re] of mainPins) {
  const ok = re.test(MAIN);
  assert(ok, 'R1 okablowanie -- ' + name);
  assert(ok && !re.test(MAIN.replace(re, '/*MUT*/')), 'mutacja lamie: ' + name);
}

console.log('\nR1 -- barbarzyncy (runda 2, zarzuty 1-2)');
{
  const B = bundle('src/game/barbarians.ts', 'barb');
  const emptyCity = { id: 'c1', ownerId: 1, q: 3, r: 3, maMur: true, nazwa: 'X' };
  const probe = fortified => B.canBarbarianWalkIntoEmptyCity(emptyCity, [], 'hard', fortified);
  const open = B.canBarbarianWalkIntoEmptyCity({ ...emptyCity, maMur: false }, [], 'hard', false);
  assert(open === true, 'puste miasto BEZ obwarowania, hard: barbarzynca wchodzi (bez zmian)');
  assert(probe(true) === false, 'puste miasto Z murem/palisada, hard: barbarzynca NIE wchodzi (jednostka nie jest przesuwana)');
  assert(B.canBarbarianWalkIntoEmptyCity({ ...emptyCity, maMur: false }, [], 'hard') === true, 'brak 4. argumentu = zachowanie dotychczasowe');
  const bsrc = fs.readFileSync(path.join(GRA, 'src/game/barbarians.ts'), 'utf8');
  const mut = bsrc.replace('&& !destCityFortified', '');
  const mf = path.join(OUT, 'barbmut.cjs');
  esbuild.buildSync({ stdin: { contents: mut, loader: 'ts', resolveDir: path.join(GRA, 'src/game') }, bundle: true, platform: 'node', format: 'cjs', outfile: mf, logLevel: 'silent', loader: { '.json': 'json' } });
  assert(mut !== bsrc && require(mf).canBarbarianWalkIntoEmptyCity(emptyCity, [], 'hard', true) === true, 'mutacja (bez !destCityFortified) wpuszcza barbarzynce => asercja by padla');
  const barbMachines = ul.filter(u => UP.isSiegeUnit(u) && /barbar/i.test(JSON.stringify(u))).length;
  console.log('  info: jednostki oblezenicze oznaczone jako barbarzynskie w units.json:', barbMachines);
}

console.log('\nMutacja funkcji: wylom zawsze true => R1 czerwone');
{
  const modSrc = fs.readFileSync(path.join(GRA, 'src/game/city-fortification.ts'), 'utf8');
  const mutSrc = modSrc.replace('return !fortified || wallBreached;', 'return true;');
  const mf = path.join(OUT, 'mut.cjs');
  esbuild.buildSync({ stdin: { contents: mutSrc, loader: 'ts', resolveDir: path.join(GRA, 'src/game') }, bundle: true, platform: 'node', format: 'cjs', outfile: mf, logLevel: 'silent' });
  const M = require(mf);
  assert(mutSrc !== modSrc && M.canCaptureCity(true, false) === true, 'zmutowane canCaptureCity zdobywa mur bez wylomu => asercje R1 by padly');
}

console.log(`\nWYNIK: ${pass} OK, ${fail} FAIL`);
process.exit(fail ? 1 : 0);
