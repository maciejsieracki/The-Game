// R-RUSTPORT-P6-SIEGE-TRANSFER-Q6-Q1: generator wektorow dla runCapitalCapturePlunder (main.ts) oraz
// jego zaleznosci czystych z capital-capture.ts.
//
// Zrodla (pin 07d2fbd72f758705f8e1d59cc4968027ffbafe75, pliki tylko do odczytu, poza repo):
//   * gra/src/game/capital-capture.ts: cityFoundOrder, oldestCityOfOwner, wasCapitalOfOldOwner,
//     remainingCitiesOfOwner, transferWholeEstateToWinner, applyCapitalCapturePlunder,
//     barbarianCaptorResourceAccess, barbarianCapturedPowerGain, applyBarbarianAwareCapitalCapturePlunder;
//   * gra/src/game/barbarians.ts: BARBARIAN_OWNER_ID, isBarbarian;
//   * gra/src/game/society-breakdown.ts: REBEL_FACTION_OWNER_ID;
//   * gra/src/main.ts: runCapitalCapturePlunder (galaz closure, wycinana po nazwie i wykonywana w node).
//
// Wykonywane REALNIE: wszystkie funkcje wymienione wyzej (typy zdejmowane przez node:module.stripTypeScriptTypes).
// Atrapy (zapisujace wolanie w `calls`, zwracajace deterministyczna wartosc) sa TYLKO dla funkcji UI / spektaklu /
// raportu wymienionych w `STUB_RET` oraz dla `buildObjectivePowerForOwner` (zwraca `lostPower` ze scenariusza) i
// `shouldShowPlayerTriumphCityStateUnification` (zwraca `triumph` ze scenariusza). Wszystkie wolania atrap trafiaja
// do `calls` z argumentami i sa porownywane z Rust (`TriggerUi`). Stan ekonomii (skarbiec/pula pracy/nauka/techy/
// spichlerz) to realne akcesory w pamieci (nie atrapy).
//
// Uzycie:
//   node tests/p6_siege_capital_plunder_gen.mjs <capital-capture.ts@pin> <main.ts@pin> <barbarians.ts@pin> \
//     <society-breakdown.ts@pin> > tests/p6_siege_capital_plunder_vectors/vectors.json

import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';

const [capPath, mainPath, barbPath, societyPath] = process.argv.slice(2);
if (!capPath || !mainPath || !barbPath || !societyPath) {
  throw new Error('uzycie: gen.mjs <capital-capture.ts> <main.ts> <barbarians.ts> <society-breakdown.ts>');
}
const readLines = p => readFileSync(p, 'utf8').split('\n');
const capLines = readLines(capPath);
const mainLines = readLines(mainPath);
const barbLines = readLines(barbPath);
const societyLines = readLines(societyPath);

function extractFn(lines, name) {
  const re = new RegExp(`^\\s*(export )?function ${name}\\(`);
  const start = lines.findIndex(l => re.test(l));
  if (start < 0) throw new Error(`brak funkcji ${name}`);
  const indent = lines[start].match(/^\s*/)[0];
  let end = start + 1;
  while (lines[end] !== indent + '}') end++;
  return lines.slice(start, end + 1).join('\n').replace(/^(\s*)export /, '$1');
}

function extractConst(lines, name) {
  const re = new RegExp(`^\\s*(export )?const ${name}\\b`);
  const start = lines.findIndex(l => re.test(l));
  if (start < 0) throw new Error(`brak stalej ${name}`);
  let end = start;
  while (!lines[end].trimEnd().endsWith(';')) end++;
  return lines.slice(start, end + 1).join('\n').replace(/^(\s*)export /, '$1');
}

const CAP_FNS = [
  'cityFoundOrder',
  'oldestCityOfOwner',
  'wasCapitalOfOldOwner',
  'remainingCitiesOfOwner',
  'transferWholeEstateToWinner',
  'applyCapitalCapturePlunder',
  'barbarianCaptorResourceAccess',
  'barbarianCapturedPowerGain',
  'applyBarbarianAwareCapitalCapturePlunder',
];

