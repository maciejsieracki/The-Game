// R-RUSTPORT-P6-K5LOOP-WIRING-A-Q1 (#369 czesc A, Operator r2): generator wektorow PELNEJ bitwy oblezniczej AUTO
// (sesja `rust-port/engine/src/domain/siege_battle_session.rs`) od `new BattleScene(...)` + `play()` do konca bitwy.
//
// ORAKUL = WYKONANIE CALEGO TEKSTU PINU 07d2fbd72 (git show, bez kopii): `gra/src/battle/battleScene.ts` z calym drzewem
// importow (`game/combat.ts`, `battle/battle-terrain.ts`, `game/city-*.ts`, `battle/formationRules.ts`, ...) ladowany jak
// w `p6_k5loop_adapter_gen.mjs` (transpileModule + wlasny require po drzewie pinu). Wykonywane sa: konstruktor
// (`generateBattleTerrain`, `_carveBattleBox`, `_fencePlayableZone`, `_carveWallTiles`, `_placeSiegeTowers`, `_placeUnits`),
// `play` -> `_startBattle` (`_applyStartingMoralePowerPenalty`, `_kickoffBattleTurn`), petla `_startLoop` (`_advanceVClock`,
// `_drainTimers`, `_tickFades`), `skip` -> `_runFastForward`, `_beginTurn`/`_activateNext`/`_activateUnit`/`_checkEnd`,
// `_schedule`, `_fireSiegeTowers`, `_singleBlow`/`_resolveBlowOutcome`, ruch, mur/brama/wylom, `_roundCapVerdict`.
//
// ATRAPY (wylacznie render/DOM/audio, bez logiki bitwy):
// * modul `three` (i `three/...`), `document`, `window`: uniwersalny obiekt-atrapa (wywolywalny, konstruowalny, kazda
//   wlasnosc = atrapa, prymityw = 0 / ''); importy zasobow (`?raw`, `?url`, `.css`, `.svg`, `.png`) = pusty tekst;
//   `import.meta.glob` = `{}`; `localStorage` = pusty magazyn.
// * `requestAnimationFrame` = kolejka klatek prowadzona przez sterownik: klatka k wykonuje (w kolejnosci rejestracji)
//   wszystkie wywolania zarejestrowane przed nia, z czasem `t = 16 * k` ms (D-WIRA-3: klatka 16 ms, `BATTLE_FRAME_WALL_MS`).
// * `performance.now` = deterministyczny zegar +1 ms na odczyt (budzet 40 ms `_runFastForward` `:9422` dzieli tylko
//   przewijanie na porcje; obrona r2, N2).
// * RNG: JEDYNA podmiana tekstu pinu: `battleScene.ts:8960` `const roll   = Math.random() * 100;` ->
//   `__blowRandom() * 100` (D-WIR-5: rzut `_singleBlow`), gdzie `__blowRandom` = LCG `domain/rng.rs`
//   (`state = state * 1664525 + 1013904223 mod 2^32`, wynik `state / 2^32`) z ziarnem `SessionRolls::derive(seed, nr)`
//   = `seed ^ nr * 0x9E3779B9 ^ 0x53494547`. Pozostale `Math.random` (dzwiek `:11030-11242`) liczone osobno
//   (`otherRandom`; wektor wymaga 0 albo braku wplywu - wynik nie zalezy od nich).
//
// Wejscie sceny = `BattleOpts` jak `main.ts:36980-37018` (`rosterToBattleUnits` -> `runtimeToBattleUnit` `:33158-33196`
// dla jednostek bez bonusow postepu: `stats = {...def, __canonicalEffectiveMaxHp, __canonicalCurrentHp}`,
// `maxHp = unitHealth(def)` `:33093`), `deploy = false`, `manualControlAllowed = false` (AUTO bez generala, D-WIR-2),
// `siege: { defCiv, builtBuildingIds }`. Warstwa stan gry -> rostery -> `BattleUnit` ma wlasne wektory pinu (T6,
// `p6_k5loop_adapter_gen.mjs`); test Rust podaje TE SAME `BattleUnit` sesji (`SiegeBattleSession::prepare_scene`).
//
// Uruchomienie: node rust-port/engine/tests/p6_k5loop_wiring_a_gen.mjs (Node >= 22, TypeScript z /opt/node22 albo
// TYPESCRIPT_JS). Wynik: tests/p6_k5loop_wiring_a_pin_vectors/{vectors.json,pin_data.json} + MD5 na stdout.

