// R-RUSTPORT-P6-K5-WYLOM-WIEZE-Q1: generator wektorow dla wiez przy wylomie (stan zburzenia wiezy).
// Generator WYKONUJE kod z pinu, nie transkrypcje reki. Wyciete po nazwie metody z gra/src/battle/battleScene.ts:
//   * _destroyTowerAtRow   (:4194-4199)  -- caly
//   * _fireSiegeTowers     (:4208-4219)  -- caly
//   * _fireOneTower        (:4223-4270)  -- bez bloku wizualnego (cellToWorld, makeProjectileMesh, projectiles,
//                                          _sfxShot, scena THREE), bez tego bloku nie ma stanu gry; reszta bez zmian
//   * _breachWallTile      (:7638-7647)  -- do wywolania `_destroyTowerAtRow` wlacznie; po nim jest wylacznie
//                                          efekt wizualny i przesuniecie obroncow (poza zakresem tego etapu)
//   * _schedule            (:9595-9606)  -- caly
//   * pickTowerTarget      (gra/src/game/city-towers.ts) -- caly, z SHA-256 fragmentu (jak p6_tower_target_wiring_gen.mjs)
// Stuby (jawnie): _singleBlow zapisuje cel i zwraca 0 (brak obrazen, stan jednostek nie zmienia wyboru celu),
// _spawnWallLabel / _spawnDamageLabel / _sfxShot to no-opy, stale BF_COLS / RANGED_FLY_MS / BTerrain / Dir z pinu.
// Straznik SHA-256: generator odmawia pracy, gdy plik pinu lub wyciety fragment roznia sie od zapisanych skrotow.
//
// Uzycie (WEB_ROOT = katalog z `git archive 07d2fbd72 gra/src`, poza repo; Node 22):
//   node rust-port/engine/tests/p6_siege_wylom_gen.mjs <WEB_ROOT> > rust-port/engine/tests/p6_siege_wylom_vectors/vectors.json

import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { stripTypeScriptTypes } from 'node:module';

const [WEB_ROOT] = process.argv.slice(2);
if (!WEB_ROOT) throw new Error('uzycie: gen.mjs <WEB_ROOT>');
const SRC = path.join(WEB_ROOT, 'gra', 'src');
const PIN = '07d2fbd72f758705f8e1d59cc4968027ffbafe75';

const BATTLE_SHA256 = 'd784735e185c63f03d95c12a5de33855106b79432001dcc382c5ef335989d21d';
const TOWERS_FILE_SHA256 = 'cc715ed61f65cb0b11fe38efe80e6c6a1742feefec2c0bb5e6ce142a4da8cbd4';
const PICK_FRAGMENT_SHA256 = '56a196fe638705e1883506e315b059116268e49b20b679a90db1448ebe3da333';
// Skroty wyciętych fragmentów (ustalone przy generowaniu z pinu; zmiana pinu = nowy temat).
const FRAGMENT_SHA256 = {
  destroyTower: '7762a5e9de175a6db57e42f60fd49a9737947d89d3e864253bd0be5827a85d35',
  fireSiegeTowers: 'c1a265f7b27e44531459932027038d8fce56ac184c476c150861d8965c9127c6',
  fireOneTower: '4ca07b028c2750e406477b274eb177cf73339347448c5a964d8c12b72b278615',
  breachWallTile: '3d1fba275aa0b82f76534d6c277459e2d3352ea682f2b9f46283b801cd374284',
  schedule: '878a9fe647ba21fbd5ae5554cee74c57c3ee181b8eaaa5bf590375600a1138c7',
};

const sha = s => createHash('sha256').update(s).digest('hex');

const battleText = readFileSync(path.join(SRC, 'battle', 'battleScene.ts'), 'utf8');
if (sha(battleText) !== BATTLE_SHA256) throw new Error(`strazik SHA-256 battleScene.ts: ${sha(battleText)} != ${BATTLE_SHA256} (pin ${PIN})`);
const bLines = battleText.split('\n');

const towersText = readFileSync(path.join(SRC, 'game', 'city-towers.ts'), 'utf8');
if (sha(towersText) !== TOWERS_FILE_SHA256) throw new Error(`strazik SHA-256 city-towers.ts: ${sha(towersText)} != ${TOWERS_FILE_SHA256}`);
const tLines = towersText.split('\n');