const SRC = {
  BARBARIAN_OWNER_ID: extractConst(barbLines, 'BARBARIAN_OWNER_ID'),
  isBarbarian: extractFn(barbLines, 'isBarbarian'),
  REBEL_FACTION_OWNER_ID: extractConst(societyLines, 'REBEL_FACTION_OWNER_ID'),
  runCapitalCapturePlunder: extractFn(mainLines, 'runCapitalCapturePlunder'),
};
for (const f of CAP_FNS) SRC[f] = extractFn(capLines, f);

const NAMES = ['BARBARIAN_OWNER_ID', 'REBEL_FACTION_OWNER_ID', 'isBarbarian', ...CAP_FNS, 'runCapitalCapturePlunder'];
const GLOBALS = new Set(['Math', 'Number', 'Object', 'Array', 'JSON', 'Map', 'Set', 'String', 'Boolean',
  'console', 'undefined', 'NaN', 'Infinity', 'Error', 'Symbol']);

// Wartosci zwracane przez atrapy UI (deterministyczne; Rust odtwarza ten sam kontrakt w TriggerUi).
const STUB_RET = {
  civLabelForOwner: a => `civ${a[0]}`,
  civDisplayNameForOwner: a => `disp${a[0]}`,
  civKeyForOwnerId: a => `key${a[0]}`,
  mocLabel: () => 'Moc',
  buildCityCaptureReportRows: a => ({ kind: a[0].kind }),
  captureReportOneLine: a => `OL:${a[0].kind}`,
  buildSpectacleForElimination: a => `spec:${a[3]}`,
};

// Kodowanie argumentow do porownania z Rust: NaN -> "NaN", undefined -> null, obiekt miasta -> {id}.
function recEnc(v) {
  if (typeof v === 'number' && Number.isNaN(v)) return 'NaN';
  if (v === undefined) return null;
  if (Array.isArray(v)) return v.map(recEnc);
  if (v && typeof v === 'object') {
    if ('id' in v && 'population' in v) return { id: v.id };
    const o = {};
    for (const k of Object.keys(v)) o[k] = recEnc(v[k]);
    return o;
  }
  return v;
}

function stubFn(name, calls, scn) {
  return new Proxy(function () {}, {
    get: (_t, k) => {
      if (k === Symbol.toPrimitive) return () => 0;
      return undefined;
    },
    apply: (_t, _this, args) => {
      calls.push({ fn: name, args: args.map(recEnc) });
      if (name === 'buildObjectivePowerForOwner') return { power: scn.lostPower };
      if (name === 'shouldShowPlayerTriumphCityStateUnification') return scn.triumph;
      const r = STUB_RET[name];
      return r ? r(args) : undefined;
    },
  });
}

const STUB_NAMES = [
  'showHintMessage', 'civLabelForOwner', 'civDisplayNameForOwner', 'civKeyForOwnerId', 'mocLabel',
  'buildCityCaptureReportRows', 'captureReportOneLine', 'recordCityCaptureEvent', 'buildSpectacleForElimination',
  'buildObjectivePowerForOwner', 'shouldShowPlayerTriumphCityStateUnification', 'showTriumphCityStateNotice',
  'recordCivElimEvent', 'eliminateOwner', 'markCityStateDirty',
];

function load(scn, calls, vars) {
  const code = NAMES.map(n => stripTypeScriptTypes(SRC[n])).join('\n');
  const body = `with (S) {\n${code}\nreturn { ${NAMES.join(', ')} };\n}`;
  const stubs = Object.fromEntries(STUB_NAMES.map(n => [n, stubFn(n, calls, scn)]));
  const scope = new Proxy({}, {
    has: (_t, k) => typeof k === 'string' && !GLOBALS.has(k),
    get: (_t, k) => {
      if (k === Symbol.unscopables) return undefined;
      if (k in vars) return vars[k];
      if (k in stubs) return stubs[k];
      throw new Error(`nieznany identyfikator w scenariuszu: ${String(k)}`);
    },
    set: (_t, k, v) => {
      if (!(k in vars)) throw new Error(`zapis do nieznanego identyfikatora: ${String(k)}`);
      vars[k] = v;
      return true;
    },
  });
  return new Function('S', body)(scope);
}