import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join, posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';

const PIN = '07d2fbd72f758705f8e1d59cc4968027ffbafe75';
// SHA-256 calego tekstu pinu wykonanego przez generator (sciezka + tresc kazdego zaladowanego pliku, w kolejnosci
// ladowania). Zmiana pinu albo drzewa importow = blad generatora.
const EXPECTED_SHA256 = process.env.WIRING_A_SHA256_OVERRIDE ?? '3eeeb760bc0efdbb8108ac3dcf36efe5a202a8f1bec5583ede354abc0d4da34d';
const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..', '..');
const TS_JS = process.env.TYPESCRIPT_JS ?? '/opt/node22/lib/node_modules/typescript/lib/typescript.js';
const ts = createRequire(import.meta.url)(TS_JS);

const showCache = new Map();
const show = (p) => {
  if (showCache.has(p)) return showCache.get(p);
  let out = null;
  try {
    out = execFileSync('git', ['show', `${PIN}:${p}`], { cwd: repoRoot, encoding: 'utf8', maxBuffer: 1 << 27, stdio: ['ignore', 'pipe', 'ignore'] });
  } catch { out = null; }
  showCache.set(p, out);
  return out;
};

// --- jedyna podmiana tekstu pinu (RNG `_singleBlow`) ----------------------------------------------------------------
const SCENE = 'gra/src/battle/battleScene.ts';
const ROLL_LINE = 8960;
const ROLL_TEXT = '    const roll   = Math.random() * 100;';
{
  const l = show(SCENE).split('\n');
  if (l[ROLL_LINE - 1] !== ROLL_TEXT) throw new Error(`pin ${SCENE}:${ROLL_LINE} != "${ROLL_TEXT}"`);
  const all = show(SCENE).split(ROLL_TEXT).length - 1;
  if (all !== 1) throw new Error('rzut _singleBlow nie jest jednoznaczny: ' + all);
}
const patchScene = (src) => {
  const l = src.split('\n');
  l[ROLL_LINE - 1] = '    const roll   = globalThis.__blowRandom() * 100;';
  return l.join('\n');
};

// --- atrapa renderu/DOM --------------------------------------------------------------------------------------------
function makeStub(name = 'stub') {
  const cache = Object.create(null);
  const fn = function () {};
  return new Proxy(fn, {
    get(t, p) {
      if (p === Symbol.toPrimitive) return (hint) => (hint === 'string' ? '' : 0);
      if (p === Symbol.iterator) return function* () {};
      if (p === 'then') return undefined;
      if (p === 'length') return 0;
      if (p === 'toString') return () => '';
      if (p === 'valueOf') return () => 0;
      if (p === 'prototype') return t.prototype;
      if (!(p in cache)) cache[p] = makeStub(`${name}.${String(p)}`);
      return cache[p];
    },
    set(t, p, v) { cache[p] = v; return true; },
    apply() { return makeStub(`${name}()`); },
    construct() { return makeStub(`new ${name}`); },
    has() { return true; },
  });
}
let rafQ = [];
globalThis.window = makeStub('window');
globalThis.document = makeStub('document');
globalThis.requestAnimationFrame = (cb) => { rafQ.push(cb); return rafQ.length; };
globalThis.cancelAnimationFrame = () => {};
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
// Obrona r2 (N2 Evaluatora): deterministyczny zegar scienny zamiast prawdziwego `performance.now`. Pin uzywa go wylacznie
// jako budzetu 40 ms jednej porcji `_runFastForward` (`battleScene.ts:9422-9423`) i w dzwiekach (`:11045`, `:11082`,
// atrapa); kazdy odczyt przesuwa zegar o 1 ms, wiec podzial przewijania na porcje nie zalezy od obciazenia maszyny.
// Pomiar obrony r2: wektory z tym zegarem = wektory z prawdziwym zegarem bajt w bajt (MD5 vectors.json 269b4da2...).
let fakeWall = 0;
Object.defineProperty(globalThis, 'performance', { value: { now: () => (fakeWall += 1) }, configurable: true, writable: true });
let otherRandom = 0;
Math.random = () => { otherRandom += 1; return 0.5; };

