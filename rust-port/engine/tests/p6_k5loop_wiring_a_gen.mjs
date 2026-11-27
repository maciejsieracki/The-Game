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
  // R-RUSTPORT-P4-404 (K5EXEC-T3, D-404-3): doktryna jednostek PRZED `play()` (`sc.doctrine = { atk, def }`, wartosc albo
  // lista per indeks rostera). Stan = pole `ru.unitDoctrine` (to samo pole co `_setUnitsDoctrine` `:17666-17671`;
  // `playerOrder` jest juz `{ type: 'none' }` ze spawnu, flagi `_applySkirmishFlagsForUnit` `:17656-17660` NIE sa
  // ustawiane: scenariusze uzywaja doktryny `skirmish` dla piechoty/jazdy bez zasiegu, dla ktorych sa no-op).
  if (sc.doctrine) {
    // Atrapa renderu: `_makeOrderArrow` (`:11373-11417`, wolane z `_refreshQueuedOrderVisuals` po rozkazie ruchu) buduje
    // wylacznie obiekty three.js (strzalka rozkazu na ziemi); atrapa `THREE.Vector3` nie ma metody `length()`.
    bs._makeOrderArrow = () => makeStub('orderArrow');
    for (const [side, list] of [['atk', bs.atk], ['def', bs.def]]) {
      const d = sc.doctrine[side];
      if (d == null) continue;
      list.forEach((ru, i) => {
        const x = Array.isArray(d) ? d[i] : d;
        if (x == null) return;
        if (x === 'skirmish' && (ru.primaryRanged || ru.rangedBase || ru.range > 1)) {
          throw new Error('skirmish dla strzelca (flagi _applySkirmishFlagsForUnit poza wektorem): ' + sc.name);
        }
        ru.unitDoctrine = x;
      });
    }
  }
  // R-RUSTPORT-P4-404: slad rozkazow ruchu (`sc.recordOrders`): kazde wywolanie `_performPlayerOrder` (`:18280-18353`) z
  // rozkazem `move` poza planowaniem AUTO-batch: `{ t: vNow, u, from: [q, r], to: [tc, tr], kind, step, attack, route }`,
  // gdzie `kind` = `target` (cel = pozycja), `attack` (`_adjacentEnemy` -> `_doAttack`), `move` (`_doMove(ru, nc, nr)`,
  // `step = [nc, nr]`, takze odmowa `_siegeMoveRefused`), `done` (brak kroku albo bramka); `route` = wynik
  // `_firstStepTowardMoveDestination` wywolanego w tym rozkazie (`[c, r]`, `null` = brak drogi, pole pominiete = nie
  // wolano). Obserwatory = opakowania metod instancji (tekst pinu bez zmian, straznik SHA-256 nietkniety).
  const orders = sc.recordOrders ? [] : null;
  if (orders) {
    const okey = (u) => (u.side === 'atk' ? 'atk:' : 'def:') + u.bu.id;
    let cur = null;
    const oPerf = bs._performPlayerOrder;
    bs._performPlayerOrder = function (ru, done) {
      const ord = ru.playerOrder;
      if (this._autoBatchPlanning || ord.type !== 'move') return oPerf.call(this, ru, done);
      const prev = cur;
      cur = { t: this.vNow, u: okey(ru), from: [ru.q, ru.r], to: [ord.col, ord.row], kind: 'done', step: null, attack: null };
      const rec = cur;
      orders.push(rec);
      try { return oPerf.call(this, ru, done); } finally { cur = prev; }
    };
    const oRoute = bs._firstStepTowardMoveDestination;
    bs._firstStepTowardMoveDestination = function (...a) {
      const out = oRoute.apply(this, a);
      if (cur) cur.route = out == null ? null : out.split(',').map(Number);
      return out;
    };
    const oMove = bs._doMove;
    bs._doMove = function (ru, c, r, ...rest) {
      if (cur && cur.kind === 'done') {
        cur.kind = 'move';
        cur.step = [c, r];
        cur = null;
      }
      return oMove.call(this, ru, c, r, ...rest);
    };
    const oAtt = bs._doAttack;
    bs._doAttack = function (a, d, ...rest) {
      if (cur && cur.kind === 'done') {
        cur.kind = 'attack';
        cur.attack = okey(d);
        cur = null;
      }
      return oAtt.call(this, a, d, ...rest);
    };
    const oRefresh = bs._refreshQueuedOrderVisuals;
    bs._refreshQueuedOrderVisuals = function (...a) {
      // `ru.playerOrder = none` + `_refreshQueuedOrderVisuals` + `done()` przy celu = pozycja (`:18300-18303`).
      if (cur && cur.kind === 'done' && cur.from[0] === cur.to[0] && cur.from[1] === cur.to[1]) cur.kind = 'target';
      return oRefresh.apply(this, a);
    };
  }
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
  const frameMs = traced && process.env.WIRING_A_FRAME ? Number(process.env.WIRING_A_FRAME) : (sc.wallFrameMs ?? 16);
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
  // R-RUSTPORT-P4-414 (FQ-SPEED-MIDCHANGE-VEC-2, `sc.probe2`): klasa kroku `_doMove` wg metody pinu, ktora go wywolala
  // bezposrednio: `ph` = krok falangi `_phalanxStep` (`:6635`, z `_phalanxAction` `:6577`), `adv` = `_advanceToward`
  // (`:7915`, wolane z `:6215`, `:8035`, `:8049`), `''` = inne. Obserwatory = opakowania metod instancji (tekst pinu bez
  // zmian, strażnik SHA-256 nietkniety); stan zwracany w `probe2Log` (sonda).
  let moveCls = '';
  const probe2Calls = {};
  if (sc.probe2) {
    for (const [m, cls] of [['_phalanxStep', 'ph'], ['_advanceToward', 'adv']]) {
      const o = bs[m];
      if (typeof o !== 'function') throw new Error('brak metody pinu ' + m);
      bs[m] = function (...a) {
        const prev = moveCls;
        moveCls = cls;
        probe2Calls[cls] = (probe2Calls[cls] ?? 0) + 1;
        try { return o.apply(this, a); } finally { moveCls = prev; }
      };
    }
  }
  if (changes.length || events || sc.probe2) {
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
      // R-RUSTPORT-P4-414: klasa kroku liczona tylko dla wywolania bezposrednio z obserwowanej metody (zagniezdzone
      // wywolania z callbacku `done` kroku nie dziedzicza klasy, bo `_doMove` wola `done` dopiero w klatce konca kroku).
      const cls = moveCls;
      moveCls = '';
      let out;
      try { out = origMove.call(this, ru, ...rest); } finally { moveCls = cls; }
      // Krok wykonany (pozycja zmieniona) = animacja od `t0 = vNow` (`:8746`); odmowa (`_siegeMoveRefused`) = brak.
      if (!planning && `${ru.q},${ru.r}` !== from) moves.push(sc.probe2 ? { t0, cls, round: this.roundNo } : { t0 });
      return out;
    };
    const origMelee = bs._doMeleeAttack;
    bs._doMeleeAttack = function (a, d, done) {
      if (!this._autoBatchPlanning) lunges.push(sc.probe2 ? { t0: this.vNow, round: this.roundNo } : { t0: this.vNow });
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
  // R-RUSTPORT-P4-406 (LANDAT-TB-TOWER-DUE-ORDER, D-406-1): kolejnosc trafienia wiezy wobec innych zegarow TEJ SAMEJ klatki
  // (`sc.recordTowerOrder`, tylko wektory `tower_due_order_vectors.json`). Obserwatory = opakowania metod instancji (bez
  // zmiany tekstu pinu, strażnik SHA-256 nietkniety); pomijaja planowanie AUTO-batch (`_autoBatchPlanning`):
  // * kazdy zegar `_schedule` dostaje rekord `{ due, ms, src, kind }` (`src` = najglebsza obserwowana metoda pinu w chwili
  //   planowania albo `src` odpalanego wlasnie zegara; `kind` = `towerHit` dla `_schedule(RANGED_FLY_MS)` z `_fireOneTower`
  //   `:4262`, `boulder` dla `_schedule(700)` z `_attackWallTile` `:7555`, inaczej `other`), a jego callback opakowanie
  //   zapisujace odpalenie `[vNow klatki, rekord]` (kolejnosc `_drainTimers` `:9616-9634`: rosnaco po `due`, potem `id`);
  // * zdarzenia (obok `C`/`R`/`K`/`D` z `recordEvents`): `[t0, 'S', 'wieza:'+row, cel]` = wystrzal wiezy (chwila
  //   `_schedule(RANGED_FLY_MS)` `:4262`; cel = `pickTowerTarget` pinu z tymi samymi wejsciami co `:4229-4234`),
  //   `[t0, 'B', jedn, wiersz]` = kamien katapulty (`_schedule(700)` `:7555`), `[vNow, 'T', roundNo]` = napis tury
  //   `_beginTurn` (`hint.textContent` `:5675-5676`);
  // * loty: `tower = [[t0, fire|null, row, cel]]`, `boulder = [[t0, fire|null, jedn, wiersz]]` (`fire` = `vNow` klatki,
  //   w ktorej `_drainTimers` odpalil trafienie; `null` = koniec bitwy przed trafieniem, `:9620`).
  const order = sc.recordTowerOrder ? { fired: [], tower: [], boulder: [] } : null;
  if (order) {
    if (!events) throw new Error('recordTowerOrder wymaga recordEvents: ' + sc.name);
    const okey = (u) => (u.side === 'atk' ? 'atk:' : 'def:') + u.bu.id;
    const towers = load('gra/src/game/city-towers.ts');
    const ctx = [];
    let firing = null;
    let shot = null;
    let wallShot = null;
    const OBS = ['_fireSiegeTowers', '_fireOneTower', '_attackWallTile', '_doRangedAttack', '_doMeleeAttack', '_activateNext',
      '_activateUnit', '_beginTurn', '_siegeWalkTo', '_advanceStep', '_rangedForwardStep', '_rangedBackStep', '_kiteStep',
      '_fallBackStep', '_rangedApproachStep', '_fleeStep', '_finishAutoBatchPhase'];
    for (const m of OBS) {
      const o = bs[m];
      if (typeof o !== 'function') throw new Error('brak metody pinu ' + m);
      bs[m] = function (...a) { ctx.push(m); try { return o.apply(this, a); } finally { ctx.pop(); } };
    }
    const oFire = bs._fireOneTower;
    bs._fireOneTower = function (t, ...rest) {
      const prev = shot;
      shot = null;
      if (!this.finished && !t.destroyed) {
        const enemies = this.atk.filter((u) => !u.dead && !u.fadingOut && !u.routed && !u.removed);
        const idx = towers.pickTowerTarget({ q: this.siegeWallCol, r: t.row }, this.towerRange,
          enemies.map((u) => ({ q: u.q, r: u.r, hp: u.bu.hp })));
        if (idx >= 0) shot = { row: t.row, target: okey(enemies[idx]) };
      }
      try { return oFire.call(this, t, ...rest); } finally { shot = prev; }
    };
    const oWall = bs._attackWallTile;
    bs._attackWallTile = function (ru, wallRow, ...rest) {
      const prev = wallShot;
      wallShot = { unit: okey(ru), row: wallRow };
      try { return oWall.call(this, ru, wallRow, ...rest); } finally { wallShot = prev; }
    };
    const oSched = bs._schedule;
    bs._schedule = function (ms, cb) {
      const n = this.vTimers.length;
      const t0 = this.vNow;
      const src = ctx.length ? ctx[ctx.length - 1] : (firing ? firing.src : '-');
      const live = !this._autoBatchPlanning && !this.finished;
      let kind = 'other';
      let flight = null;
      if (ms === 380 && src === '_fireOneTower') {
        kind = 'towerHit';
        if (live) {
          if (!shot) throw new Error('trafienie wiezy bez celu: ' + sc.name + ' t0 ' + t0);
          flight = [t0, null, shot.row, shot.target];
          order.tower.push(flight);
          events.push([t0, 'S', 'wieza:' + shot.row, shot.target]);
        }
      } else if (ms === 700 && src === '_attackWallTile') {
        kind = 'boulder';
        if (live) {
          flight = [t0, null, wallShot.unit, wallShot.row];
          order.boulder.push(flight);
          events.push([t0, 'B', wallShot.unit, wallShot.row]);
        }
      }
      const out = oSched.call(this, ms, cb);
      if (live && this.vTimers.length === n + 1) {
        const e = this.vTimers[n];
        const rec = { due: e.due, ms, src, kind };
        const orig = e.cb;
        e.cb = () => {
          if (flight) flight[1] = bs.vNow;
          order.fired.push([bs.vNow, rec]);
          const prev = firing;
          firing = rec;
          try { return orig(); } finally { firing = prev; }
        };
      }
      return out;
    };
    const h0 = bs.hint;
    bs.hint = new Proxy(h0, {
      set(t, p, v) {
        if (p === 'textContent' && typeof v === 'string' && v.startsWith('Tura ' + bs.roundNo + ' — klik: ruch/atak od razu. Ctrl')) {
          events.push([bs.vNow, 'T', bs.roundNo]);
        }
        t[p] = v;
        return true;
      },
    });
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
      ...(sc.probe2 ? probe2(oldMul, newMul) : {}),
    };
  };
  // R-RUSTPORT-P4-414 (D-414-2): chwile, w ktorych zmiana predkosci PRZESUWA koniec odcinka `_raf` w toku. Odcinek od `t0`
  // o dlugosci `ms` konczy sie w pierwszej klatce `vNow + k * F >= t0 + ms` (pin sprawdza `localT >= ms` w kazdej klatce:
  // `_doMove` `:8748-8768`, `_doMeleeAttack` `:9118-9124` cios, `:9149` koniec wypadu); `F = 16 * speedMul`. Licznik =
  // odcinki w toku, dla ktorych koniec przy starej predkosci (`F0`) != koniec przy nowej (`F1`):
  // `movingPh` = krok falangi (`MOVE_STEP_MS` 240), `movingAdv` = krok `_advanceToward` (240), `lungeShift` = wypad przed
  // ciosem (`BLOW_HIT_T` 150; zmiana przesuwa cios o klatke), `lungeTail` = wypad po ciosie przed koncem (`BLOW_LUNGE_MS`
  // 260; zmiana przesuwa koniec wypadu i `_schedule(BLOW_SETTLE_MS)`).
  function probe2(oldMul, newMul) {
    const now = bs.vNow;
    const F0 = 16 * oldMul;
    const F1 = 16 * newMul;
    const shift = (target) => target > now && Math.ceil((target - now) / F0) * F0 !== Math.ceil((target - now) / F1) * F1;
    const live = (t0, ms) => now - t0 >= 0 && now - t0 < ms && shift(t0 + ms);
    return {
      movingPh: moves.filter((m) => m.cls === 'ph' && live(m.t0, 240)).length,
      movingAdv: moves.filter((m) => m.cls === 'adv' && live(m.t0, 240)).length,
      lungeShift: lunges.filter((l) => live(l.t0, 150)).length,
      lungeTail: lunges.filter((l) => now - l.t0 >= 150 && live(l.t0, 260)).length,
    };
  }
  if (sc.probe2) globalThis.__probe2Log = { moves, lunges, calls: probe2Calls };
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
          const k = { inflight: 'inFlight', prehit: 'preHit', moving: 'moving', lunge: 'lunging',
            ...(sc.probe2 ? { movingPh: 'movingPh', movingAdv: 'movingAdv', lungeShift: 'lungeShift', lungeTail: 'lungeTail' } : {}) }[at.when];
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
    ...(order ? { towerOrder: order } : {}),
    ...(orders ? { orders } : {}),
    ...(sc.doctrine ? { doctrine: sc.doctrine } : {}),
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

