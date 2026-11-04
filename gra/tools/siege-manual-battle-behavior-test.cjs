'use strict';
/**
 * siege-manual-battle-behavior-test.cjs
 *
 * R-WEB-SIEGE-MANUAL-BATTLE-BEHAVIOR-Q1 (2026-11-04): reczna bitwa obleznicza --
 *  (A) tarany jada do BRAMY, wieza oblezna daje wejscie na mur, piechota po wiezy wchodzi i bije;
 *  (B) szarza / atakuj-marszem: wrecz i konnica NIE wchodza w zasieg ostrzalu obroncow dopoki
 *      brama/mur stoja (konnica: dopoki brama/kafel nie padnie).
 *
 * Czesc A -- PRAWDZIWE funkcje (esbuild: battle/testBattle.ts): unikalne id machin presetu
 *   (dawniej kolizja 'atk0' piechoty z 'atk0' machiny => rozkazy gracza trafialy w zla jednostke)
 *   + hak ?rams/towers.
 * Czesc B -- ZRODLO battleScene.ts (THREE + Vite nie da sie zbundlowac w izolacji): pinezki
 *   okablowania; kazda ma MUTACJE (usuniecie okablowania => czerwono).
 * Czesc C -- mutacja PRAWDZIWEJ funkcji (cofniecie prefiksu id) lamie Czesc A.
 * Zachowanie ruchu jednostek sprawdza harness zywy: tools/siege-manual-battle-live.cjs
 *   (Chromium + prawdziwa BattleScene, deterministyczny Math.random, 21 scenariuszy).
 *
 * Usage (z gra/): node tools/siege-manual-battle-behavior-test.cjs
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
let pass = 0; let fail = 0;
function assert(c, m) { if (c) { pass++; console.log('  [OK]', m); } else { fail++; console.error('  [FAIL]', m); } }

const OUT = path.join(os.tmpdir(), `siege-manual-${process.pid}-${Math.random().toString(36).slice(2, 8)}`);
fs.mkdirSync(OUT, { recursive: true });
process.on('exit', () => { try { fs.rmSync(OUT, { recursive: true, force: true }); } catch { /* best-effort */ } });

function bundleSrc(contents, name) {
  const outfile = path.join(OUT, name + '.cjs');
  esbuild.buildSync({
    stdin: { contents, loader: 'ts', resolveDir: path.join(GRA, 'src/battle') },
    bundle: true, platform: 'node', format: 'cjs', outfile, logLevel: 'silent', loader: { '.json': 'json' },
  });
  return require(outfile);
}

const unitsRaw = JSON.parse(fs.readFileSync(path.join(GRA, 'data/units.json'), 'utf8'));
const units = Array.isArray(unitsRaw) ? unitsRaw : (unitsRaw.units || unitsRaw.jednostki || Object.values(unitsRaw).find(Array.isArray));

function checkArmies(TB, tag) {
  const base = TB.buildTestArmies(units, 'oblezenie_duze');
  const withSiege = TB.ensureSiegeMachines(base, units);
  const ids = withSiege.attacker.map(u => u.id);
  const dup = ids.length - new Set(ids).size;
  const extra = TB.addSiegeMachinesCount(withSiege, units, 2, 2);
  const eids = extra.attacker.map(u => u.id);
  const rams = extra.attacker.filter(u => /battering/i.test(u.nazwa)).length - withSiege.attacker.filter(u => /battering/i.test(u.nazwa)).length;
  const towers = extra.attacker.filter(u => /siege tower/i.test(u.nazwa)).length;
  return { tag, total: ids.length, dup, edup: eids.length - new Set(eids).size, rams, towers, added: withSiege.attacker.length - base.attacker.length };
}

console.log('\nCZESC A -- prawdziwe funkcje presetu oblezenia');
const TBsrc = fs.readFileSync(path.join(GRA, 'src/battle/testBattle.ts'), 'utf8');
{
  const TB = bundleSrc(TBsrc, 'tb');
  const r = checkArmies(TB, 'real');
  assert(r.added > 0, `ensureSiegeMachines dodaje machiny (${r.added})`);
  assert(r.dup === 0, `id jednostek atakujacego unikalne po ensureSiegeMachines (duplikaty=${r.dup})`);
  assert(r.edup === 0, `id unikalne po addSiegeMachinesCount (duplikaty=${r.edup})`);
  assert(r.rams === 2, `hak rams=2 dodaje 2 tarany (${r.rams})`);
  assert(r.towers === 2, `hak towers=2 dodaje 2 wieze oblezne (${r.towers})`);
  const none = TB.addSiegeMachinesCount(TB.buildTestArmies(units, 'oblezenie_duze'), units, 0, 0);
  assert(none.attacker.length === TB.buildTestArmies(units, 'oblezenie_duze').attacker.length, 'rams=0/towers=0 => armia bez zmian');
}