// --- ladowanie drzewa pinu ------------------------------------------------------------------------------------------
const hash = createHash('sha256');
const hashed = new Set();
const transpiled = new Map();
const transpile = (p, src) => {
  if (transpiled.has(p)) return transpiled.get(p);
  const out = ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true, preserveConstEnums: true, isolatedModules: true },
    fileName: p,
  }).outputText
    .replace(/import\.meta\.glob/g, '(() => ({}))')
    .replace(/import\.meta/g, "({ env: { DEV: false, PROD: true, MODE: 'production', BASE_URL: '/' }, url: 'file:///pin/' })");
  transpiled.set(p, out);
  return out;
};
let modCache = new Map();
function load(p) {
  if (modCache.has(p)) return modCache.get(p).exports;
  let src = show(p);
  if (src === null) throw new Error('brak w pinie: ' + p);
  if (!hashed.has(p)) { hashed.add(p); hash.update(p + '\n' + src); }
  const mod = { exports: {} };
  modCache.set(p, mod);
  if (p.endsWith('.json')) { mod.exports = JSON.parse(src); return mod.exports; }
  if (p === SCENE) src = patchScene(src);
  const req = (spec) => {
    if (spec === 'three' || spec.startsWith('three/')) return makeStub('THREE');
    if (/[?](raw|url|worker)/.test(spec) || /\.(css|svg|png|jpg|glsl|txt|md|mp3|ogg|wav)$/.test(spec)) return { __esModule: true, default: '' };
    if (!spec.startsWith('.')) return makeStub(spec);
    const base = posix.normalize(posix.join(posix.dirname(p), spec.replace(/\.ts$/, '')));
    for (const c of [base + '.ts', base, base + '/index.ts']) {
      if ((c.endsWith('.ts') || c.endsWith('.json')) && show(c) !== null) return load(c);
    }
    throw new Error('nie rozwiazano ' + spec + ' z ' + p);
  };
  new Function('module', 'exports', 'require', transpile(p, src))(mod, mod.exports, req);
  return mod.exports;
}

// --- dane pinu -----------------------------------------------------------------------------------------------------
const units = JSON.parse(show('gra/data/units.json'));
const counters = JSON.parse(show('gra/data/counters.json'));
const terrainCombat = JSON.parse(show('gra/data/terrain-combat.json'));
const combatParams = JSON.parse(show('gra/data/combat-params.json'));
const miastoParams = JSON.parse(show('gra/data/miasto-params.json'));
const def = (n) => {
  const r = units.find((u) => u.Jednostka === n);
  if (!r) throw new Error('brak jednostki ' + n);
  return r;
};
// `unitHealth(def)` (`main.ts:33093-33095`): `normFieldVal(def.health ?? def.Health, 30)`; scenariusze uzywaja
// wylacznie jednostek z liczbowym `health`.
const unitHealth = (d) => {
  const v = d.health ?? d.Health;
  if (typeof v !== 'number' || !Number.isFinite(v)) throw new Error('health nie-liczbowe: ' + d.Jednostka);
  return v;
};
const battleUnit = (id, typeId, category, color, extra = {}) => {
  const d = def(typeId);
  const maxHp = unitHealth(d);
  const hp = extra.hp != null ? Math.min(maxHp, Math.max(0, extra.hp)) : maxHp;
  return {
    id, isArmyCommander: false, nazwa: typeId, kategoria: category, ownerColor: color,
    stats: { ...d, __canonicalEffectiveMaxHp: maxHp, __canonicalCurrentHp: hp },
    hp, maxHp,
    pancerzBonusFrac: 0, parametryBonusFrac: 0, veteranBonusFrac: 0, fortifiedInField: false,
    armyHungry: false, goldDeficit: false,
    armyLeaderMoraleBonusFrac: 0, civBonusy: [], difficultyCombatMult: 1,
  };
};