// R-RUSTPORT-P4-414 (Obrona r1, Z1/Z3): krok falangi `_phalanxStep` (`:6588-6636`) w oblezeniu. Obroncy oblezenia
// koncza `_activateUnit` w `:6225-6236` (przed `:6290`), a atakujacy z doktryna AUTO (`unitDoctrine` null, `autoPlay`
// grupy domyslnie true) ida przez `_executeGroupDoctrineStep` (`:6092-6098`) - stad 0 wywolan `_phalanxStep` w
// scenariuszach bazowych. Doktryna jednostki `'manual'` (`GroupDoctrine` `:1938`) daje `_isUnitDoctrineAuto` = false
// (`:17621-17623`), wiec falanga atakujacego omija galaz doktryny i dochodzi do `:6290` `_phalanxAction` -> `_phalanxStep`
// `:6588` -> `_doMove` `:6635`. Doktryna ustawiana przed `play()` mechanizmem `sc.doctrine` (#404, pole `ru.unitDoctrine`)
// i zapisywana w wektorze (`doctrine`). Scenariusze spoza `vectors.json`: wejscie sceny zapisane w samym wektorze.
const F = ['Falanga', 'falanga'];
const EXTRA2_SCENARIOS = [
  // mury, rzeka; dwie falangi atakujacego z doktryna `manual` (sonda: 78 wywolan `_phalanxStep`, tury 1-32).
  { name: 'ev_falangi_manual_mur', mode: 'skip', seed: 409, built: ['mury'], world: { baza: 'Równina', las: false, rzeka: true }, atk: [F, F, W, W, L, L], def: [W, F, L, L], doctrine: { atk: ['manual', 'manual'] } },
  // palisada z taranem; trzy falangi atakujacego z doktryna `manual` (sonda: 228 wywolan `_phalanxStep`, tury 1-12).
  { name: 'ev_falangi_manual_pal', mode: 'skip', seed: 414, built: ['palisada'], atk: [F, F, F, W, W, ['Taran', 'obleznicza']], def: [W, L, L], doctrine: { atk: ['manual', 'manual', 'manual'] } },
];
// R-RUSTPORT-P4-414 (FQ-SPEED-MIDCHANGE-VEC-2, D-414-2): SONDA (`WIRING_A_SPEED_CHANGE2_SONDA=1`, podzial
// `WIRING_A_SPEED_CHANGE2_SHARD=k/n`, wynik JSON do `WIRING_A_OUT`): kazdy scenariusz bazowy `SCENARIOS` z klatka
// produkcyjna w czasie rzeczywistym x1 z obserwatorami `probe2` (bez zmian predkosci): kroki falangi / `_advanceToward`
// (tura, `t0`) i wypady wrecz (tura, `t0`). Sluzy do doboru przypadkow `SPEED_CHANGE2_CASES`; nie zapisuje wektorow.
if (process.env.WIRING_A_SPEED_CHANGE2_SONDA) {
  const shard = process.env.WIRING_A_SPEED_CHANGE2_SHARD ? process.env.WIRING_A_SPEED_CHANGE2_SHARD.split('/').map(Number) : null;
  const out = [];
  const tS = Date.now();
  const only2 = process.env.WIRING_A_SPEED_CHANGE2_ONLY ? new Set(process.env.WIRING_A_SPEED_CHANGE2_ONLY.split(',')) : null;
  for (const [i, sc0] of [...SCENARIOS.filter((s) => s.ffStepMs == null), ...EXTRA2_SCENARIOS].entries()) {
    if (shard && i % shard[1] !== shard[0]) continue;
    if (only2 && !only2.has(sc0.name)) continue;
    const v = runScenario({ ...sc0, mode: 'realtime', probe2: true });
    const { moves, lunges } = globalThis.__probe2Log;
    const rounds = (cls) => moves.filter((m) => m.cls === cls).map((m) => m.round);
    const row = { name: sc0.name, winner: v.expect.winner, roundNo: v.expect.roundNo, ph: rounds('ph'), adv: rounds('adv'), lunges: lunges.length, lungeRounds: [...new Set(lunges.map((l) => l.round))] };
    out.push(row);
    console.error(`${sc0.name}: ${row.winner} tura ${row.roundNo} ph ${JSON.stringify(row.ph)} adv ${JSON.stringify(row.adv)} wypadow ${row.lunges} wywolan ${JSON.stringify(globalThis.__probe2Log.calls)} (${Date.now() - tS} ms)`);
  }
  if (process.env.WIRING_A_OUT) writeFileSync(process.env.WIRING_A_OUT, JSON.stringify(out) + '\n');
  process.exit(0);
}

// R-RUSTPORT-P4-414 (FQ-SPEED-MIDCHANGE-VEC-2, D-414-1/2): wektory zmiany predkosci w trakcie bitwy pod klasy odcinkow
// `_raf`, ktorych nie trafia `speed_change_vectors.json` (sonda Evaluatora #413): krok falangi (`movingPh`), krok
// `_advanceToward` (`movingAdv`), wypad przed ciosem z przesunieciem ciosu o klatke (`lungeShift`) i wypad po ciosie
// przed koncem (`lungeTail`); klasy i warunek przesuniecia = `probe2` w `runScenario`. Format wektora jak
// `speed_change_vectors.json` (te same pola, w `changes` dodatkowo liczniki `movingPh`/`movingAdv`/`lungeShift`/
// `lungeTail`). Zapis WYLACZNIE `speed_change_vectors_2.json` (`WIRING_A_SPEED_CHANGE2_VECTORS=1`, podzial
// `WIRING_A_SPEED_CHANGE2_SHARD=k/n` do `WIRING_A_OUT`, scalanie `WIRING_A_SPEED_CHANGE2_MERGE=plik1,...`); pozostale
// pliki wektorow bez zmian. Przypadki dobrane sonda (`WIRING_A_SPEED_CHANGE2_SONDA`), raport
// `dyspozycje/autobot/runs/R-RUSTPORT-P4-414-FQ-SPEED-MIDCHANGE-VEC-2-Q1/01-operator-r1.md`.
const SPEED_CHANGE2_CASES = (() => {
  const base = [...SCENARIOS.filter((s) => s.ffStepMs == null), ...EXTRA2_SCENARIOS];
  const list = JSON.parse(process.env.WIRING_A_SPEED_CHANGE2_CASES_JSON ?? 'null') ?? [
    // [scenariusz bazowy, predkosc startowa, [[at, speedMul], ...]]; dobor: sonda (`WIRING_A_SPEED_CHANGE2_SONDA`).
    // Krok `_advanceToward` (tarany/katapulty/wieze w turach 1..~25).
    ['mur_machiny_wylom', 1, [[{ when: 'movingAdv', afterRound: 2 }, 4]]],
    ['b07_las_katapulta_zejscie_z_korony', 2, [[{ when: 'movingAdv', afterRound: 3 }, 16]]],
    ['b03_wzgorza_palisada_katapulta', 1, [[{ when: 'movingAdv', afterRound: 2 }, 8]]],
    ['p3_las_jazda_d6l_mury_111', 4, [[{ when: 'movingAdv', afterRound: 2 }, 1], [{ round: 30 }, 16]]],
    // Wypad przed ciosem: zmiana przesuwa klatke ciosu (`BLOW_HIT_T`).
    ['fq_las_mix_d8l_palisada_122', 4, [[{ when: 'lungeShift', afterRound: 2 }, 1]]],
    ['p3_wzg_mix_d5_palisada_156', 2, [[{ when: 'lungeShift', afterRound: 2 }, 8]]],
    ['b03_gory_lucznicy_mury_baszta', 1, [[{ when: 'lungeShift', afterRound: 2 }, 4]]],
    ['rt_mur_machiny_wylom', 8, [[{ when: 'lungeShift', afterRound: 2 }, 2]]],
    // Wypad po ciosie przed koncem (`BLOW_LUNGE_MS`, potem `_schedule(BLOW_SETTLE_MS)`).
    ['p3_las_mix_d5_mury_123', 1, [[{ when: 'lungeTail', afterRound: 2 }, 4]]],
    ['fq_wzg_lucz2_d8l_palisada_162', 2, [[{ when: 'lungeTail', afterRound: 2 }, 16]]],
    ['p3_rown_mix_d8l_palisada_218', 4, [[{ when: 'lungeTail', afterRound: 2 }, 1]]],
    ['mi_las_mix_d3l_palisada_118', 1, [[{ when: 'lungeTail', afterRound: 2 }, 64]]],
    // Krok falangi (`_phalanxStep` `:6635`) atakujacego z doktryna `manual` (`EXTRA2_SCENARIOS`, Obrona r1 Z1).
    ['ev_falangi_manual_pal', 1, [[{ when: 'movingPh', afterRound: 2 }, 4]]],
    ['ev_falangi_manual_mur', 2, [[{ when: 'movingPh', afterRound: 3 }, 1]]],
  ];
  return list.map(([b, s0, ch]) => {
    if (!base.some((s) => s.name === b)) throw new Error('brak scenariusza bazowego ' + b);
    const tag = ch.map(([at, k]) => `${at.when ?? (at.round != null ? 'r' + at.round : 'f' + at.frame)}${k}`).join('_');
    return { name: `sc2_${b}_x${s0}_${tag}`, base: b, speedMul: s0 === 1 ? undefined : s0, speedChanges: ch.map(([at, k]) => ({ at, speedMul: k })) };
  });
})();
if (process.env.WIRING_A_SPEED_CHANGE2_VECTORS) {
  const tS = Date.now();
  const outDefault = join(here, 'p6_k5loop_wiring_a_pin_vectors', 'speed_change_vectors_2.json');
  const only = process.env.WIRING_A_SPEED_CHANGE2_ONLY ? new Set(process.env.WIRING_A_SPEED_CHANGE2_ONLY.split(',')) : null;
  const shard = process.env.WIRING_A_SPEED_CHANGE2_SHARD ? process.env.WIRING_A_SPEED_CHANGE2_SHARD.split('/').map(Number) : null;
  if (process.env.WIRING_A_SPEED_CHANGE2_MERGE) {
    const parts = process.env.WIRING_A_SPEED_CHANGE2_MERGE.split(',').map((p) => JSON.parse(readFileSync(p, 'utf8')));
    const byName = new Map();
    for (const p of parts) {
      if (p.pin !== PIN || p.pinSha256 !== EXPECTED_SHA256) throw new Error('czesc z innego pinu');
      for (const v of p.vectors) {
        if (byName.has(v.name)) throw new Error('powtorzony przypadek ' + v.name);
        byName.set(v.name, v);
      }
    }
    const merged = SPEED_CHANGE2_CASES.filter((c) => byName.has(c.name)).map((c) => byName.get(c.name));
    if (merged.length !== byName.size) throw new Error('nadmiarowe przypadki w czesciach');
    console.error(`przypadkow ${merged.length}/${SPEED_CHANGE2_CASES.length} (pominiete: ${SPEED_CHANGE2_CASES.filter((c) => !byName.has(c.name)).map((c) => c.name).join(', ') || 'brak'})`);
    const txtM = JSON.stringify({ pin: PIN, pinSha256: EXPECTED_SHA256, frameWallMs: 16, vectors: merged }) + '\n';
    writeFileSync(outDefault, txtM);
    console.log(createHash('md5').update(txtM).digest('hex') + '  ' + outDefault);
    process.exit(0);
  }
  if (shard && !process.env.WIRING_A_OUT) throw new Error('WIRING_A_SPEED_CHANGE2_SHARD wymaga WIRING_A_OUT');
  const vecs = [];
  for (const [ci, c] of SPEED_CHANGE2_CASES.entries()) {
    if (only && !only.has(c.name)) continue;
    if (shard && ci % shard[1] !== shard[0]) continue;
    const sc0 = SCENARIOS.find((s) => s.name === c.base) ?? EXTRA2_SCENARIOS.find((s) => s.name === c.base);
    const v = runScenario({ ...sc0, name: c.name, mode: 'realtime', speedMul: c.speedMul, speedChanges: c.speedChanges, recordEvents: true, probe2: true });
    if (v.speedChanges.length !== c.speedChanges.length) {
      console.error(`POMINIETY ${c.name}: zastosowano ${v.speedChanges.length}/${c.speedChanges.length} zmian`);
      continue;
    }
    vecs.push({
      name: c.name, base: c.base, mode: 'realtime', ...(c.speedMul != null ? { speedMul: c.speedMul } : {}),
      wanted: c.speedChanges, changes: v.speedChanges, frames: v.frames, expect: v.expect, events: v.events,
      // Wejscie sceny w wektorze (scenariusze `EXTRA2_SCENARIOS` nie maja wpisu w `vectors.json`; dla pozostalych test
      // sprawdza rownosc z `vectors.json`).
      seed: v.seed, battleIndex: v.battleIndex, input: v.input,
      // Doktryna jednostek przed `play()` (`sc.doctrine`, Obrona r1 Z1): test Rust ustawia ja przed pierwsza klatka.
      ...(v.doctrine ? { doctrine: v.doctrine } : {}),
    });
    console.error(`${c.name}: ${v.expect.winner} tura ${v.expect.roundNo} klatek ${v.frames} zdarzen ${v.events.length} zmiany ${JSON.stringify(v.speedChanges.map((a) => [a.frame, a.from, a.speedMul, a.roundNo, a.movingPh, a.movingAdv, a.lungeShift, a.lungeTail]))} (${Date.now() - tS} ms)`);
  }
  if (hashed.size === 0) throw new Error('czesc bez przypadkow (WIRING_A_SPEED_CHANGE2_SHARD / _ONLY nic nie wybraly)');
  const sha2 = hash.digest('hex');
  if (sha2 !== EXPECTED_SHA256) throw new Error('straznik SHA-256 pinu: ' + sha2 + ' != ' + EXPECTED_SHA256);
  const txt = JSON.stringify({ pin: PIN, pinSha256: sha2, frameWallMs: 16, vectors: vecs }) + '\n';
  const outPath = process.env.WIRING_A_OUT ?? outDefault;
  writeFileSync(outPath, txt);
  console.log(createHash('md5').update(txt).digest('hex') + '  ' + outPath);
  process.exit(0);
}

// R-RUSTPORT-P4-406 (LANDAT-TB-TOWER-DUE-ORDER, D-406-1): wektory kolejnosci trafienia wiezy wobec innych zegarow tej samej
// klatki (`WIRING_A_TOWER_ORDER_VECTORS=16,8` = dlugosci klatki sciany pinu w ms). Kazdy scenariusz `SCENARIOS` z klatka
// produkcyjna (bez bliźniakow `ffStepMs`) w CZASIE RZECZYWISTYM (klatki rAF co `F` ms sciany, `speedMul = 1`, wiec
// `vNow += F` na klatke `_advanceVClock` `:9500-9509`): przy 16 ms model produkcyjny; przy 8 ms bliźniak granicy klatki
// (D-PIN2-2; Rust: `speedMul = 0.5` przy klatce 16 ms, ten sam krok `vNow`). Czas rzeczywisty zamiast przewijania: chwile
// zdarzen sa porownywane bezwzglednie, a `skip()` po `play()` ma znany dlug czasu tury 1 (PRE-SKIP-RAF, #405). Zapis
// WYLACZNIE `tower_due_order_vectors.json` (albo `WIRING_A_OUT`): nazwa, scenariusz bazowy (wejscie z `vectors.json`),
// klatka `wallFrameMs`, liczba klatek, `expect`, strumien zdarzen `events` (`S`/`B`/`T`/`C`/`R`/`K`/`D`, patrz
// `runScenario`), loty `tower`/`boulder` z chwila trafienia oraz `pairFrames` = klatki, w ktorych odpalil zegar trafienia
// wiezy (`due = t0 + 380`) i po nim inny zegar z `due ∈ (t0 + 380, vNow klatki]` (lista zegarow klatki w kolejnosci
// `_drainTimers`: `[due, ms, src, kind]`). Podzial na procesy jak #412: `WIRING_A_TOWER_ORDER_SHARD=k/n` (wynik do
// `WIRING_A_OUT`), `WIRING_A_TOWER_ORDER_MERGE=plik1,plik2,...`. Pozostale pliki wektorow bez zmian.
const TOWER_ORDER_CASES = (steps) => {
  const out = [];
  for (const F of steps) {
    for (const sc of SCENARIOS) {
      if (sc.ffStepMs != null) continue;
      out.push({ F, sc, name: F === 16 ? `to_${sc.name}` : `to_${sc.name}_klatka${F}` });
    }
  }
  return out;
};
if (process.env.WIRING_A_TOWER_ORDER_VECTORS) {
  const tS = Date.now();
  const steps = process.env.WIRING_A_TOWER_ORDER_VECTORS.split(',').map(Number);
  const cases = TOWER_ORDER_CASES(steps);
  const outPath = process.env.WIRING_A_OUT ?? join(here, 'p6_k5loop_wiring_a_pin_vectors', 'tower_due_order_vectors.json');
  const summarize = (vecs) => {
    const totals = { pairs: {}, pairFrames: {}, hits: {}, byOther: {} };
    for (const v of vecs) {
      const F = v.wallFrameMs ?? 16;
      totals.pairs[F] = (totals.pairs[F] ?? 0) + v.pairs;
      totals.pairFrames[F] = (totals.pairFrames[F] ?? 0) + v.pairFrames.length;
      for (const [k, list] of [['tower', v.tower], ['boulder', v.boulder]]) {
        for (const [t, fire] of list) {
          if (fire == null) continue;
          const key = `${k}@${F}:${fire - t}`;
          totals.hits[key] = (totals.hits[key] ?? 0) + 1;
        }
      }
      for (const [vn, list] of v.pairFrames) {
        const i = list.findIndex((r) => r[3] === 'towerHit');
        for (const o of list.slice(i + 1)) {
          if (o[0] > list[i][0]) { const k = `${F}:${o[2]}:${o[1]}`; totals.byOther[k] = (totals.byOther[k] ?? 0) + 1; }
        }
      }
    }
    return totals;
  };
  const write = (vecs, sha) => {
    const totals = summarize(vecs);
    console.error('RAZEM ' + JSON.stringify(totals));
    const txt = JSON.stringify({ pin: PIN, pinSha256: sha, steps, totals, vectors: vecs }) + '\n';
    writeFileSync(outPath, txt);
    console.log(createHash('md5').update(txt).digest('hex') + '  ' + outPath);
  };
  if (process.env.WIRING_A_TOWER_ORDER_MERGE) {
    const parts = process.env.WIRING_A_TOWER_ORDER_MERGE.split(',').map((p) => JSON.parse(readFileSync(p, 'utf8')));
    const byName = new Map();
    for (const p of parts) {
      if (p.pin !== PIN || p.pinSha256 !== EXPECTED_SHA256) throw new Error('czesc z innego pinu');
      for (const v of p.vectors) {
        if (byName.has(v.name)) throw new Error('powtorzony przypadek ' + v.name);
        byName.set(v.name, v);
      }
    }
    const missing = cases.filter((c) => !byName.has(c.name)).map((c) => c.name);
    if (missing.length) throw new Error('brak przypadkow: ' + missing.join(', '));
    if (byName.size !== cases.length) throw new Error('nadmiarowe przypadki w czesciach');
    write(cases.map((c) => byName.get(c.name)), EXPECTED_SHA256);
    process.exit(0);
  }
  const shard = process.env.WIRING_A_TOWER_ORDER_SHARD ? process.env.WIRING_A_TOWER_ORDER_SHARD.split('/').map(Number) : null;
  if (shard && !process.env.WIRING_A_OUT) throw new Error('WIRING_A_TOWER_ORDER_SHARD wymaga WIRING_A_OUT');
  const only = process.env.WIRING_A_TOWER_ORDER_ONLY ? new Set(process.env.WIRING_A_TOWER_ORDER_ONLY.split(',')) : null;
  const vecs = [];
  for (const [ci, { F, sc: sc0, name }] of cases.entries()) {
    if (shard && ci % shard[1] !== shard[0]) continue;
    if (only && !only.has(name)) continue;
    const v = runScenario({ ...sc0, name, mode: 'realtime', wallFrameMs: F, recordEvents: true, recordTowerOrder: true });
    const { fired, tower, boulder } = v.towerOrder;
    const byFrame = new Map();
    for (const [vn, rec] of fired) {
      if (!byFrame.has(vn)) byFrame.set(vn, []);
      byFrame.get(vn).push(rec);
    }
    const pairFrames = [];
    let pairs = 0;
    for (const [vn, list] of byFrame) {
      let any = false;
      list.forEach((r, i) => {
        if (r.kind !== 'towerHit') return;
        for (const [j, o] of list.entries()) {
          if (o === r || !(o.due > r.due)) continue;
          // `_drainTimers`: zegar z wiekszym `due` tej klatki odpala PO trafieniu wiezy (strażnik obserwatora).
          if (j < i) throw new Error(`${name}: zegar due ${o.due} przed trafieniem wiezy due ${r.due} w klatce ${vn}`);
          if (!(o.due <= vn)) throw new Error(`${name}: zegar due ${o.due} > klatka ${vn}`);
          pairs += 1;
          any = true;
        }
      });
      if (any) pairFrames.push([vn, list.map((r) => [r.due, r.ms, r.src, r.kind])]);
    }
    vecs.push({
      name, base: sc0.name, mode: 'realtime', ...(F === 16 ? {} : { wallFrameMs: F }), expect: v.expect,
      tower, boulder, pairs, pairFrames, events: v.events,
    });
    console.error(`${name}: ${v.expect.winner} tura ${v.expect.roundNo} wiez ${tower.length} kamieni ${boulder.length} par ${pairs} w klatkach ${pairFrames.length} zdarzen ${v.events.length} (${Date.now() - tS} ms)`);
  }
  if (hashed.size === 0) throw new Error('czesc bez przypadkow (WIRING_A_TOWER_ORDER_SHARD / _ONLY nic nie wybraly)');
  const shaT = hash.digest('hex');
  if (shaT !== EXPECTED_SHA256) throw new Error('straznik SHA-256 pinu: ' + shaT + ' != ' + EXPECTED_SHA256);
  write(vecs, shaT);
  process.exit(0);
}

