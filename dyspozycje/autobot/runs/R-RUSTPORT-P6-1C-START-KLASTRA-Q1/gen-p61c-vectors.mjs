// P6.1C — wektory z URUCHOMIONEGO weba (pin edb8fb56) dla:
//   gra/src/game/cluster-start.ts   (buildClusterStartPlan + pickSecondHumanStartHex, displayLabelForSlot)
//   gra/src/game/inca-llama-seed.ts (seedIncaLlamaDeposits, hashPos)
//   gra/src/game/braz-access.ts     (empireHasKopalniaMiedzi, cityHasPiecHutniczy, hasBrazAccess)
// Mapy sa generowane PRAWDZIWYM generateMap() weba, spawn plan PRAWDZIWYM buildClusterSpawnPlan()
// (przechwytywany wrapperem obserwacyjnym z p61c-loader-hooks.mjs), kod bez stubow logiki.
// hashPos nie jest eksportowany: wycinamy linie 21-29 inca-llama-seed.ts WERBATIM (kotwice) i importujemy.
//
// Uzycie (z dowolnego katalogu):
//   P61C_WEB_ROOT=<WEB_ROOT> node --experimental-transform-types --no-warnings \
//     --import ./p61c-loader-register.mjs ./gen-p61c-vectors.mjs <WEB_ROOT> <OUT_DIR> <STUB_DIR>
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve as presolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [, , webRootArg, outDirArg, stubDirArg] = process.argv;
if (!webRootArg || !outDirArg || !stubDirArg) {
  console.error('usage: <WEB_ROOT> <OUT_DIR> <STUB_DIR>');
  process.exit(2);
}
const webRoot = presolve(webRootArg);
const outDir = presolve(outDirArg);
const stubDir = presolve(stubDirArg);
mkdirSync(outDir, { recursive: true });
mkdirSync(stubDir, { recursive: true });
const src = (p) => pathToFileURL(join(webRoot, 'gra/src', p)).href;

// wyciszenie logow weba (generateMap/clusters); wyniki liczymy, nie logi
const origLog = console.log;
const origWarn = console.warn;
const quiet = (fn) => {
  console.log = () => {};
  console.warn = () => {};
  try {
    return fn();
  } finally {
    console.log = origLog;
    console.warn = origWarn;
  }
};

const { generateMap } = await import(src('map/generator.ts'));
const { loadGameData } = await import(src('data/loader.ts'));
const clusterStart = await import(src('game/cluster-start.ts'));
const clusterSpawn = await import(src('map/cluster-spawn.ts'));
const llamaSeed = await import(src('game/inca-llama-seed.ts'));
const braz = await import(src('game/braz-access.ts'));
const terrainImp = await import(src('game/terrain-improvements.ts'));
const cities = await import(src('game/cities.ts'));
const dlayers = await import(src('game/diplomacy-layers.ts'));
const data = loadGameData();

// --- hashPos werbatim (inca-llama-seed.ts:21-29) ---
const llamaLines = readFileSync(join(webRoot, 'gra/src/game/inca-llama-seed.ts'), 'utf8').split('\n');
const hashAnchors = {
  l21: llamaLines[20] === 'function hashPos(seed: number, q: number, r: number): number {',
  l22: llamaLines[21] === '  let h = (Math.imul(q | 0, 0x27d4eb2d)',
  l23: llamaLines[22] === '    ^ Math.imul(r | 0, 0x165667b1)',
  l24: llamaLines[23] === '    ^ Math.imul(seed | 0, 0x9e3779b1)) >>> 0;',
  l25: llamaLines[24] === '  h ^= h >>> 15;',
  l26: llamaLines[25] === '  h = Math.imul(h, 0x2c1b3c6d) >>> 0;',
  l27: llamaLines[26] === '  h ^= h >>> 12;',
  l28: llamaLines[27] === '  return (h >>> 0) / 4294967296;',
  l29: llamaLines[28] === '}',
};
for (const [k, v] of Object.entries(hashAnchors)) {
  if (!v) throw new Error(`hashPos anchor drift: ${k}`);
}
const hashStubPath = join(stubDir, 'hash-pos.ts');
writeFileSync(hashStubPath, 'export ' + llamaLines.slice(20, 29).join('\n') + '\n');
const { hashPos } = await import(pathToFileURL(hashStubPath).href);