// --- scenariusze ---------------------------------------------------------------------------------------------------
const A = (list) => list.map(([t, c, x], i) => battleUnit('a' + i, t, c, 0xffd54a, x));
const D = (list) => list.map(([t, c, x], i) => battleUnit('d' + i, t, c, 0xc84040, x));
const W = ['Wojownik', 'miecznik'];
const L = ['Łucznik', 'lucznik'];
const SCENARIOS = [
  // mur, piechota+lucznicy obu stron, bez machin: bez wylomu -> sufit tur `siegeNoBreachMaxRounds` (remis).
  { name: 'mur_bez_machin_sufit', mode: 'skip', seed: 1, built: ['mury'], atk: [W, W, L], def: [W, L] },
  // mur + taran i katapulta: wylom, zwyciezca rozstrzyga walka.
  { name: 'mur_machiny_wylom', mode: 'skip', seed: 2, built: ['mury'], atk: [W, W, W, ['Taran', 'obleznicza'], ['Katapulta', 'obleznicza'], L], def: [W, L] },
  // palisada (bez muru kamiennego), liczni atakujacy (9 vs 3) z taranem.
  { name: 'palisada_liczni_taran', mode: 'skip', seed: 3, built: ['palisada'], atk: [W, W, W, W, W, W, L, L, ['Taran', 'obleznicza']], def: [W, W, L] },
  // mur + cytadela + baszta: wieze obroncow, slaby atak (ucieczka/rozbicie atakujacych).
  { name: 'mury_cytadela_slaby_atak', mode: 'skip', seed: 4, built: ['mury', 'fort', 'baszta'], atk: [['Wojownik', 'miecznik', { hp: 6 }], L], def: [['Włócznik', 'wlocznik'], ['Włócznik', 'wlocznik'], L, L] },
  // jazda i falanga z katapulta, teren swiata z rzeka (brody na polu).
  { name: 'mur_jazda_rzeka', mode: 'skip', seed: 5, built: ['mury'], world: { baza: 'Równina', las: false, rzeka: true }, atk: [['Konnica', 'konnica'], ['Falanga', 'falanga'], ['Katapulta', 'obleznicza'], W], def: [W, ['Falanga', 'falanga'], L] },
  // obroncy liczniejsi, atakujacy z wieza oblezicza; teren las.
  { name: 'mur_wieza_obl_las', mode: 'skip', seed: 6, teren: 'Las', built: ['mury'], world: { baza: 'Las', las: true, rzeka: false }, atk: [['Wieża oblężnicza', 'obleznicza'], W, W, L], def: [W, W, W, L, L] },
  // czas rzeczywisty (klatki 16 ms) dla dwoch scenariuszy: wynik ma byc identyczny z przewijaniem tylko gdy pin tak liczy.
  { name: 'rt_mur_machiny_wylom', mode: 'realtime', seed: 2, built: ['mury'], atk: [W, W, W, ['Taran', 'obleznicza'], ['Katapulta', 'obleznicza'], L], def: [W, L] },
  { name: 'rt_mury_cytadela_slaby_atak', mode: 'realtime', seed: 4, built: ['mury', 'fort', 'baszta'], atk: [['Wojownik', 'miecznik', { hp: 6 }], L], def: [['Włócznik', 'wlocznik'], ['Włócznik', 'wlocznik'], L, L] },
  // PIN2-PROBE-Q1 (D-PIN2-2): `mur_jazda_rzeka` z krokiem przewijania 1 ms (granica klatki, NIE model produkcyjny):
  // pin @1 ms = pin @2 ms = pin @0,25 ms (sonda), wiec wynik nie zalezy juz od remisu czasowego klatki 16 ms (t. 70,
  // cios 150 ms vs pocisk wiezy 156 ms). Straznik logiki Rust dla jedynego scenariusza z jawna rozbieznoscia @16 ms.
  { name: 'mur_jazda_rzeka_klatka1', mode: 'skip', ffStepMs: 1, seed: 5, built: ['mury'], world: { baza: 'Równina', las: false, rzeka: true }, atk: [['Konnica', 'konnica'], ['Falanga', 'falanga'], ['Katapulta', 'obleznicza'], W], def: [W, ['Falanga', 'falanga'], L] },
  // PIN2-PROBE-Q1: scenariusze rozrozniajace mutant B03 (trafienie strzalu przesuniete o RANGED_GAP_MS): wielu lucznikow
  // atakujacego strzela w oknie lotu pociskow wiez / strzelcow korony (wybrane z 293 losowych kandydatow, pomiar w
  // 01-operator-r1.md). Las + mury + baszta (taran), Wzgorza + palisada (katapulta, wylom, sufit 400), Gory + mury + baszta.
  { name: 'b03_las_lucznicy_mury_baszta', mode: 'skip', seed: 129, teren: 'Las', built: ['mury', 'baszta'], world: { baza: 'Las', las: true, rzeka: false }, atk: [L, L, L, L, W, W, ['Taran', 'obleznicza']], def: [W, W, L, L, L, L, L, L, L, L] },
  { name: 'b03_wzgorza_palisada_katapulta', mode: 'skip', seed: 134, teren: 'Wzgórza', built: ['palisada'], world: { baza: 'Wzgórza', las: false, rzeka: false }, atk: [W, W, L, L, L, ['Katapulta', 'obleznicza']], def: [W, L, L, L] },
  { name: 'b03_gory_lucznicy_mury_baszta', mode: 'skip', seed: 195, teren: 'Góry', built: ['mury', 'baszta'], world: { baza: 'Góry', las: false, rzeka: false }, atk: [L, L, L, L, W, W, ['Taran', 'obleznicza']], def: [['Włócznik', 'wlocznik'], W, L, L, L] },
  // PIN2-PROBE-Q1 (mutant B07): katapulta wyburza kafel muru pod lucznikiem korony -> zejscie z korony (`:7699-7741`)
  // przy zyciu; test `zejscie_z_korony_od_razu_przelicza_zasieg` sprawdza zasieg w chwili zejscia (`:7740`).
  { name: 'b07_las_katapulta_zejscie_z_korony', mode: 'skip', seed: 107, teren: 'Las', built: ['mury', 'baszta'], world: { baza: 'Las', las: true, rzeka: false }, atk: [W, W, L, L, L, ['Katapulta', 'obleznicza']], def: [['Włócznik', 'wlocznik'], W, L, L, L] },
  { name: 'b07_wzgorza_katapulta_zejscie_z_korony', mode: 'skip', seed: 135, teren: 'Wzgórza', built: ['mury', 'baszta'], world: { baza: 'Wzgórza', las: false, rzeka: false }, atk: [W, W, L, L, L, ['Katapulta', 'obleznicza']], def: [W, ['Włócznik', 'wlocznik'], L, L, L, L, L, L] },
];