const t0 = Date.now();
const vectors = [];
// R-RUSTPORT-P4-404 (K5EXEC-T3, D-404-3): wektory rozkazu ruchu `_performPlayerOrder` (`:18280-18353`) i
// `_firstStepTowardMoveDestination` (`:18478-18527`). Dwa tryby (pozostale pliki wektorow bez zmian):
// * `WIRING_A_MOVE_ORDER_VECTORS=1`: PELNE bitwy oblezenia (`MOVE_ORDER_SCENARIOS`, przewijanie albo czas rzeczywisty) z
//   doktryna `skirmish` czesci atakujacych (`sc.doctrine`), wiec `_executeSkirmishDoctrineStep` (`:18087-18124`) wydaje
//   rozkaz ruchu wykonywany tekstem pinu. Zapis: `move_order_vectors.json` (wejscie sceny, doktryna, `expect` jak
//   `vectors.json`, strumien zdarzen `events` C/R/K/D i slad rozkazow `orders`, patrz `runScenario`). Podzial na procesy:
//   `WIRING_A_MOVE_ORDER_SHARD=k/n` (wynik do `WIRING_A_OUT`), `WIRING_A_MOVE_ORDER_MERGE=plik1,...`.
// * `WIRING_A_MOVE_ORDER_STEPS=1`: przypadki jednego wywolania na scenie pinu z ustawionym stanem (pozycje, zajetosc,
//   doktryna, `lastAutoMoveFrom`, `formationRank`, blokada linii). Metody wykonawcze (`_doMove`, `_doAttack`,
//   `_executeGroupDoctrineStep`, `_refreshQueuedOrderVisuals`) sa zastapione zapisem decyzji (ruch NIE jest animowany:
//   callback `_doMove` wolany od razu, jak koniec kroku); decyzja, `route` i `lastAutoMoveFrom` po wywolaniu = tekst pinu.
//   Wejscia predykatow pinu zapisane w przypadku (`_passableForUnit` jako lista pol nieprzejezdnych sceny i rodzaju,
//   `occByKey`, `_compactAttackAllowsStep` i `_destAllowedByBlockade` dla kolumn `q-1..q+1`, `_adjacentEnemy`,
//   `_shouldAvoidAutoBacktrack`, bramka `steady` BFS). Zapis: `move_order_step_vectors.json`.
const BF_COLS_PIN = 68;
const BF_ROWS_PIN = 156;
{
  const l = show(SCENE).split('\n');
  if (!l[660].startsWith('const BF_COLS = 68;') || !l[661].startsWith('const BF_ROWS = 156;')) throw new Error('BF_COLS/BF_ROWS pinu');
}
const MO_W = ['Wojownik', 'miecznik'];
const MO_L = ['Łucznik', 'lucznik'];
const MO_K = ['Konnica', 'konnica'];
const MO_F = ['Falanga', 'falanga'];
const MO_S = ['Włócznik', 'wlocznik'];
const MO_T = ['Taran', 'obleznicza'];
const MO_C = ['Katapulta', 'obleznicza'];
const MOVE_ORDER_SCENARIOS = (() => {
  const S = 'skirmish';
  const lists = [
    // [nazwa, mode, seed, teren, built, world, atk, def, doktryna atk]
    ['mo_mur_piech3', 'skip', 401, 'Równina', ['mury'], null, [MO_W, MO_W, MO_W, MO_L], [MO_W, MO_L], [S, S, S, null]],
    ['mo_palisada_piech6', 'skip', 402, 'Równina', ['palisada'], null, [MO_W, MO_W, MO_W, MO_W, MO_W, MO_W, MO_L, MO_T], [MO_W, MO_W, MO_L], [S, S, S, S, S, S, null, null]],
    ['mo_mur_jazda_rzeka', 'skip', 403, 'Równina', ['mury'], { baza: 'Równina', las: false, rzeka: true }, [MO_K, MO_F, MO_C, MO_W], [MO_W, MO_F, MO_L], [S, S, null, S]],
    ['mo_las_mury_baszta', 'skip', 404, 'Las', ['mury', 'baszta'], { baza: 'Las', las: true, rzeka: false }, [MO_W, MO_W, MO_S, MO_L, MO_T], [MO_W, MO_L, MO_L], [S, S, S, null, null]],
    ['mo_wzg_palisada_mix', 'skip', 405, 'Wzgórza', ['palisada'], { baza: 'Wzgórza', las: false, rzeka: false }, [MO_W, MO_K, MO_W, MO_L, MO_C], [MO_S, MO_L, MO_L], [S, S, null, null, null]],
    ['mo_gory_mury_cytadela', 'skip', 406, 'Góry', ['mury', 'fort', 'baszta'], { baza: 'Góry', las: false, rzeka: false }, [MO_W, MO_W, MO_W, MO_W], [MO_S, MO_S, MO_L, MO_L], [S, S, S, S]],
    ['mo_mur_tlum8', 'skip', 407, 'Równina', ['mury'], null, [MO_W, MO_W, MO_W, MO_W, MO_W, MO_W, MO_W, MO_W], [MO_W, MO_W, MO_L, MO_L], [S, S, S, S, S, S, S, S]],
    ['mo_palisada_jazda4', 'skip', 408, 'Równina', ['palisada'], { baza: 'Równina', las: true, rzeka: false }, [MO_K, MO_K, MO_K, MO_K, MO_T], [MO_W, MO_S, MO_L], [S, S, S, S, null]],
    ['mo_rzeka_falangi', 'skip', 409, 'Równina', ['mury'], { baza: 'Równina', las: false, rzeka: true }, [MO_F, MO_F, MO_W, MO_W, MO_L, MO_L], [MO_W, MO_F, MO_L, MO_L], [S, S, S, null, null, null]],
    ['mo_las_palisada_wloczn', 'skip', 410, 'Las', ['palisada'], { baza: 'Las', las: true, rzeka: false }, [MO_S, MO_S, MO_S, MO_W, MO_T], [MO_W, MO_L], [S, S, S, S, null]],
    ['mo_mur_mieszane', 'skip', 411, 'Równina', ['mury'], null, [MO_W, MO_W, MO_W, MO_W, MO_L, MO_L], [MO_W, MO_L, MO_L], [S, null, S, null, null, null]],
    ['mo_wzg_mury_baszta_jazda', 'skip', 412, 'Wzgórza', ['mury', 'baszta'], { baza: 'Wzgórza', las: false, rzeka: false }, [MO_K, MO_K, MO_W, MO_W, MO_L, MO_T], [MO_W, MO_L, MO_L, MO_L], [S, S, S, S, null, null]],
    ['mo_palisada_slabi_obr', 'skip', 413, 'Równina', ['palisada'], null, [MO_W, MO_W, MO_W, MO_W, MO_W], [MO_L], [S, S, S, S, S]],
    ['mo_mur_tylko_jeden', 'skip', 414, 'Równina', ['mury'], null, [MO_W], [MO_W, MO_L], [S]],
    ['mo_rzeka_palisada_tlum', 'skip', 415, 'Równina', ['palisada'], { baza: 'Równina', las: false, rzeka: true }, [MO_W, MO_W, MO_W, MO_W, MO_W, MO_W, MO_K, MO_K], [MO_W, MO_W, MO_L, MO_L], [S, S, S, S, S, S, S, S]],
    ['mo_gory_palisada', 'skip', 416, 'Góry', ['palisada'], { baza: 'Góry', las: false, rzeka: false }, [MO_W, MO_W, MO_S, MO_S, MO_L, MO_C], [MO_W, MO_L, MO_L], [S, S, S, S, null, null]],
    ['mo_las_mury_tlum', 'skip', 417, 'Las', ['mury'], { baza: 'Las', las: true, rzeka: false }, [MO_W, MO_W, MO_W, MO_W, MO_W, MO_W, MO_T], [MO_W, MO_W, MO_W, MO_L], [S, S, S, S, S, S, null]],
    ['mo_mur_baszta_wloczn', 'skip', 418, 'Równina', ['mury', 'baszta'], null, [MO_S, MO_S, MO_W, MO_W, MO_K], [MO_S, MO_L, MO_L], [S, S, S, S, S]],
    ['mo_wzg_rzeka_mix', 'skip', 419, 'Wzgórza', ['mury'], { baza: 'Wzgórza', las: false, rzeka: true }, [MO_W, MO_W, MO_K, MO_F, MO_L, MO_L, MO_T], [MO_W, MO_F, MO_L], [S, S, S, S, null, null, null]],
    ['mo_palisada_przewaga', 'skip', 420, 'Równina', ['palisada'], { baza: 'Równina', las: true, rzeka: false }, [MO_W, MO_W, MO_W, MO_W, MO_W, MO_W, MO_W, MO_W, MO_W, MO_T], [MO_W, MO_L], [S, S, S, S, S, S, S, S, S, null]],
    ['mo_mur_cytadela_piech', 'skip', 421, 'Równina', ['mury', 'fort'], null, [MO_W, MO_W, MO_W, MO_L, MO_C], [MO_W, MO_S, MO_L, MO_L], [S, S, S, null, null]],
    ['mo_las_jazda_palisada', 'skip', 422, 'Las', ['palisada'], { baza: 'Las', las: true, rzeka: false }, [MO_K, MO_K, MO_W, MO_W], [MO_W, MO_L, MO_L], [S, S, S, S]],
    ['mo_mur_falanga_tlum', 'skip', 423, 'Równina', ['mury'], null, [MO_F, MO_F, MO_F, MO_W, MO_W, MO_W, MO_L], [MO_W, MO_W, MO_L], [S, S, S, S, S, S, null]],
    ['mo_gory_rzeka_palisada', 'skip', 424, 'Góry', ['palisada'], { baza: 'Góry', las: false, rzeka: true }, [MO_W, MO_W, MO_W, MO_K], [MO_W, MO_L], [S, S, S, S]],
  ];
  // Kazda bitwa w CZASIE RZECZYWISTYM (klatki 16 ms, etykiety obrazen `D`): chwile zdarzen i rozkazow porownywane
  // bezwzglednie. Przewijanie (`play()` + `skip()`) ma znany artefakt osi czasu tury 1 (PRE-SKIP-RAF,
  // R-RUSTPORT-P6-K5LOOP-FRAME-QUANT-Q1 §5), wiec 8 pierwszych bitew dodatkowo jako bliźniaki `_skip` (porownanie bez
  // chwil: decyzje, kolejnosc zdarzen, wynik).
  const rt = lists.map(([name, , seed, teren, built, world, atk, def, dAtk]) => ({
    name, mode: 'realtime', seed, teren, built, ...(world ? { world } : {}), atk, def, doctrine: { atk: dAtk },
  }));
  const sk = rt.slice(0, 8).map((sc) => ({ ...sc, name: sc.name + '_skip', mode: 'skip' }));
  return [...rt, ...sk];
})();
if (process.env.WIRING_A_MOVE_ORDER_VECTORS) {
  const tS = Date.now();
  const outDefault = join(here, 'p6_k5loop_wiring_a_pin_vectors', 'move_order_vectors.json');
  if (process.env.WIRING_A_MOVE_ORDER_MERGE) {
    const parts = process.env.WIRING_A_MOVE_ORDER_MERGE.split(',').map((p) => JSON.parse(readFileSync(p, 'utf8')));
    const byName = new Map();
    for (const p of parts) {
      if (p.pin !== PIN || p.pinSha256 !== EXPECTED_SHA256) throw new Error('czesc z innego pinu');
      for (const v of p.vectors) {
        if (byName.has(v.name)) throw new Error('powtorzony przypadek ' + v.name);
        byName.set(v.name, v);
      }
    }
    const merged = MOVE_ORDER_SCENARIOS.filter((c) => byName.has(c.name)).map((c) => byName.get(c.name));
    if (merged.length !== byName.size || merged.length !== MOVE_ORDER_SCENARIOS.length) throw new Error('niepelne czesci: ' + merged.length);
    const txtM = JSON.stringify({ pin: PIN, pinSha256: EXPECTED_SHA256, frameMs: 16, vectors: merged }) + '\n';
    writeFileSync(outDefault, txtM);
    console.log(createHash('md5').update(txtM).digest('hex') + '  ' + outDefault);
    process.exit(0);
  }
  const shard = process.env.WIRING_A_MOVE_ORDER_SHARD ? process.env.WIRING_A_MOVE_ORDER_SHARD.split('/').map(Number) : null;
  if (shard && !process.env.WIRING_A_OUT) throw new Error('WIRING_A_MOVE_ORDER_SHARD wymaga WIRING_A_OUT');
  const only = process.env.WIRING_A_MOVE_ORDER_ONLY ? new Set(process.env.WIRING_A_MOVE_ORDER_ONLY.split(',')) : null;
  const vecs = [];
  for (const [ci, sc] of MOVE_ORDER_SCENARIOS.entries()) {
    if (only && !only.has(sc.name)) continue;
    if (shard && ci % shard[1] !== shard[0]) continue;
    const v = runScenario({ ...sc, recordEvents: true, recordOrders: true });
    vecs.push(v);
    const kinds = {};
    for (const o of v.orders) {
      const k = o.kind + (o.route !== undefined ? (o.route ? '+route' : '+route-null') : '');
      kinds[k] = (kinds[k] ?? 0) + 1;
    }
    console.error(`${sc.name}: ${v.expect.winner} tura ${v.expect.roundNo} wylom ${v.expect.wallEverBreached} rzuty ${v.expect.rollsDrawn} zdarzen ${v.events.length} rozkazow ${v.orders.length} ${JSON.stringify(kinds)} (${Date.now() - tS} ms)`);
  }
  if (hashed.size === 0) throw new Error('czesc bez przypadkow');
  const shaM = hash.digest('hex');
  if (shaM !== EXPECTED_SHA256) throw new Error('straznik SHA-256 pinu: ' + shaM + ' != ' + EXPECTED_SHA256);
  const txt = JSON.stringify({ pin: PIN, pinSha256: shaM, frameMs: 16, vectors: vecs }) + '\n';
  const outPath = process.env.WIRING_A_OUT ?? outDefault;
  writeFileSync(outPath, txt);
  console.log(createHash('md5').update(txt).digest('hex') + '  ' + outPath);
  process.exit(0);
}
if (process.env.WIRING_A_MOVE_ORDER_STEPS) {
  const tS = Date.now();
  // Deterministyczny LCG generatora (nie `Math.random`, ktory jest atrapa dzwieku).
  let seed = 0x404404;
  const rnd = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const okey = (u) => (u.side === 'atk' ? 'atk:' : 'def:') + u.bu.id;
  const ck = (c, r) => `${c},${r}`;
  const BASES = [
    { name: 'st_mur', built: ['mury'], atk: [MO_W, MO_W, MO_W, MO_K, MO_L, MO_L, MO_F, MO_W], def: [MO_W, MO_S, MO_L, MO_L, MO_W, MO_W] },
    { name: 'st_rzeka', built: ['palisada'], world: { baza: 'Równina', las: false, rzeka: true }, atk: [MO_W, MO_K, MO_K, MO_L, MO_W, MO_W, MO_F, MO_W], def: [MO_W, MO_L, MO_L, MO_S, MO_W, MO_K] },
    { name: 'st_las', teren: 'Las', built: ['mury', 'baszta'], world: { baza: 'Las', las: true, rzeka: false }, atk: [MO_W, MO_W, MO_L, MO_K, MO_W, MO_S, MO_W, MO_L], def: [MO_W, MO_W, MO_L, MO_L, MO_K, MO_W] },
  ];
  const DOCS = [null, 'steady', 'skirmish', 'aggressive', 'defensive', 'manual'];
  const cases = [];
  const firstStep = [];
  const doctrineCases = [];
  const edgeCases = [];
  const edgeFirst = [];
  const impassableBy = {};
  const N_MOVE = Number(process.env.WIRING_A_MOVE_ORDER_N ?? 900);
  const N_FIRST = Number(process.env.WIRING_A_MOVE_ORDER_NF ?? 400);
  const N_DOC = Number(process.env.WIRING_A_MOVE_ORDER_ND ?? 120);
  for (const base of BASES) {
    modCache = new Map();
    rafQ = [];
    globalThis.__blowRandom = () => { throw new Error('rzut w przypadku kroku'); };
    const { BattleScene } = load(SCENE);
    const bs = new BattleScene({
      attacker: JSON.parse(JSON.stringify(A(base.atk))),
      defender: JSON.parse(JSON.stringify(D(base.def))),
      teren: base.teren ?? 'Równina', worldTerrain: base.world, data: { units, counters, terrainCombat },
      deploy: false, deployPlayerSide: 'atk', manualControlAllowed: false,
      siege: { defCiv: 'rzym', builtBuildingIds: base.built }, attackerCivBonusy: [], defenderCivBonusy: [],
      attackerEra: 1, defenderEra: 1,
    });
    const all = [...bs.atk, ...bs.def];
    // Zapis decyzji (bez wykonania): `_doMove` zapisuje krok i od razu wola callback (koniec kroku), `_doAttack` cel.
    let rec = null;
    bs._doMove = function (ru, c, r, cb) { rec.kind = 'move'; rec.step = [c, r]; if (cb) cb(); };
    bs._doAttack = function (a, d, cb) { rec.kind = 'attack'; rec.attack = okey(d); if (cb) cb(); };
    bs._executeGroupDoctrineStep = function (ru, meta, cb) { rec.kind = 'doctrine'; rec.meta = meta.doctrine; if (cb) cb(); return true; };
    bs._refreshQueuedOrderVisuals = function () {};
    const oRoute = bs._firstStepTowardMoveDestination;
    bs._firstStepTowardMoveDestination = function (...a) {
      const out = oRoute.apply(this, a);
      if (rec) { rec.route = out == null ? null : out.split(',').map(Number); rec.routeMax = a[3]; rec.routeAllow = typeof a[4] === 'function'; }
      return out;
    };
    // Poza plansza `terrainMap.at` = Plains (`battle-terrain.ts:781-783`), wiec `_passableForUnit` = true; test Rust
    // modeluje to tak samo (BFS sprawdza granice przed `_passableForUnit`, krok zachlanny idzie ku celowi w planszy).
    for (const u of all) {
      if (!bs._passableForUnit(u, -1, 0) || !bs._passableForUnit(u, 0, -1)
        || !bs._passableForUnit(u, BF_COLS_PIN, 0) || !bs._passableForUnit(u, 0, BF_ROWS_PIN)) {
        throw new Error('_passableForUnit poza plansza != true');
      }
    }
    // Pola nieprzejezdne (`_passableForUnit`) calej planszy dla pieszego i jezdnego (teren sceny przypadkow jest staly:
    // bez wylomu i bramy; `_moveCostForUnit` `:7436-7443` czyta tylko teren i `ru.mounted`), raz na scene.
    for (const mounted of [false, true]) {
      const u = all.find((x) => !!x.mounted === mounted);
      if (!u) throw new Error('brak jednostki mounted=' + mounted + ' w ' + base.name);
      const out = [];
      for (let c = 0; c < BF_COLS_PIN; c++) {
        for (let r = 0; r < BF_ROWS_PIN; r++) if (!bs._passableForUnit(u, c, r)) out.push([c, r]);
      }
      impassableBy[base.name + (mounted ? '|1' : '|0')] = out;
    }
    const wallCol = bs.siegeWallCol;
    const layout = () => {
      for (const u of all) { u.dead = false; u.fadingOut = false; u.routed = false; u.removed = false; }
      const used = new Set();
      const anchorC = ri(4, wallCol >= 0 ? Math.max(5, wallCol - 2) : 60);
      const anchorR = ri(20, 130);
      for (const u of all) {
        let ok = false;
        for (let k = 0; k < 400 && !ok; k++) {
          const c = anchorC + ri(-5, 5);
          const r = anchorR + ri(-5, 5);
          if (c < 0 || c >= BF_COLS_PIN || r < 0 || r >= BF_ROWS_PIN) continue;
          if (used.has(ck(c, r)) || !bs._passableForUnit(u, c, r)) continue;
          used.add(ck(c, r));
          u.q = c; u.r = r;
          ok = true;
        }
        if (!ok) return false;
      }
      // Flagi zywotnosci (czesc martwa / uciekajaca / znikajaca: filtr `_enemiesOf` i `firingTiles`).
      for (const u of all) {
        const x = rnd();
        if (x < 0.06) u.dead = true;
        else if (x < 0.1) u.routed = true;
        else if (x < 0.13) u.fadingOut = true;
      }
      bs.occByKey = new Map();
      for (const u of all) if (!u.dead && !(u.routed && rnd() < 0.5)) bs.occByKey.set(ck(u.q, u.r), u);
      return true;
    };
    const setDoctrine = (ru) => {
      ru.unitDoctrine = pick(DOCS);
      ru.groupId = rnd() < 0.35 ? pick(['g1', 'g2']) : null;
      bs._groupMeta = new Map();
      if (rnd() < 0.6) bs._groupMeta.set('g1', { doctrine: pick(DOCS.filter(Boolean)), autoPlay: rnd() < 0.7 });
      ru.formationRank = rnd() < 0.5 ? ri(0, 3) : undefined;
      for (const u of all) if (u !== ru) u.formationRank = rnd() < 0.5 ? ri(0, 3) : undefined;
      ru.lastAutoMoveFrom = rnd() < 0.4 ? undefined : { q: ru.q + pick([-1, 0, 1]), r: ru.r + pick([-1, 0, 1]) };
      if (ru.rangedBase) ru.ammoLeft = pick([0, 3, 10]);
      ru.shootingEnabled = rnd() >= 0.15;
      bs._generalSettings.blockadeActive = rnd() < 0.25;
      bs._generalSettings.blockadeCol = bs._generalSettings.blockadeActive ? ru.q + ri(-2, 2) : null;
    };
    const snapshot = (ru) => {
      const enemies = (ru.side === 'atk' ? bs.def : bs.atk).map((e) => ({ id: okey(e), q: e.q, r: e.r, dead: !!e.dead, fadingOut: !!e.fadingOut, routed: !!e.routed }));
      const occ = [...bs.occByKey.keys()].map((k) => k.split(',').map(Number));
      const cols = [ru.q - 1, ru.q, ru.q + 1];
      const adj = bs._adjacentEnemy(ru);
      const meta = bs._effectiveMetaForUnit(ru);
      return {
        base: base.name, unit: okey(ru), side: ru.side, mounted: !!ru.mounted, pos: [ru.q, ru.r],
        unitDoctrine: ru.unitDoctrine ?? null, groupId: ru.groupId ?? null,
        groupMeta: [...bs._groupMeta.entries()].map(([k, m]) => [k, m.doctrine, m.autoPlay]),
        lastAutoMoveFrom: ru.lastAutoMoveFrom ? [ru.lastAutoMoveFrom.q, ru.lastAutoMoveFrom.r] : null,
        rangedBase: !!ru.rangedBase, canShoot: !!(ru.rangedBase && ru.ammoLeft > 0), shootingEnabled: ru.shootingEnabled !== false,
        range: ru.range,
        enemies, occ,
        compact: cols.map((c) => bs._compactAttackAllowsStep(ru, c)),
        blockade: cols.map((c) => bs._destAllowedByBlockade(ru, c)),
        adjacent: adj ? (ru.side === 'atk' ? bs.def : bs.atk).indexOf(adj) : null,
        avoidBacktrack: bs._shouldAvoidAutoBacktrack(ru),
        bfsSteady: bs._isUnitDoctrineAuto(ru) && meta.doctrine === 'steady',
        doctrineAuto: bs._isUnitDoctrineAuto(ru),
        metaDoctrine: meta.doctrine,
      };
    };
    const live = () => all.filter((u) => !u.dead && !u.fadingOut && bs.occByKey.get(ck(u.q, u.r)) === u);
    const per = Math.ceil(N_MOVE / BASES.length);
    let made = 0;
    let guard = 0;
    while (made < per && guard++ < per * 20) {
      if (!layout()) continue;
      const pool = live();
      if (pool.length === 0) continue;
      const ru = pick(pool);
      setDoctrine(ru);
      // Cel: pozycja (rzadko), pole w oknie, przekatna, daleko; czesc celow na zajetym albo nieprzejezdnym polu.
      const x = rnd();
      let tc;
      let tr;
      if (x < 0.05) { tc = ru.q; tr = ru.r; }
      else if (x < 0.6) { tc = ru.q + ri(-6, 6); tr = ru.r + ri(-6, 6); }
      else if (x < 0.85) { tc = ru.q + pick([-1, 1]) * ri(1, 3); tr = ru.r + pick([-1, 1]) * ri(1, 3); }
      else { tc = ru.q + ri(-25, 25); tr = ru.r + ri(-25, 25); }
      tc = Math.max(0, Math.min(BF_COLS_PIN - 1, tc));
      tr = Math.max(0, Math.min(BF_ROWS_PIN - 1, tr));
      // Blokada drogi zachlannej: inna jednostka na polach (q+dc, r+dr), (q+dc, r), (q, r+dr).
      if (rnd() < 0.55) {
        const dc = Math.sign(tc - ru.q);
        const dr = Math.sign(tr - ru.r);
        const want = [[ru.q + dc, ru.r + dr], [ru.q + dc, ru.r], [ru.q, ru.r + dr]].filter(([c, r]) => !(c === ru.q && r === ru.r));
        const others = all.filter((u) => u !== ru);
        for (const [c, r] of want) {
          if (rnd() < 0.75 && !bs.occByKey.has(ck(c, r)) && c >= 0 && c < BF_COLS_PIN && r >= 0 && r < BF_ROWS_PIN) {
            const b = pick(others);
            if (bs.occByKey.get(ck(b.q, b.r)) === b) bs.occByKey.delete(ck(b.q, b.r));
            b.q = c; b.r = r; b.dead = false; b.fadingOut = false; b.routed = false;
            bs.occByKey.set(ck(c, r), b);
          }
        }
      }
      // Mur poza oknem nie jest zapisany: przypadek tylko w polu okna 81x81 (cel i BFS w promieniu < 40).
      const snap = snapshot(ru);
      rec = { kind: 'done', step: null, attack: null };
      ru.playerOrder = { type: 'move', col: tc, row: tr };
      let doneCalls = 0;
      const ret = bs._performPlayerOrder(ru, () => { doneCalls += 1; });
      cases.push({
        ...snap, order: 'move', target: [tc, tr],
        expect: {
          ret, doneCalls, kind: rec.kind, step: rec.step, attack: rec.attack,
          ...(rec.route !== undefined ? { route: rec.route, routeMax: rec.routeMax, routeAllow: rec.routeAllow } : {}),
          orderAfter: ru.playerOrder.type,
          lastAutoMoveFrom: ru.lastAutoMoveFrom ? [ru.lastAutoMoveFrom.q, ru.lastAutoMoveFrom.r] : null,
        },
      });
      rec = null;
      made += 1;
    }
    // `_firstStepTowardMoveDestination` wolane wprost: limit odwiedzin i `allowFirstStep` (zbior zakazanych pierwszych pol).
    const perF = Math.ceil(N_FIRST / BASES.length);
    made = 0;
    guard = 0;
    while (made < perF && guard++ < perF * 20) {
      if (!layout()) continue;
      const pool = live();
      if (pool.length === 0) continue;
      const ru = pick(pool);
      setDoctrine(ru);
      const tc = Math.max(0, Math.min(BF_COLS_PIN - 1, ru.q + ri(-12, 12)));
      const tr = Math.max(0, Math.min(BF_ROWS_PIN - 1, ru.r + ri(-12, 12)));
      const maxVisited = pick([1024, 1024, 1, 2, 3, 5, 10, 25, 60, 200]);
      const banned = rnd() < 0.5
        ? [[ru.q, ru.r - 1], [ru.q + 1, ru.r], [ru.q, ru.r + 1], [ru.q - 1, ru.r]].filter(() => rnd() < 0.5)
        : null;
      const bannedSet = banned ? new Set(banned.map(([c, r]) => ck(c, r))) : null;
      const snap = snapshot(ru);
      const out = oRoute.call(bs, ru, tc, tr, maxVisited, bannedSet ? (c, r) => !bannedSet.has(ck(c, r)) : undefined);
      firstStep.push({ ...snap, target: [tc, tr], maxVisited, banned, expect: out == null ? null : out.split(',').map(Number) });
      made += 1;
    }
    // `hold` / `none` (bez oblezenia recznego `_performSiegeManualOrder`: `hold` albo strona `def`, `:18282-18296`).
    const perD = Math.ceil(N_DOC / BASES.length);
    made = 0;
    guard = 0;
    while (made < perD && guard++ < perD * 20) {
      if (!layout()) continue;
      const pool = live();
      if (pool.length === 0) continue;
      const ru = pick(pool);
      setDoctrine(ru);
      const type = rnd() < 0.3 ? 'hold' : 'none';
      if (type === 'none' && ru.side === 'atk' && wallCol >= 0) continue;
      const snap = snapshot(ru);
      rec = { kind: 'done', step: null, attack: null };
      ru.playerOrder = { type };
      let doneCalls = 0;
      const ret = bs._performPlayerOrder(ru, () => { doneCalls += 1; });
      doctrineCases.push({ ...snap, order: type, wallCol, expect: { ret, doneCalls, kind: rec.kind, meta: rec.meta ?? null } });
      rec = null;
      made += 1;
    }
    // N-E1 (obrona, runda 1): przypadki przy KRAWEDZI planszy (kolumna 0, wiersz 0, `BF_COLS-1`, `BF_ROWS-1`). Pin:
    // `_passableForUnit` poza plansza = true, wiec o kroku BFS przy krawedzi decyduje WYLACZNIE test granic `:18509`.
    // Osobne ziarno LCG (stan glownego ziarna zachowany): przypadki z okna powyzej sa bajt w bajt jak przed dopiskiem,
    // przypadki krawedzi doklejane na koniec `cases` / `firstStep` (pole `edge`).
    {
      const savedSeed = seed;
      seed = (0xED6E0000 + BASES.indexOf(base)) >>> 0;
      const EDGES = ['c0', 'cMax', 'r0', 'rMax'];
      // Scena pinu ma ogrodzenie strefy gry (`_fencePlayableZone` `:4004-4013`: poza `PLAY_COL0..PLAY_COL1` x
      // `PLAY_ROW0..PLAY_ROW1` = River), wiec w KAZDYM osiagalnym stanie bitwy BFS zatrzymuje sie na ogrodzeniu
      // i nie dochodzi do krawedzi planszy. Dla kontraktu czystej funkcji (test granic `:18509` przy `_passableForUnit`
      // poza plansza = true) przypadki krawedzi licza sie na scenie z ZDJETYM ogrodzeniem (River poza strefa -> Plains;
      // Wall/Gate bez zmian), zapisanej jako osobna plansza `<scena>~bez-ogrodzenia`; kafle przywracane po przypadkach.
      const B_PLAINS = 0; // `battle-terrain.ts:38`
      const B_RIVER = 3; // `battle-terrain.ts:41`
      const tilesT = bs.terrainMap.tiles;
      const tilesSaved = Array.from(tilesT);
      let unfenced = 0;
      for (let c = 0; c < BF_COLS_PIN; c++) {
        for (let r = 0; r < BF_ROWS_PIN; r++) {
          const inPlay = c >= 10 && c <= 57 && r >= 23 && r <= 132; // PLAY_COL0..PLAY_COL1 x PLAY_ROW0..PLAY_ROW1 (`:667-670`)
          if (!inPlay && tilesT[r * BF_COLS_PIN + c] === B_RIVER) { tilesT[r * BF_COLS_PIN + c] = B_PLAINS; unfenced += 1; }
        }
      }
      if (unfenced < 4000 || bs._passableForUnit(all[0], 0, 0) !== true) throw new Error('zdjecie ogrodzenia: ' + unfenced);
      const edgeBase = base.name + '~bez-ogrodzenia';
      for (const mounted of [false, true]) {
        const u = all.find((x) => !!x.mounted === mounted);
        const out = [];
        for (let c = 0; c < BF_COLS_PIN; c++) {
          for (let r = 0; r < BF_ROWS_PIN; r++) if (!bs._passableForUnit(u, c, r)) out.push([c, r]);
        }
        impassableBy[edgeBase + (mounted ? '|1' : '|0')] = out;
      }
      const edgeLayout = (edge) => {
        for (const u of all) { u.dead = false; u.fadingOut = false; u.routed = false; u.removed = false; }
        const used = new Set();
        const anchorC = edge === 'c0' ? 0 : edge === 'cMax' ? BF_COLS_PIN - 1 : ri(4, BF_COLS_PIN - 5);
        const anchorR = edge === 'r0' ? 0 : edge === 'rMax' ? BF_ROWS_PIN - 1 : ri(20, 130);
        for (const u of all) {
          let ok = false;
          for (let k = 0; k < 400 && !ok; k++) {
            const c = anchorC + ri(-4, 4);
            const r = anchorR + ri(-4, 4);
            if (c < 0 || c >= BF_COLS_PIN || r < 0 || r >= BF_ROWS_PIN) continue;
            if (used.has(ck(c, r)) || !bs._passableForUnit(u, c, r)) continue;
            used.add(ck(c, r));
            u.q = c; u.r = r;
            ok = true;
          }
          if (!ok) return null;
        }
        for (const u of all) {
          const x = rnd();
          if (x < 0.04) u.dead = true;
          else if (x < 0.07) u.routed = true;
        }
        bs.occByKey = new Map();
        for (const u of all) if (!u.dead && !(u.routed && rnd() < 0.5)) bs.occByKey.set(ck(u.q, u.r), u);
        // Jednostka wykonujaca: zywa, przeniesiona NA linie krawedzi (pole wolne i przejezdne), jesli to mozliwe.
        const pool = live();
        if (pool.length === 0) return null;
        const ru = pick(pool);
        const onEdge = (c, r) => (edge === 'c0' ? c === 0 : edge === 'cMax' ? c === BF_COLS_PIN - 1 : edge === 'r0' ? r === 0 : r === BF_ROWS_PIN - 1);
        if (!onEdge(ru.q, ru.r)) {
          const c = edge === 'c0' ? 0 : edge === 'cMax' ? BF_COLS_PIN - 1 : ru.q;
          const r = edge === 'r0' ? 0 : edge === 'rMax' ? BF_ROWS_PIN - 1 : ru.r;
          if (!bs.occByKey.has(ck(c, r)) && bs._passableForUnit(ru, c, r)) {
            bs.occByKey.delete(ck(ru.q, ru.r));
            ru.q = c; ru.r = r;
            bs.occByKey.set(ck(c, r), ru);
          }
        }
        return ru;
      };
      // Cel wzdluz krawedzi (2..8 pol) albo w glab planszy; zablokowane pola drogi zachlannej (wymusza BFS).
      const edgeTarget = (ru, edge) => {
        let tc;
        let tr;
        if (rnd() < 0.7) {
          if (edge === 'c0' || edge === 'cMax') { tc = ru.q + ri(-1, 1); tr = ru.r + pick([-1, 1]) * ri(2, 8); }
          else { tr = ru.r + ri(-1, 1); tc = ru.q + pick([-1, 1]) * ri(2, 8); }
        } else { tc = ru.q + ri(-8, 8); tr = ru.r + ri(-8, 8); }
        tc = Math.max(0, Math.min(BF_COLS_PIN - 1, tc));
        tr = Math.max(0, Math.min(BF_ROWS_PIN - 1, tr));
        return [tc, tr];
      };
      const blockGreedy = (ru, tc, tr) => {
        const dc = Math.sign(tc - ru.q);
        const dr = Math.sign(tr - ru.r);
        const want = [[ru.q + dc, ru.r + dr], [ru.q + dc, ru.r], [ru.q, ru.r + dr]].filter(([c, r]) => !(c === ru.q && r === ru.r));
        const others = all.filter((u) => u !== ru);
        for (const [c, r] of want) {
          if (rnd() < 0.85 && !bs.occByKey.has(ck(c, r)) && c >= 0 && c < BF_COLS_PIN && r >= 0 && r < BF_ROWS_PIN) {
            const b = pick(others);
            if (bs.occByKey.get(ck(b.q, b.r)) === b) bs.occByKey.delete(ck(b.q, b.r));
            b.q = c; b.r = r; b.dead = false; b.fadingOut = false; b.routed = false;
            bs.occByKey.set(ck(c, r), b);
          }
        }
      };
      const perE = Number(process.env.WIRING_A_MOVE_ORDER_NE ?? 80);
      made = 0;
      guard = 0;
      while (made < perE && guard++ < perE * 20) {
        const edge = EDGES[made % EDGES.length];
        const ru = edgeLayout(edge);
        if (!ru) continue;
        setDoctrine(ru);
        const [tc, tr] = edgeTarget(ru, edge);
        if (rnd() < 0.8) blockGreedy(ru, tc, tr);
        const snap = snapshot(ru);
        rec = { kind: 'done', step: null, attack: null };
        ru.playerOrder = { type: 'move', col: tc, row: tr };
        let doneCalls = 0;
        const ret = bs._performPlayerOrder(ru, () => { doneCalls += 1; });
        edgeCases.push({
          ...snap, base: edgeBase, order: 'move', target: [tc, tr], edge,
          expect: {
            ret, doneCalls, kind: rec.kind, step: rec.step, attack: rec.attack,
            ...(rec.route !== undefined ? { route: rec.route, routeMax: rec.routeMax, routeAllow: rec.routeAllow } : {}),
            orderAfter: ru.playerOrder.type,
            lastAutoMoveFrom: ru.lastAutoMoveFrom ? [ru.lastAutoMoveFrom.q, ru.lastAutoMoveFrom.r] : null,
          },
        });
        rec = null;
        made += 1;
      }
      const perEF = Number(process.env.WIRING_A_MOVE_ORDER_NEF ?? 80);
      made = 0;
      guard = 0;
      while (made < perEF && guard++ < perEF * 20) {
        const edge = EDGES[made % EDGES.length];
        const ru = edgeLayout(edge);
        if (!ru) continue;
        setDoctrine(ru);
        const [tc, tr] = edgeTarget(ru, edge);
        if (rnd() < 0.8) blockGreedy(ru, tc, tr);
        const maxVisited = pick([1024, 1024, 1024, 2, 3, 5, 10, 25, 60, 200]);
        const banned = rnd() < 0.4
          ? [[ru.q, ru.r - 1], [ru.q + 1, ru.r], [ru.q, ru.r + 1], [ru.q - 1, ru.r]].filter(() => rnd() < 0.5)
          : null;
        const bannedSet = banned ? new Set(banned.map(([c, r]) => ck(c, r))) : null;
        const snap = snapshot(ru);
        const out = oRoute.call(bs, ru, tc, tr, maxVisited, bannedSet ? (c, r) => !bannedSet.has(ck(c, r)) : undefined);
        edgeFirst.push({ ...snap, base: edgeBase, target: [tc, tr], maxVisited, banned, edge, expect: out == null ? null : out.split(',').map(Number) });
        made += 1;
      }
      for (let i = 0; i < tilesSaved.length; i++) tilesT[i] = tilesSaved[i];
      console.error(`${base.name} krawedz: ruch ${edgeCases.length} pierwszy-krok ${edgeFirst.length}`);
      seed = savedSeed;
    }
    console.error(`${base.name}: ruch ${cases.length} pierwszy-krok ${firstStep.length} hold/none ${doctrineCases.length} (${Date.now() - tS} ms)`);
  }
  const shaS = hash.digest('hex');
  if (shaS !== EXPECTED_SHA256) throw new Error('straznik SHA-256 pinu: ' + shaS + ' != ' + EXPECTED_SHA256);
  const txt = JSON.stringify({ pin: PIN, pinSha256: shaS, bfCols: BF_COLS_PIN, bfRows: BF_ROWS_PIN, impassable: impassableBy, cases: [...cases, ...edgeCases], firstStep: [...firstStep, ...edgeFirst], doctrineCases }) + '\n';
  const outPath = process.env.WIRING_A_OUT ?? join(here, 'p6_k5loop_wiring_a_pin_vectors', 'move_order_step_vectors.json');
  writeFileSync(outPath, txt);
  console.log(createHash('md5').update(txt).digest('hex') + '  ' + outPath);
  process.exit(0);
}

