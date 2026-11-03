'use strict';
/**
 * palisade-battle-wall-rules-test.cjs
 *
 * R-WEB-PALISADE-BATTLE-WALL-RULES-Q1 (2026-11-03): miasto z PALISADA ma w bitwie
 * te same reguly obwarowania co miasto z MUREM (zmieniaja sie tylko wartosci:
 * palisada +100% / mur +200% z miasto-params.json). Miasto bez obwarowania i
 * miasto z murem -- bez zmian.
 *
 * Czesc A -- PRAWDZIWE funkcje (esbuild: game/city-fortification.ts + city-defense.ts
 *   + game/post-battle-map.ts): rozpoznanie obwarowania, pierwszenstwo mur > palisada,
 *   R1 (canCaptureCity), R2 (meleeBlockedByWall), wartosci bonusu z danych,
 *   applyPostBattleMap(holdPositionAfterWin).
 * Czesc B -- ZRODLO (battleScene.ts / main.ts nie da sie zbundlowac w izolacji: THREE +
 *   Vite): pinezki okablowania; kazda pinezka ma MUTACJE (usuniecie okablowania =
 *   czerwono), co dowodzi, ze test lapie pomijanie palisady / obwarowania.
 *
 * Usage (z gra/): node tools/palisade-battle-wall-rules-test.cjs
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
let pass = 0; let fail = 0;
function assert(c, m) { if (c) { pass++; console.log('  [OK]', m); } else { fail++; console.error('  [FAIL]', m); } }

const RUN = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
const OUT = path.join(os.tmpdir(), `pal-battle-wall-${RUN}`);
fs.mkdirSync(OUT, { recursive: true });
process.on('exit', () => { try { fs.rmSync(OUT, { recursive: true, force: true }); } catch { /* best-effort */ } });

function bundle(entry, name) {
  const outfile = path.join(OUT, name + '.cjs');
  esbuild.buildSync({
    entryPoints: [path.join(GRA, entry)], bundle: true, platform: 'node', format: 'cjs',
    outfile, logLevel: 'silent', loader: { '.json': 'json' },
  });
  return require(outfile);
}

const F = bundle('src/game/city-fortification.ts', 'fort');
const D = bundle('src/game/city-defense.ts', 'def');
const PBM = bundle('src/game/post-battle-map.ts', 'pbm');
const params = JSON.parse(fs.readFileSync(path.join(GRA, 'data/miasto-params.json'), 'utf8'));
const buildings = JSON.parse(fs.readFileSync(path.join(GRA, 'data/buildings.json'), 'utf8'));
const bl = Array.isArray(buildings) ? buildings : (buildings.budynki || buildings);
const P = {
  mur: params.bonus_obrona_mur_proc.wartosc, cytadela: params.bonus_obrona_cytadela_proc.wartosc,
  baszta: params.bonus_obrona_baszta_proc.wartosc, palisada: params.bonus_obrona_palisada_proc.wartosc,
};

console.log('\nCZESC A -- prawdziwe funkcje');
assert(F.cityFortificationKind(['palisada']) === 'palisada', 'palisada => obwarowanie "palisada"');
assert(F.cityFortificationKind(['mury']) === 'mur', 'mury => "mur"');
assert(F.cityFortificationKind(['mury', 'fort']) === 'mur', 'mury+cytadela => "mur"');
assert(F.cityFortificationKind(['palisada', 'mury']) === 'mur', 'pierwszenstwo: mur > palisada (bez podwojnego liczenia)');
assert(F.cityFortificationKind([]) === 'none' && F.cityFortificationKind(undefined) === 'none', 'brak obwarowania => none');
assert(F.cityFortificationKind(['baszta']) === 'none', 'sama baszta nie jest obwarowaniem');
assert(F.cityHasFortification(['palisada']) === F.cityHasFortification(['mury']), 'palisada i mur: ta sama klasyfikacja "obwarowane"');
assert(F.cityIsFortified(true, []) === true && F.cityIsFortified(undefined, ['palisada']) === true
  && F.cityIsFortified(false, []) === false, 'cityIsFortified: flaga maMur LUB lista budynkow');