const f64hex = (x) => {
  const b = Buffer.alloc(8);
  b.writeDoubleBE(x);
  return b.toString('hex');
};
const MAX_FRAMES = 3_000_000;

function runScenario(sc) {
  modCache = new Map();
  rafQ = [];
  otherRandom = 0;
  let st = (sc.seed ^ Math.imul(sc.battleIndex ?? 0, 0x9e3779b9) ^ 0x53494547) >>> 0;
  let drawn = 0;
  globalThis.__blowRandom = () => {
    drawn += 1;
    st = (Math.imul(st, 1664525) + 1013904223) >>> 0;
    return st / 4294967296;
  };
  const { BattleScene } = load(SCENE);
  const attacker = A(sc.atk);
  const defender = D(sc.def);
  const opts = {
    attacker: JSON.parse(JSON.stringify(attacker)),
    defender: JSON.parse(JSON.stringify(defender)),
    teren: sc.teren ?? 'Równina',
    worldTerrain: sc.world,
    data: { units, counters, terrainCombat },
    deploy: false,
    deployPlayerSide: 'atk',
    manualControlAllowed: false,
    siege: { defCiv: sc.defCiv ?? 'rzym', builtBuildingIds: sc.built },
    attackerCivBonusy: [],
    defenderCivBonusy: [],
    attackerEra: sc.attackerEra ?? 1,
    defenderEra: sc.defenderEra ?? 1,
  };
  const bs = new BattleScene(opts);
  // Diagnostyka (tylko z WIRING_A_TRACE, bez wplywu na wynik): slad etykiet obrazen, rozbic, smierci i ruchow.
  if (process.env.WIRING_A_TRACE === sc.name) {
    const wrap = (m, fmt) => {
      const orig = bs[m];
      bs[m] = function (...a) { console.error(`T ${bs.vNow} r${bs.roundNo} ${fmt(...a)}`); return orig.apply(this, a); };
    };
    wrap('_spawnDamageLabel', (ru, dmg) => `DMG ${ru.bu.id} ${dmg}`);
    wrap('_startRout', (ru) => `ROUT ${ru.bu.id}`);
    wrap('_startFade', (ru) => `KILL ${ru.bu.id}`);
    const origLogPush = bs.log.push.bind(bs.log);
    bs.log.push = (...a) => {
      for (const s of a) if (String(s).startsWith('Wieza strzelnicza')) console.error(`T ${bs.vNow} r${bs.roundNo} TOWER ${s} | ${bs.atk.map((u) => `${u.bu.id}@${u.q},${u.r}:${u.bu.hp}${u.routed ? 'R' : ''}${u.dead ? 'D' : ''}`).join(' ')}`);
      return origLogPush(...a);
    };
    // PIN2-PROBE-Q1 (sonda morale): stan morale celu przed i po `_resolveBlowOutcome` (`battleScene.ts:9019-9068`)
    // oraz kazdy `_checkRout` (`:9783-9797`) i `_gainMorale`. Tylko diagnostyka (bez wplywu na wynik).
    const mor = (u) => `${u.bu.id}{hp=${u.bu.hp} m=${u.morale} mx=${u.moraleMax} fl=${u.fleeMorale}${u.routed ? ' R' : ''}${u.dead ? ' D' : ''}}`;
    const origOutcome = bs._resolveBlowOutcome;
    bs._resolveBlowOutcome = function (att, dfd, dmg, extra) {
      const before = mor(dfd);
      const ra = this._armyMoraleRatio('atk');
      const rd = this._armyMoraleRatio('def');
      const out = origOutcome.call(this, att, dfd, dmg, extra);
      console.error(`T ${bs.vNow} r${bs.roundNo} OUTCOME ${att.bu.id}->${dfd.bu.id} dmg=${dmg} extra=${extra} ratioA=${ra} ratioD=${rd} ${before} => ${mor(dfd)} att=${mor(att)}`);
      return out;
    };
    const origGain = bs._gainMorale;
    bs._gainMorale = function (u, amt) {
      const b = mor(u);
      const out = origGain.call(this, u, amt);
      console.error(`T ${bs.vNow} r${bs.roundNo} GAIN ${amt} ${b} => ${mor(u)}`);
      return out;
    };
    const origCheck = bs._checkRout;
    bs._checkRout = function (u) {
      const b = mor(u);
      const out = origCheck.call(this, u);
      console.error(`T ${bs.vNow} r${bs.roundNo} CHECKROUT ${b} terr=${this.terrainMap.combatTerrainName(u.q, u.r)}@${u.q},${u.r} => ${u.routed ? 'ROUT' : 'ok'}`);
      return out;
    };
    // PIN3-DIVERGENCE-Q1 (diagnostyka): kazdy `_singleBlow` z pozycja i zwrotem obu stron (`relativeHit` `:8880`).
    const origBlow = bs._singleBlow;
    bs._singleBlow = function (att, dfd, ranged) {
      const out = origBlow.call(this, att, dfd, ranged);
      console.error(`T ${bs.vNow} r${bs.roundNo} BLOW ${att.bu.id}@${att.q},${att.r}f${att.facing}->${dfd.bu.id}@${dfd.q},${dfd.r}f${dfd.facing} ranged=${ranged} dmg=${out}`);
      return out;
    };
    // PIN3-DIVERGENCE-Q1 (diagnostyka): cel jazdy (`_cavalryTarget` `:6326`).
    const origCavT = bs._cavalryTarget;
    bs._cavalryTarget = function (ru) {
      const t = origCavT.call(this, ru);
      console.error(`T ${bs.vNow} r${bs.roundNo} CAVT ${ru.bu.id}@${ru.q},${ru.r} ml=${ru.moveLeft} -> ${t ? `${t.bu.id}@${t.q},${t.r}` : 'null'} | ${[...bs.atk, ...bs.def].map((u) => `${u.bu.id}@${u.q},${u.r}${u.routed ? 'R' : ''}${u.dead ? 'D' : ''}${u.removed ? 'X' : ''}`).join(' ')}`);
      return t;
    };
    const origMove = bs._doMove;
    bs._doMove = function (ru, c, r, ...rest) {
      const from = `${ru.q},${ru.r}`;
      const out = origMove.call(this, ru, c, r, ...rest);
      if (`${ru.q},${ru.r}` !== from) console.error(`T ${bs.vNow} r${bs.roundNo} MOVE ${ru.bu.id} ${from}->${ru.q},${ru.r}`);
      return out;
    };
  }
  // PIN2-PROBE-Q1 (diagnostyka): mapa terenu pola (`WIRING_A_DUMP_TERRAIN=1` w trybie sladu): litera = `combatTerrainName`
  // (P plaskie, L las, W wzgorza, G gory, R rzeka, ? inne), `#` = kafel muru/bramy, `.` = nieprzechodni; jednostki na
  // starcie jako `a0..`, `d0..` w osobnej linii.
  if (process.env.WIRING_A_TRACE === sc.name && process.env.WIRING_A_DUMP_TERRAIN) {
    const tm = bs.terrainMap;
    for (let r = 0; r < tm.rows; r++) {
      let line = '';
      for (let c = 0; c < tm.cols; c++) {
        const n = tm.combatTerrainName(c, r);
        let ch = n.startsWith('Las') ? 'L' : n.startsWith('Wzg') ? 'W' : n.startsWith('G') ? 'G' : n.startsWith('Rzeka') ? 'R' : n.startsWith('P') ? 'P' : '?';
        if (bs.wallTileHp && bs.wallTileHp.has && bs.wallTileHp.has(r)) { if (c === bs.siegeWallCol) ch = '#'; }
        if (!tm.passable(c, r)) ch = '.';
        line += ch;
      }
      console.error(`TERR ${String(r).padStart(3)} ${line}`);
    }
    console.error('UNITS ' + [...bs.atk, ...bs.def].map((u) => `${u.bu.id}@${u.q},${u.r}`).join(' ') + ` wallCol=${bs.siegeWallCol}`);
  }
  let res = null;
  // PIN2-PROBE-Q1: tryb i dlugosc klatki nadpisywalne WYLACZNIE w trybie sladu (`WIRING_A_TRACE`), np.
  // `WIRING_A_FRAME=2 WIRING_A_MODE=realtime`; wektory zawsze z klatka 16 ms i trybem scenariusza.
  const traced = !!process.env.WIRING_A_TRACE;
  const mode = traced && process.env.WIRING_A_MODE ? process.env.WIRING_A_MODE : sc.mode;
  const frameMs = traced && process.env.WIRING_A_FRAME ? Number(process.env.WIRING_A_FRAME) : 16;
  bs.play((r) => { res = r; });
  if (mode === 'skip') bs.skip();
  let t = 0;
  let frames = 0;
  // PIN2-PROBE-Q1: krok przewijania `FF_STEP_MS = _scaledWallDelta(BATTLE_FRAME_WALL_MS)` (`:2552`, `:9419`)
  // nadpisywalny w trybie sladu (`WIRING_A_FF_STEP=2`) albo polem scenariusza `ffStepMs` (D-PIN2-2: wektor granicy
  // klatki, NIE model produkcyjny -- produkcja = 16 ms). Ten sam model klatki co czas rzeczywisty z klatka N ms, bez
  // kosztu petli renderu (modul pinu ladowany od nowa w kazdym scenariuszu, `modCache = new Map()`). Jedyna zmiana to
  // wartosc statycznej wlasnosci klasy; tekst pinu bez zmian (straznik SHA-256 nietkniety).
  const ffStep = traced && process.env.WIRING_A_FF_STEP ? Number(process.env.WIRING_A_FF_STEP) : (sc.ffStepMs ?? null);
  if (ffStep != null && sc.mode !== 'skip') throw new Error('ffStepMs tylko dla przewijania: ' + sc.name);
  if (ffStep != null) BattleScene.BATTLE_FRAME_WALL_MS = ffStep;
  const stopRound = traced && process.env.WIRING_A_STOP_ROUND ? Number(process.env.WIRING_A_STOP_ROUND) : Infinity;
  while (!bs.finished && frames < MAX_FRAMES) {
    if (bs.roundNo > stopRound) { console.error(`STOP r${bs.roundNo}`); process.exit(0); }
    t += frameMs;
    frames += 1;
    const q = rafQ;
    rafQ = [];
    for (const cb of q) cb(t);
  }
  if (!bs.finished) throw new Error('bitwa bez konca: ' + sc.name);
  const out = (u) => ({
    id: u.bu.id, side: u.side, hpBits: f64hex(u.bu.hp), hp: u.bu.hp, dead: !!u.dead, routed: !!u.routed, removed: !!u.removed,
  });
  return {
    name: sc.name,
    mode: sc.mode,
    ...(sc.ffStepMs != null ? { frameMs: sc.ffStepMs } : {}),
    seed: sc.seed,
    battleIndex: sc.battleIndex ?? 0,
    input: {
      teren: opts.teren, worldTerrain: sc.world ?? null, builtBuildingIds: sc.built, defCiv: opts.siege.defCiv,
      defenderEra: opts.defenderEra, attacker, defender,
    },
    expect: {
      winner: bs._endWinner,
      resultWinner: res ? res.winner : null,
      roundNo: bs.roundNo,
      wallEverBreached: !!bs.wallEverBreached,
      rollsDrawn: drawn,
      otherRandom,
      units: [...bs.atk.map(out), ...bs.def.map(out)],
    },
  };
}