// R-RUSTPORT-P4-415 (K5EXEC-T4, D-415-3): wektory KROKU rozkazow `attack` / `attackMove` `_performPlayerOrder`
// (`:18353-18428`), `_attackMovePath` (`:18535-18566`) i `_firstStepOnAttackMovePath` (`:18568-18572`).
// `WIRING_A_ATTACK_ORDER_STEPS=1`: przypadki jednego wywolania na scenie pinu z ustawionym stanem (jak
// `WIRING_A_MOVE_ORDER_STEPS`). Metody wykonawcze (`_doMove`, `_doAttack`, `_refreshQueuedOrderVisuals`) = zapis decyzji
// (callback `_doMove` wolany od razu). Wejscia predykatow pinu zapisane w przypadku: `_passableForUnit` (lista pol
// nieprzejezdnych sceny i rodzaju), `occByKey` z klasa zajmujacego (`self` / `player` = `_isPlayerSide` / `other`),
// `_destAllowedByBlockade` i `_compactAttackAllowsStep` dla kazdej kolumny planszy, `_priorityScore` kazdego wroga,
// `_shouldAvoidAutoBacktrack`; `_canStrikeTargetFrom` = DZIENNIK zapytan pinu w tym wywolaniu (pole, wrog, wynik),
// po `_performSiegeManualOrder` (jego wynik zapisany: `siegeManual`). Slady: wywolania `_attackMovePath` i
// `_firstStepAlongPathToAttack` (argumenty i wynik). Scena `~otwarta` (caly teren = Plains, bez zajetosci) dla limitu
// `queue.length < BF_COLS * BF_ROWS` (`:18546`). Tekst pinu bez zmian (straznik SHA-256 nietkniety).
// Zapis: `attack_order_step_vectors.json` (albo `WIRING_A_OUT`).
if (process.env.WIRING_A_ATTACK_ORDER_STEPS) {
  const tS = Date.now();
  let seed = 0x415415;
  const rnd = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const ck = (c, r) => `${c},${r}`;
  const BASES = [
    { name: 'st_mur', built: ['mury'], atk: [MO_W, MO_W, MO_W, MO_K, MO_L, MO_L, MO_F, MO_W], def: [MO_W, MO_S, MO_L, MO_L, MO_W, MO_W] },
    { name: 'st_rzeka', built: ['palisada'], world: { baza: 'Równina', las: false, rzeka: true }, atk: [MO_W, MO_K, MO_K, MO_L, MO_W, MO_W, MO_F, MO_W], def: [MO_W, MO_L, MO_L, MO_S, MO_W, MO_K] },
    { name: 'st_las', teren: 'Las', built: ['mury', 'baszta'], world: { baza: 'Las', las: true, rzeka: false }, atk: [MO_W, MO_W, MO_L, MO_K, MO_W, MO_S, MO_W, MO_L], def: [MO_W, MO_W, MO_L, MO_L, MO_K, MO_W] },
  ];
  const DOCS = [null, 'steady', 'skirmish', 'aggressive', 'defensive', 'manual'];
  const N_AM = Number(process.env.WIRING_A_ATTACK_ORDER_NAM ?? 600);
  const N_AT = Number(process.env.WIRING_A_ATTACK_ORDER_NAT ?? 600);
  const N_AMB = Number(process.env.WIRING_A_ATTACK_ORDER_NAMB ?? 450);
  const N_PATH = Number(process.env.WIRING_A_ATTACK_ORDER_NP ?? 300);
  const N_OPEN = Number(process.env.WIRING_A_ATTACK_ORDER_NO ?? 12);
  const orders = [];
  const paths = [];
  const impassableBy = {};
  for (const base of BASES) {
    modCache = new Map();
    rafQ = [];
    globalThis.__blowRandom = () => { throw new Error('rzut w przypadku kroku'); };
    const { BattleScene } = load(SCENE);
    const bs = new BattleScene({
      attacker: JSON.parse(JSON.stringify(A(base.atk))),
      defender: JSON.parse(JSON.stringify(D(base.def))),
      teren: base.teren ?? 'Równina', worldTerrain: base.world, data: { units, counters, terrainCombat },
      deploy: false, deployPlayerSide: 'atk', manualControlAllowed: false,
      siege: { defCiv: 'rzym', builtBuildingIds: base.built }, attackerCivBonusy: [], defenderCivBonusy: [],
      attackerEra: 1, defenderEra: 1,
    });
    const all = [...bs.atk, ...bs.def];
    const wallCol0 = bs.siegeWallCol;
    let rec = null;
    let curRu = null;
    const rosterOf = (ru) => (ru.side === 'atk' ? bs.def : bs.atk);
    const eIdx = (ru, e) => { const i = rosterOf(ru).indexOf(e); if (i < 0) throw new Error('cel spoza rosteru wroga'); return i; };
    bs._doMove = function (ru, c, r, cb) { if (rec.kind !== 'done') throw new Error('drugie wykonanie'); rec.kind = 'move'; rec.step = [c, r]; if (cb) cb(); };
    bs._doAttack = function (a, d, cb) { if (rec.kind !== 'done') throw new Error('drugie wykonanie'); rec.kind = 'attack'; rec.attack = eIdx(a, d); if (cb) cb(); };
    bs._refreshQueuedOrderVisuals = function () {};
    const oStrike = bs._canStrikeTargetFrom;
    bs._canStrikeTargetFrom = function (ru, col, row, target) {
      const out = oStrike.call(this, ru, col, row, target);
      if (rec && rec.logging && ru === curRu) rec.strike.push([col, row, eIdx(ru, target), out]);
      return out;
    };
    const oPath = bs._attackMovePath;
    bs._attackMovePath = function (ru, tc, tr, allow) {
      const out = oPath.call(this, ru, tc, tr, allow);
      if (rec && rec.logging) rec.amPath.push({ allow, target: [tc, tr], out: out == null ? null : out.map((k) => k.split(',').map(Number)) });
      return out;
    };
    const oFirst = bs._firstStepAlongPathToAttack;
    bs._firstStepAlongPathToAttack = function (ru, allow, target) {
      const out = oFirst.call(this, ru, allow, target);
      if (rec && rec.logging) rec.fsCalls.push({ allow: typeof allow === 'function', target: target ? eIdx(ru, target) : null, out: out == null ? null : out.split(',').map(Number) });
      return out;
    };
    const oSiege = bs._performSiegeManualOrder;
    bs._performSiegeManualOrder = function (...a) {
      const out = oSiege.apply(this, a);
      if (rec) {
        rec.siegeManual = out;
        if (!out && rec.kind !== 'done') throw new Error('oblezenie reczne wykonalo krok i zwrocilo false');
        rec.logging = true;
      }
      return out;
    };
    for (const u of all) {
      if (!bs._passableForUnit(u, -1, 0) || !bs._passableForUnit(u, BF_COLS_PIN, 0)) throw new Error('_passableForUnit poza plansza != true');
    }
    const recordImpassable = (name) => {
      for (const mounted of [false, true]) {
        const u = all.find((x) => !!x.mounted === mounted);
        if (!u) throw new Error('brak jednostki mounted=' + mounted + ' w ' + base.name);
        const out = [];
        for (let c = 0; c < BF_COLS_PIN; c++) {
          for (let r = 0; r < BF_ROWS_PIN; r++) if (!bs._passableForUnit(u, c, r)) out.push([c, r]);
        }
        impassableBy[name + (mounted ? '|1' : '|0')] = out;
      }
    };
    recordImpassable(base.name);
    const layout = () => {
      for (const u of all) { u.dead = false; u.fadingOut = false; u.routed = false; u.removed = false; }
      const used = new Set();
      const anchorC = ri(4, wallCol0 >= 0 ? Math.max(5, wallCol0 - 2) : 60);
      const anchorR = ri(20, 130);
      for (const u of all) {
        let ok = false;
        for (let k = 0; k < 400 && !ok; k++) {
          const c = anchorC + ri(-6, 6);
          const r = anchorR + ri(-6, 6);
          if (c < 0 || c >= BF_COLS_PIN || r < 0 || r >= BF_ROWS_PIN) continue;
          if (used.has(ck(c, r)) || !bs._passableForUnit(u, c, r)) continue;
          used.add(ck(c, r));
          u.q = c; u.r = r;
          ok = true;
        }
        if (!ok) return false;
      }
      for (const u of all) {
        const x = rnd();
        if (x < 0.06) u.dead = true;
        else if (x < 0.1) u.routed = true;
        else if (x < 0.13) u.fadingOut = true;
        else if (x < 0.16) u.removed = true;
      }
      bs.occByKey = new Map();
      for (const u of all) if (!u.dead && !(u.routed && rnd() < 0.5)) bs.occByKey.set(ck(u.q, u.r), u);
      return true;
    };
    const setState = (ru, forceBlock = false) => {
      ru.unitDoctrine = pick(DOCS);
      ru.groupId = rnd() < 0.35 ? pick(['g1', 'g2']) : null;
      bs._groupMeta = new Map();
      if (rnd() < 0.6) bs._groupMeta.set('g1', { doctrine: pick(DOCS.filter(Boolean)), autoPlay: rnd() < 0.7 });
      ru.formationRank = rnd() < 0.5 ? ri(0, 3) : undefined;
      for (const u of all) if (u !== ru) u.formationRank = rnd() < 0.5 ? ri(0, 3) : undefined;
      ru.lastAutoMoveFrom = rnd() < 0.3 ? undefined : { q: ru.q + pick([-1, 0, 1]), r: ru.r + pick([-1, 0, 1]) };
      for (const u of all) if (u.rangedBase) u.ammoLeft = pick([0, 3, 10]);
      bs._generalSettings.blockadeActive = forceBlock || rnd() < 0.25;
      bs._generalSettings.blockadeCol = bs._generalSettings.blockadeActive ? ru.q + (forceBlock ? pick([-1, 0, 0, 1]) : ri(-2, 2)) : null;
      bs._deployPlayerSideOpt = rnd() < 0.5 ? 'atk' : 'def';
      // Polowa przypadkow bez muru (bramka `_performSiegeManualOrder` `:18436` zamknieta), reszta z murem sceny.
      bs.siegeWallCol = rnd() < 0.5 ? -1 : wallCol0;
      bs.wallEverBreached = rnd() < 0.3;
    };
    const snapshot = (ru, boardName) => {
      const enemies = rosterOf(ru).map((e) => ({ id: e.bu.id, q: e.q, r: e.r, dead: !!e.dead, fadingOut: !!e.fadingOut, routed: !!e.routed, removed: !!e.removed }));
      const occ = [...bs.occByKey.entries()].map(([k, u]) => [...k.split(',').map(Number), u === ru ? 'self' : (bs._isPlayerSide(u.side) ? 'player' : 'other')]);
      const cols = [];
      for (let c = 0; c < BF_COLS_PIN; c++) cols.push(c);
      return {
        base: boardName, unit: (ru.side === 'atk' ? 'atk:' : 'def:') + ru.bu.id, side: ru.side, mounted: !!ru.mounted, pos: [ru.q, ru.r],
        wallCol: bs.siegeWallCol, playerSide: bs._deployPlayerSideOpt,
        lastAutoMoveFrom: ru.lastAutoMoveFrom ? [ru.lastAutoMoveFrom.q, ru.lastAutoMoveFrom.r] : null,
        enemies, occ,
        compact: cols.map((c) => bs._compactAttackAllowsStep(ru, c)),
        blockade: cols.map((c) => bs._destAllowedByBlockade(ru, c)),
        priority: rosterOf(ru).map((e) => bs._priorityScore(ru, e)),
        avoidBacktrack: bs._shouldAvoidAutoBacktrack(ru),
      };
    };
    const live = () => all.filter((u) => !u.dead && !u.fadingOut && !u.removed && bs.occByKey.get(ck(u.q, u.r)) === u);
    const runOrder = (ru, order, boardName) => {
      const snap = snapshot(ru, boardName);
      rec = { kind: 'done', step: null, attack: null, logging: false, siegeManual: null, strike: [], amPath: [], fsCalls: [] };
      curRu = ru;
      ru.playerOrder = order;
      let doneCalls = 0;
      const ret = bs._performPlayerOrder(ru, () => { doneCalls += 1; });
      const out = {
        ...snap,
        order: order.type,
        ...(order.type === 'attack' ? { targetId: order.targetId } : { target: [order.col, order.row] }),
        strike: rec.strike,
        expect: {
          ret, doneCalls, siegeManual: rec.siegeManual, kind: rec.kind, step: rec.step, attack: rec.attack,
          orderAfter: ru.playerOrder.type,
          lastAutoMoveFrom: ru.lastAutoMoveFrom ? [ru.lastAutoMoveFrom.q, ru.lastAutoMoveFrom.r] : null,
          amPath: rec.amPath, fsCalls: rec.fsCalls,
        },
      };
      rec = null;
      curRu = null;
      return out;
    };
    const blockGreedy = (ru, tc, tr) => {
      // Inna jednostka (czesto wrog) na polach drogi ku celowi: zagrozenie na trasie / obejscie.
      const dc = Math.sign(tc - ru.q);
      const dr = Math.sign(tr - ru.r);
      const want = [[ru.q + dc, ru.r], [ru.q, ru.r + dr], [ru.q + 2 * dc, ru.r], [ru.q + dc, ru.r + dr]].filter(([c, r]) => !(c === ru.q && r === ru.r));
      const others = all.filter((u) => u !== ru);
      for (const [c, r] of want) {
        if (rnd() < 0.5 && !bs.occByKey.has(ck(c, r)) && c >= 0 && c < BF_COLS_PIN && r >= 0 && r < BF_ROWS_PIN) {
          const b = pick(others);
          if (bs.occByKey.get(ck(b.q, b.r)) === b) bs.occByKey.delete(ck(b.q, b.r));
          b.q = c; b.r = r; b.dead = false; b.fadingOut = false; b.routed = false; b.removed = false;
          bs.occByKey.set(ck(c, r), b);
        }
      }
    };
    const pickTarget = (ru) => {
      const x = rnd();
      let tc;
      let tr;
      if (x < 0.07) { tc = ru.q; tr = ru.r; }
      else if (x < 0.6) { tc = ru.q + ri(-8, 8); tr = ru.r + ri(-8, 8); }
      else if (x < 0.85) { tc = ru.q + pick([-1, 1]) * ri(1, 3); tr = ru.r + pick([-1, 1]) * ri(1, 3); }
      else { tc = ru.q + ri(-25, 25); tr = ru.r + ri(-25, 25); }
      return [Math.max(0, Math.min(BF_COLS_PIN - 1, tc)), Math.max(0, Math.min(BF_ROWS_PIN - 1, tr))];
    };
    // attackMove
    const per = Math.ceil(N_AM / BASES.length);
    let made = 0;
    let guard = 0;
    while (made < per && guard++ < per * 20) {
      if (!layout()) continue;
      const pool = live();
      if (pool.length === 0) continue;
      const ru = pick(pool);
      setState(ru);
      const [tc, tr] = pickTarget(ru);
      if (rnd() < 0.5) blockGreedy(ru, tc, tr);
      orders.push(runOrder(ru, { type: 'attackMove', col: tc, row: tr }, base.name));
      made += 1;
    }
    // attackMove z aktywna blokada linii przy kolumnie `ru` (`_destAllowedByBlockade` na kroku ku zagrozeniu i punktowi).
    const perB = Math.ceil(N_AMB / BASES.length);
    made = 0;
    guard = 0;
    while (made < perB && guard++ < perB * 20) {
      if (!layout()) continue;
      const pool = live();
      if (pool.length === 0) continue;
      const ru = pick(pool);
      setState(ru, true);
      const [tc, tr] = pickTarget(ru);
      if (rnd() < 0.5) blockGreedy(ru, tc, tr);
      orders.push(runOrder(ru, { type: 'attackMove', col: tc, row: tr }, base.name));
      made += 1;
    }
    // attack
    const perT = Math.ceil(N_AT / BASES.length);
    made = 0;
    guard = 0;
    while (made < perT && guard++ < perT * 20) {
      if (!layout()) continue;
      const pool = live();
      if (pool.length === 0) continue;
      const ru = pick(pool);
      setState(ru);
      const x = rnd();
      const roster = rosterOf(ru);
      const own = ru.side === 'atk' ? bs.atk : bs.def;
      const targetId = x < 0.85 ? pick(roster).bu.id : x < 0.93 ? pick(own).bu.id : 'brak';
      const tgt = roster.find((u) => u.bu.id === targetId);
      if (tgt && rnd() < 0.5) blockGreedy(ru, tgt.q, tgt.r);
      orders.push(runOrder(ru, { type: 'attack', targetId }, base.name));
      made += 1;
    }
    // `_attackMovePath` wprost (oba `allowEnemyCells`).
    const perP = Math.ceil(N_PATH / BASES.length);
    made = 0;
    guard = 0;
    while (made < perP && guard++ < perP * 20) {
      if (!layout()) continue;
      const pool = live();
      if (pool.length === 0) continue;
      const ru = pick(pool);
      setState(ru);
      const [tc, tr] = pickTarget(ru);
      if (rnd() < 0.5) blockGreedy(ru, tc, tr);
      const snap = snapshot(ru, base.name);
      for (const allow of [true, false]) {
        const out = oPath.call(bs, ru, tc, tr, allow);
        const fs = bs._firstStepOnAttackMovePath(ru, tc, tr);
        paths.push({ ...snap, target: [tc, tr], allow, expect: out == null ? null : out.map((k) => k.split(',').map(Number)), firstStep: fs == null ? null : fs.split(',').map(Number) });
      }
      made += 1;
    }
    // Scena otwarta (limit `queue.length < BF_COLS * BF_ROWS`): caly teren Plains, w `occByKey` tylko `ru`.
    {
      const B_PLAINS = 0; // `battle-terrain.ts:38`
      const tilesT = bs.terrainMap.tiles;
      const saved = Array.from(tilesT);
      for (let i = 0; i < tilesT.length; i++) tilesT[i] = B_PLAINS;
      const openName = base.name + '~otwarta';
      recordImpassable(openName);
      for (let k = 0; k < N_OPEN; k++) {
        for (const u of all) { u.dead = false; u.fadingOut = false; u.routed = false; u.removed = false; }
        const ru = all[k % all.length];
        ru.q = pick([0, 1, BF_COLS_PIN - 1, ri(0, BF_COLS_PIN - 1)]);
        ru.r = pick([0, BF_ROWS_PIN - 1, ri(0, BF_ROWS_PIN - 1)]);
        bs.occByKey = new Map([[ck(ru.q, ru.r), ru]]);
        bs._generalSettings.blockadeActive = false;
        bs._generalSettings.blockadeCol = null;
        bs._deployPlayerSideOpt = 'atk';
        bs.siegeWallCol = -1;
        const tc = k % 3 === 0 ? BF_COLS_PIN - 1 - ru.q : ri(0, BF_COLS_PIN - 1);
        const tr = k % 3 === 0 ? BF_ROWS_PIN - 1 - ru.r : ri(0, BF_ROWS_PIN - 1);
        const snap = snapshot(ru, openName);
        for (const allow of [true, false]) {
          const out = oPath.call(bs, ru, tc, tr, allow);
          const fs = bs._firstStepOnAttackMovePath(ru, tc, tr);
          paths.push({ ...snap, target: [tc, tr], allow, open: true, expect: out == null ? null : out.map((kk) => kk.split(',').map(Number)), firstStep: fs == null ? null : fs.split(',').map(Number) });
        }
      }
      for (let i = 0; i < saved.length; i++) tilesT[i] = saved[i];
      bs.siegeWallCol = wallCol0;
    }
    console.error(`${base.name}: rozkazy ${orders.length} drogi ${paths.length} (${Date.now() - tS} ms)`);
  }
  const shaS = hash.digest('hex');
  if (shaS !== EXPECTED_SHA256) throw new Error('straznik SHA-256 pinu: ' + shaS + ' != ' + EXPECTED_SHA256);
  const txt = JSON.stringify({ pin: PIN, pinSha256: shaS, bfCols: BF_COLS_PIN, bfRows: BF_ROWS_PIN, impassable: impassableBy, orders, paths }) + '\n';
  const outPath = process.env.WIRING_A_OUT ?? join(here, 'p6_k5loop_wiring_a_pin_vectors', 'attack_order_step_vectors.json');
  writeFileSync(outPath, txt);
  console.log(createHash('md5').update(txt).digest('hex') + '  ' + outPath);
  process.exit(0);
}