// --- mapy (prawdziwy generateMap) ---
const MAP_SPECS = [
  { id: 'k42', w: 36, h: 28, seed: 42, typ: 'kontynenty' },
  { id: 'k7', w: 36, h: 28, seed: 7, typ: 'kontynenty' },
  { id: 'p123', w: 36, h: 28, seed: 123, typ: 'pangea' },
  { id: 'k3small', w: 24, h: 18, seed: 3, typ: 'kontynenty' },
  { id: 'w5', w: 40, h: 30, seed: 5, typ: 'wyspy' },
];
const webMaps = {};
const mapsOut = {};
for (const spec of MAP_SPECS) {
  const map = quiet(() => generateMap(spec.w, spec.h, spec.seed, spec.typ));
  webMaps[spec.id] = map;
  mapsOut[spec.id] = {
    w: spec.w,
    h: spec.h,
    seed: spec.seed,
    typ: spec.typ,
    szerokoscQ: map.szerokoscQ,
    wysokoscR: map.wysokoscR,
    // kolejnosc = Object.values(map.hexes) (ma znaczenie dla stabilnego sortowania)
    // 5. kolumna: runtime-owe pole `zloze` (web: (hex as {zloze?: string}).zloze), null gdy brak
    hexes: Object.values(map.hexes).map((h) => [h.coords.q, h.coords.r, h.terenBazowy, h.nakladka, h.zloze ?? null]),
  };
}

const cloneMap = (map) => ({
  ...map,
  hexes: Object.fromEntries(Object.entries(map.hexes).map(([k, h]) => [k, { ...h, coords: { ...h.coords } }])),
});

// UWAGA: plan-level "drugi czlowiek bez legalnego heksu" (pickSecondHumanStartHex -> null w
// buildClusterStartPlan) NIE da sie wywolac na prawdziwym webie: degenerowana mapa (za malo ladu)
// wywala computeClusters (TypeError, clusters.ts:4231) PRZED dojsciem do drugiego czlowieka.
// Sciezka null jest pokryta wektorami pickSecondHumanStartHex wprost (minDistance=100) oraz testem
// Rust wyprowadzonym z kodu (nie z weba), jawnie oznaczonym w P6-1C.md.

// --- stale i relacje ---
const constants = {
  MIN_CITY_DISTANCE: cities.MIN_CITY_DISTANCE,
  MIN_CITY_DISTANCE_START_CITY_STATE: cities.MIN_CITY_DISTANCE_START_CITY_STATE,
  startRelationSameType: dlayers.startRelationForPair(true),
  startRelationOtherType: dlayers.startRelationForPair(false),
  PIEC_HUTNICZY_BUILDING_ID: braz.PIEC_HUTNICZY_BUILDING_ID,
  KOPALNIA_MIEDZI_KEY: braz.KOPALNIA_MIEDZI_KEY,
  LLAMA_START_RADIUS: llamaSeed.LLAMA_START_RADIUS,
  LLAMA_PER_START: llamaSeed.LLAMA_PER_START,
};

// --- serializacja planu (Map/Set -> tablice w kolejnosci wstawienia) ---
const ser = (plan) => ({
  playerStartHex: plan.playerStartHex,
  playerStartCityName: plan.playerStartCityName,
  secondPlayerStartHex: plan.secondPlayerStartHex,
  secondPlayerOwnerId: plan.secondPlayerOwnerId,
  aiStartHexes: plan.aiStartHexes,
  spawnCities: plan.spawnCities,
  foreignTypeClusters: plan.foreignTypeClusters,
  aiOwnerCivMap: [...plan.aiOwnerCivMap],
  ownerDisplayName: [...plan.ownerDisplayName],
  simplifiedDiplomacyOwners: [...plan.simplifiedDiplomacyOwners],
  foreignTypeOwners: [...plan.foreignTypeOwners],
  typCityCopyOwners: [...plan.typCityCopyOwners],
  startRelations: [...plan.startRelations],
  pendingSameTypeRivals: plan.pendingSameTypeRivals,
  pendingSameTypeRivalHexes: plan.pendingSameTypeRivalHexes,
  pendingSameTypeRivalOwnerIds: plan.pendingSameTypeRivalOwnerIds,
  pendingSameTypeRivalsSecond: plan.pendingSameTypeRivalsSecond,
  pendingSameTypeRivalOwnerIdsSecond: plan.pendingSameTypeRivalOwnerIdsSecond,
  clusterCapitalOwnerIds: plan.clusterCapitalOwnerIds,
});