const t0 = Date.now();
const vectors = [];
// PIN2-PROBE-Q1: kandydaci scenariuszy (diagnostyka, np. przy szukaniu wektorow zabijajacych mutanty): `WIRING_A_EXTRA`
// = plik JSON z lista scenariuszy w formacie `SCENARIOS`, wynik do `WIRING_A_OUT` (NIE do katalogu wektorow).
const extra = process.env.WIRING_A_EXTRA ? JSON.parse(readFileSync(process.env.WIRING_A_EXTRA, 'utf8')) : null;
for (const sc of extra ?? SCENARIOS) {
  if (process.env.WIRING_A_TRACE && process.env.WIRING_A_TRACE !== sc.name) continue;
  const v = runScenario(sc);
  vectors.push(v);
  console.error(`${sc.name}: ${v.expect.winner} tura ${v.expect.roundNo} wylom ${v.expect.wallEverBreached} rzuty ${v.expect.rollsDrawn} inne ${v.expect.otherRandom} (${Date.now() - t0} ms)`);
}
const sha = hash.digest('hex');
if (sha !== EXPECTED_SHA256) {
  console.error('SHA-256 tekstu pinu: ' + sha);
  if (!process.env.WIRING_A_PRINT_SHA) throw new Error('straznik SHA-256 pinu: ' + sha + ' != ' + EXPECTED_SHA256);
}
// Obrona r2 (N1 Evaluatora): diagnostyka (`WIRING_A_TRACE`) liczy tylko wybrany scenariusz i NIE zapisuje wektorow.
if (process.env.WIRING_A_TRACE) process.exit(0);
if (extra) {
  if (!process.env.WIRING_A_OUT) throw new Error('WIRING_A_EXTRA wymaga WIRING_A_OUT');
  writeFileSync(process.env.WIRING_A_OUT, JSON.stringify({ pin: PIN, pinSha256: sha, frameMs: 16, vectors }, null, 1) + '\n');
  process.exit(0);
}
const outDir = join(here, 'p6_k5loop_wiring_a_pin_vectors');
mkdirSync(outDir, { recursive: true });
const pinData = {
  pin: PIN,
  units, counters, terrainCombat,
  combatParams: {
    counter_multiplier: combatParams.counter_multiplier,
    river_attack_mult: combatParams.river_attack_mult,
    brod: combatParams.brod,
    fortify_obrona_proc: combatParams['oblężenie']?.fortify_obrona_proc,
    bez_wylomu_max_tur: combatParams['oblężenie']?.bez_wylomu_max_tur,
    morale_przewaga_mocy: combatParams.morale_przewaga_mocy,
  },
  miastoParams: {
    bonus_obrona_mur_proc: miastoParams.bonus_obrona_mur_proc?.wartosc ?? null,
    bonus_obrona_mur_kamienny_proc: miastoParams.bonus_obrona_mur_kamienny_proc?.wartosc ?? null,
    bonus_obrona_cytadela_proc: miastoParams.bonus_obrona_cytadela_proc?.wartosc ?? null,
    bonus_obrona_baszta_proc: miastoParams.bonus_obrona_baszta_proc?.wartosc ?? null,
    bonus_obrona_palisada_proc: miastoParams.bonus_obrona_palisada_proc?.wartosc ?? null,
  },
};
const files = {
  'vectors.json': JSON.stringify({ pin: PIN, pinSha256: sha, frameMs: 16, vectors }, null, 1) + '\n',
  'pin_data.json': JSON.stringify(pinData) + '\n',
};
for (const [f, txt] of Object.entries(files)) {
  writeFileSync(join(outDir, f), txt);
  console.log(createHash('md5').update(txt).digest('hex') + '  ' + f);
}