// Metoda klasy: od `  private NAME(` do domykajacego `  }` o tym samym wcieciu.
function extractMethod(lines, name) {
  const re = new RegExp(`^\\s*(export )?(private |public )?(function )?${name}\\(`);
  const hits = lines.map((l, i) => (re.test(l) ? i : -1)).filter(i => i >= 0);
  if (hits.length !== 1) throw new Error(`metoda ${name}: oczekiwano 1 deklaracji, jest ${hits.length}`);
  const start = hits[0];
  const indent = lines[start].match(/^\s*/)[0];
  let end = start + 1;
  while (lines[end] !== indent + '}') end++;
  return { start, end, body: lines.slice(start, end + 1) };
}

function fragmentOf(lines, name) {
  return extractMethod(lines, name).body.join('\n');
}

// _fireOneTower: wycinamy blok wizualny od `const tw = cellToWorld(` do domknietego `this.projectiles.push(...)`.
const fireOne = extractMethod(bLines, '_fireOneTower');
const visStart = fireOne.body.findIndex(l => l.includes('const tw = cellToWorld(wallCol, t.row);'));
const visEnd = fireOne.body.findIndex(l => l.includes('this.projectiles.push('));
if (visStart < 0 || visEnd < visStart) throw new Error('_fireOneTower: nie znaleziono bloku wizualnego');
const fireOneSrc = fireOne.body.filter((_, i) => i < visStart || i > visEnd).join('\n');

// _breachWallTile: tniemy po linii `this._destroyTowerAtRow(wallRow);` (czesc stanu), zamykamy klamra.
const breach = extractMethod(bLines, '_breachWallTile');
const cutAt = breach.body.findIndex(l => l.includes('this._destroyTowerAtRow(wallRow);'));
if (cutAt < 0) throw new Error('_breachWallTile: brak linii _destroyTowerAtRow');
const breachSrc = [...breach.body.slice(0, cutAt + 1), breach.body[0].match(/^\s*/)[0] + '}'].join('\n');

const destroySrc = fragmentOf(bLines, '_destroyTowerAtRow');
const fireSiegeSrc = fragmentOf(bLines, '_fireSiegeTowers');
const scheduleSrc = fragmentOf(bLines, '_schedule');
const pickSrc = fragmentOf(tLines, 'pickTowerTarget').replace(/^(\s*)export /, '$1');

const hashes = {
  destroyTower: sha(destroySrc),
  fireSiegeTowers: sha(fireSiegeSrc),
  fireOneTower: sha(fireOneSrc),
  breachWallTile: sha(breachSrc),
  schedule: sha(scheduleSrc),
};
if (process.env.GEN_PRINT_HASHES) {
  process.stderr.write(JSON.stringify({ pick: sha(pickSrc), ...hashes }, null, 2) + '\n');
}
if (sha(pickSrc) !== PICK_FRAGMENT_SHA256) throw new Error(`strazik SHA-256 pickTowerTarget: ${sha(pickSrc)}`);
for (const k of Object.keys(hashes)) {
  if (hashes[k] !== FRAGMENT_SHA256[k]) throw new Error(`strazik SHA-256 fragmentu ${k}: ${hashes[k]} != ${FRAGMENT_SHA256[k]}`);
}

// Klasa sceny: wyciete metody pinu + jawne stuby. `this` w metodach to instancja tej klasy.
const sceneSrc = `
class __Scene {
  constructor(cfg) {
    this.finished = false;
    this.siegeWallCol = cfg.wallCol;
    this.siegeTowers = cfg.towers.map(row => ({ row, mesh: null, destroyed: false }));
    this.wallTileHp = new Map(cfg.wallRows.map(r => [r, 100]));
    this.towerShooterRow = { Jednostka: 'Lucznik', Health: 10, Typ: 'Distance' };
    this.towerRange = cfg.range;
    this.atk = cfg.atk.map(u => ({ q: u.q, r: u.r, dead: false, fadingOut: false, routed: false, removed: false, bu: { hp: u.hp, nazwa: u.nazwa } }));
    this.def = [];
    this.terrainMap = { tiles: new Array(BF_COLS * BF_ROWS).fill(0) };
    this.log = [];
    this._autoBatchPlanning = null;
    this.vTimers = [];
    this.vTimerSeq = 0;
    this.vNow = 0;
    this.wallEverBreached = false;
    this.blows = [];
  }
  // --- stuby (nie kod pinu) ---
  _now() { return this.vNow; }
  _singleBlow(shooter, target, ranged) { this.blows.push(this.atk.indexOf(target)); return 0; }
  _spawnWallLabel() {}
  _spawnDamageLabel() {}
  _sfxShot() {}
  drain() {
    for (;;) {
      if (this.vTimers.length === 0) break;
      this.vTimers.sort((a, b) => (a.due - b.due) || (a.id - b.id));
      const t = this.vTimers.shift();
      this.vNow = Math.max(this.vNow, t.due);
      t.cb();
    }
  }
  // --- wyciete z pinu ---
${destroySrc}
${fireSiegeSrc}
${fireOneSrc}
${breachSrc}
${scheduleSrc}
}
`;