// R1
for (const [lbl, built] of [['palisada', ['palisada']], ['mur', ['mury']]]) {
  const fort = F.cityHasFortification(built);
  assert(F.canCaptureCity(fort, false) === false, `R1 ${lbl}: bez wylomu miasto NIE do zdobycia`);
  assert(F.canCaptureCity(fort, true) === true, `R1 ${lbl}: po wylomie do zdobycia`);
}
assert(F.canCaptureCity(F.cityHasFortification([]), false) === true, 'R1 bez obwarowania: bez zmian (zdobycie mozliwe)');
assert(F.autoStormBreach(true) === true && F.autoStormBreach(false) === false, 'szturm Auto: wylom <=> machina oblezenicza');

// R2
const ctx = (m, on, d) => ({ attackerIsMelee: m, attackerOnWall: on, defenderOnWall: d });
assert(F.meleeBlockedByWall(ctx(true, false, true)) === true, 'R2: melee NIE atakuje obroncy na murze/za palisada');
assert(F.meleeBlockedByWall(ctx(false, false, true)) === false, 'R2: dystansowy/machina atakuje obroncy na murze/za palisada');
assert(F.meleeBlockedByWall(ctx(true, false, false)) === false, 'R2: melee po wylomie (obronca zszedl z muru) walczy');
assert(F.meleeBlockedByWall(ctx(true, true, true)) === false, 'R2: melee wspiety wieza walczy mur-na-murze');

// R3 -- wartosci z danych, palisada jako wartosc, nie zmieniamy liczb
assert(P.palisada === 100 && P.mur === 200, `wartosci z danych: palisada=${P.palisada}, mur=${P.mur} (bez zmiany)`);
assert(D.cityWallDefenseBonusPercent(['palisada'], P) === 100, 'bonus obrony: palisada +100');
assert(D.cityWallDefenseBonusPercent(['mury'], P) === 200, 'bonus obrony: mur +200');
assert(D.cityWallDefenseBonusPercent(['palisada', 'mury'], P) === 200, 'bonus: mur zastepuje palisade (200, nie 300)');
assert(D.cityWallDefenseBonusPercent(['mury', 'fort', 'baszta'], P) === 400, 'bonus: mur+cytadela+baszta = 400 (bez zmiany)');
assert(D.cityWallDefenseBonusPercent([], P) === 0, 'bonus: bez obwarowania 0 (bez zmiany)');
assert(D.shouldApplyGarrisonFortifyBonus(['palisada'], P) === false
  && D.shouldApplyGarrisonFortifyBonus([], P) === true, 'garnizon: fortify tylko bez obwarowania (bez zmiany)');

// Dane: palisada odblokowuje maMur => classifyCityAttack/oblezenie jak mur
const pal = bl.find(b => b.id === 'palisada'); const mur = bl.find(b => b.id === 'mury');
assert(pal.odblokowuje === 'maMur' && mur.odblokowuje === 'maMur', 'dane: palisada i mury odblokowuja te sama flage maMur');

// applyPostBattleMap -- hold po wygranej bez wylomu
function mkInput(hold) {
  const mk = (id, owner, q, r) => ({ id, ownerId: owner, q, r, hp: 10, ruchLeft: 2, typeId: 'Wojownik' });
  const a1 = mk('a1', 1, 4, 4);
  const d1 = mk('d1', 0, 5, 4);
  const units = [a1, d1];
  const city = { id: 'c', q: 5, r: 4, ownerId: 0 };
  return {
    units, a1, d1,
    input: {
      units, map: { hexes: {} }, cities: [city], battleQ: 5, battleR: 4, atkAnchor: a1, atkRoster: [a1], defRoster: [d1],
      atkStart: new Map([['a1', { q: 4, r: 4 }]]), winner: 'atakujacy',
      manualSurvivors: [{ id: 'a1', hp: 8 }], getDef: () => ({}), maxHpOf: () => 10,
      isPassableHex: () => true, isUnitAt: () => false, cityOnBattleHex: city,
      ...(hold ? { holdPositionAfterWin: true } : {}),
    },
  };
}
try {
  const open = mkInput(false); PBM.applyPostBattleMap(open.input);
  assert(open.a1.q === 5 && open.a1.r === 4, 'post-battle: bez obwarowania/po wylomie atakujacy wchodzi na heks miasta');
  const held = mkInput(true); PBM.applyPostBattleMap(held.input);
  assert(held.a1.q === 4 && held.a1.r === 4, 'post-battle: obwarowanie bez wylomu -- atakujacy zostaje pod murami');
} catch (e) { assert(false, 'post-battle-map bundle/run: ' + e.message); }

