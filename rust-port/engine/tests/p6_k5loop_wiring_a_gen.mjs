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
  // PIN3-DIVERGENCE-Q1: kandydaci c1 (`01-operator-r1-kandydaci-c1.py` z PIN2-PROBE, ziarno 100+i) rozbiezni przed
  // poprawkami D-PIN3-1..5, zgodni po nich (klatka 16 ms). 156: pozycja celu wiezy w trakcie marszu (D-PIN3-1, mutant
  // M1); 123: zwrot celu wiezy w trakcie marszu (D-PIN3-1, M2); 111: rozbicie w trakcie wlasnego marszu (D-PIN3-5, M6);
  // 218: skutek ciala w fazie `_raf` po zegarach klatki (D-PIN3-3, M5).
  { name: 'p3_wzg_mix_d5_palisada_156', mode: 'skip', seed: 156, teren: 'Wzgórza', built: ['palisada'], world: { 'baza': 'Wzgórza', 'las': false, 'rzeka': false}, atk: [['Wojownik', 'miecznik'], ['Wojownik', 'miecznik'], ['Wojownik', 'miecznik'], ['Konnica', 'konnica'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Taran', 'obleznicza']], def: [['Włócznik', 'wlocznik'], ['Wojownik', 'miecznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik']] },
  { name: 'p3_las_mix_d5_mury_123', mode: 'skip', seed: 123, teren: 'Las', built: ['mury', 'baszta'], world: { 'baza': 'Las', 'las': true, 'rzeka': false}, atk: [['Wojownik', 'miecznik'], ['Wojownik', 'miecznik'], ['Wojownik', 'miecznik'], ['Konnica', 'konnica'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Taran', 'obleznicza']], def: [['Włócznik', 'wlocznik'], ['Wojownik', 'miecznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik']] },
  { name: 'p3_las_jazda_d6l_mury_111', mode: 'skip', seed: 111, teren: 'Las', built: ['mury', 'baszta'], world: { 'baza': 'Las', 'las': true, 'rzeka': false}, atk: [['Konnica', 'konnica'], ['Konnica', 'konnica'], ['Wojownik', 'miecznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Katapulta', 'obleznicza'], ['Taran', 'obleznicza']], def: [['Wojownik', 'miecznik'], ['Włócznik', 'wlocznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik']] },
  { name: 'p3_rown_mix_d8l_palisada_218', mode: 'skip', seed: 218, teren: 'Równina', built: ['palisada'], world: { 'baza': 'Równina', 'las': true, 'rzeka': false}, atk: [['Wojownik', 'miecznik'], ['Wojownik', 'miecznik'], ['Wojownik', 'miecznik'], ['Konnica', 'konnica'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Taran', 'obleznicza']], def: [['Wojownik', 'miecznik'], ['Wojownik', 'miecznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik']] },
  // PIN3-DIVERGENCE-Q1 (D-PIN3-4): granica klatki 1 ms (Rust liczony przy tym samym kroku). 181: krok `_raf` z `t0 ==
  // vNow` niewykonany dla zegara wiezy (D-PIN3-2, M3).
  { name: 'p3_gory_mix_d3l_mury_181_klatka1', mode: 'skip', ffStepMs: 1, seed: 181, teren: 'Góry', built: ['mury', 'baszta'], world: { 'baza': 'Góry', 'las': false, 'rzeka': false}, atk: [['Wojownik', 'miecznik'], ['Wojownik', 'miecznik'], ['Wojownik', 'miecznik'], ['Konnica', 'konnica'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Taran', 'obleznicza']], def: [['Wojownik', 'miecznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik']] },
  // PIN3-DIVERGENCE-Q1: JAWNY WYJATEK B-WIRA-PIN-3 (klasa A, `ROZBIEZNE_B_WIRA_PIN_3` w tescie): decyzja kolejnego
  // kroku marszu w pinie zapada w chwili kroku i widzi rozbicie innej jednostki od wiezy w trakcie marszu; cialo Rust
  // liczy marsz atomowo w `start` (D-WIRA-18). Temat nastepczy: marsz przyrostowy (MARCH-INCREMENTAL).
  { name: 'a3_las_mix_d3l_palisada_118_klatka1', mode: 'skip', ffStepMs: 1, seed: 118, teren: 'Las', built: ['palisada'], world: { 'baza': 'Las', 'las': true, 'rzeka': false}, atk: [['Wojownik', 'miecznik'], ['Wojownik', 'miecznik'], ['Wojownik', 'miecznik'], ['Konnica', 'konnica'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Taran', 'obleznicza']], def: [['Wojownik', 'miecznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik']] },
  { name: 'a3_gory_lucz2_d5_palisada_196_klatka1', mode: 'skip', ffStepMs: 1, seed: 196, teren: 'Góry', built: ['palisada'], world: { 'baza': 'Góry', 'las': false, 'rzeka': false}, atk: [['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Wojownik', 'miecznik'], ['Wojownik', 'miecznik'], ['Taran', 'obleznicza']], def: [['Włócznik', 'wlocznik'], ['Wojownik', 'miecznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik']] },
  { name: 'a3_rown_lucz2_d3l_mury_221_klatka1', mode: 'skip', ffStepMs: 1, seed: 221, teren: 'Równina', built: ['mury', 'baszta'], world: { 'baza': 'Równina', 'las': true, 'rzeka': false}, atk: [['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Wojownik', 'miecznik'], ['Wojownik', 'miecznik'], ['Taran', 'obleznicza']], def: [['Wojownik', 'miecznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik']] },
  // FRAME-QUANT-Q1 (D-FQ-1..3): kandydaci c1 rozbiezni z pinem TYLKO przy klatce produkcyjnej 16 ms przed kwantyzacja
  // odcinkow czasu ciala klatka (zgodni @1 ms); zgodni po D-FQ-1..3, zabijaja mutanty kwantyzacji (raport FRAME-QUANT-Q1).
  { name: 'fq_las_mix_d6l_palisada_120', mode: 'skip', seed: 120, teren: 'Las', built: ['palisada'], world: { 'baza': 'Las', 'las': true, 'rzeka': false}, atk: [['Wojownik', 'miecznik'], ['Wojownik', 'miecznik'], ['Wojownik', 'miecznik'], ['Konnica', 'konnica'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Taran', 'obleznicza']], def: [['Wojownik', 'miecznik'], ['Włócznik', 'wlocznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik']] },
  { name: 'fq_las_mix_d8l_palisada_122', mode: 'skip', seed: 122, teren: 'Las', built: ['palisada'], world: { 'baza': 'Las', 'las': true, 'rzeka': false}, atk: [['Wojownik', 'miecznik'], ['Wojownik', 'miecznik'], ['Wojownik', 'miecznik'], ['Konnica', 'konnica'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Taran', 'obleznicza']], def: [['Wojownik', 'miecznik'], ['Wojownik', 'miecznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik']] },
  { name: 'fq_wzg_mix_d8l_palisada_154', mode: 'skip', seed: 154, teren: 'Wzgórza', built: ['palisada'], world: { 'baza': 'Wzgórza', 'las': false, 'rzeka': false}, atk: [['Wojownik', 'miecznik'], ['Wojownik', 'miecznik'], ['Wojownik', 'miecznik'], ['Konnica', 'konnica'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Taran', 'obleznicza']], def: [['Wojownik', 'miecznik'], ['Wojownik', 'miecznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik']] },
  { name: 'fq_wzg_mix_d5_mury_155', mode: 'skip', seed: 155, teren: 'Wzgórza', built: ['mury', 'baszta'], world: { 'baza': 'Wzgórza', 'las': false, 'rzeka': false}, atk: [['Wojownik', 'miecznik'], ['Wojownik', 'miecznik'], ['Wojownik', 'miecznik'], ['Konnica', 'konnica'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Taran', 'obleznicza']], def: [['Włócznik', 'wlocznik'], ['Wojownik', 'miecznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik']] },
  { name: 'fq_wzg_lucz2_d3l_mury_157', mode: 'skip', seed: 157, teren: 'Wzgórza', built: ['mury', 'baszta'], world: { 'baza': 'Wzgórza', 'las': false, 'rzeka': false}, atk: [['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Wojownik', 'miecznik'], ['Wojownik', 'miecznik'], ['Taran', 'obleznicza']], def: [['Wojownik', 'miecznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik']] },
  { name: 'fq_wzg_lucz2_d8l_mury_161', mode: 'skip', seed: 161, teren: 'Wzgórza', built: ['mury', 'baszta'], world: { 'baza': 'Wzgórza', 'las': false, 'rzeka': false}, atk: [['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Wojownik', 'miecznik'], ['Wojownik', 'miecznik'], ['Taran', 'obleznicza']], def: [['Wojownik', 'miecznik'], ['Wojownik', 'miecznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik']] },
  { name: 'fq_wzg_lucz2_d8l_palisada_162', mode: 'skip', seed: 162, teren: 'Wzgórza', built: ['palisada'], world: { 'baza': 'Wzgórza', 'las': false, 'rzeka': false}, atk: [['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Wojownik', 'miecznik'], ['Wojownik', 'miecznik'], ['Taran', 'obleznicza']], def: [['Wojownik', 'miecznik'], ['Wojownik', 'miecznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik']] },
  { name: 'fq_gory_lucz2_d3l_mury_189', mode: 'skip', seed: 189, teren: 'Góry', built: ['mury', 'baszta'], world: { 'baza': 'Góry', 'las': false, 'rzeka': false}, atk: [['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Wojownik', 'miecznik'], ['Wojownik', 'miecznik'], ['Taran', 'obleznicza']], def: [['Wojownik', 'miecznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik']] },
  { name: 'fq_gory_lucz2_d3l_palisada_190', mode: 'skip', seed: 190, teren: 'Góry', built: ['palisada'], world: { 'baza': 'Góry', 'las': false, 'rzeka': false}, atk: [['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Wojownik', 'miecznik'], ['Wojownik', 'miecznik'], ['Taran', 'obleznicza']], def: [['Wojownik', 'miecznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik']] },
  { name: 'fq_gory_lucz2_d6l_mury_191', mode: 'skip', seed: 191, teren: 'Góry', built: ['mury', 'baszta'], world: { 'baza': 'Góry', 'las': false, 'rzeka': false}, atk: [['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Wojownik', 'miecznik'], ['Wojownik', 'miecznik'], ['Taran', 'obleznicza']], def: [['Wojownik', 'miecznik'], ['Włócznik', 'wlocznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik']] },
  { name: 'fq_rown_lucz_d5_palisada_204', mode: 'skip', seed: 204, teren: 'Równina', built: ['palisada'], world: { 'baza': 'Równina', 'las': true, 'rzeka': false}, atk: [['Wojownik', 'miecznik'], ['Wojownik', 'miecznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Katapulta', 'obleznicza']], def: [['Włócznik', 'wlocznik'], ['Wojownik', 'miecznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik']] },
  { name: 'fq_rown_mix_d8l_mury_217', mode: 'skip', seed: 217, teren: 'Równina', built: ['mury', 'baszta'], world: { 'baza': 'Równina', 'las': true, 'rzeka': false}, atk: [['Wojownik', 'miecznik'], ['Wojownik', 'miecznik'], ['Wojownik', 'miecznik'], ['Konnica', 'konnica'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Taran', 'obleznicza']], def: [['Wojownik', 'miecznik'], ['Wojownik', 'miecznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik']] },
  // FRAME-QUANT-Q1 (D-FQ-2): granica klatki 4 ms (bliźniak diagnostyczny `_klatka4`, Rust przy tym samym kroku): krok
  // marszu wołany z zegara `_schedule(STEP_GAP_MS)` i zegar wieży w tej samej klatce w kolejności nominalnego `due`
  // (`_drainTimers` `:9622-9627`). Rozbieżne przed D-FQ-2, zgodne po nim; zabijają mutanty kolejności w klatce.
  { name: 'fq_las_lucz2_d3l_mury_125_klatka4', mode: 'skip', ffStepMs: 4, seed: 125, teren: 'Las', built: ['mury', 'baszta'], world: { 'baza': 'Las', 'las': true, 'rzeka': false}, atk: [['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Wojownik', 'miecznik'], ['Wojownik', 'miecznik'], ['Taran', 'obleznicza']], def: [['Wojownik', 'miecznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik']] },
  { name: 'fq_gory_jazda_d3l_mury_173_klatka4', mode: 'skip', ffStepMs: 4, seed: 173, teren: 'Góry', built: ['mury', 'baszta'], world: { 'baza': 'Góry', 'las': false, 'rzeka': false}, atk: [['Konnica', 'konnica'], ['Konnica', 'konnica'], ['Wojownik', 'miecznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Katapulta', 'obleznicza'], ['Taran', 'obleznicza']], def: [['Wojownik', 'miecznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik']] },
  { name: 'fq_gory_jazda_d3l_palisada_174_klatka4', mode: 'skip', ffStepMs: 4, seed: 174, teren: 'Góry', built: ['palisada'], world: { 'baza': 'Góry', 'las': false, 'rzeka': false}, atk: [['Konnica', 'konnica'], ['Konnica', 'konnica'], ['Wojownik', 'miecznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Katapulta', 'obleznicza'], ['Taran', 'obleznicza']], def: [['Wojownik', 'miecznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik']] },
  // FRAME-QUANT-Q1 (D-FQ-2, Operator r1 dopisek): krok 1 ms (bliźniak `_klatka1`, Rust przy tym samym kroku): nominalny
  // `due` wystrzału wieży (`_schedule` `:9605`) wobec kroku marszu z zegara `_schedule(STEP_GAP_MS)` w tej samej klatce.
  // Zgodne z pinem; zabijają mutant Q21 (`due` wystrzału przesunięty = wieża zawsze po kroku z zegara).
  { name: 'fq_rown_mix_d3l_mury_213_klatka1', mode: 'skip', ffStepMs: 1, seed: 213, teren: 'Równina', built: ['mury', 'baszta'], world: { 'baza': 'Równina', 'las': true, 'rzeka': false}, atk: [['Wojownik', 'miecznik'], ['Wojownik', 'miecznik'], ['Wojownik', 'miecznik'], ['Konnica', 'konnica'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Taran', 'obleznicza']], def: [['Wojownik', 'miecznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik']] },
  { name: 'fq_rown_mix_d3l_palisada_214_klatka1', mode: 'skip', ffStepMs: 1, seed: 214, teren: 'Równina', built: ['palisada'], world: { 'baza': 'Równina', 'las': true, 'rzeka': false}, atk: [['Wojownik', 'miecznik'], ['Wojownik', 'miecznik'], ['Wojownik', 'miecznik'], ['Konnica', 'konnica'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Taran', 'obleznicza']], def: [['Wojownik', 'miecznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik']] },
  // FRAME-QUANT-Q1 (D-PIN3-3 + D-FQ-2, Operator r1 dopisek): test czułości kolejności klatki — skutek ciała (`done()`
  // pętli `_raf`) w fazie kolejki `_ffQueue` PO `_drainTimers` (`_runFastForward` `:9427-9435`). Zgodne z pinem; zabijają
  // mutant Q24 (skutek ciała w `_drainTimers`, czyli zamiana kolejności faz `_drainTimers`/`_raf`).
  { name: 'fq_rown_mix_d8l_mury_217_klatka1', mode: 'skip', ffStepMs: 1, seed: 217, teren: 'Równina', built: ['mury', 'baszta'], world: { 'baza': 'Równina', 'las': true, 'rzeka': false}, atk: [['Wojownik', 'miecznik'], ['Wojownik', 'miecznik'], ['Wojownik', 'miecznik'], ['Konnica', 'konnica'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Taran', 'obleznicza']], def: [['Wojownik', 'miecznik'], ['Wojownik', 'miecznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik']] },
  { name: 'fq_rown_mix_d8l_palisada_218_klatka1', mode: 'skip', ffStepMs: 1, seed: 218, teren: 'Równina', built: ['palisada'], world: { 'baza': 'Równina', 'las': true, 'rzeka': false}, atk: [['Wojownik', 'miecznik'], ['Wojownik', 'miecznik'], ['Wojownik', 'miecznik'], ['Konnica', 'konnica'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Taran', 'obleznicza']], def: [['Wojownik', 'miecznik'], ['Wojownik', 'miecznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik']] },
  { name: 'fq_las_lucz2_d5_palisada_132_klatka4', mode: 'skip', ffStepMs: 4, seed: 132, teren: 'Las', built: ['palisada'], world: { 'baza': 'Las', 'las': true, 'rzeka': false}, atk: [['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Wojownik', 'miecznik'], ['Wojownik', 'miecznik'], ['Taran', 'obleznicza']], def: [['Włócznik', 'wlocznik'], ['Wojownik', 'miecznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik']] },
  // MARCH-INCREMENTAL-Q1 (D-MI-1/2): te same bitwy co dawne wyjatki klasy A (`a3_*_klatka1`), przy klatce produkcyjnej
  // 16 ms: marsz `_advanceStep` (118, 196) i `_rangedForwardStep` (221) decyduje o kazdym kroku w chwili kroku (rozbicie
  // innej jednostki od wiezy w trakcie marszu). Przed tematem rozbiezne takze przy 16 ms; zabijaja mutant marszu atomowego.
  { name: 'mi_las_mix_d3l_palisada_118', mode: 'skip', seed: 118, teren: 'Las', built: ['palisada'], world: { 'baza': 'Las', 'las': true, 'rzeka': false}, atk: [['Wojownik', 'miecznik'], ['Wojownik', 'miecznik'], ['Wojownik', 'miecznik'], ['Konnica', 'konnica'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Taran', 'obleznicza']], def: [['Wojownik', 'miecznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik']] },
  { name: 'mi_gory_lucz2_d5_palisada_196', mode: 'skip', seed: 196, teren: 'Góry', built: ['palisada'], world: { 'baza': 'Góry', 'las': false, 'rzeka': false}, atk: [['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Wojownik', 'miecznik'], ['Wojownik', 'miecznik'], ['Taran', 'obleznicza']], def: [['Włócznik', 'wlocznik'], ['Wojownik', 'miecznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik']] },
  { name: 'mi_rown_lucz2_d3l_mury_221', mode: 'skip', seed: 221, teren: 'Równina', built: ['mury', 'baszta'], world: { 'baza': 'Równina', 'las': true, 'rzeka': false}, atk: [['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Wojownik', 'miecznik'], ['Wojownik', 'miecznik'], ['Taran', 'obleznicza']], def: [['Wojownik', 'miecznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik']] },
  // MARCH-RESZTA-Q1 (D-MR-1): kandydaci `mr`/`mr2` (`01-operator-r1-kandydaci-mr.py`, klatka produkcyjna 16 ms) z marszem
  // jazdy (`_cavalryAction`: kolejny krok decydowany w callbacku kroku, cel `_cavalryTarget` z tej chwili) i marszem wieży
  // obleznej (`_siegeWalkTo` + `arrive`) w oknie zdarzeń zegara (rozbicia/śmierci od wież i strzelców). 364, 534, 606:
  // zgodne z pinem, rozbieżne przy manewrze jazdy liczonym atomowo w `start` (mutant M2); 333: rozbieżne bez kontynuacji
  // manewru z callbacku (M9/M10); 347: rozbieżne bez `arrive` wieży (M12) i bez kontynuacji ucieczki (M19).
  { name: 'mr_wzg_jazda3_d3l_mury_333', mode: 'skip', seed: 333, teren: 'Wzgórza', built: ['mury', 'baszta'], world: { 'baza': 'Wzgórza', 'las': false, 'rzeka': false }, atk: [['Konnica', 'konnica'], ['Konnica', 'konnica'], ['Konnica', 'konnica'], ['Wojownik', 'miecznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Taran', 'obleznicza']], def: [['Wojownik', 'miecznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik']] },
  { name: 'mr_wzg_wieza_df_mury_347', mode: 'skip', seed: 347, teren: 'Wzgórza', built: ['mury', 'baszta'], world: { 'baza': 'Wzgórza', 'las': false, 'rzeka': false }, atk: [['Wieża oblężnicza', 'obleznicza'], ['Wojownik', 'miecznik'], ['Wojownik', 'miecznik'], ['Wojownik', 'miecznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Taran', 'obleznicza']], def: [['Falanga', 'falanga'], ['Falanga', 'falanga'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik']] },
  { name: 'mr_wzg_mixk_df_palisada_364', mode: 'skip', seed: 364, teren: 'Wzgórza', built: ['palisada'], world: { 'baza': 'Wzgórza', 'las': false, 'rzeka': false }, atk: [['Konnica', 'konnica'], ['Falanga', 'falanga'], ['Wojownik', 'miecznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Katapulta', 'obleznicza'], ['Taran', 'obleznicza']], def: [['Falanga', 'falanga'], ['Falanga', 'falanga'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik']] },
  { name: 'mr2_wzg_slabi_ds_palisada_534', mode: 'skip', seed: 534, teren: 'Wzgórza', built: ['palisada'], world: { 'baza': 'Wzgórza', 'las': false, 'rzeka': false }, atk: [['Wojownik', 'miecznik', { hp: 8 }], ['Wojownik', 'miecznik', { hp: 8 }], ['Wojownik', 'miecznik', { hp: 8 }], ['Konnica', 'konnica'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Taran', 'obleznicza']], def: [['Włócznik', 'wlocznik'], ['Włócznik', 'wlocznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik']] },
  { name: 'mr2_rown_wiezak_ds_palisada_606', mode: 'skip', seed: 606, teren: 'Równina', built: ['palisada'], world: { 'baza': 'Równina', 'las': false, 'rzeka': true }, atk: [['Wieża oblężnicza', 'obleznicza'], ['Konnica', 'konnica'], ['Wojownik', 'miecznik'], ['Wojownik', 'miecznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Taran', 'obleznicza']], def: [['Włócznik', 'wlocznik'], ['Włócznik', 'wlocznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik'], ['Łucznik', 'lucznik']] },
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
    // FRAME-QUANT-Q1 (diagnostyka): start kazdej aktywacji (`_activateUnit`) z chwila klatki.
    const origAct = bs._activateUnit;
    bs._activateUnit = function (ru, ...rest) {
      console.error(`T ${bs.vNow} r${bs.roundNo} ACT ${ru.bu.id}`);
      return origAct.call(this, ru, ...rest);
    };
    // FRAME-QUANT-Q1 (diagnostyka, `WIRING_A_TRACE_SCHED=1`): kazde `_schedule(ms)` z nominalnym `due`.
    if (process.env.WIRING_A_TRACE_SCHED) {
      const origSched = bs._schedule;
      bs._schedule = function (ms, cb) {
        console.error(`T ${bs.vNow} r${bs.roundNo} SCHED ${ms} due=${bs.vNow + Math.max(0, ms)}`);
        return origSched.call(this, ms, cb);
      };
    }
    // MARCH-INCREMENTAL-Q1 (diagnostyka): kazde wejscie kroku marszu wielokrokowego (kazda metoda z
    // `_schedule(STEP_GAP_MS, ...)`: `:6806`, `:7029`, `:7091`, `:7241`, `:7283`, `:8017`, `:8225`/`:8280`, `:9895`) z
    // pozycja i `moveLeft` w chwili decyzji.
    for (const m of ['_siegeWalkTo', '_advanceStep', '_rangedForwardStep', '_rangedBackStep', '_kiteStep', '_fallBackStep',
      '_rangedApproachStep', '_fleeStep']) {
      const origW = bs[m];
      bs[m] = function (ru, ...rest) {
        console.error(`T ${bs.vNow} r${bs.roundNo} WALK ${m} ${ru.bu.id}@${ru.q},${ru.r} ml=${ru.moveLeft}`);
        return origW.call(this, ru, ...rest);
      };
    }
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
  // FQ-SPEED-Q1 (pomiar predkosci, tylko kandydaci `WIRING_A_EXTRA`/`WIRING_A_SWEEP_FRAME`): `speedMul` sceny ustawiany
  // METODA PINU `_setSpeedIdx` (`:9518-9527`; ta sama co przycisk `_cycleSpeed` `:9536` i panel ± `_adjustSpeedIdx`
  // `:9531-9533`) przed `play()`; przewijanie liczy wtedy `FF_STEP_MS = _scaledWallDelta(16) = 16 * speedMul` (`:9419`),
  // czas rzeczywisty `vNow += clamp(dw, 0, 100) * speedMul` (`:9500-9515`). Tekst pinu i strażnik SHA-256 bez zmian.
  if (sc.speedMul != null) {
    const idx = BattleScene.SPEED_STEPS.indexOf(sc.speedMul);
    if (idx < 0) throw new Error('speedMul poza SPEED_STEPS: ' + sc.name + ' ' + sc.speedMul);
    bs._setSpeedIdx(idx);
    if (bs.speedMul !== sc.speedMul || bs.speedIdx !== idx) throw new Error('_setSpeedIdx: ' + sc.name);
  }
  // FQ-SPEED-Q1: zmiana predkosci w trakcie bitwy (`speedAt = { round, speedMul }`, tylko czas rzeczywisty): `_setSpeedIdx`
  // miedzy klatkami rAF (jak klik gracza), w pierwszej klatce z `roundNo >= round`.
  let speedAtDone = false;
  if (sc.speedAt != null && sc.mode !== 'realtime') throw new Error('speedAt tylko dla czasu rzeczywistego: ' + sc.name);
  // FQ-SPEED-MIDCHANGE-VEC-Q1 (#412): lista zmian predkosci w trakcie bitwy (`speedChanges = [{ at, speedMul }]`, tylko
  // czas rzeczywisty) i strumien zdarzen pinu (`events`). Zmiana = `_setSpeedIdx` (metoda pinu, jak klik gracza) MIEDZY
  // klatkami rAF, przed klatka N (stan po klatce N-1). `at` rozwiazywany po kolei (kolejna zmiana dopiero po poprzedniej):
  // `{ frame: N }` = przed klatka N; `{ round: N }` = pierwsza klatka z `roundNo >= N`; `{ when, afterRound }` = pierwsza
  // klatka z `roundNo >= afterRound`, w ktorej w pinie trwa: `inflight` = pocisk w locie (`_schedule(RANGED_FLY_MS | 700)`
  // jednostki, wiezy, katapulty), ktory bez zmiany NIE laduje w najblizszej klatce (przy predkosci sprzed zmiany); `prehit` = pocisk
  // ladujacy w najblizszej klatce przy szybszej z predkosci i pozniej przy wolniejszej (zmiana przesuwa trafienie o
  // klatke); `moving` = krok `_doMove` w trakcie animacji (`0 < vNow - t0 < MOVE_STEP_MS`); `lunge` = wypad
  // `_doMeleeAttack` przed ciosem (`0 < vNow - t0 < BLOW_HIT_T`). Wektor zapisuje ROZWIAZANA klatke (Rust stosuje zmiane
  // przed ta sama klatka) i stan pinu w chwili zmiany (`vNow`, `roundNo`, liczniki), ktory test porownuje z sesja.
  // Obserwatory (opakowania metod instancji, bez zmiany tekstu pinu; pomijaja planowanie AUTO-batch na klonach
  // `_autoBatchPlanning`): `_schedule` (znacznik `ms` na wpisie `vTimers`), `_doMove`, `_doMeleeAttack`, `_pushClash`,
  // `_startRout`, `_startFade`, `_spawnDamageLabel`.
  const changes = (sc.speedChanges ?? []).map((c) => ({ ...c }));
  if (changes.length && sc.mode !== 'realtime') throw new Error('speedChanges tylko dla czasu rzeczywistego: ' + sc.name);
  const applied = [];
  const events = sc.recordEvents ? [] : null;
  const moves = [];
  const lunges = [];
  if (changes.length || events) {
    const key = (u) => (u.side === 'atk' ? 'atk:' : 'def:') + u.bu.id;
    const origSched = bs._schedule;
    bs._schedule = function (ms, cb) {
      const n = this.vTimers.length;
      const out = origSched.call(this, ms, cb);
      if (this.vTimers.length === n + 1) this.vTimers[n].__ms = ms;
      return out;
    };
    const origMove = bs._doMove;
    bs._doMove = function (ru, ...rest) {
      const planning = !!this._autoBatchPlanning;
      const from = `${ru.q},${ru.r}`;
      const t0 = this.vNow;
      const out = origMove.call(this, ru, ...rest);
      // Krok wykonany (pozycja zmieniona) = animacja od `t0 = vNow` (`:8746`); odmowa (`_siegeMoveRefused`) = brak.
      if (!planning && `${ru.q},${ru.r}` !== from) moves.push({ t0 });
      return out;
    };
    const origMelee = bs._doMeleeAttack;
    bs._doMeleeAttack = function (a, d, done) {
      if (!this._autoBatchPlanning) lunges.push({ t0: this.vNow });
      return origMelee.call(this, a, d, done);
    };
    if (events) {
      const origClash = bs._pushClash;
      bs._pushClash = function (a, d, dmg, outcome) {
        if (!this._autoBatchPlanning) events.push([this.vNow, 'C', String(a.bu.id).startsWith('wieza:') ? String(a.bu.id) : key(a), key(d), dmg, outcome || '']);
        return origClash.call(this, a, d, dmg, outcome);
      };
      const origRout = bs._startRout;
      bs._startRout = function (ru) {
        if (!this._autoBatchPlanning && !(ru.routed || ru.dead || ru.fadingOut)) events.push([this.vNow, 'R', key(ru)]);
        return origRout.call(this, ru);
      };
      const origFade = bs._startFade;
      bs._startFade = function (ru) {
        if (!this._autoBatchPlanning && !(ru.fadingOut || ru.dead || ru.removed)) events.push([this.vNow, 'K', key(ru)]);
        return origFade.call(this, ru);
      };
      const origLabel = bs._spawnDamageLabel;
      bs._spawnDamageLabel = function (ru, dmg) {
        if (!this._autoBatchPlanning && !this._ffActive) events.push([this.vNow, 'D', key(ru), dmg]);
        return origLabel.call(this, ru, dmg);
      };
    }
  }
  const PROJ_MS = new Set([380, 700]);
  const probe = (oldMul, newMul) => {
    const lo = 16 * Math.min(oldMul, newMul);
    const hi = 16 * Math.max(oldMul, newMul);
    const fly = bs.vTimers.filter((t) => PROJ_MS.has(t.__ms));
    return {
      pendingTimers: bs.vTimers.length,
      inFlight: fly.filter((t) => t.due > bs.vNow + 16 * oldMul).length,
      preHit: fly.filter((t) => t.due > bs.vNow + lo && t.due <= bs.vNow + hi).length,
      moving: moves.filter((m) => bs.vNow - m.t0 > 0 && bs.vNow - m.t0 < 240).length,
      lunging: lunges.filter((l) => bs.vNow - l.t0 > 0 && bs.vNow - l.t0 < 150).length,
    };
  };
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
    if (sc.speedAt != null && !speedAtDone && bs.roundNo >= sc.speedAt.round) {
      speedAtDone = true;
      const idx = BattleScene.SPEED_STEPS.indexOf(sc.speedAt.speedMul);
      if (idx < 0) throw new Error('speedAt.speedMul poza SPEED_STEPS: ' + sc.name);
      bs._setSpeedIdx(idx);
    }
    if (changes.length > applied.length) {
      const c = changes[applied.length];
      const at = c.at;
      const frameNo = frames + 1;
      let hit = false;
      let pr = null;
      if (at.frame != null) hit = frameNo === at.frame;
      else if (at.round != null) hit = bs.roundNo >= at.round;
      else if (at.when != null) {
        if (bs.roundNo >= (at.afterRound ?? 0)) {
          pr = probe(bs.speedMul, c.speedMul);
          const k = { inflight: 'inFlight', prehit: 'preHit', moving: 'moving', lunge: 'lunging' }[at.when];
          if (!k) throw new Error('nieznany at.when: ' + at.when);
          hit = pr[k] > 0;
        }
      } else throw new Error('zmiana bez at: ' + sc.name);
      if (hit) {
        const idx = BattleScene.SPEED_STEPS.indexOf(c.speedMul);
        if (idx < 0) throw new Error('speedChanges.speedMul poza SPEED_STEPS: ' + sc.name);
        const st = pr ?? probe(bs.speedMul, c.speedMul);
        applied.push({ frame: frameNo, from: bs.speedMul, speedMul: c.speedMul, vNow: bs.vNow, roundNo: bs.roundNo, ...st });
        bs._setSpeedIdx(idx);
        if (bs.speedMul !== c.speedMul) throw new Error('_setSpeedIdx: ' + sc.name);
      }
    }
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
    ...(sc.speedMul != null ? { speedMul: sc.speedMul } : {}),
    ...(sc.speedAt != null ? { speedAt: sc.speedAt, speedAtApplied: speedAtDone } : {}),
    ...(changes.length ? { speedChanges: applied, speedChangesWanted: changes.length, frames } : {}),
    ...(events ? { events } : {}),
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

// FQ-SPEED-Q1: wektory predkosci bitwy (`WIRING_A_SPEED_VECTORS=32,64,...` = klatki pinu 16 * speedMul): kazdy scenariusz
// `SCENARIOS` z klatka produkcyjna (bez bliźniakow `ffStepMs`) liczony przy `speedMul = klatka / 16` ustawionym metoda pinu
// `_setSpeedIdx` przed `play()`. Zapis WYLACZNIE `speed_vectors.json` (zwiezle: nazwa scenariusza, tryb, `speedMul`,
// `expect`; wejscie test bierze z `vectors.json` po nazwie), `vectors.json` i `pin_data.json` bez zmian.
if (process.env.WIRING_A_SPEED_VECTORS) {
  const tS = Date.now();
  const frames = process.env.WIRING_A_SPEED_VECTORS.split(',').map(Number);
  const speedVectors = [];
  for (const F of frames) {
    for (const sc0 of SCENARIOS) {
      if (sc0.ffStepMs != null) continue;
      const v = runScenario({ ...sc0, speedMul: F / 16 });
      speedVectors.push({ name: sc0.name, mode: sc0.mode, speedMul: F / 16, expect: v.expect });
      console.error(`x${F / 16} ${sc0.name}: ${v.expect.winner} tura ${v.expect.roundNo} rzuty ${v.expect.rollsDrawn} (${Date.now() - tS} ms)`);
    }
  }
  const shaS = hash.digest('hex');
  if (shaS !== EXPECTED_SHA256) throw new Error('straznik SHA-256 pinu: ' + shaS + ' != ' + EXPECTED_SHA256);
  const txt = JSON.stringify({ pin: PIN, pinSha256: shaS, frames, vectors: speedVectors }, null, 1) + '\n';
  writeFileSync(join(here, 'p6_k5loop_wiring_a_pin_vectors', 'speed_vectors.json'), txt);
  console.log(createHash('md5').update(txt).digest('hex') + '  speed_vectors.json');
  process.exit(0);
}

// FQ-SPEED-MIDCHANGE-VEC-Q1 (#412, D-412-1): wektory zmiany predkosci W TRAKCIE bitwy (`WIRING_A_SPEED_CHANGE_VECTORS=1`).
// Kazdy przypadek = scenariusz bazowy `SCENARIOS` z klatka produkcyjna (bez bliźniakow `ffStepMs`) w czasie rzeczywistym
// (klatki 16 ms sciany), predkosc startowa `_setSpeedIdx` przed `play()` (opcjonalnie) i lista zmian `_setSpeedIdx` miedzy
// klatkami (`speedChanges`, rozwiazane do numeru klatki, patrz `runScenario`). Zapis WYLACZNIE `speed_change_vectors.json`
// (nazwa, scenariusz bazowy - wejscie test bierze z `vectors.json`, zmiany zadane i zastosowane, liczba klatek, `expect`,
// strumien zdarzen pinu `events`: `[vNow, 'C', aktor, cel, dmg, wynik]` = `_pushClash`, `[vNow, 'R', jedn]` = `_startRout`,
// `[vNow, 'K', jedn]` = `_startFade`, `[vNow, 'D', jedn, dmg]` = `_spawnDamageLabel`); pozostale pliki bez zmian.
const SPEED_CHANGE_CASES = (() => {
  const base = SCENARIOS.filter((s) => s.ffStepMs == null);
  // Pary (start -> zmiana) jak pomiar obrony #407 (1->4, 1->64, 64->1, 4->512, 1->2, 8->32) plus 2->128 i 512->8.
  const pairs = [[1, 4], [1, 64], [64, 1], [4, 512], [1, 2], [8, 32], [2, 128], [512, 8]];
  // Rodzaje chwili zmiany: tura (jak obrona #407), pocisk w locie, pocisk tuz przed trafieniem (zmiana przesuwa trafienie
  // o klatke), krok ruchu w trakcie animacji, wypad wrecz przed ciosem, numer klatki.
  const kinds = ['round', 'inflight', 'prehit', 'moving', 'lunge', 'frame'];
  const out = [];
  let i = 0;
  for (const sc of base) {
    const [s0, s1] = pairs[i % pairs.length];
    const kind = kinds[i % kinds.length];
    const r = 2 + (i * 5) % 11;
    const at = kind === 'round' ? { round: r } : kind === 'frame' ? { frame: 40 + 37 * i } : { when: kind, afterRound: r };
    out.push({ name: `sc_${sc.name}_x${s0}to${s1}_${kind}`, base: sc.name, speedMul: s0 === 1 ? undefined : s0, speedChanges: [{ at, speedMul: s1 }] });
    i += 1;
  }
  // Wielokrotne zmiany w jednej bitwie (w gore i w dol, w tym powrot do x1 i skok 1 -> 512).
  const multi = [
    ['mur_machiny_wylom', 1, [[{ when: 'inflight', afterRound: 2 }, 64], [{ when: 'prehit', afterRound: 5 }, 1], [{ when: 'moving', afterRound: 8 }, 8]]],
    ['palisada_liczni_taran', 1, [[{ when: 'moving', afterRound: 1 }, 16], [{ when: 'lunge', afterRound: 4 }, 2], [{ round: 9 }, 512]]],
    ['mury_cytadela_slaby_atak', 4, [[{ when: 'prehit', afterRound: 3 }, 1], [{ when: 'inflight', afterRound: 6 }, 256]]],
    ['b03_las_lucznicy_mury_baszta', 1, [[{ when: 'prehit', afterRound: 2 }, 32], [{ when: 'prehit', afterRound: 6 }, 2], [{ when: 'inflight', afterRound: 10 }, 128]]],
    ['mr_wzg_jazda3_d3l_mury_333', 2, [[{ when: 'moving', afterRound: 2 }, 1], [{ when: 'lunge', afterRound: 5 }, 64]]],
    ['mi_las_mix_d3l_palisada_118', 1, [[{ frame: 25 }, 512], [{ round: 4 }, 1], [{ when: 'moving', afterRound: 6 }, 4]]],
    // Operator r1 (dopisek po pierwszym pomiarze: 2 z 4 bitew wielokrotnych w klasie rozbieżności): kolejne bitwy z
    // wieloma zmianami w turach i w chwili pocisku w locie (bez wypadu wręcz).
    ['mur_bez_machin_sufit', 1, [[{ round: 3 }, 8], [{ round: 20 }, 1], [{ round: 40 }, 256]]],
    ['rt_mur_machiny_wylom', 1, [[{ round: 2 }, 4], [{ round: 6 }, 64], [{ round: 12 }, 2]]],
    ['fq_wzg_lucz2_d3l_mury_157', 1, [[{ when: 'inflight', afterRound: 2 }, 16], [{ round: 8 }, 1], [{ round: 12 }, 128]]],
    ['mi_gory_lucz2_d5_palisada_196', 1, [[{ frame: 60 }, 2], [{ round: 5 }, 32]]],
    ['mr_wzg_wieza_df_mury_347', 1, [[{ round: 3 }, 2], [{ when: 'inflight', afterRound: 6 }, 8], [{ round: 10 }, 1]]],
  ];
  for (const [b, s0, ch] of multi) {
    if (!base.some((s) => s.name === b)) throw new Error('brak scenariusza bazowego ' + b);
    out.push({ name: `scm_${b}_${[s0, ...ch.map((c) => c[1])].join('_')}`, base: b, speedMul: s0 === 1 ? undefined : s0, speedChanges: ch.map(([at, k]) => ({ at, speedMul: k })) });
  }
  return out;
})();
if (process.env.WIRING_A_SPEED_CHANGE_VECTORS) {
  const tS = Date.now();
  const only = process.env.WIRING_A_SPEED_CHANGE_ONLY ? new Set(process.env.WIRING_A_SPEED_CHANGE_ONLY.split(',')) : null;
  // Podzial na procesy (czas rzeczywisty pinu jest wolny, ~30-80 s na bitwe): `WIRING_A_SPEED_CHANGE_SHARD=k/n` liczy
  // przypadki o indeksie `i % n == k` do `WIRING_A_OUT`; `WIRING_A_SPEED_CHANGE_MERGE=plik1,plik2,...` sklada czesci w
  // kolejnosci `SPEED_CHANGE_CASES` (kazdy przypadek dokladnie raz, ten sam strażnik SHA-256) do pliku wektorow.
  const shard = process.env.WIRING_A_SPEED_CHANGE_SHARD ? process.env.WIRING_A_SPEED_CHANGE_SHARD.split('/').map(Number) : null;
  if (process.env.WIRING_A_SPEED_CHANGE_MERGE) {
    const parts = process.env.WIRING_A_SPEED_CHANGE_MERGE.split(',').map((p) => JSON.parse(readFileSync(p, 'utf8')));
    const byName = new Map();
    for (const p of parts) {
      if (p.pin !== PIN || p.pinSha256 !== EXPECTED_SHA256) throw new Error('czesc z innego pinu');
      for (const v of p.vectors) {
        if (byName.has(v.name)) throw new Error('powtorzony przypadek ' + v.name);
        byName.set(v.name, v);
      }
    }
    const merged = SPEED_CHANGE_CASES.filter((c) => byName.has(c.name)).map((c) => byName.get(c.name));
    if (merged.length !== byName.size) throw new Error('nadmiarowe przypadki w czesciach');
    console.error(`przypadkow ${merged.length}/${SPEED_CHANGE_CASES.length} (pominiete: ${SPEED_CHANGE_CASES.filter((c) => !byName.has(c.name)).map((c) => c.name).join(', ') || 'brak'})`);
    const txtM = JSON.stringify({ pin: PIN, pinSha256: EXPECTED_SHA256, frameWallMs: 16, vectors: merged }) + '\n';
    const outM = join(here, 'p6_k5loop_wiring_a_pin_vectors', 'speed_change_vectors.json');
    writeFileSync(outM, txtM);
    console.log(createHash('md5').update(txtM).digest('hex') + '  ' + outM);
    process.exit(0);
  }
  if (shard && !process.env.WIRING_A_OUT) throw new Error('WIRING_A_SPEED_CHANGE_SHARD wymaga WIRING_A_OUT');
  const vecs = [];
  for (const [ci, c] of SPEED_CHANGE_CASES.entries()) {
    if (only && !only.has(c.name)) continue;
    if (shard && ci % shard[1] !== shard[0]) continue;
    const sc0 = SCENARIOS.find((s) => s.name === c.base);
    const v = runScenario({ ...sc0, name: c.name, mode: 'realtime', speedMul: c.speedMul, speedChanges: c.speedChanges, recordEvents: true });
    // Chwila zadana (`when`) moze w danej bitwie nie wystapic (np. brak ruchu w krotkiej bitwie): przypadek pominiety
    // jawnie (log `POMINIETY`), test liczy pokrycie z przypadkow zapisanych.
    if (v.speedChanges.length !== c.speedChanges.length) {
      console.error(`POMINIETY ${c.name}: zastosowano ${v.speedChanges.length}/${c.speedChanges.length} zmian`);
      continue;
    }
    vecs.push({
      name: c.name, base: c.base, mode: 'realtime', ...(c.speedMul != null ? { speedMul: c.speedMul } : {}),
      wanted: c.speedChanges, changes: v.speedChanges, frames: v.frames, expect: v.expect, events: v.events,
    });
    console.error(`${c.name}: ${v.expect.winner} tura ${v.expect.roundNo} klatek ${v.frames} zdarzen ${v.events.length} zmiany ${JSON.stringify(v.speedChanges.map((a) => [a.frame, a.from, a.speedMul, a.inFlight, a.preHit, a.moving, a.lunging]))} (${Date.now() - tS} ms)`);
  }
  // Obrona #412 (Uwaga 5 Evaluatora): czesc bez zadnego przypadku (`SHARD`/`ONLY` nic nie wybraly) nie laduje pinu,
  // wiec strażnik SHA-256 liczylby skrot pusty; jawny blad zamiast mylacego „straznik SHA-256” (zmniejsz `n` podzialu).
  if (hashed.size === 0) throw new Error('czesc bez przypadkow (WIRING_A_SPEED_CHANGE_SHARD / _ONLY nic nie wybraly)');
  const shaC = hash.digest('hex');
  if (shaC !== EXPECTED_SHA256) throw new Error('straznik SHA-256 pinu: ' + shaC + ' != ' + EXPECTED_SHA256);
  const txt = JSON.stringify({ pin: PIN, pinSha256: shaC, frameWallMs: 16, vectors: vecs }) + '\n';
  const outPath = process.env.WIRING_A_OUT ?? join(here, 'p6_k5loop_wiring_a_pin_vectors', 'speed_change_vectors.json');
  writeFileSync(outPath, txt);
  console.log(createHash('md5').update(txt).digest('hex') + '  ' + outPath);
  process.exit(0);
}

const t0 = Date.now();
const vectors = [];
// PIN2-PROBE-Q1: kandydaci scenariuszy (diagnostyka, np. przy szukaniu wektorow zabijajacych mutanty): `WIRING_A_EXTRA`
// = plik JSON z lista scenariuszy w formacie `SCENARIOS`, wynik do `WIRING_A_OUT` (NIE do katalogu wektorow).
const extra0 = process.env.WIRING_A_EXTRA ? JSON.parse(readFileSync(process.env.WIRING_A_EXTRA, 'utf8')) : null;
// FQ-SPEED-Q1 (pomiar, NIE wektory): `WIRING_A_SWEEP_FRAME=<ms>` liczy scenariusze (kandydatow `WIRING_A_EXTRA` albo
// wbudowane `SCENARIOS`) przy jednej klatce pinu, wynik WYLACZNIE do `WIRING_A_OUT`. `ms >= 16`: `speedMul = ms / 16`
// z `SPEED_STEPS` (`_setSpeedIdx`, model produkcyjny przycisku predkosci; wlasny krok bliźniaka `ffStepMs` pominiety);
// `ms < 16`: krok przewijania `ffStepMs = ms` (granica klatki, jak bliźniaki `_klatka1`/`_klatka4`; czas rzeczywisty
// pominiety, bo `speedMul < 1` nie istnieje w pinie).
const sweep = process.env.WIRING_A_SWEEP_FRAME ? Number(process.env.WIRING_A_SWEEP_FRAME) : null;
if (sweep != null && !process.env.WIRING_A_OUT) throw new Error('WIRING_A_SWEEP_FRAME wymaga WIRING_A_OUT');
const sweepOf = (sc) => {
  if (sweep == null) return sc;
  const { ffStepMs: _drop, speedMul: _drop2, ...base } = sc;
  if (sweep >= 16) return { ...base, speedMul: sweep / 16 };
  if (sc.mode !== 'skip') return null;
  return { ...base, ffStepMs: sweep };
};
const extra = extra0 ?? (sweep != null ? SCENARIOS : null);
for (const sc0 of extra ?? SCENARIOS) {
  const sc = sweepOf(sc0);
  if (sc == null) { console.error(`${sc0.name}: pominiety przy klatce ${sweep} ms (czas rzeczywisty)`); continue; }
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