const OWNER_LIST = [-99, -1, 0, 1, 2, 3];

function makeStore(scn) {
  const st = {
    treasury: { ...(scn.store.treasury ?? {}) },
    praca: { ...(scn.store.praca ?? {}) },
    nauka: { ...(scn.store.nauka ?? {}) },
    techs: Object.fromEntries(Object.entries(scn.store.techs ?? {}).map(([k, v]) => [k, [...v]])),
    food: { ...(scn.store.food ?? {}) },
  };
  return st;
}

function makeAccess(st, scn) {
  const acc = {
    getTreasury: o => st.treasury[o] ?? 0,
    setTreasury: (o, v) => { st.treasury[o] = v; },
    getPracaPool: o => st.praca[o] ?? 0,
    setPracaPool: (o, v) => { st.praca[o] = v; },
    getNaukaPool: o => st.nauka[o] ?? 0,
    setNaukaPool: (o, v) => { st.nauka[o] = v; },
    getResearchedTechs: o => new Set(st.techs[o] ?? []),
    addResearchedTechs: (o, ids) => {
      const s = new Set(st.techs[o] ?? []);
      for (const id of ids) s.add(id);
      st.techs[o] = [...s];
    },
  };
  if (scn.foodSupported) {
    acc.getFoodReserve = o => st.food[o] ?? 0;
    acc.setFoodReserve = (o, v) => { st.food[o] = Math.max(0, v); };
  }
  if (scn.capMode === 'value') {
    acc.getFoodCapacity = o => scn.cap?.[o] ?? 0;
  }
  return acc;
}

function finalStore(st, scn) {
  const out = { treasury: {}, praca: {}, nauka: {}, techs: {}, food: scn.foodSupported ? {} : null };
  for (const o of OWNER_LIST) {
    out.treasury[o] = st.treasury[o] ?? 0;
    out.praca[o] = st.praca[o] ?? 0;
    out.nauka[o] = st.nauka[o] ?? 0;
    out.techs[o] = [...(st.techs[o] ?? [])].sort();
    if (scn.foodSupported) out.food[o] = st.food[o] ?? 0;
  }
  return out;
}

function mapOut(m) {
  return Object.fromEntries([...m.entries()].map(([k, v]) => [String(k), v]).sort((a, b) => Number(a[0]) - Number(b[0])));
}

function buildCities(scn) {
  return scn.cities.map(c => ({ id: c.id, name: `N-${c.id}`, ownerId: c.ownerId, population: c.population, surowce: { ...c.surowce } }));
}