// --- buildClusterStartPlan: macierz przypadkow ---
const SECOND_VARIANTS = [
  { label: 'brak', second: undefined },
  { label: 'losowo-auto', second: 'grecy', mode: 'losowo' },
  { label: 'blisko-owner99', second: 'grecy', mode: 'blisko', ownerId: 99 },
  { label: 'daleko', second: 'egipt', mode: 'daleko' },
  { label: 'domyslny-tryb', second: 'sumer', mode: undefined },
];
const cases = [];
for (const spec of MAP_SPECS) {
  const map = webMaps[spec.id];
  const combos = [];
  for (const civ of ['rzymianie', 'chinczycy']) {
    for (const rywale of [0, 3, 6]) {
      for (const v of SECOND_VARIANTS) combos.push({ civ, rywale, v, pools: true });
    }
  }
  for (const v of [SECOND_VARIANTS[0], SECOND_VARIANTS[1]]) combos.push({ civ: 'rzymianie', rywale: 3, v, pools: false });
  for (const { civ, rywale, v, pools } of combos) {
    const input = {
      map,
      civs: data.civs,
      seed: spec.seed,
      playerCivId: civ,
      rywaleNaKlaster: rywale,
      ...(pools ? { cityNamesPools: data.cityNamesPools } : {}),
      ...(v.second ? { secondHumanCivId: v.second } : {}),
      ...(v.mode ? { humanDistanceMode: v.mode } : {}),
      ...(v.ownerId !== undefined ? { secondHumanOwnerId: v.ownerId } : {}),
    };
    globalThis.__p61c = { names: [], spawnPlans: [], picks: [] };
    const plan = quiet(() => clusterStart.buildClusterStartPlan(input));
    const cap = globalThis.__p61c;
    if (cap.spawnPlans.length !== 1) throw new Error('oczekiwano 1 spawnPlan');
    cases.push({
      map: spec.id,
      label: `${spec.id}/${civ}/r${rywale}/${v.label}/${pools ? 'pools' : 'nopools'}`,
      input: {
        seed: spec.seed,
        playerCivId: civ,
        rywaleNaKlaster: rywale,
        hasPools: pools,
        secondHumanCivId: v.second ?? null,
        humanDistanceMode: v.mode ?? null,
        secondHumanOwnerId: v.ownerId ?? null,
      },
      spawnPlan: cap.spawnPlans[0],
      names: cap.names,
      picks: cap.picks,
      plan: ser(plan),
    });
  }
}
// przypadek bledu (ABC-Q3): fotel 2 = fotel 1
let dupError = null;
try {
  quiet(() => clusterStart.buildClusterStartPlan({
    map: webMaps.k42, civs: data.civs, seed: 42, playerCivId: 'rzymianie', rywaleNaKlaster: 1, secondHumanCivId: 'rzymianie',
  }));
} catch (e) {
  dupError = String(e.message);
}
if (!dupError) throw new Error('duplikat fotela 2 powinien rzucac');

