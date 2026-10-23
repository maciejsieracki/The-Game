// Generator wektorow M16: wola PRAWDZIWE funkcje weba (pin edb8fb56, `git archive` w WEB_ROOT) i zapisuje
// wejscia+wyjscia do rust-port/engine/tests/p6_m16_vectors/{rules,qualifier,gallery}.json.
// Uruchomienie (Node 22):
//   WEB_ROOT=<katalog z gra/src> OUT_DIR=<tests/p6_m16_vectors> node --experimental-transform-types \
//     --import ./m16-loader-register.mjs gen-m16-vectors.mjs
// Wejscia losowe z Mulberry32 o stalym ziarnie (deterministyczne). Specjalnych liczb (NaN/Inf) brak.
import { writeFileSync, mkdirSync } from 'node:fs';

const WEB = process.env.WEB_ROOT;
const OUT = process.env.OUT_DIR;
if (!WEB || !OUT) throw new Error('WEB_ROOT i OUT_DIR wymagane');
mkdirSync(OUT, { recursive: true });

const ib = await import(`${WEB}/gra/src/map/improvement-build.ts`);
const tech = await import(`${WEB}/gra/src/game/improvement-tech.ts`);
const live = await import(`${WEB}/gra/src/game/livestock-unlock.ts`);
const okolica = await import(`${WEB}/gra/src/game/okolica.ts`);
const road = await import(`${WEB}/gra/src/map/road-movement.ts`);
const types = await import(`${WEB}/gra/src/types/hex.ts`);
const tImp = await import(`${WEB}/gra/src/game/terrain-improvements.ts`);
const { TerenBazowy, Nakladka } = types;

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(0x4d313600);
const int = (n) => Math.floor(rnd() * n);
const pick = (a) => a[int(a.length)];
const chance = (p) => rnd() < p;
const subset = (a, p) => a.filter(() => chance(p));

const TERENY = Object.values(TerenBazowy);
const NAKLADKI = Object.values(Nakladka);
const KEYS = [
  'farma', 'bydlo', 'owce', 'lama', 'kamieniolom', 'oboz_lowiecki', 'wyrab', 'tartak',
  'lodzie_rybackie', 'droga', 'droga_brukowana', 'posterunek', 'stadnina', 'pastwisko', 'kopalnia_miedzi',
  'kopalnia_zelaza', 'kopalnia_zlota', 'kopalnia_cyny',
  'irygacja', 'pole_irygowane', 'glinianka', 'warzelnia_soli', 'tarasy', 'fort',
];
const EXTRA_KEYS = ['xyz', 'kopalnia', 'Farma', '', 'brak', '_meta', 'kon', 'konie', ' kon '];
const ALL_KEYS = [...KEYS, ...EXTRA_KEYS];
const ZLOZA = [undefined, undefined, undefined, 'miedz', 'zelazo', 'zloto', 'cyna', 'sol', 'glina', 'ruda', 'wegiel',
  ' GLINA ', 'Glina', '', 'inne', 'glina ', '﻿glina'];
const ULEPSZENIE_VALUES = [undefined, undefined, 'brak', 'farma', 'droga', 'droga_brukowana', 'kopalnia', 'tartak',
  'irygacja', 'pastwisko', 'xyz', ''];
const CIVS = [undefined, null, '', 'inkowie', 'Inkowie ', ' astekowie', 'AZTEK', 'rzymianie', 'chinczycy', 'chiny',
  'Chinczycy', 'inkowie_x', 'aztekowie', 'incas', 'inka', 'Chiny '];

const out = (name, data) => writeFileSync(`${OUT}/${name}`, JSON.stringify(data));
const u = (v) => (v === undefined ? null : v); // undefined -> null (JSON); Rust: None

// ---------------------------------------------------------------------------------------------
// rules.json
// ---------------------------------------------------------------------------------------------
const rules = {};

function randLayers(maxLen = 5) {
  const n = int(maxLen + 1);
  const pool = [...KEYS, 'xyz', 'FARMA', ' farma', 'brak', 'kopalnia'];
  return Array.from({ length: n }, () => pick(pool));
}

rules.strip_forest_removed = Array.from({ length: 200 }, () => {
  const layers = randLayers(6);
  return { layers, out: ib.stripImprovementsWhenForestRemoved(layers) };
});

rules.legacy_farm_layer = [];
for (const key of ALL_KEYS.concat(['pastwisko'])) {
  for (const nakladka of NAKLADKI) {
    rules.legacy_farm_layer.push({ key, nakladka, out: ib.isLegacyFarmOnForestLayer(key, nakladka) });
  }
}