// R-RUSTPORT-P4-417A r2 (K5EXEC-H4, D-417A-3): wektory KROKU CIALA trybu recznego. `WIRING_A_MANUAL_BODY_STEPS=1`:
// przypadki jednego wywolania `_activateUnit(ru, done)` (`:6024-6112`) na scenie pinu w trybie recznym
// (`_manualMode`, strona gracza = `_deployPlayerSideOpt`) z rozkazem gracza `hold` / `none` / `move` / `attack` /
// `attackMove` (`_performPlayerOrder` `:18280-18428`, wolany z `:6068`). Pin wykonuje caly tekst (straznik SHA-256).
// Wykonawcze `_doMove` (przestawia jednostke i `occByKey`, potem callback), `_doAttack`, `_doRangedAttack`,
// `_doMeleeAttack` i `_refreshQueuedOrderVisuals` zapisuja decyzje; kazdy przypadek z czynnoscia spoza
// {done, move, attack} albo z drugim wykonaniem jest odrzucany (licznik `dropped`). Blokada generala nieaktywna
// (`blockadeActive = false`; w ciele czesc B #422), `siegeWallCol = -1` (oblezenie reczne = r3). Wejscie sceny
// (`inputs`) jest w formacie `vectors.json`, wiec test Rust buduje te sama scene przez `SiegeBattleSession::prepare_scene`
// i NADPISUJE stan (pozycje, flagi, zajetosc, doktryna) z migawki. Zapis: `manual_body_step_vectors.json` (`WIRING_A_OUT`).
if (process.env.WIRING_A_MANUAL_BODY_STEPS) {
  const tS = Date.now();
  let seed = 0x417417;
  const rnd = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const ck = (c, r) => `${c},${r}`;
  const BASES = [
    { name: 'st_mur', built: ['mury'], atk: [MO_W, MO_W, MO_W, MO_K, MO_L, MO_L, MO_F, MO_W], def: [MO_W, MO_S, MO_L, MO_L, MO_W, MO_W] },
    { name: 'st_rzeka', built: ['palisada'], world: { baza: 'Równina', las: false, rzeka: true }, atk: [MO_W, MO_K, MO_K, MO_L, MO_W, MO_W, MO_F, MO_W], def: [MO_W, MO_L, MO_L, MO_S, MO_W, MO_K] },
    { name: 'st_las', teren: 'Las', built: ['mury', 'baszta'], world: { baza: 'Las', las: true, rzeka: false }, atk: [MO_W, MO_W, MO_L, MO_K, MO_W, MO_S, MO_W, MO_L], def: [MO_W, MO_W, MO_L, MO_L, MO_K, MO_W] },
  ];
  const DOCS = [null, 'steady', 'skirmish', 'aggressive', 'defensive', 'manual'];
  const N = {
    hold: Number(process.env.WIRING_A_MANUAL_BODY_NH ?? 60),
    none: Number(process.env.WIRING_A_MANUAL_BODY_NN ?? 240),
    move: Number(process.env.WIRING_A_MANUAL_BODY_NM ?? 270),
    attack: Number(process.env.WIRING_A_MANUAL_BODY_NA ?? 240),
    attackMove: Number(process.env.WIRING_A_MANUAL_BODY_NAM ?? 240),
    wallMove: Number(process.env.WIRING_A_MANUAL_BODY_NWM ?? 120),
    wallAttack: Number(process.env.WIRING_A_MANUAL_BODY_NWA ?? 90),
    wallNone: Number(process.env.WIRING_A_MANUAL_BODY_NWN ?? 60),
  };
  const cases = [];
  const inputs = {};
  const dropped = { drugie: 0, inne: 0 };
  for (const base of BASES) {
    modCache = new Map();
    rafQ = [];
    globalThis.__blowRandom = () => { throw new Error('rzut w przypadku kroku'); };
    const { BattleScene } = load(SCENE);
    const attackerIn = JSON.parse(JSON.stringify(A(base.atk)));
    const defenderIn = JSON.parse(JSON.stringify(D(base.def)));
    const bs = new BattleScene({
      attacker: JSON.parse(JSON.stringify(attackerIn)),
      defender: JSON.parse(JSON.stringify(defenderIn)),
      teren: base.teren ?? 'Równina', worldTerrain: base.world, data: { units, counters, terrainCombat },
      deploy: false, deployPlayerSide: 'atk', manualControlAllowed: false,
      siege: { defCiv: 'rzym', builtBuildingIds: base.built }, attackerCivBonusy: [], defenderCivBonusy: [],
      attackerEra: 1, defenderEra: 1,
    });
    inputs[base.name] = {
      teren: base.teren ?? 'Równina', worldTerrain: base.world ?? null, builtBuildingIds: base.built, defCiv: 'rzym', defenderEra: 1,
      attacker: attackerIn, defender: defenderIn,
    };
    const all = [...bs.atk, ...bs.def];
    const wallCol0 = bs.siegeWallCol;
    if (wallCol0 < 0) throw new Error('scena bez muru');
    let wallOn = false;
    const key = (u) => (u.side === 'atk' ? 'atk:' : 'def:') + u.bu.id;
    const rosterOf = (ru) => (ru.side === 'atk' ? bs.def : bs.atk);
    const eIdx = (ru, e) => { const i = rosterOf(ru).indexOf(e); if (i < 0) throw new Error('cel spoza rosteru wroga'); return i; };
    if (bs._manualMode !== true) throw new Error('_manualMode sceny != true');
    let rec = null;
    bs._doMove = function (ru, c, r, cb) {
      rec.exec.push('move');
      // Drugie wykonanie w jednej aktywacji (rekurencja callbackow jazdy): przypadek odrzucany, bez dalszej rekurencji.
      if (rec.exec.length > 1) return;
      // Odmowa bramki muru (`:8689-8693`): jednostka stoi, `moveLeft = 0`, callback wolany od razu (ruch nie nastepuje).
      if (this.siegeWallCol >= 0 && this._siegeMoveRefused(ru, c, r)) { ru.moveLeft = 0; rec.refused = true; if (cb) cb(); return; }
      if (rec.kind === 'done') { rec.kind = 'move'; rec.step = [c, r]; }
      // `_doMove` pinu przestawia jednostke i `occByKey` w chwili kroku, callback po animacji.
      if (this.occByKey.get(ck(ru.q, ru.r)) === ru) this.occByKey.delete(ck(ru.q, ru.r));
      ru.q = c; ru.r = r;
      this.occByKey.set(ck(c, r), ru);
      if (cb) cb();
    };
    bs._doAttack = function (a, d, cb) {
      rec.exec.push('attack');
      if (rec.exec.length > 1) return;
      if (rec.kind === 'done') { rec.kind = 'attack'; rec.attack = eIdx(a, d); }
      if (cb) cb();
    };
    bs._doRangedAttack = function () { rec.exec.push('ranged'); };
    bs._doMeleeAttack = function () { rec.exec.push('melee'); };
    bs._refreshQueuedOrderVisuals = function () {};
    const oPPO = bs._performPlayerOrder;
    bs._performPlayerOrder = function (...a) { const out = oPPO.apply(this, a); rec.ret = out; return out; };
    const layout = () => {
      for (const u of all) { u.dead = false; u.fadingOut = false; u.routed = false; u.removed = false; u.playerOrder = { type: 'none' }; }
      const used = new Set();
      const anchorC = wallOn ? ri(Math.max(4, wallCol0 - 10), wallCol0 + 4) : ri(4, 60);
      const anchorR = ri(20, 130);
      for (const u of all) {
        let ok = false;
        for (let k = 0; k < 400 && !ok; k++) {
          const c = anchorC + ri(-6, 6);
          const r = anchorR + ri(-6, 6);
          if (c < 0 || c >= BF_COLS_PIN || r < 0 || r >= BF_ROWS_PIN) continue;
          if (used.has(ck(c, r)) || !bs._passableForUnit(u, c, r)) continue;
          used.add(ck(c, r));
          u.q = c; u.r = r;
          ok = true;
        }
        if (!ok) return false;
      }
      for (const u of all) {
        const x = rnd();
        if (x < 0.06) u.dead = true;
        else if (x < 0.1) u.routed = true;
        else if (x < 0.13) u.fadingOut = true;
        else if (x < 0.16) u.removed = true;
      }
      bs.occByKey = new Map();
      for (const u of all) if (!u.dead && !(u.routed && rnd() < 0.5)) bs.occByKey.set(ck(u.q, u.r), u);
      return true;
    };
    const setState = (ru, docMode) => {
      // docMode: 'rand' (losowa), 'manual' (doktryna reczna: `none` = done), 'auto' (jednostka z doktryna AUTO).
      if (docMode === 'manual') ru.unitDoctrine = pick(['manual', 'manual', null]);
      else if (docMode === 'auto') ru.unitDoctrine = pick(['steady', 'skirmish', 'aggressive', 'defensive', null]);
      else ru.unitDoctrine = pick(DOCS);
      ru.groupId = rnd() < 0.35 ? pick(['g1', 'g2']) : null;
      bs._groupMeta = new Map();
      if (rnd() < 0.6) bs._groupMeta.set('g1', { doctrine: pick(DOCS.filter(Boolean)), autoPlay: rnd() < 0.7 });
      ru.formationRank = rnd() < 0.5 ? ri(0, 3) : undefined;
      for (const u of all) if (u !== ru) u.formationRank = rnd() < 0.5 ? ri(0, 3) : undefined;
      ru.lastAutoMoveFrom = rnd() < 0.3 ? undefined : { q: ru.q + pick([-1, 0, 1]), r: ru.r + pick([-1, 0, 1]) };
      for (const u of all) if (u.rangedBase) u.ammoLeft = pick([0, 3, 10]);
      bs._generalSettings.blockadeActive = false;
      bs._generalSettings.blockadeCol = null;
      bs._deployPlayerSideOpt = ru.side === 'atk' ? 'atk' : 'def';
      bs.siegeWallCol = wallOn ? wallCol0 : -1;
      bs.wallEverBreached = wallOn && rnd() < 0.3;
    };
    const uj = (u) => ({
      id: u.bu.id, q: u.q, r: u.r, dead: !!u.dead, fadingOut: !!u.fadingOut, routed: !!u.routed, removed: !!u.removed,
      ammo: u.ammoLeft > 0, rangedBase: !!u.rangedBase, range: u.range, formationRank: u.formationRank ?? null,
      unitDoctrine: u.unitDoctrine ?? null, groupId: u.groupId ?? null,
      lastAutoMoveFrom: u.lastAutoMoveFrom ? [u.lastAutoMoveFrom.q, u.lastAutoMoveFrom.r] : null,
    });
    const orderJson = (o) => ({ ...o });
    const live = () => all.filter((u) => !u.dead && !u.fadingOut && !u.removed && !u.routed && bs.occByKey.get(ck(u.q, u.r)) === u);
    const runCase = (ru, order, label, boardName) => {
      ru.playerOrder = order;
      const before = {
        base: boardName, label, unit: key(ru), side: ru.side, order: orderJson(order),
        playerSide: bs._deployPlayerSideOpt, wallCol: bs.siegeWallCol, wallEverBreached: !!bs.wallEverBreached,
        units: { atk: bs.atk.map(uj), def: bs.def.map(uj) },
        groupMeta: [...bs._groupMeta.entries()].map(([k, m]) => [k, { doctrine: m.doctrine, autoPlay: m.autoPlay }]),
        occ: [...bs.occByKey.entries()].map(([k, u]) => [...k.split(',').map(Number), key(u)]),
      };
      rec = { kind: 'done', step: null, attack: null, exec: [], ret: null, refused: false };
      let doneCalls = 0;
      bs._activateUnit(ru, () => { doneCalls += 1; });
      const ex = rec.exec;
      let ok = false;
      if (ex.some((x) => x === 'ranged' || x === 'melee')) dropped.inne += 1;
      else if (ex.length > 1) dropped.drugie += 1;
      else {
        cases.push({
          ...before,
          expect: {
            ret: rec.ret, doneCalls, kind: rec.kind, step: rec.step, attack: rec.attack, refused: rec.refused,
            orderAfter: orderJson(ru.playerOrder),
            lastAutoMoveFrom: ru.lastAutoMoveFrom ? [ru.lastAutoMoveFrom.q, ru.lastAutoMoveFrom.r] : null,
            groupMetaAfter: [...bs._groupMeta.keys()],
            pos: [ru.q, ru.r],
          },
        });
        ok = true;
      }
      rec = null;
      return ok;
    };
    const blockGreedy = (ru, tc, tr) => {
      const dc = Math.sign(tc - ru.q);
      const dr = Math.sign(tr - ru.r);
      const want = [[ru.q + dc, ru.r], [ru.q, ru.r + dr], [ru.q + 2 * dc, ru.r], [ru.q + dc, ru.r + dr]].filter(([c, r]) => !(c === ru.q && r === ru.r));
      const others = all.filter((u) => u !== ru);
      for (const [c, r] of want) {
        if (rnd() < 0.5 && !bs.occByKey.has(ck(c, r)) && c >= 0 && c < BF_COLS_PIN && r >= 0 && r < BF_ROWS_PIN) {
          const b = pick(others);
          if (bs.occByKey.get(ck(b.q, b.r)) === b) bs.occByKey.delete(ck(b.q, b.r));
          b.q = c; b.r = r; b.dead = false; b.fadingOut = false; b.routed = false; b.removed = false;
          bs.occByKey.set(ck(c, r), b);
        }
      }
    };
    const pickTarget = (ru) => {
      const x = rnd();
      let tc;
      let tr;
      if (x < 0.07) { tc = ru.q; tr = ru.r; }
      else if (x < 0.6) { tc = ru.q + ri(-8, 8); tr = ru.r + ri(-8, 8); }
      else if (x < 0.85) { tc = ru.q + pick([-1, 1]) * ri(1, 3); tr = ru.r + pick([-1, 1]) * ri(1, 3); }
      else { tc = ru.q + ri(-25, 25); tr = ru.r + ri(-25, 25); }
      return [Math.max(0, Math.min(BF_COLS_PIN - 1, tc)), Math.max(0, Math.min(BF_ROWS_PIN - 1, tr))];
    };
    // Dla `none` z doktryna AUTO tylko piechota wrecz (krok doktryny strzelcow, jazdy i falangi to osobne klocki K5DOC).
    const meleeInfantry = (u) => !u.rangedBase && !u.mounted && !String(u.bu.nazwa).startsWith('Falanga');
    const gen = (label, n, mk) => {
      const per = Math.ceil(n / BASES.length);
      let made = 0;
      let guard = 0;
      while (made < per && guard++ < per * 30) {
        if (!layout()) continue;
        const pool = live();
        if (pool.length === 0) continue;
        const spec = mk(pool);
        if (!spec) continue;
        if (runCase(spec.ru, spec.order, label, base.name)) made += 1;
      }
    };
    gen('hold', N.hold, (pool) => { const ru = pick(pool); setState(ru, 'rand'); return { ru, order: { type: 'hold' } }; });
    gen('none', N.none, (pool) => {
      const ru = pick(pool);
      const mode = pick(['manual', 'auto', 'auto', 'rand']);
      if (mode === 'auto' && !meleeInfantry(ru)) return null;
      setState(ru, mode);
      if (bs._isUnitDoctrineAuto(ru) && bs._getEffectiveDoctrine(ru) !== 'manual' && !meleeInfantry(ru)) return null;
      return { ru, order: { type: 'none' } };
    });
    gen('move', N.move, (pool) => {
      const ru = pick(pool);
      setState(ru, 'rand');
      const [tc, tr] = pickTarget(ru);
      if (rnd() < 0.5) blockGreedy(ru, tc, tr);
      return { ru, order: { type: 'move', col: tc, row: tr } };
    });
    gen('attackMove', N.attackMove, (pool) => {
      const ru = pick(pool);
      setState(ru, 'rand');
      const [tc, tr] = pickTarget(ru);
      if (rnd() < 0.5) blockGreedy(ru, tc, tr);
      return { ru, order: { type: 'attackMove', col: tc, row: tr } };
    });
    gen('attack', N.attack, (pool) => {
      const ru = pick(pool);
      setState(ru, 'rand');
      const x = rnd();
      const roster = rosterOf(ru);
      const own = ru.side === 'atk' ? bs.atk : bs.def;
      // Podprzyczyny celu: martwy / znikajacy / uciekajacy / usuniety (rozkaz `attack` pomija tylko pierwsze dwa, `_enemiesOf`
      // `:8291` odfiltrowuje takze `routed`); w 30% przypadkow cel zywy stawiany obok aktora (cios bez ruchu).
      const flagged = roster.filter((u) => u.dead || u.fadingOut || u.routed || u.removed);
      const targetId = x < 0.35 && flagged.length ? pick(flagged).bu.id : x < 0.85 ? pick(roster).bu.id : x < 0.93 ? pick(own).bu.id : 'brak';
      const tgt = roster.find((u) => u.bu.id === targetId);
      if (tgt && rnd() < 0.3 && !tgt.dead && !tgt.fadingOut) {
        const nb = [[ru.q + 1, ru.r], [ru.q - 1, ru.r], [ru.q, ru.r + 1], [ru.q, ru.r - 1]].filter(([c, r]) => c >= 0 && c < BF_COLS_PIN && r >= 0 && r < BF_ROWS_PIN && !bs.occByKey.has(ck(c, r)) && bs._passableForUnit(tgt, c, r));
        if (nb.length) {
          const [c, r] = pick(nb);
          if (bs.occByKey.get(ck(tgt.q, tgt.r)) === tgt) bs.occByKey.delete(ck(tgt.q, tgt.r));
          tgt.q = c; tgt.r = r;
          bs.occByKey.set(ck(c, r), tgt);
        }
      } else if (tgt && rnd() < 0.5) blockGreedy(ru, tgt.q, tgt.r);
      return { ru, order: { type: 'attack', targetId } };
    });
    // Warianty Z MUREM sceny (`siegeWallCol >= 0`): rozkaz `move` dowolnej strony (bramka oblezenia recznego `:18436` odrzuca
    // `move`) oraz wszystkie rozkazy obroncy (bramka wymaga strony `atk`); oblezenie reczne atakujacego = r3.
    wallOn = true;
    const sideOk = (u, type) => type === 'move' || u.side === 'def';
    const gw = (label, n, type, mk) => gen(label + '+mur', n, (pool) => {
      const p = pool.filter((u) => sideOk(u, type));
      return p.length ? mk(p) : null;
    });
    gw('move', N.wallMove, 'move', (pool) => {
      const ru = pick(pool); setState(ru, 'rand');
      const [tc, tr] = pickTarget(ru);
      if (rnd() < 0.5) blockGreedy(ru, tc, tr);
      return { ru, order: { type: 'move', col: tc, row: tr } };
    });
    gw('attackMove', N.wallAttack, 'attackMove', (pool) => {
      const ru = pick(pool); setState(ru, 'rand');
      const [tc, tr] = pickTarget(ru);
      if (rnd() < 0.5) blockGreedy(ru, tc, tr);
      return { ru, order: { type: 'attackMove', col: tc, row: tr } };
    });
    gw('attack', N.wallAttack, 'attack', (pool) => {
      const ru = pick(pool); setState(ru, 'rand');
      const roster = rosterOf(ru);
      const tgt = pick(roster);
      if (rnd() < 0.5) blockGreedy(ru, tgt.q, tgt.r);
      return { ru, order: { type: 'attack', targetId: tgt.bu.id } };
    });
    gw('none', N.wallNone, 'none', (pool) => {
      const ru = pick(pool);
      const mode = pick(['manual', 'auto', 'rand']);
      if (mode === 'auto' && !meleeInfantry(ru)) return null;
      setState(ru, mode);
      if (bs._isUnitDoctrineAuto(ru) && bs._getEffectiveDoctrine(ru) !== 'manual' && !meleeInfantry(ru)) return null;
      return { ru, order: { type: 'none' } };
    });
    wallOn = false;
    console.error(`${base.name}: przypadki ${cases.length} odrzucone ${JSON.stringify(dropped)} (${Date.now() - tS} ms)`);
  }
  const shaS = hash.digest('hex');
  if (shaS !== EXPECTED_SHA256) throw new Error('straznik SHA-256 pinu: ' + shaS + ' != ' + EXPECTED_SHA256);
  const txt = JSON.stringify({ pin: PIN, pinSha256: shaS, bfCols: BF_COLS_PIN, bfRows: BF_ROWS_PIN, dropped, inputs, cases }) + '\n';
  const outPath = process.env.WIRING_A_OUT ?? join(here, 'p6_k5loop_wiring_a_pin_vectors', 'manual_body_step_vectors.json');
  writeFileSync(outPath, txt);
  console.log(createHash('md5').update(txt).digest('hex') + '  ' + outPath);
  process.exit(0);
}