console.log('\nCZESC B -- okablowanie (zrodlo) + mutacje');
const BS = fs.readFileSync(path.join(GRA, 'src/battle/battleScene.ts'), 'utf8');
const MAIN = fs.readFileSync(path.join(GRA, 'src/main.ts'), 'utf8');
const pins = [
  ['_doMove: odmowa wejscia w zasieg ostrzalu (jeden punkt ruchu)', BS, /if \(this\.siegeWallCol >= 0 && this\._siegeMoveRefused\(ru, col, row\)\) \{\s*\n\s*ru\.moveLeft = 0;\s*\n\s*done\(\);\s*\n\s*return;/],
  ['_performPlayerOrder: reczne rozkazy oblezenia', BS, /if \(this\._performSiegeManualOrder\(ru, ord, done\)\) return true;/],
  ['tryb reczny: tarany/wieze jada same', BS, /if \(\(this\._isRam\(ru\.bu\) && !this\.gateOpen\) \|\| isSiegeTower\(ru\.bu\)\) return this\._siegeRamTowerStep\(ru, done\);/],
  ['taran: cel = kafel PRZED brama (BFS), nie wzdluz muru', BS, /const goal = \(c: number, r: number\) => c === wallCol - 1 && \(r === gLo \|\| r === gHi\);/],
  ['taran: BFS preferuje rzad bramy', BS, /this\._bfsFirstStep\(ru, goal, undefined, this\.siegeGateRow\)/],
  ['wieza: staje pod murem na wolnej koronie', BS, /c === wallBase && !this\.towerAtWallRows\.has\(r\)\s*\n\s*&& this\.wallTileHp\.has\(r\)/],
  ['AUTO: wspolny helper wejscia po wiezy', BS, /if \(this\._trySiegeTowerClimb\(ru, done\)\) return;\s*\n\s*if \(this\._siegeInfantryToTowerStep\(ru, done\)\) return;/],
  ['RECZNY: piechota wchodzi po wiezy', BS, /if \(this\._trySiegeTowerClimb\(ru, done\)\) return true;\s*\n\s*if \(this\._siegeInfantryToTowerStep\(ru, done\)\) return true;/],
  ['szarza/atakuj-marszem: podejscie poza zasiegiem (nie cel na koronie)', BS, /this\._siegeSafeApproach\(ru, tc, tr,/],
  ['ograniczenie: konnica tylko po wylomie bramy/kafla', BS, /return !\(this\.gateOpen \|\| tileBreached\);/],
  ['ograniczenie: piechota po wylomie/wiezy', BS, /return !\(this\.wallEverBreached \|\| this\.towerAtWallRows\.size > 0\);/],
  ['ograniczenie: strzelcy (luk/proca) zwolnieni', BS, /if \(ru\.primaryRanged && canShoot\(ru\) && ru\.shootingEnabled !== false\) return false; \/\/ strzelec/],
  ['zrodla ognia: lucznicy z amunicja + wiezyczki muru', BS, /for \(const t of this\.siegeTowers\) \{\s*\n\s*if \(t\.destroyed\) continue;\s*\n\s*out\.push\(\{ q: this\.siegeWallCol, r: t\.row, range: this\.towerRange \}\);/],
  ['main: hak ?rams/towers/bare', MAIN, /addSiegeMachinesCount\(armies, \(data as any\)\.units, Number\(qp\.get\('rams'\)\) \|\| 0, Number\(qp\.get\('towers'\)\) \|\| 0\)/],
];
for (const [name, text, re] of pins) {
  const ok = re.test(text);
  assert(ok, 'pinezka: ' + name);
  const mutated = text.replace(re, '/*MUTACJA*/');
  assert(ok && !re.test(mutated) && mutated !== text, 'mutacja lamie pinezke: ' + name);
}

console.log('\nCZESC C -- mutacja PRAWDZIWEJ funkcji: cofniecie unikalnych id lamie test');
{
  const mut = TBsrc.replace("buildSide(siegeBlocks, units ?? [], 'atkS', ATK_COLOR, missing)", "buildSide(siegeBlocks, units ?? [], 'atk', ATK_COLOR, missing)");
  assert(mut !== TBsrc, 'mutacja zastosowana (prefiks id machin = "atk")');
  const r = checkArmies(bundleSrc(mut, 'tb-mut'), 'mut');
  assert(r.dup > 0, `zmutowany preset ma duplikaty id (${r.dup}) => asercja unikalnosci CZERWONA`);
}

console.log(`\nWYNIK: ${pass} OK, ${fail} FAIL`);
process.exit(fail ? 1 : 0);