rules.strip_legacy_farm = Array.from({ length: 1500 }, () => {
  const layers = randLayers(6);
  const nakladka = pick(NAKLADKI);
  return { layers, nakladka, out: ib.stripLegacyFarmOnForest(layers, nakladka) };
});

function randView() {
  const v = { nakladka: pick([Nakladka.Las, Nakladka.Las, Nakladka.Brak, Nakladka.ZlozeBydla]) };
  if (chance(0.5)) v.ulepszenie = pick(ULEPSZENIE_VALUES.filter((x) => x !== undefined));
  if (chance(0.5)) v.ulepszenia = chance(0.2) ? null : randLayers(4);
  return v;
}

function legacyCase() {
  const n = 1 + int(8);
  const hexes = [];
  const hexesObj = {};
  for (let i = 0; i < n; i++) {
    const key = `${int(7) - 3},${int(7) - 3}`;
    if (key in hexesObj) continue;
    const view = chance(0.1) ? undefined : randView();
    hexesObj[key] = view;
    hexes.push([key, view === undefined ? null : view]);
  }
  let placed = null;
  if (chance(0.6)) {
    placed = {};
    for (const [key] of hexes) if (chance(0.5)) placed[key] = randLayers(4);
  }
  return { hexes, hexesObj, placed };
}

rules.plan_legacy = [];
rules.remove_legacy = [];
for (let i = 0; i < 300; i++) {
  const c = legacyCase();
  const placedMap = c.placed ? new Map(Object.entries(c.placed)) : undefined;
  rules.plan_legacy.push({ hexes: c.hexes, placed: c.placed, out: ib.planLegacyFarmOnForestRemoval(c.hexesObj, placedMap) });
  const placedMap2 = new Map(Object.entries(c.placed ?? {}));
  const calls = [];
  const report = ib.removeLegacyFarmsOnForest(c.hexesObj, placedMap2, (k, l) => calls.push([k, l]));
  const noCb = new Map(Object.entries(c.placed ?? {}));
  const report2 = ib.removeLegacyFarmsOnForest(c.hexesObj, noCb);
  rules.remove_legacy.push({
    hexes: c.hexes, placed: c.placed ?? {}, out: report, calls,
    placed_after: Object.fromEntries([...placedMap2.entries()].sort(([a], [b]) => (a < b ? -1 : 1))),
    report_no_callback: report2,
    placed_after_no_callback: Object.fromEntries([...noCb.entries()].sort(([a], [b]) => (a < b ? -1 : 1))),
  });
}

// przypadki ukierunkowane: rejestr `placed` ze SAMYMI farmami na lesie (wpis znika) i mieszane
for (let i = 0; i < 80; i++) {
  const hexesObj = {};
  const hexes = [];
  const placed = {};
  for (let j = 0, n = 1 + int(5); j < n; j++) {
    const key = `${j},${int(3)}`;
    if (key in hexesObj) continue;
    const view = { nakladka: pick([Nakladka.Las, Nakladka.Las, Nakladka.Brak]) };
    if (chance(0.3)) view.ulepszenie = 'farma';
    hexesObj[key] = view;
    hexes.push([key, view]);
    if (chance(0.8)) placed[key] = pick([['farma'], ['farma', 'farma'], ['farma', 'tartak'], ['tartak'], [], ['pastwisko'], ['farma', 'irygacja']]);
  }
  const placedMap = new Map(Object.entries(placed));
  const calls = [];
  const report = ib.removeLegacyFarmsOnForest(hexesObj, placedMap, (k, l) => calls.push([k, l]));
  const noCb = new Map(Object.entries(placed));
  const report2 = ib.removeLegacyFarmsOnForest(hexesObj, noCb);
  rules.plan_legacy.push({ hexes, placed, out: ib.planLegacyFarmOnForestRemoval(hexesObj, new Map(Object.entries(placed))) });
  rules.remove_legacy.push({
    hexes, placed, out: report, calls,
    placed_after: Object.fromEntries([...placedMap.entries()].sort(([a], [b]) => (a < b ? -1 : 1))),
    report_no_callback: report2,
    placed_after_no_callback: Object.fromEntries([...noCb.entries()].sort(([a], [b]) => (a < b ? -1 : 1))),
  });
}