console.log('\nCZESC B -- okablowanie (zrodlo) + mutacje');
const src = n => fs.readFileSync(path.join(GRA, n), 'utf8');
const BS = src('src/battle/battleScene.ts'); const MAIN = src('src/main.ts'); const PBMS = src('src/game/post-battle-map.ts');
const pins = [
  ['battleScene: melee filtr R2 w _targetInRange', BS, /if \(this\._meleeBlockedByWall\(ru, e\)\) continue;[^\n]*\n\s*const dd = manhattan\(ru\.q, ru\.r, e\.q, e\.r\);\s*\n\s*if \(dd === 1 \|\| dd === 0\)/],
  ['battleScene: R2 w _canAttackFrom', BS, /_meleeBlockedByWall\(ru, e\)\) continue; \/\/ R2\n/],
  ['battleScene: R2 w _canStrikeTargetFrom', BS, /if \(this\._meleeBlockedByWall\(ru, target\)\) return false;/],
  ['battleScene: wylom ustawiany (kafel + brama)', BS, /this\.wallTileHp\.delete\(wallRow\);\s*\n\s*this\.wallEverBreached = true;[\s\S]*?private _breachGate\(\): void \{\s*\n\s*this\.gateOpen = true;\s*\n\s*this\.wallEverBreached = true;/],
  ['battleScene: BattleResult.wallBreached przekazane w onFinish', BS, /\.\.\.\(this\.siegeWallCol >= 0 \? \{ wallBreached: this\.wallEverBreached \} : \{\}\)/],
  ['battleScene: szturm odparty gdy pat bez wylomu', BS, /if \(isSiege && !this\.wallEverBreached\) \{/],
  ['main: R1 bramka zdobycia (szturm/AI/puste miasto)', MAIN, /function fortifiedCityCaptureBlocked\(city: City, atkRoster: RuntimeUnit\[\]\): boolean \{\s*\n\s*const fortified = cityIsFortified\(city\.maMur, cityBuilt\.get\(city\.id\)\);/],
  ['main: wejscie do pustego miasta objete R1', MAIN, /if \(fortifiedCityCaptureBlocked\(city, atkRoster\)\) \{\s*\n\s*if \(isMe\(anchor\.ownerId\)\)/],
  ['main: wygrana bez wylomu nie zdobywa miasta', MAIN, /&& opts\?\.cityCaptureBlocked !== true/],
  ['main: wallKind z jednego pojecia obwarowania', MAIN, /const fk = cityFortificationKind\(built\);/],
  ['post-battle-map: hold po wygranej', PBMS, /input\.winner === 'atakujacy' && input\.holdPositionAfterWin === true/],
];
for (const [name, text, re] of pins) {
  const ok = re.test(text);
  assert(ok, 'pinezka: ' + name);
  // MUTACJA: ta sama tresc z usunietym okablowaniem => pinezka musi zgasnąć.
  const mutated = text.replace(re, '/*MUTACJA*/');
  assert(ok && !re.test(mutated) && mutated !== text, 'mutacja lamie pinezke: ' + name);
}

console.log('\nCZESC C -- mutacja PRAWDZIWEJ funkcji: pomijanie palisady lamie test');
{
  const modSrc = fs.readFileSync(path.join(GRA, 'src/game/city-fortification.ts'), 'utf8');
  const mutSrc = modSrc.replace("if (built.includes('palisada')) return 'palisada';", '/* MUTACJA: palisada pominieta */');
  assert(mutSrc !== modSrc, 'mutacja zastosowana (palisada pominieta w cityFortificationKind)');
  const mf = path.join(OUT, 'mut-fort.cjs');
  const r = esbuild.buildSync({
    stdin: { contents: mutSrc, loader: 'ts', resolveDir: path.join(GRA, 'src/game') },
    bundle: true, platform: 'node', format: 'cjs', outfile: mf, logLevel: 'silent', write: true,
  });
  const M = require(mf);
  const kindOk = M.cityFortificationKind(['palisada']) === 'palisada';
  const captureBlocked = M.canCaptureCity(M.cityHasFortification(['palisada']), false) === false;
  assert(!kindOk && !captureBlocked, 'zmutowany modul: miasto z palisada traktowane jak bez obwarowania => asercje A.1/A.R1 CZERWONE');
}

console.log(`\nWYNIK: ${pass} OK, ${fail} FAIL`);
process.exit(fail ? 1 : 0);