// --- pickSecondHumanStartHex wprost (prawdziwa funkcja) ---
const pickRows = [];
for (const spec of MAP_SPECS) {
  const map = webMaps[spec.id];
  const hexes = Object.values(map.hexes);
  const landish = hexes.filter((h) => !['morze', 'plytkie_morze', 'gory', 'polarny'].includes(h.terenBazowy));
  const primaries = [0, Math.floor(landish.length / 3), Math.floor((2 * landish.length) / 3), landish.length - 1]
    .map((i) => ({ q: landish[i].coords.q, r: landish[i].coords.r }));
  for (const primary of primaries) {
    for (const mode of ['blisko', 'daleko', 'losowo']) {
      for (const seed of [spec.seed, 4294967295]) {
        for (const minDistance of [3, 5, 100]) {
          for (const occupied of [undefined, [{ q: primary.q + 4, r: primary.r }, { q: primary.q - 3, r: primary.r + 5 }, { q: 10, r: 10 }]]) {
            const result = occupied === undefined
              ? clusterSpawn.pickSecondHumanStartHex(map, primary, mode, seed, minDistance)
              : clusterSpawn.pickSecondHumanStartHex(map, primary, mode, seed, minDistance, occupied);
            pickRows.push({ map: spec.id, primary, mode, seed, minDistance, occupied: occupied ?? [], result });
          }
        }
      }
    }
  }
}

// displayLabelForSlot (czysta funkcja)
const labelRows = [
  { nazwaMiasta: 'Cusco' },
  { nazwaMiasta: '' },
  { nazwaMiasta: "Xi'an" },
].map((s) => ({
  slot: { ownerId: 1, q: 0, r: 0, nazwaMiasta: s.nazwaMiasta, typ: 'inkowie', isSameTypeRival: false, isPlayerCapital: false },
  label: clusterSpawn.displayLabelForSlot(data.civs, { ownerId: 1, q: 0, r: 0, nazwaMiasta: s.nazwaMiasta, typ: 'inkowie', isSameTypeRival: false, isPlayerCapital: false }),
}));

writeFileSync(join(outDir, 'maps.json'), JSON.stringify({ pin: 'edb8fb56', generator: 'gen-p61c-vectors.mjs', maps: mapsOut }) + '\n');
writeFileSync(
  join(outDir, 'cluster-start.json'),
  JSON.stringify({
    pin: 'edb8fb56',
    generator: 'gen-p61c-vectors.mjs',
    sourceFiles: ['gra/src/game/cluster-start.ts', 'gra/src/map/cluster-spawn.ts', 'gra/src/game/diplomacy-layers.ts', 'gra/src/game/cities.ts'],
    constants,
    cases,
    duplicateCivError: dupError,
    pickSecond: pickRows,
    displayLabel: labelRows,
  }) + '\n',
);

// --- inca-llama-seed ---
const hashRows = [];
for (const seed of [0, 1, 42, 123456789, 2147483648, 4294967295]) {
  for (const q of [-40, -3, -1, 0, 1, 7, 39]) {
    for (const r of [-30, -2, 0, 5, 29]) {
      hashRows.push({ seed, q, r, h: hashPos(seed, q, r) });
    }
  }
}
// h jako tekst (String(x)) - serde_json bez float_roundtrip parsuje liczby z bledem 1 ulp
const hashRowsOut = hashRows.map((row) => ({ ...row, hText: String(row.h) }));