rules.farm_base_terrain = [];
rules.owce_base_terrain = [];
for (const teren of TERENY) {
  for (const nakladka of NAKLADKI) {
    rules.farm_base_terrain.push({ teren, nakladka, out: ib.isFarmBaseTerrain(teren, nakladka) });
    rules.owce_base_terrain.push({ teren, nakladka, out: ib.isOwceBaseTerrain(teren, nakladka) });
  }
}

rules.forest_blocked = [];
rules.stadnina_blocked = [];
for (const key of ALL_KEYS) {
  for (const nakladka of NAKLADKI) {
    rules.forest_blocked.push({ key, nakladka, out: ib.isImprovementBlockedOnForest(key, nakladka) });
    rules.stadnina_blocked.push({ key, nakladka, out: ib.isStadninaBlockedOnForest(key, nakladka) });
  }
}

rules.forest_hint = ALL_KEYS.map((key) => ({ key, out: ib.getImprovementForestBlockHint(key) }));

rules.replaced_by_build = [];
rules.impact = [];
for (let i = 0; i < 3000; i++) {
  const key = pick(ALL_KEYS);
  const existing = chance(0.15) ? randLayers(6) : subset(KEYS, 0.2);
  rules.replaced_by_build.push({ key, existing, out: ib.improvementsReplacedByBuild(key, existing) });
  const hex = { terenBazowy: pick(TERENY), nakladka: pick(NAKLADKI) };
  rules.impact.push({ key, teren: hex.terenBazowy, nakladka: hex.nakladka, existing, out: u(ib.computeImprovementBuildImpact(key, hex, existing)) });
}
// pelne pokrycie pojedynczych warstw
for (const key of ALL_KEYS) {
  for (const ex of [[], ...KEYS.map((x) => [x])]) {
    rules.replaced_by_build.push({ key, existing: ex, out: ib.improvementsReplacedByBuild(key, ex) });
    for (const nakladka of [Nakladka.Brak, Nakladka.Las, Nakladka.ZlozeOwiec]) {
      for (const teren of [TerenBazowy.Wzgorza, TerenBazowy.Laka]) {
        rules.impact.push({ key, teren, nakladka, existing: ex, out: u(ib.computeImprovementBuildImpact(key, { terenBazowy: teren, nakladka }, ex)) });
      }
    }
  }
}

rules.format_impact = Array.from({ length: 200 }, () => {
  const impact = { removedImprovements: randLayers(4), removesForest: chance(0.4) };
  return { impact, out: ib.formatImprovementBuildImpactList(impact) };
});

rules.mine_key = [...ALL_KEYS, null, undefined].map((key) => ({ key: u(key), out: ib.isMineImprovementKey(key) }));
rules.mine_keys_set = [...ib.MINE_IMPROVEMENT_KEYS].sort();
rules.food_layer_keys_set = [...ib.FOOD_LAYER_KEYS].sort();

rules.tarasy_civ = [...CIVS, 'INKOWIE', 'chinczycy ', ' inca', 'Incas ', 'xchiny', 'chiny2', '﻿chiny'].map((civ) => ({ civ: u(civ), out: ib.isTarasyCiv(civ) }));

function randHex() {
  const h = { terenBazowy: pick(TERENY), nakladka: pick(NAKLADKI) };
  const z = pick(ZLOZA);
  if (z !== undefined) h.zloze = z;
  return h;
}

rules.deposit_hex = [];
for (let i = 0; i < 600; i++) {
  const hex = randHex();
  rules.deposit_hex.push({
    hex: { teren: hex.terenBazowy, nakladka: hex.nakladka, zloze: u(hex.zloze) },
    blocking_farm: ib.hasBlockingDepositForFarm(hex),
    clay: ib.hexHasClayDeposit(hex),
    reserve: ib.hexHasDepositReserve(hex),
  });
}
rules.deposit_allows = [];
for (const key of ALL_KEYS) {
  for (let i = 0; i < 80; i++) {
    const hex = randHex();
    rules.deposit_allows.push({
      key, hex: { teren: hex.terenBazowy, nakladka: hex.nakladka, zloze: u(hex.zloze) },
      out: ib.depositAllowsPlayerImprovement(key, hex),
    });
  }
}
rules.animal_deposit = NAKLADKI.map((nakladka) => ({ nakladka, out: ib.hasAnimalDeposit(nakladka) }));