// R-RUSTPORT-P4-416 (K5EXEC-H3, D-416-3): wektory KROKU `_performSiegeManualOrder(ru, ord, done)` (`:18435-18475`) i
// `_trySiegeTowerClimb(ru, done)` (`:8056-8084`). `WIRING_A_SIEGE_MANUAL_STEPS=1`: przypadki jednego wywolania na scenie
// pinu z murem (konstruktor pinu: `_carveWallTiles`, `_placeSiegeTowers`) i ustawionym stanem (`towerAtWallRows`,
// `wallTileHp`, `gateOpen`, `wallEverBreached`, `onWallWalkway`, doktryna, amunicja, `shootingEnabled`, rozkaz).
// Funkcja pinu wolana WPROST (nie przez `_performPlayerOrder`); jej wywolania podfunkcji (`_siegeRamTowerStep`,
// `_rangedTargetInRange`, `_targetInRange`, `_trySiegeTowerClimb`, `_siegeInfantryToTowerStep`, `_siegeApproachRestricted`,
// `_siegeSafeApproach`) zapisane jako SLAD (nazwa, argumenty, wynik, wywolania `done` podfunkcji, pierwsze efekty
// sceny) tylko na glebokosci 1 (wolane wprost z ciala funkcji). Podfunkcje wykonuja tekst pinu; metody wykonawcze
// (`_doMove`, `_attackGate`, `_advanceToward`, `_doAttack`, `_refreshQueuedOrderVisuals`) = zapis bez wolania
// callbacku (marsz konczy sie na pierwszym kroku). `done` przekazane do podfunkcji = osobny licznik podfunkcji;
// `doneCalls` = wylacznie bezposrednie `done()` z ciala funkcji. Klasyfikacja jednostki NIE jest liczona w harnessie:
// zapisane sa pola `stats.Typ` / `stats.Jednostka` / `nazwa` / `rangedBase` / `ammoLeft` (port klasyfikacji w Rust).
// Tekst pinu bez zmian (straznik SHA-256 nietkniety). Zapis: `siege_manual_order_step_vectors.json` (albo `WIRING_A_OUT`).
if (process.env.WIRING_A_SIEGE_MANUAL_STEPS) {
  const tS = Date.now();
  let seed = 0x416416;
  const rnd = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const ck = (c, r) => `${c},${r}`;
  const MO_WT = ['Wieża oblężnicza', 'obleznicza'];
  const MO_TO = ['Taran okuty', 'obleznicza'];
  const BASES = [
    { name: 'sm_mur', built: ['mury'], atk: [MO_W, MO_W, MO_T, MO_WT, MO_WT, MO_K, MO_L, MO_C, MO_F, MO_W], def: [MO_W, MO_S, MO_L, MO_L, MO_W, MO_W] },
    { name: 'sm_palisada', built: ['palisada'], atk: [MO_W, MO_K, MO_TO, MO_WT, MO_L, MO_W, MO_S, MO_W], def: [MO_W, MO_L, MO_L, MO_S, MO_W, MO_K] },
    { name: 'sm_baszta', teren: 'Las', built: ['mury', 'baszta'], world: { baza: 'Las', las: true, rzeka: false }, atk: [MO_W, MO_W, MO_L, MO_K, MO_WT, MO_T, MO_C, MO_L], def: [MO_W, MO_W, MO_L, MO_L, MO_K, MO_W] },
  ];
  const DOCS = [null, 'steady', 'skirmish', 'aggressive', 'defensive', 'manual'];
  const N_ORD = Number(process.env.WIRING_A_SIEGE_MANUAL_N ?? 1500);
  const N_CLIMB = Number(process.env.WIRING_A_SIEGE_MANUAL_NC ?? 450);
  const orders = [];
  const climbs = [];
  const impassable = {};
  const SUBS = ['_siegeRamTowerStep', '_rangedTargetInRange', '_targetInRange', '_trySiegeTowerClimb', '_siegeInfantryToTowerStep', '_siegeApproachRestricted', '_siegeSafeApproach'];
  for (const base of BASES) {
    modCache = new Map();
    rafQ = [];
    globalThis.__blowRandom = () => { throw new Error('rzut w przypadku kroku'); };
    const { BattleScene } = load(SCENE);
    const bs = new BattleScene({
      attacker: JSON.parse(JSON.stringify(A(base.atk))),
      defender: JSON.parse(JSON.stringify(D(base.def))),
      teren: base.teren ?? 'Równina', worldTerrain: base.world, data: { units, counters, terrainCombat },
      deploy: false, deployPlayerSide: 'atk', manualControlAllowed: false,
      siege: { defCiv: 'rzym', builtBuildingIds: base.built }, attackerCivBonusy: [], defenderCivBonusy: [],
      attackerEra: 1, defenderEra: 1,
    });
    const all = [...bs.atk, ...bs.def];
    const wallCol0 = bs.siegeWallCol;
    if (!(wallCol0 >= 0)) throw new Error('scena bez muru: ' + base.name);
    const wallTiles0 = new Map(bs.wallTileHp);
    const wallRows0 = [...wallTiles0.keys()];
    if (wallRows0.length === 0) throw new Error('brak kafli muru: ' + base.name);
    const log0 = bs.log.length;
    // `_passableForUnit` kazdej jednostki (teren; kafle nieprzejezdne), deduplikowane.
    const impTable = new Map();
    const impOf = new Map();
    for (const u of all) {
      const out = [];
      for (let c = 0; c < BF_COLS_PIN; c++) for (let r = 0; r < BF_ROWS_PIN; r++) if (!bs._passableForUnit(u, c, r)) out.push([c, r]);
      const key = JSON.stringify(out);
      if (!impTable.has(key)) { impTable.set(key, base.name + '#' + impTable.size); impassable[base.name + '#' + (impTable.size - 1)] = out; }
      impOf.set(u, impTable.get(key));
    }
    let rec = null;
    let depth = 0;
    let sub = null;
    const idOf = (u) => (u ? u.bu.id : null);
    bs._doMove = function (ru, c, r) { if (sub) sub.fx.push(['move', c, r]); else throw new Error('_doMove poza podfunkcja'); };
    bs._attackGate = function () { if (sub) sub.fx.push(['attackGate']); else throw new Error('_attackGate poza podfunkcja'); };
    bs._advanceToward = function (ru, c, r) { if (sub) sub.fx.push(['advance', c, r]); else throw new Error('_advanceToward poza podfunkcja'); };
    bs._schedule = function () { throw new Error('_schedule w przypadku kroku'); };
    bs._doAttack = function (a, d) { if (!rec || depth !== 0) throw new Error('_doAttack poza cialem'); rec.attacks.push(idOf(d)); };
    bs._refreshQueuedOrderVisuals = function () { if (rec && depth === 0) rec.refresh += 1; };
    const orig = {};
    for (const name of SUBS) {
      orig[name] = bs[name];
      bs[name] = function (...a) {
        if (!rec || depth !== 0) return orig[name].apply(this, a);
        const s = { fn: name, fx: [], done: 0 };
        const args = a.slice(1);
        // `done` / callback podfunkcji -> licznik podfunkcji (nie `done` ciala).
        for (let i = 0; i < args.length; i++) if (typeof args[i] === 'function') args[i] = () => { s.done += 1; s.fx.push(['done']); };
        depth += 1;
        const prevSub = sub;
        sub = s;
        let out;
        try { out = orig[name].call(this, a[0], ...args); } finally { depth -= 1; sub = prevSub; }
        s.args = a.slice(1).filter((x) => typeof x !== 'function');
        s.out = out && typeof out === 'object' ? idOf(out) : out;
        rec.trace.push(s);
        return out;
      };
    }
    const unitSnap = (ru) => ({
      unit: ru.bu.id, side: ru.side, pos: [ru.q, ru.r], moveLeft: ru.moveLeft, dead: !!ru.dead, fadingOut: !!ru.fadingOut,
      routed: !!ru.routed, onWallWalkway: !!ru.onWallWalkway, mounted: !!ru.mounted, primaryRanged: !!ru.primaryRanged,
      rangedBase: !!ru.rangedBase, ammoLeft: ru.ammoLeft, shootingEnabled: ru.shootingEnabled !== false,
      typ: ru.bu.stats?.Typ == null ? null : String(ru.bu.stats.Typ),
      jednostka: ru.bu.stats?.Jednostka == null ? null : String(ru.bu.stats.Jednostka),
      nazwa: ru.bu.nazwa == null ? null : String(ru.bu.nazwa),
      impassable: impOf.get(ru),
    });
    const sceneSnap = () => ({
      finished: !!bs.finished, wallCol: bs.siegeWallCol, gateCol: bs.siegeGateCol, gateRow: bs.siegeGateRow,
      gateOpen: !!bs.gateOpen, wallEverBreached: !!bs.wallEverBreached, wallTilesInit: bs.siegeWallTilesInit,
      wallRows: [...bs.wallTileHp.keys()].sort((x, y) => x - y), towerRows: [...bs.towerAtWallRows].sort((x, y) => x - y),
      occ: [...bs.occByKey.keys()].map((k) => k.split(',').map(Number)),
    });
    const resetScene = () => {
      bs.wallTileHp = new Map(wallTiles0);
      bs.towerAtWallRows = new Set();
      bs.gateOpen = false;
      bs.wallEverBreached = false;
      bs.finished = false;
      bs.siegeWallCol = wallCol0;
      bs.log.length = log0;
      for (const u of all) { u.dead = false; u.fadingOut = false; u.routed = false; u.removed = false; u.onWallWalkway = false; }
    };
    const layout = () => {
      const used = new Set();
      const anchorR = pick(wallRows0) + ri(-3, 3);
      for (const u of all) {
        let ok = false;
        for (let k = 0; k < 400 && !ok; k++) {
          const c = u.side === 'atk' ? wallCol0 - ri(1, 9) : wallCol0 + ri(-2, 5);
          const r = anchorR + ri(-6, 6);
          if (c < 0 || c >= BF_COLS_PIN || r < 0 || r >= BF_ROWS_PIN) continue;
          if (used.has(ck(c, r)) || !bs._passableForUnit(u, c, r)) continue;
          used.add(ck(c, r));
          u.q = c; u.r = r;
          ok = true;
        }
        if (!ok) return false;
      }
      for (const u of all) {
        const x = rnd();
        if (x < 0.06) u.dead = true;
        else if (x < 0.11) u.routed = true;
        else if (x < 0.14) u.fadingOut = true;
        else if (x < 0.16) u.removed = true;
        u.moveLeft = pick([0, 1, 2.5, 4, 6]);
        if (u.rangedBase) u.ammoLeft = pick([0, 3, 10]);
        u.shootingEnabled = rnd() >= 0.2;
        if (u.side === 'def' && u.q === wallCol0 && rnd() < 0.5) u.onWallWalkway = true;
      }
      bs.occByKey = new Map();
      for (const u of all) if (!u.dead && !(u.routed && rnd() < 0.5)) bs.occByKey.set(ck(u.q, u.r), u);
      return true;
    };
    const moveTo = (u, c, r) => {
      if (c < 0 || c >= BF_COLS_PIN || r < 0 || r >= BF_ROWS_PIN || bs.occByKey.has(ck(c, r))) return false;
      if (bs.occByKey.get(ck(u.q, u.r)) === u) bs.occByKey.delete(ck(u.q, u.r));
      u.q = c; u.r = r;
      bs.occByKey.set(ck(c, r), u);
      return true;
    };
    const towersAndWall = (ru) => {
      if (rnd() < 0.6) {
        const k = ri(1, 3);
        for (let i = 0; i < k; i++) {
          const row = rnd() < 0.7 ? ru.r + ri(-2, 2) : pick(wallRows0);
          if (wallTiles0.has(row)) bs.towerAtWallRows.add(row);
        }
      }
      const wb = wallCol0 - 1;
      const tr = bs.towerAtWallRows.size > 0 ? pick([...bs.towerAtWallRows]) : pick(wallRows0);
      const y = rnd();
      if (y < 0.5) {
        const spot = pick([[wb - 1, tr], [wb, tr - 1], [wb, tr + 1], [wb - 2, tr], [wb, tr], [wb - 1, tr + 1], [wb + 1, tr]]);
        moveTo(ru, spot[0], spot[1]);
      }
      // Korona nad `ru` zajeta / wyburzona, brama, wylom.
      if (rnd() < 0.25) {
        const other = pick(all.filter((u) => u !== ru));
        moveTo(other, wallCol0, ru.r);
      }
      if (rnd() < 0.15) bs.wallTileHp.delete(ru.r);
      for (const row of wallRows0) if (rnd() < 0.04) bs.wallTileHp.delete(row);
      bs.gateOpen = rnd() < 0.25;
      bs.wallEverBreached = rnd() < 0.25;
      if (rnd() < 0.1) bs.siegeWallCol = -1;
    };
    const setDoctrine = (ru) => {
      ru.unitDoctrine = pick(DOCS);
      ru.groupId = rnd() < 0.35 ? pick(['g1', 'g2']) : null;
      bs._groupMeta = new Map();
      if (rnd() < 0.6) bs._groupMeta.set('g1', { doctrine: pick(DOCS.filter(Boolean)), autoPlay: rnd() < 0.7 });
    };
    const rosterOf = (ru) => (ru.side === 'atk' ? bs.def : bs.atk);
    // Rozkazy.
    const per = Math.ceil(N_ORD / BASES.length);
    let made = 0;
    let guard = 0;
    while (made < per && guard++ < per * 20) {
      resetScene();
      if (!layout()) continue;
      const pool = all.filter((u) => !u.dead && !u.removed && bs.occByKey.get(ck(u.q, u.r)) === u);
      const atkPool = pool.filter((u) => u.side === 'atk');
      if (atkPool.length === 0) continue;
      const rangedAtk = atkPool.filter((u) => u.rangedBase);
      const ru = rnd() < 0.15 && rangedAtk.length > 0 ? pick(rangedAtk) : rnd() < 0.88 ? pick(atkPool) : pick(pool);
      towersAndWall(ru);
      setDoctrine(ru);
      if (rnd() < 0.15) ru.onWallWalkway = true;
      const x = rnd();
      let ord;
      if (x < 0.3) {
        ord = { type: 'none' };
        // Bezczynny strzelec (`:18445-18452`): czesc przypadkow z amunicja, doktryna `manual` i wrogiem w zasiegu.
        if (ru.rangedBase && rnd() < 0.7) {
          ru.ammoLeft = pick([0, 10, 10]);
          if (rnd() < 0.6) ru.unitDoctrine = 'manual';
          const foe = pick(rosterOf(ru).filter((u) => !u.dead));
          if (foe && rnd() < 0.7) {
            const d = ri(0, Math.max(1, Math.floor(ru.range)) + 1);
            const dc = ri(0, d);
            moveTo(foe, ru.q + dc, ru.r + (d - dc) * pick([-1, 1]));
          }
        }
      } else if (x < 0.55) {
        const y = rnd();
        const roster = rosterOf(ru);
        const targetId = y < 0.8 ? pick(roster).bu.id : y < 0.9 ? pick(ru.side === 'atk' ? bs.atk : bs.def).bu.id : 'brak';
        const t = roster.find((u) => u.bu.id === targetId);
        if (t && rnd() < 0.12) { t.q = ru.q; t.r = ru.r; t.dead = false; t.fadingOut = false; t.routed = false; }
        ord = { type: 'attack', targetId };
      } else if (x < 0.82) {
        const at = rnd() < 0.1;
        ord = { type: 'attackMove', col: at ? ru.q : Math.max(0, Math.min(BF_COLS_PIN - 1, ru.q + ri(-12, 12))), row: at ? ru.r : Math.max(0, Math.min(BF_ROWS_PIN - 1, ru.r + ri(-12, 12))) };
      } else if (x < 0.92) ord = { type: 'move', col: ru.q + 1, row: ru.r };
      else ord = { type: 'hold' };
      const snap = {
        base: base.name, ...unitSnap(ru), scene: sceneSnap(),
        unitDoctrine: ru.unitDoctrine ?? null, groupId: ru.groupId ?? null,
        groupMeta: [...bs._groupMeta.entries()].map(([k, m]) => [k, m.doctrine, m.autoPlay]),
        enemies: rosterOf(ru).map((e) => ({ id: e.bu.id, q: e.q, r: e.r, dead: !!e.dead, fadingOut: !!e.fadingOut, routed: !!e.routed })),
        threats: bs._siegeShooterThreats().map((t) => [t.q, t.r, t.range]),
        order: ord.type,
        ...(ord.type === 'attack' ? { targetId: ord.targetId } : ord.type === 'attackMove' || ord.type === 'move' ? { target: [ord.col, ord.row] } : {}),
      };
      rec = { trace: [], attacks: [], refresh: 0 };
      ru.playerOrder = ord;
      let doneCalls = 0;
      const ret = bs._performSiegeManualOrder(ru, ord, () => { doneCalls += 1; });
      orders.push({
        ...snap,
        expect: {
          ret, doneCalls, attacks: rec.attacks, refresh: rec.refresh, orderAfter: ru.playerOrder.type,
          trace: rec.trace.map((s) => ({ fn: s.fn, args: s.args, out: s.out, done: s.done, fx: s.fx })),
          towerRowsAfter: [...bs.towerAtWallRows].sort((p, q) => p - q),
        },
      });
      rec = null;
      made += 1;
    }
    // `_trySiegeTowerClimb` wprost: stan przed i po.
    const perC = Math.ceil(N_CLIMB / BASES.length);
    made = 0;
    guard = 0;
    while (made < perC && guard++ < perC * 20) {
      resetScene();
      if (!layout()) continue;
      const pool = all.filter((u) => !u.dead && !u.removed && bs.occByKey.get(ck(u.q, u.r)) === u);
      if (pool.length === 0) continue;
      const ru = rnd() < 0.85 ? pick(pool.filter((u) => u.side === 'atk')) ?? pick(pool) : pick(pool);
      if (!ru) continue;
      towersAndWall(ru);
      if (rnd() < 0.5 && bs.towerAtWallRows.size > 0) {
        const tr = pick([...bs.towerAtWallRows]);
        const spot = pick([[wallCol0 - 2, tr], [wallCol0 - 1, tr - 1], [wallCol0 - 1, tr + 1]]);
        moveTo(ru, spot[0], spot[1]);
      }
      if (rnd() < 0.1) ru.onWallWalkway = true;
      if (rnd() < 0.05) ru.moveLeft = NaN;
      const occHasSelf = bs.occByKey.get(ck(ru.q, ru.r)) === ru;
      const before = { ...unitSnap(ru), moveLeft: Number.isNaN(ru.moveLeft) ? 'NaN' : ru.moveLeft, scene: sceneSnap(), occSelf: occHasSelf };
      let done = 0;
      const ret = bs._trySiegeTowerClimb(ru, () => { done += 1; });
      climbs.push({
        base: base.name, ...before,
        expect: {
          ret, done, pos: [ru.q, ru.r], onWallWalkway: !!ru.onWallWalkway,
          moveLeft: Number.isNaN(ru.moveLeft) ? 'NaN' : ru.moveLeft,
          wallEverBreached: !!bs.wallEverBreached, log: bs.log.slice(log0),
          occ: [...bs.occByKey.keys()].map((k) => k.split(',').map(Number)).sort((p, q) => p[0] - q[0] || p[1] - q[1]),
        },
      });
      made += 1;
    }
    console.error(`${base.name}: rozkazy ${orders.length} wspinaczki ${climbs.length} (${Date.now() - tS} ms)`);
  }
  const shaS = hash.digest('hex');
  if (shaS !== EXPECTED_SHA256) throw new Error('straznik SHA-256 pinu: ' + shaS + ' != ' + EXPECTED_SHA256);
  const txt = JSON.stringify({ pin: PIN, pinSha256: shaS, bfCols: BF_COLS_PIN, bfRows: BF_ROWS_PIN, impassable, orders, climbs }) + '\n';
  const outPath = process.env.WIRING_A_OUT ?? join(here, 'p6_k5loop_wiring_a_pin_vectors', 'siege_manual_order_step_vectors.json');
  writeFileSync(outPath, txt);
  console.log(createHash('md5').update(txt).digest('hex') + '  ' + outPath);
  process.exit(0);
}

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