function runCase(scn) {
  // Glowna sciezka: runCapitalCapturePlunder (main.ts) z realnym stanem i atrapami UI.
  const st = makeStore(scn);
  const acc = makeAccess(st, scn);
  const calls = [];
  const cities = buildCities(scn);
  const city = cities.find(c => c.id === scn.city);
  const vars = {
    cities,
    capitalCityIdByOwner: new Map(Object.entries(scn.capitalMap ?? {}).map(([k, v]) => [Number(k), v])),
    zdobyczePowerByOwner: new Map(Object.entries(scn.zdobycze ?? {}).map(([k, v]) => [Number(k), v])),
    eliminationSpectacleByLabel: new Map(),
    cityBuilt: new Map(Object.entries(scn.cityBuilt ?? {}).map(([k, n]) => [k, Array.from({ length: n }, () => 0)])),
    capitalCaptureResourceAccess: acc,
    capitalCaptureReportSlot: null,
    typCityCopyOwners: null,
    aiOwnerCivMap: null,
  };
  const S = load(scn, calls, vars);
  const ret = S.runCapitalCapturePlunder(city, scn.oldOwner, scn.newOwner);
  const slot = vars.capitalCaptureReportSlot;
  const main = {
    ret: ret ?? null,
    capitalMap: mapOut(vars.capitalCityIdByOwner),
    zdobycze: mapOut(vars.zdobyczePowerByOwner),
    spectacle: mapOut(vars.eliminationSpectacleByLabel),
    slot: slot ? { kind: slot.rows.kind, oneLine: slot.oneLine } : null,
    store: finalStore(st, scn),
    calls,
  };

  // Czysta sciezka: applyBarbarianAwareCapitalCapturePlunder na swiezym stanie (ta sama logika, bez UI).
  const st2 = makeStore(scn);
  const acc2 = makeAccess(st2, scn);
  const cities2 = buildCities(scn);
  const city2 = cities2.find(c => c.id === scn.city);
  const designated = (scn.capitalMap ?? {})[String(scn.oldOwner)] ?? undefined;
  const S2 = load(scn, [], { cities: cities2 });
  const outcome = S2.applyBarbarianAwareCapitalCapturePlunder(
    city2, scn.oldOwner, scn.newOwner, cities2, acc2, designated, S2.isBarbarian,
  );
  const pure = {
    outcome: outcome
      ? {
          event: outcome.event,
          skarbiecPrzejety: outcome.skarbiecPrzejety,
          naukaPrzejeta: outcome.naukaPrzejeta,
          pracaPoolPrzejeta: outcome.pracaPoolPrzejeta,
          techSkopiowane: outcome.techSkopiowane,
          zywnoscPrzejeta: outcome.zywnoscPrzejeta,
          zywnoscUtracona: outcome.zywnoscUtracona,
          zywnoscOfiaryRazem: recEnc(outcome.zywnoscOfiaryRazem),
          surowcePrzejete: outcome.surowcePrzejete,
          eliminacja: outcome.eliminacja,
          newCapitalIdForOldOwner: outcome.newCapitalIdForOldOwner,
        }
      : null,
    store: finalStore(st2, scn),
  };
  return { main, pure };
}

// --- Scenariusze -----------------------------------------------------------------------------