rules.food_layer = [];
const FOODISH = ['farma', 'irygacja', 'bydlo', 'owce', 'lama', 'tarasy', 'droga', 'tartak', 'xyz'];
for (let i = 0; i < 4000; i++) {
  const existing = Array.from({ length: int(5) }, () => pick(FOODISH));
  const newKey = pick(FOODISH);
  rules.food_layer.push({ existing, new_key: newKey, out: ib.canAddFoodLayer(existing, newKey) });
}
// wszystkie podzbiory warstw zywnosci x klucz
const FOOD6 = ['farma', 'irygacja', 'bydlo', 'owce', 'lama', 'tarasy'];
for (let mask = 0; mask < 64; mask++) {
  const existing = FOOD6.filter((_, i) => mask & (1 << i));
  for (const newKey of FOODISH) rules.food_layer.push({ existing, new_key: newKey, out: ib.canAddFoodLayer(existing, newKey) });
}

// livestock-unlock / panel
rules.livestock = {
  inca: CIVS.map((civ) => ({ civ: u(civ), inca: live.isIncaCiv(civ), new_world: live.isNewWorldCiv(civ) })),
  key_from: ALL_KEYS.concat(['PASTWISKO', ' bydlo', 'lama ']).map((key) => ({ key, out: u(live.livestockKeyFromImprovement(key)) })),
  allowed: [],
  unlocked: [],
  visible: [],
};
const ERAS = [undefined, 0, 1, 2, 2.9, 3, 3.5, 4, -1];
for (const key of ALL_KEYS) {
  for (const civ of CIVS) {
    for (const era of ERAS) {
      if (era === undefined) continue;
      rules.livestock.allowed.push({ civ: u(civ), key, era, out: live.isLivestockAllowed(civ, key, era) });
    }
    for (const era of ERAS) {
      rules.livestock.visible.push({ key, civ: u(civ), era: u(era), out: ib.isImprovementVisibleInBuildPanel(key, civ, era) });
    }
  }
  for (const nakladka of NAKLADKI) {
    for (const trade of [false, true]) {
      for (const stock of [0, 49, 49.999, 50, 51, 1000, -5]) {
        rules.livestock.unlocked.push({ key, nakladka, trade, stock, out: live.isLivestockUnlockedForPlacement(key, { nakladka }, trade, stock) });
      }
    }
  }
}

// okolica::hexKeysWithinRadius
rules.keys_within_radius = [];
for (let i = 0; i < 300; i++) {
  const hexes = {};
  const list = [];
  const R = 4;
  for (let q = -R; q <= R; q++) for (let r = -R; r <= R; r++) if (chance(0.7)) { hexes[`${q},${r}`] = {}; list.push([q, r]); }
  const cq = int(5) - 2, cr = int(5) - 2;
  const rad = pick([0, 1, 2, 2.5, 3, 4.9, 6, -1, 0.5]);
  rules.keys_within_radius.push({ hexes: list, cq, cr, rad, out: okolica.hexKeysWithinRadius(cq, cr, rad, { hexes }) });
}

// hexHasRoad
rules.has_road = Array.from({ length: 400 }, () => {
  const hex = { ulepszenie: pick(ULEPSZENIE_VALUES) };
  if (chance(0.5)) hex.ulepszenia = chance(0.2) ? null : randLayers(3).concat(chance(0.4) ? [pick(['droga', 'droga_brukowana', 'DROGA'])] : []);
  return { hex: { ulepszenie: u(hex.ulepszenie), ulepszenia: hex.ulepszenia === undefined ? null : hex.ulepszenia }, out: road.hexHasRoad(hex) };
});

// meta / tech
const TECHS = ['Rolnictwo', 'Irygacja', 'Gospodarka wodna', 'Oswojenie zwierząt', 'Jeździectwo', 'Garncarstwo', 'Murarstwo',
  'Łowiectwo', 'Obróbka drewna', 'Żegluga', 'Wojskowość', 'Koło', 'Drogi brukowane', 'Brązownictwo', 'Hutnictwo żelaza', 'Waluta', 'Matematyka'];