const moduleSrc = `
const BF_COLS = 68;
const BF_ROWS = 156;
const RANGED_FLY_MS = 380;
const BTerrain = { Plains: 0 };
const Dir = { W: 4 };
${stripTypeScriptTypes(pickSrc, { mode: 'strip' })}
${stripTypeScriptTypes(sceneSrc, { mode: 'strip' })}
return { __Scene, pickTowerTarget };
`;
const { __Scene } = new Function(moduleSrc)();

// Scenariusze (deterministyczne). Jednostki atakujacych stoja poza kolumna muru; kazda wieza ma swojego najblizszego celu.
const ATK = [
  { q: 6, r: 2, hp: 40, nazwa: 'A0' },
  { q: 6, r: 4, hp: 50, nazwa: 'A1' },
];
const SCENARIOS = [
  {
    // Wylom wiezy PO zaplanowaniu salwy, PRZED strzalem (w locie na zegarze): wieza na wierszu 2 nie strzela.
    id: 'wylom-po-planowaniu-przed-strzalem',
    wallCol: 5, towers: [2, 4], wallRows: [2, 4], range: 2, atk: ATK,
    steps: [{ op: 'fire' }, { op: 'breach', row: 2 }, { op: 'drain' }],
  },
  {
    // Brak kafla muru na wierszu wiezy juz przy planowaniu: wieza zburzona, nie planowana, nie strzela.
    id: 'brak-kafla-przy-planowaniu',
    wallCol: 5, towers: [1, 4], wallRows: [4], range: 2, atk: ATK,
    steps: [{ op: 'fire' }, { op: 'drain' }],
  },
  {
    // Wylom PRZED kolejna salwa: zniszczona wieza nie jest planowana w kolejnej turze; trafienie z pierwszej salwy
    // (w locie) nie jest cofane przez wylom.
    id: 'wylom-przed-kolejna-salwa',
    wallCol: 5, towers: [2, 4], wallRows: [2, 4], range: 2, atk: ATK,
    steps: [{ op: 'fire' }, { op: 'drain' }, { op: 'breach', row: 2 }, { op: 'fire' }, { op: 'drain' }],
  },
];

function runScenario(sc) {
  const s = new __Scene({ wallCol: sc.wallCol, towers: sc.towers, wallRows: sc.wallRows, range: sc.range, atk: sc.atk });
  const steps = [];
  for (const st of sc.steps) {
    const before = s.blows.length;
    let planned = null;
    if (st.op === 'fire') {
      const t0 = s.vTimers.length;
      s._fireSiegeTowers();
      planned = s.vTimers.slice(t0).map(t => t.due - s.vNow);
    } else if (st.op === 'breach') {
      s._breachWallTile(st.row);
    } else if (st.op === 'drain') {
      s.drain();
    } else {
      throw new Error(`nieznany krok ${st.op}`);
    }
    steps.push({
      op: st.op,
      ...(st.op === 'breach' ? { row: st.row } : {}),
      ...(planned !== null ? { planned } : {}),
      blows: s.blows.slice(before),
      snapshot: {
        wallRows: [...s.wallTileHp.keys()].sort((a, b) => a - b),
        destroyed: s.siegeTowers.map(t => t.destroyed),
        wallEverBreached: s.wallEverBreached,
      },
    });
  }
  if (s.blows.length === 0) {
    throw new Error(`scenariusz ${sc.id}: brak trafien (sprawdz geometrie)`);
  }
  return {
    id: sc.id, wallCol: sc.wallCol, towers: sc.towers, wallRows: sc.wallRows, range: sc.range,
    atk: sc.atk.map(u => ({ q: u.q, r: u.r, hp: u.hp })), steps,
  };
}

const out = {
  pin: PIN,
  sources: {
    battleScene: { path: 'gra/src/battle/battleScene.ts', sha256: BATTLE_SHA256 },
    cityTowers: { path: 'gra/src/game/city-towers.ts', sha256: TOWERS_FILE_SHA256 },
  },
  scenarios: SCENARIOS.map(runScenario),
};
process.stdout.write(JSON.stringify(out, null, 2) + '\n');