function makeRnd(seed) {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ID_POOL = ['city0', 'city1', 'city2', 'city3', 'city4', 'city5', 'city9', 'city10', 'city12', 'city17', 'cityX', 'city'];
const RES = ['zloto', 'zelazo', 'drewno', 'kamien'];
const TECHS = ['a', 'b', 'c', 'd', 'e'];

function randomScenario(rnd, idx) {
  const pick = arr => arr[Math.floor(rnd() * arr.length)];
  const ownersAll = [0, 1, 2, 3, -1, -99];
  let oldOwner = pick(rnd() < 0.15 ? [-99] : rnd() < 0.1 ? [-1] : [0, 1, 2, 3]);
  let newOwner = pick(ownersAll);
  if (newOwner === oldOwner) newOwner = oldOwner === 2 ? 3 : 2;
  const nCities = 1 + Math.floor(rnd() * 4);
  const usedIds = new Set();
  const cities = [];
  for (let k = 0; k < nCities; k++) {
    let id;
    do { id = pick(ID_POOL.concat([`city${Math.floor(rnd() * 40)}`])); } while (usedIds.has(id));
    usedIds.add(id);
    const ownerId = rnd() < 0.5 ? oldOwner : pick(ownersAll);
    const surowce = {};
    for (const r of RES) if (rnd() < 0.4) surowce[r] = Math.floor(rnd() * 60) + (rnd() < 0.3 ? 0.5 : 0);
    cities.push({ id, ownerId, population: Math.floor(rnd() * 40), surowce });
  }
  // Zdobyta stolica: ownerId juz = newOwner (wolajacy ustawia przed wywolaniem).
  const ci = Math.floor(rnd() * cities.length);
  cities[ci].ownerId = newOwner;
  const city = cities[ci].id;
  // Stolica ofiary: domyslnie brak wpisu (fallback najstarsze), czasem wskazana (w tym id spoza miast).
  const capitalMap = {};
  const dr = rnd();
  if (dr < 0.35) {
    const own = cities.filter(c => c.ownerId === oldOwner && c.id !== city).map(c => c.id);
    capitalMap[oldOwner] = own.length && rnd() < 0.7 ? pick(own) : city;
  } else if (dr < 0.45) {
    capitalMap[oldOwner] = 'cityZZ';
  }
  const zdobycze = {};
  if (rnd() < 0.3) zdobycze[newOwner] = Math.floor(rnd() * 50);
  const cityBuilt = { [city]: Math.floor(rnd() * 4) };
  const store = { treasury: {}, praca: {}, nauka: {}, techs: {}, food: {} };
  for (const o of [oldOwner, newOwner, 0]) {
    store.treasury[o] = Math.floor(rnd() * 300);
    store.praca[o] = Math.floor(rnd() * 80);
    store.nauka[o] = Math.floor(rnd() * 120);
    store.food[o] = Math.floor(rnd() * 90);
    store.techs[o] = TECHS.filter(() => rnd() < 0.4);
  }
  const foodSupported = rnd() < 0.8;
  const capMode = rnd() < 0.8 ? 'value' : 'absent';
  const cap = { [newOwner]: pick([0, -1, 3, 50, 1000]), 0: pick([0, 40]) };
  return {
    id: `r${String(idx).padStart(3, '0')}`,
    oldOwner, newOwner, city, cities, capitalMap, zdobycze, cityBuilt,
    lostPower: Math.floor(rnd() * 500),
    triumph: rnd() < 0.3,
    foodSupported, capMode, cap, store,
  };
}

const HAND = [];
function hand(id, o) {
  HAND.push({
    id,
    oldOwner: o.oldOwner, newOwner: o.newOwner,
    city: o.cities.find(c => c.ownerId === o.newOwner).id,
    cities: o.cities, capitalMap: o.capitalMap ?? {}, zdobycze: o.zdobycze ?? {},
    cityBuilt: o.cityBuilt ?? { c1: 2 }, lostPower: o.lostPower ?? 120, triumph: o.triumph ?? false,
    foodSupported: o.foodSupported ?? true, capMode: o.capMode ?? 'value', cap: o.cap ?? { [o.newOwner]: 50, 0: 40 },
    store: o.store ?? { treasury: { [o.oldOwner]: 100, [o.newOwner]: 20 }, praca: { [o.oldOwner]: 30, [o.newOwner]: 5 },
      nauka: { [o.oldOwner]: 40, [o.newOwner]: 7 }, techs: { [o.oldOwner]: ['a', 'b', 'c'], [o.newOwner]: ['b'] },
      food: { [o.oldOwner]: 60, [o.newOwner]: 10 } },
  });
}

// Reczne przypadki pokrywajace galezie (stolica/eliminacja, barbarzynca, rebelia, triumf, zywnosc).
hand('h01-rebel-to-player', { oldOwner: -99, newOwner: 0, cities: [{ id: 'c1', ownerId: 0, population: 9, surowce: {} }] });
hand('h02-rebel-to-ai', { oldOwner: -99, newOwner: 2, cities: [{ id: 'c1', ownerId: 2, population: 9, surowce: {} }] });
hand('h03-barb-old-single-city', { oldOwner: -1, newOwner: 0, cities: [{ id: 'c1', ownerId: 0, population: 9, surowce: {} }] });
hand('h04-capital-ai-keeps-cities', { oldOwner: 2, newOwner: 0,
  cities: [{ id: 'c1', ownerId: 0, population: 9, surowce: { zloto: 4 } }, { id: 'c2', ownerId: 2, population: 9, surowce: {} }] });
hand('h05-elim-player-wins-triumph', { oldOwner: 2, newOwner: 0, triumph: true,
  cities: [{ id: 'c1', ownerId: 0, population: 12, surowce: { zloto: 4, kamien: 2 } }] });
hand('h06-elim-player-no-triumph', { oldOwner: 2, newOwner: 0, triumph: false,
  cities: [{ id: 'c1', ownerId: 0, population: 12, surowce: {} }] });
hand('h07-elim-ai-wins-ai-victim', { oldOwner: 3, newOwner: 2,
  cities: [{ id: 'c1', ownerId: 2, population: 12, surowce: {} }] });
hand('h08-elim-player-victim-ai-wins', { oldOwner: 0, newOwner: 2,
  cities: [{ id: 'c1', ownerId: 2, population: 12, surowce: {} }] });
hand('h09-elim-barb-captor', { oldOwner: 2, newOwner: -1,
  cities: [{ id: 'c1', ownerId: -1, population: 12, surowce: {} }] });
hand('h10-capital-barb-captor', { oldOwner: 2, newOwner: -1,
  cities: [{ id: 'c1', ownerId: -1, population: 12, surowce: {} }, { id: 'c2', ownerId: 2, population: 3, surowce: {} }] });
hand('h11-capital-designated-not-oldest', { oldOwner: 2, newOwner: 0,
  cities: [{ id: 'city1', ownerId: 2, population: 5, surowce: {} }, { id: 'city7', ownerId: 0, population: 5, surowce: {} }, { id: 'city9', ownerId: 2, population: 5, surowce: {} }],
  capitalMap: { 2: 'city9' } });
hand('h12-capital-legacy-oldest-kept', { oldOwner: 2, newOwner: 0,
  cities: [{ id: 'city1', ownerId: 0, population: 5, surowce: {} }, { id: 'city10', ownerId: 2, population: 5, surowce: {} }] });
hand('h13-not-capital', { oldOwner: 2, newOwner: 0,
  cities: [{ id: 'city1', ownerId: 2, population: 5, surowce: {} }, { id: 'city10', ownerId: 0, population: 5, surowce: {} }] });
hand('h14-food-over-capacity', { oldOwner: 2, newOwner: 0, cap: { 0: 70, 2: 0 },
  cities: [{ id: 'c1', ownerId: 0, population: 5, surowce: {} }] });
hand('h15-food-no-capacity-accessor', { oldOwner: 2, newOwner: 0, capMode: 'absent',
  cities: [{ id: 'c1', ownerId: 0, population: 5, surowce: {} }] });
hand('h16-food-unsupported', { oldOwner: 2, newOwner: 0, foodSupported: false,
  cities: [{ id: 'c1', ownerId: 0, population: 5, surowce: {} }] });
hand('h17-capacity-zero-means-no-limit', { oldOwner: 2, newOwner: 0, cap: { 0: 0 },
  cities: [{ id: 'c1', ownerId: 0, population: 5, surowce: {} }] });
hand('h18-barb-captor-food-blocked', { oldOwner: 2, newOwner: -1, foodSupported: true,
  cities: [{ id: 'c1', ownerId: -1, population: 5, surowce: {} }] });
hand('h19-barb-captor-capital-keeps-treasury-victim', { oldOwner: 2, newOwner: -1,
  cities: [{ id: 'c1', ownerId: -1, population: 5, surowce: {} }, { id: 'c2', ownerId: 2, population: 1, surowce: {} }] });
hand('h20-elim-techs-already-owned', { oldOwner: 2, newOwner: 0,
  store: { treasury: {}, praca: {}, nauka: {}, techs: { 2: ['x', 'y'], 0: ['x', 'y', 'z'] }, food: {} },
  cities: [{ id: 'c1', ownerId: 0, population: 5, surowce: {} }] });
hand('h21-elim-zero-resources', { oldOwner: 2, newOwner: 0,
  store: { treasury: { 2: 0 }, praca: { 2: 0 }, nauka: { 2: 0 }, techs: {}, food: { 2: 0 } },
  cities: [{ id: 'c1', ownerId: 0, population: 0, surowce: {} }] });
hand('h22-rebel-to-barb', { oldOwner: -99, newOwner: -1, cities: [{ id: 'c1', ownerId: -1, population: 9, surowce: {} }] });
hand('h23-rebel-to-player-ai-kept-triumph', { oldOwner: -99, newOwner: 0, triumph: true, cities: [{ id: 'c1', ownerId: 0, population: 9, surowce: {} }] });
hand('h24-capital-ai-victim-ai-captor', { oldOwner: 2, newOwner: 3,
  cities: [{ id: 'c1', ownerId: 3, population: 9, surowce: { drewno: 3 } }, { id: 'c2', ownerId: 2, population: 9, surowce: {} }] });
hand('h25-capital-player-victim', { oldOwner: 0, newOwner: 2,
  cities: [{ id: 'c1', ownerId: 2, population: 9, surowce: {} }, { id: 'c2', ownerId: 0, population: 9, surowce: {} }] });
hand('h26-elim-player-victim-triumph-flag-ignored', { oldOwner: 0, newOwner: 3, triumph: true,
  cities: [{ id: 'c1', ownerId: 3, population: 9, surowce: {} }] });
hand('h27-nonfloor-population', { oldOwner: 2, newOwner: 0,
  cities: [{ id: 'c1', ownerId: 0, population: 7.9, surowce: { zloto: 2.9 } }] });
hand('h28-designated-missing-city', { oldOwner: 2, newOwner: 0, capitalMap: { 2: 'cityZZ' },
  cities: [{ id: 'c1', ownerId: 0, population: 5, surowce: {} }, { id: 'c2', ownerId: 2, population: 5, surowce: {} }] });
hand('h29-designated-player-owner-eliminated', { oldOwner: 2, newOwner: 0, capitalMap: { 2: 'c1' },
  cities: [{ id: 'c1', ownerId: 0, population: 5, surowce: {} }] });
hand('h30-barb-captor-treasury-noop', { oldOwner: 3, newOwner: -1, store: { treasury: { 3: 500, [-1]: 9 }, praca: { 3: 60 }, nauka: { 3: 90 }, techs: { 3: ['q'] }, food: { 3: 80 } },
  cities: [{ id: 'c1', ownerId: 3, population: 2, surowce: {} }, { id: 'c2', ownerId: -1, population: 2, surowce: {} }] });

hand('h31-elim-triumph-last-city-numbered', { oldOwner: 3, newOwner: 0, triumph: true,
  cities: [{ id: 'city1', ownerId: 0, population: 8, surowce: { kamien: 5 } }] });
hand('h32-capital-player-captor-keeps-cities', { oldOwner: 1, newOwner: 0, triumph: true,
  cities: [{ id: 'city2', ownerId: 0, population: 8, surowce: {} }, { id: 'city6', ownerId: 1, population: 3, surowce: {} }] });
hand('h33-elim-triumph-false-player-captor-zero-treasury', { oldOwner: 2, newOwner: 0, triumph: false,
  store: { treasury: {}, praca: {}, nauka: {}, techs: {}, food: {} },
  cities: [{ id: 'c1', ownerId: 0, population: 4, surowce: { zloto: 1 } }] });

const rnd = makeRnd(0x51e6e6);
const scenarios = [...HAND];
for (let i = 0; i < 90; i++) scenarios.push(randomScenario(rnd, i));

const cases = scenarios.map(s => {
  const { main, pure } = runCase(s);
  const { cities, ...rest } = s;
  return { id: s.id, input: { ...rest, cities }, main, pure };
});

// Czyste funkcje: cityFoundOrder (wartosc JS, Infinity jako "Infinity").
const foundIds = ['city0', 'city9', 'city10', 'city007', 'city', 'cityX', 'city-1', 'city12a', 'xcity3', 'city99999999999'];
const S0 = load({ lostPower: 0, triumph: false, store: {} }, [], { cities: [] });
const foundOrder = foundIds.map(id => {
  const v = S0.cityFoundOrder(id);
  return { id, v: Number.isFinite(v) ? v : 'Infinity' };
});

process.stdout.write(JSON.stringify({
  generator: 'R-RUSTPORT-P6-SIEGE-TRANSFER-Q6-Q1 p6_siege_capital_plunder_gen.mjs',
  source_pin: '07d2fbd72f758705f8e1d59cc4968027ffbafe75',
  cityFoundOrder: foundOrder,
  cases,
}, null, 1) + '\n');