rules.meta = ALL_KEYS.concat(['_miasto_zasieg_ref']).map((key) => {
  const m = tech.getImprovementMeta(key);
  return { key, out: m === null ? null : { key: m.key, nazwa: m.nazwa, kosztPraca: m.kosztPraca, techId: u(m.techId), typ: m.typ } };
});
rules.tech_unlocked = [];
for (const key of ALL_KEYS.concat(['_miasto_zasieg_ref'])) {
  rules.tech_unlocked.push({ key, researched: [], out: tech.isImprovementTechUnlocked(key, new Set()) });
  rules.tech_unlocked.push({ key, researched: TECHS, out: tech.isImprovementTechUnlocked(key, new Set(TECHS)) });
  for (let i = 0; i < 40; i++) {
    const researched = subset(TECHS, 0.5);
    rules.tech_unlocked.push({ key, researched, out: tech.isImprovementTechUnlocked(key, new Set(researched)) });
  }
}
rules.work_cost_scale = [1, 2, 2.5, 15, 20, 22, 25, 30].map((base) => ({ base, era: [undefined, 1, 2, 3, 4].map((era) => u(tImp.scaleTerrainImprovementWorkCost(base, era))) }));

out('rules.json', rules);

// ---------------------------------------------------------------------------------------------
// qualifier.json: stany + kwalifikacja + API
// ---------------------------------------------------------------------------------------------
function randTerrain() {
  const x = rnd();
  if (x < 0.22) return TerenBazowy.Laka;
  if (x < 0.42) return TerenBazowy.Rownina;
  if (x < 0.60) return TerenBazowy.Wzgorza;
  if (x < 0.70) return TerenBazowy.Gory;
  if (x < 0.78) return TerenBazowy.Pustynia;
  if (x < 0.84) return TerenBazowy.Polarny;
  if (x < 0.92) return TerenBazowy.PlytkieMorze;
  return TerenBazowy.Morze;
}

function randNakladka() {
  const x = rnd();
  if (x < 0.4) return Nakladka.Brak;
  if (x < 0.65) return Nakladka.Las;
  return pick(NAKLADKI);
}