const llamaCases = [];
for (const spec of MAP_SPECS) {
  const map = webMaps[spec.id];
  const hills = Object.values(map.hexes).filter((h) => h.terenBazowy === 'wzgorza' || h.terenBazowy === 'gory');
  const startsSets = [];
  // starty Inkow z prawdziwego planu (jesli sa), w pierwszej kolejnosci
  globalThis.__p61c = { names: [], spawnPlans: [], picks: [] };
  const plan = quiet(() => clusterStart.buildClusterStartPlan({ map, civs: data.civs, seed: spec.seed, playerCivId: 'rzymianie', rywaleNaKlaster: 3, cityNamesPools: data.cityNamesPools }));
  const incaCluster = plan.foreignTypeClusters.find((g) => g.typ === 'inkowie');
  if (incaCluster) startsSets.push({ label: 'plan-inkowie', starts: incaCluster.positions });
  const h0 = hills[Math.floor(hills.length / 4)];
  const h1 = hills[Math.floor(hills.length / 2)];
  const h1n = hills.find((h) => h !== h1 && Math.abs(h.coords.q - h1.coords.q) <= 2 && Math.abs(h.coords.r - h1.coords.r) <= 2) ?? hills[hills.length - 1];
  startsSets.push({ label: 'jeden-start', starts: [{ q: h0.coords.q, r: h0.coords.r }] });
  startsSets.push({ label: 'nakladajace-sie', starts: [{ q: h1.coords.q, r: h1.coords.r }, { q: h1n.coords.q, r: h1n.coords.r }] });
  startsSets.push({ label: 'brak-startow', starts: [] });
  for (const ss of startsSets) {
    for (const params of [{}, { perStart: 1, radius: 2 }, { perStart: 5, radius: 4 }, { perStart: 0, radius: 3 }]) {
      for (const avoidKind of ['brak', 'starty+sasiedzi']) {
        for (const zlozeKind of ['brak', 'wzgorza-co-3']) {
          for (const seed of [spec.seed, 0, 4294967295]) {
            const m = cloneMap(map);
            const zlozeKeys = [];
            if (zlozeKind !== 'brak') {
              let i = 0;
              for (const h of Object.values(m.hexes)) {
                if (h.terenBazowy === 'wzgorza' || h.terenBazowy === 'gory') {
                  if (i % 3 === 0) {
                    h.zloze = i % 2 === 0 ? 'zelazo' : '';
                    zlozeKeys.push([h.coords.q, h.coords.r, h.zloze]);
                  }
                  i++;
                }
              }
            }
            const avoid = new Set();
            if (avoidKind !== 'brak') {
              for (const s of ss.starts) {
                avoid.add(`${s.q},${s.r}`);
                avoid.add(`${s.q + 1},${s.r}`);
                avoid.add(`${s.q},${s.r + 1}`);
              }
            }
            const before = Object.fromEntries(Object.entries(m.hexes).map(([k, h]) => [k, h.nakladka]));
            const args = [m, seed, ss.starts, avoid];
            if (params.perStart !== undefined) args.push(params.perStart, params.radius);
            const seeded = llamaSeed.seedIncaLlamaDeposits(...args);
            const changed = Object.entries(m.hexes)
              .filter(([k, h]) => h.nakladka !== before[k])
              .map(([, h]) => [h.coords.q, h.coords.r, before[`${h.coords.q},${h.coords.r}`], h.nakladka]);
            llamaCases.push({
              map: spec.id,
              label: `${spec.id}/${ss.label}/${params.perStart ?? 'def'}-${params.radius ?? 'def'}/${avoidKind}/${zlozeKind}/s${seed}`,
              seed,
              starts: ss.starts,
              avoid: [...avoid],
              zloze: zlozeKeys,
              perStart: params.perStart ?? null,
              radius: params.radius ?? null,
              seeded,
              changed,
            });
          }
        }
      }
    }
  }
}
writeFileSync(
  join(outDir, 'llama.json'),
  JSON.stringify({
    pin: 'edb8fb56',
    generator: 'gen-p61c-vectors.mjs',
    sourceFile: 'gra/src/game/inca-llama-seed.ts',
    hashPosSource: 'gra/src/game/inca-llama-seed.ts:21-29 (werbatim, kotwice sprawdzone, stubs/hash-pos.ts)',
    hash: hashRowsOut,
    cases: llamaCases,
  }) + '\n',
);

// --- braz-access ---
const rawKeys = [
  ...terrainImp.IMPROVEMENT_KEYS,
  '_meta', '_miasto_zasieg_ref', 'pastwisko', 'brak', '', 'foo', 'KOPALNIA_MIEDZI', ' kopalnia_miedzi', 'kopalnia_miedzi ',
  'kopalnia', 'Kopalnia_miedzi', 'bydlo', 'trzoda', 'cattle', 'copper_mine',
];
const protoKeys = ['constructor', 'toString', '__proto__', 'hasOwnProperty'];
const normalizeRows = rawKeys.map((raw) => ({ raw, result: terrainImp.normalizeImprovementKey(raw) ?? null }));
const normalizeNullish = [null, undefined].map((raw, i) => ({ kind: i === 0 ? 'null' : 'undefined', result: terrainImp.normalizeImprovementKey(raw) ?? null }));
const normalizeProto = protoKeys.map((raw) => ({ raw, result: terrainImp.normalizeImprovementKey(raw) ?? null }));