function buildState(forest = false, mode = null) {
  const radius = 3 + int(4);
  const noLas = forest && chance(0.12);
  const hexes = [];
  const hexMap = {};
  for (let q = -radius; q <= radius; q++) {
    for (let r = Math.max(-radius, -q - radius); r <= Math.min(radius, -q + radius); r++) {
      if (chance(0.06)) continue; // dziury w mapie
      const h = {
        q, r, teren: forest ? (chance(0.45) ? pick([TerenBazowy.Gory, TerenBazowy.Morze, TerenBazowy.PlytkieMorze]) : randTerrain()) : randTerrain(), nakladka: (() => { const n = forest ? (chance(0.7) ? Nakladka.Las : randNakladka()) : randNakladka(); return noLas && n === Nakladka.Las ? Nakladka.Brak : n; })(),
        ulepszenie: chance(0.3) ? pick(ULEPSZENIE_VALUES.filter((x) => x !== undefined)) : undefined,
        ulepszenia: chance(0.35) ? (chance(0.1) ? null : subset(['farma', 'irygacja', 'bydlo', 'owce', 'tartak', 'droga', 'droga_brukowana', 'kopalnia_miedzi', 'glinianka', 'stadnina', 'fort', 'oboz_lowiecki', 'xyz', 'pastwisko', 'kopalnia'], 0.25)) : undefined,
        zloze: pick(ZLOZA),
        rzeka: chance(0.15),
      };
      hexes.push(h);
      const hexObj = {
        coords: { q, r }, terenBazowy: h.teren, nakladka: h.nakladka,
        wlasciciel: null, wioska: { istnieje: false, ludnosc: 0 }, widocznosc: {},
        rzeka: { obecna: h.rzeka, krawedzie: [] },
      };
      if (h.ulepszenie !== undefined) hexObj.ulepszenie = h.ulepszenie; else if (chance(0.7)) hexObj.ulepszenie = 'brak';
      if (h.ulepszenia !== undefined) hexObj.ulepszenia = h.ulepszenia;
      if (h.zloze !== undefined) hexObj.zloze = h.zloze;
      hexMap[`${q},${r}`] = hexObj;
    }
  }
  const riverPaths = [];
  for (let i = 0, n = int(3); i < n; i++) {
    const path = [];
    let q = int(2 * radius + 1) - radius, r = int(2 * radius + 1) - radius;
    for (let s = 0; s < 3 + int(5); s++) { path.push({ q, r }); q += int(3) - 1; r += int(3) - 1; }
    riverPaths.push(path);
  }
  const nodeCount = forest && chance(0.1) ? 0 : 1 + int(3);
  const cityNodes = [];
  for (let i = 0; i < nodeCount; i++) {
    const n = { q: int(5) - 2, r: int(5) - 2, pop: pick([0, 1, 2, 3, 5, 7, 9, 12, 16, 20, 4.5]), level: 1 };
    if (chance(0.1)) n.isOutpost = true;
    if (chance(0.07)) n.isFort = true;
    cityNodes.push(n);
  }
  const keysAll = Object.keys(hexMap);
  const state = { map: { hexes: hexMap, riverPaths }, cityNodes };
  if (forest) {
    if (chance(0.4)) state.clearingHexKeys = new Set(keysAll.filter((k) => hexMap[k].nakladka === Nakladka.Las && chance(0.9)));
    if (chance(0.5)) {
      state.territoryNodes = Array.from({ length: 1 + int(2) }, () => ({ q: int(9) - 4, r: int(9) - 4, pop: pick([2, 5, 9, 14]), level: 1, ownerId: pick([1, 2]) }));
    }
    if (chance(0.5)) state.playerOwnerIdNum = pick([0, 1]);
    if (chance(0.3)) {
      for (const n of cityNodes) { n.q += pick([-9, 9, 0]); n.pop = pick([1, 2]); }
    }
  }
  if (chance(0.5)) state.placedKeys = new Set(subset(keysAll, 0.1));
  if (chance(0.5)) state.roadKeys = new Set(subset(keysAll, 0.1));
  if (chance(0.7)) state.playerCivArchetype = pick(CIVS.filter((x) => x !== null));
  if (chance(0.6)) state.playerEra = pick([0, 1, 2, 2.5, 3, 4, 7]);
  if (mode) {
    // scenariusze ukierunkowane: wszystkie lasy w zasiegu miasta gracza
    cityNodes.length = 0;
    cityNodes.push({ q: 0, r: 0, pop: 15, level: 1 });
    delete state.territoryNodes;
    delete state.playerOwnerIdNum;
    for (const k of keysAll) {
      const h = hexMap[k];
      if (h.nakladka !== Nakladka.Las) continue;
      h.terenBazowy = mode === 'wrong' ? pick([TerenBazowy.Gory, TerenBazowy.Morze, TerenBazowy.PlytkieMorze]) : pick([TerenBazowy.Laka, TerenBazowy.Rownina, TerenBazowy.Wzgorza]);
    }
    if (mode === 'cleared') state.clearingHexKeys = new Set(keysAll.filter((k) => hexMap[k].nakladka === Nakladka.Las));
  }
  if (!forest && chance(0.55)) {
    state.territoryNodes = Array.from({ length: 1 + int(3) }, (_, i) => ({
      q: int(7) - 3, r: int(7) - 3, pop: pick([1, 3, 5, 8, 11, 15]), level: 1, ownerId: i === 0 ? pick([0, 0, 1]) : pick([0, 1, 2]),
      ...(chance(0.1) ? { isFort: true } : chance(0.1) ? { isOutpost: true } : {}),
    }));
    if (chance(0.15)) state.territoryNodes = [];
  }
  if (!forest && chance(0.5)) state.playerOwnerIdNum = pick([0, 1, 2]);
  if (chance(0.4)) {
    state.placedImprovements = new Map();
    for (const key of subset(keysAll, 0.2)) {
      state.placedImprovements.set(key, chance(0.5) ? pick(['farma', 'droga', '', 'tartak', ' FARMA ', 'brak']) : randLayers(3));
    }
  }
  if (chance(0.7)) state.researchedTechs = new Set(subset(TECHS, chance(0.5) ? 0.9 : 0.4));
  if (!forest && chance(0.4)) state.clearingHexKeys = new Set(subset(keysAll, 0.2));
  if (chance(0.4)) {
    state.pendingUndoKeys = new Set(subset(keysAll, 0.1).flatMap((hk) => [`${hk}:${pick(KEYS)}`]));
    if (chance(0.2)) state.pendingUndoKeys.add(':farma');
    if (chance(0.2)) state.pendingUndoKeys.add('nocolon');
    if (chance(0.2)) state.pendingUndoKeys.add('0,0:a:b');
  }
  if (chance(0.4)) state.tradeRouteKonUnlocked = chance(0.5);
  if (chance(0.5)) state.horseStockAvailable = pick([0, 10, 49, 50, 51, 120]);
  if (chance(0.5)) state.ownUnitHexKeys = new Set(subset(keysAll, 0.1));
  return { state, hexes, radius };
}

function ser(state) {
  const s = {
    hexes: Object.values(state.map.hexes).map((h) => ({
      q: h.coords.q, r: h.coords.r, teren: h.terenBazowy, nakladka: h.nakladka,
      ulepszenie: u(h.ulepszenie), ulepszenia: u(h.ulepszenia), zloze: u(h.zloze), rzeka: h.rzeka.obecna,
    })),
    riverPaths: state.map.riverPaths.map((p) => p.map(({ q, r }) => [q, r])),
    cityNodes: state.cityNodes.map((n) => ({ q: n.q, r: n.r, pop: n.pop, isOutpost: u(n.isOutpost), isFort: u(n.isFort) })),
  };
  const setOf = (v) => (v === undefined ? null : [...v]);
  s.placedKeys = setOf(state.placedKeys);
  s.roadKeys = setOf(state.roadKeys);
  s.playerCivArchetype = u(state.playerCivArchetype);
  s.playerEra = u(state.playerEra);
  s.territoryNodes = state.territoryNodes === undefined ? null
    : state.territoryNodes.map((n) => ({ q: n.q, r: n.r, pop: n.pop, isOutpost: u(n.isOutpost), isFort: u(n.isFort), ownerId: n.ownerId }));
  s.playerOwnerIdNum = u(state.playerOwnerIdNum);
  s.placedImprovements = state.placedImprovements === undefined ? null
    : Object.fromEntries([...state.placedImprovements.entries()]);
  s.researchedTechs = setOf(state.researchedTechs);
  s.clearingHexKeys = setOf(state.clearingHexKeys);
  s.pendingUndoKeys = setOf(state.pendingUndoKeys);
  s.tradeRouteKonUnlocked = u(state.tradeRouteKonUnlocked);
  s.horseStockAvailable = u(state.horseStockAvailable);
  s.ownUnitHexKeys = setOf(state.ownUnitHexKeys);
  return s;
}

const qualCases = [];
let totalTrue = 0;
const REASON_TEXTS = [];
{
  // teksty powodow wyciagniete ze zrodla (kolejnosc `return` w getForestBuildBlockReason)
  const { readFileSync } = await import('node:fs');
  const src = readFileSync(`${WEB}/gra/src/map/improvement-build.ts`, 'utf8').split('\n');
  const body = src.slice(1366, 1405); // linie 1367-1405 (1-based)
  for (const line of body) {
    const m = line.match(/return '(.*)';/);
    if (m) REASON_TEXTS.push(m[1]);
  }
  if (REASON_TEXTS.length !== 8) throw new Error(`oczekiwano 8 tekstow powodow, jest ${REASON_TEXTS.length}`);
}
// kolejnosc `return` w zrodle getForestBuildBlockReason (:1367-1405)
const REASON_VARIANTS = ['NoCity', 'AllBeingCleared', 'TartakWrongTerrainAll', 'TartakWrongTerrainSome', 'EnemyTerritory', 'OutsideReach', 'NoForestInTerritory', 'Generic'];
const REASON_BY_TEXT = new Map(REASON_TEXTS.map((t, i) => [t, REASON_VARIANTS[i]]));
const reasonText2Variant = (t) => (t === null ? null : REASON_BY_TEXT.get(t) ?? (() => { throw new Error('nieznany tekst: ' + t); })());