const placedSets = [
  { label: 'puste', values: [] },
  { label: 'jedno-miedz', values: ['kopalnia_miedzi'] },
  { label: 'jedno-zelazo', values: ['kopalnia_zelaza'] },
  { label: 'warstwy-z-miedzia', values: [['droga', 'kopalnia_miedzi']] },
  { label: 'warstwy-bez-miedzi', values: [['droga', 'farma'], ['tartak']] },
  { label: 'mieszane', values: ['farma', ['droga', 'brak'], 'foo', 'kopalnia_miedzi'] },
  { label: 'same-brak', values: ['brak', '', ['brak', '']] },
  { label: 'alias-pastwisko', values: ['pastwisko'] },
  { label: 'wielkie-litery', values: ['KOPALNIA_MIEDZI'] },
  { label: 'proto', values: ['constructor', ['toString', '__proto__']] },
  { label: 'puste-warstwy', values: [[]] },
];
const copperRows = [];
for (const s of placedSets) {
  const map = new Map(s.values.map((v, i) => [`${i},0`, v]));
  copperRows.push({ label: s.label, values: s.values, hasMap: true, result: braz.empireHasKopalniaMiedzi(map) });
}
copperRows.push({ label: 'null', values: [], hasMap: false, kind: 'null', result: braz.empireHasKopalniaMiedzi(null) });
copperRows.push({ label: 'undefined', values: [], hasMap: false, kind: 'undefined', result: braz.empireHasKopalniaMiedzi(undefined) });

const builtSets = [[], ['odlewnia_brazu'], ['odlewnia_zelaza'], ['wielka_odlewnia'], ['piec'], ['odlewnia_brazu', 'x'], ['Odlewnia_brazu']];
const pietRows = builtSets.map((ids) => ({ builtIds: ids, result: braz.cityHasPiecHutniczy(ids) }));

const stocks = [
  { kind: 'null', value: null },
  { kind: 'undefined', value: undefined },
  { kind: 'record', value: {} },
  { kind: 'record', value: { braz: 0 } },
  { kind: 'record', value: { braz: 5 } },
  { kind: 'record', value: { braz: -1 } },
  { kind: 'record', value: { braz: 0.5 } },
  { kind: 'record', value: { inne: 9 } },
  { kind: 'record', value: { braz: 3, inne: 9 } },
  { kind: 'map', value: new Map([['0,0', 'kopalnia_miedzi']]) },
];
const builtOpts = [undefined, [], ['odlewnia_brazu'], ['odlewnia_zelaza'], ['wielka_odlewnia'], ['x']];
const accessRows = [];
for (const s of stocks) {
  for (const b of builtOpts) {
    accessRows.push({
      stock: s.kind === 'record' ? { kind: 'record', value: s.value } : { kind: s.kind },
      builtIds: b === undefined ? null : b,
      result: braz.hasBrazAccess(s.value, b),
    });
  }
}
writeFileSync(
  join(outDir, 'braz.json'),
  JSON.stringify({
    pin: 'edb8fb56',
    generator: 'gen-p61c-vectors.mjs',
    sourceFiles: ['gra/src/game/braz-access.ts', 'gra/src/game/terrain-improvements.ts'],
    improvementKeys: terrainImp.IMPROVEMENT_KEYS,
    normalize: normalizeRows,
    normalizeNullish,
    normalizeProtoOutOfDomain: normalizeProto,
    copper: copperRows,
    piec: pietRows,
    access: accessRows,
  }) + '\n',
);

console.log(
  `OK maps=${MAP_SPECS.length} cases=${cases.length} pick=${pickRows.length} label=${labelRows.length} hash=${hashRowsOut.length} llama=${llamaCases.length} normalize=${normalizeRows.length} copper=${copperRows.length} piec=${pietRows.length} access=${accessRows.length}`,
);