for (let ci = 0; ci < 320; ci++) {
  const { state, hexes } = buildState(ci >= 160, ci >= 280 ? (ci % 2 === 0 ? 'wrong' : 'cleared') : null);
  const queries = hexes.map((h) => [h.q, h.r]);
  for (let i = 0; i < 8; i++) queries.push([int(25) - 12, int(25) - 12]);
  const qualify = ib.buildImprovementQualifier(state);
  const qual = {};
  for (const key of ALL_KEYS) {
    let bits = '';
    for (const [q, r] of queries) {
      const v = qualify(key, q, r);
      bits += v ? '1' : '0';
      if (v) totalTrue++;
    }
    qual[key] = bits;
  }
  // API bez activeKey
  const api = ib.createImprovementBuildApi(state);
  const apiOut = { qualifying: {}, work_cost: {}, requests: [], has_click: api.handleHexClick !== undefined };
  // R2 (zarzut 7): `getQualifyingHexes` dla KAZDEGO klucza w kazdym stanie. Wywolanie chance() zostaje
  // (wynik nieuzywany), zeby strumien Mulberry32 - a wiec wszystkie pozostale wektory - byl bit-w-bit jak w R1.
  ALL_KEYS.filter(() => chance(0.45));
  for (const key of ALL_KEYS) {
    apiOut.qualifying[key] = api.getQualifyingHexes(key).map(({ q, r }) => [q, r]);
    apiOut.work_cost[key] = api.getWorkCost(key);
  }
  for (let i = 0; i < 40; i++) {
    const key = pick(ALL_KEYS);
    const [q, r] = pick(queries);
    const req = api.createBuildRequest(key, q, r);
    apiOut.requests.push({ key, q, r, can_build: api.canBuild(key, q, r), req: req === null ? null : { key: req.key, q: req.q, r: req.r, hexKey: req.hexKey, kosztPraca: req.kosztPraca, action: req.action, type: req.type } });
  }
  // API z activeKey: kliki
  const clicks = [];
  const activeKeys = [pick(KEYS), pick(KEYS), pick(ALL_KEYS), ''];
  for (const activeKey of activeKeys) {
    const calls = [];
    const api2 = ib.createImprovementBuildApi(state, { activeKey: activeKey === '' ? null : activeKey, onSelect: (rq) => calls.push({ key: rq.key, q: rq.q, r: rq.r, hexKey: rq.hexKey, kosztPraca: rq.kosztPraca, action: rq.action }) });
    const results = [];
    for (let i = 0; i < 12; i++) {
      const [q, r] = pick(queries);
      const before = calls.length;
      const res = api2.handleHexClick ? api2.handleHexClick(q, r) : 'NO_HANDLER';
      results.push({ q, r, res: res === 'NO_HANDLER' ? 'NO_HANDLER' : res === null ? null : { key: res.key, q: res.q, r: res.r, hexKey: res.hexKey, kosztPraca: res.kosztPraca, action: res.action }, called: calls.length - before });
    }
    // klik na heksie z pending undo (jesli jest)
    if (state.pendingUndoKeys) {
      for (const comp of [...state.pendingUndoKeys].slice(0, 3)) {
        const idx = comp.lastIndexOf(':');
        if (idx <= 0) continue;
        const hk = comp.slice(0, idx);
        const [qs, rs] = hk.split(',');
        if (!Number.isInteger(Number(qs)) || !Number.isInteger(Number(rs))) continue;
        const before = calls.length;
        const res = api2.handleHexClick ? api2.handleHexClick(Number(qs), Number(rs)) : 'NO_HANDLER';
        results.push({ q: Number(qs), r: Number(rs), res: res === 'NO_HANDLER' ? 'NO_HANDLER' : res === null ? null : { key: res.key, q: res.q, r: res.r, hexKey: res.hexKey, kosztPraca: res.kosztPraca, action: res.action }, called: calls.length - before });
      }
    }
    clicks.push({ active_key: activeKey === '' ? null : activeKey, results, calls_total: calls.length });
  }
  // powody blokady lasu
  const reasons = {};
  for (const key of ['tartak', 'wyrab']) {
    reasons[key] = reasonText2Variant(ib.getForestBuildBlockReason(state, key));
  }
  qualCases.push({ state: ser(state), queries, qual, api: apiOut, clicks, reasons });
}
out('qualifier.json', { cases: qualCases, keys: ALL_KEYS });
console.log('qualifier: stany=%d, wynikow prawdziwych=%d', qualCases.length, totalTrue);

// ---------------------------------------------------------------------------------------------
// gallery.json
// ---------------------------------------------------------------------------------------------
const gallery = { terrain: [], combo: [], show: [] };
for (const key of ALL_KEYS) for (const teren of TERENY) gallery.terrain.push({ key, teren, out: ib.galleryTerrainEligible(key, teren) });
const COMBO_POOL = ['farma', 'bydlo', 'owce', 'irygacja', 'lama', 'tarasy', 'stadnina', 'tartak', 'brak', '', 'droga', 'xyz'];
for (let i = 0; i < 3000; i++) {
  const keys = Array.from({ length: int(5) }, () => pick(COMBO_POOL));
  const teren = pick(TERENY);
  gallery.combo.push({ keys, teren, out: ib.galleryComboEligible(keys, teren) });
  const preview = chance(0.5);
  gallery.show.push({ keys, teren, preview, out: ib.galleryComboShowModel(keys, teren, preview) });
  gallery.show.push({ keys, teren, preview: null, out: ib.galleryComboShowModel(keys, teren) });
}
out('gallery.json', gallery);

// ---------------------------------------------------------------------------------------------
// teksty zrodlowe (kotwice weryfikatora): liczba linii pliku
// ---------------------------------------------------------------------------------------------
console.log('OK');
