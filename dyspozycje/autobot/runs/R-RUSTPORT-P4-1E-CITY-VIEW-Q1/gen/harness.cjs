'use strict';
// R-RUSTPORT-P4-1E-CITY-VIEW-Q1: wektory widoku miast z webu na pinie 07d2fbd72.
//
// Uruchamia PRAWDZIWY kod pinu skompilowany przez tsc do CommonJS (bez zmian w zrodle):
//   render/cities.ts      CityRenderer.prototype._isCapitalCity / _cityMapLabel / _buildBadgeInput
//                          (wolane dokladnie jak w _syncStatChip, render/cities.ts:944-946)
//   game/display-names.ts formatCityMapLabel (przez _cityMapLabel), shouldForceCultureIconForOwner
//   game/production.ts    frontItem (przez _buildBadgeInput)
//   game/building-stock-cost.ts canAffordBuildingStock (przez _buildBadgeInput), ownerResourceStockAll
//   game/city-fortification.ts cityFortificationKind
//   game/civ-visual.ts    civColorForOwner
//   render/bronzeCity.ts  ikonaIdToBronzeCiv
//   game/capital-capture.ts oldestCityOfOwner
//   game/diplomacy-treaties.ts normalizeTreatyKind
//   game/barbarians.ts    isBarbarian
//   data/civs.json        (dane pinu)
// Moduly 'three' i inne nierozwiazywalne zaleznosci = zaslepka Proxy (zaden z wolanych kodow ich nie uzywa).
//
// Klej z main.ts (zamkniecia w funkcji startowej gry, nie do zaladowania w node: 47 448 linii, DOM) jest
// PRZEPISANY ponizej linia w linie z podanymi numerami linii pinu. To jedyna czesc nie wykonywana z pinu.
//
// Uzycie: node harness.cjs <katalog out tsc> <scenarios.json>  -> JSON na stdout.

const Module = require('module');
const path = require('path');
const fs = require('fs');

function makeStub() {
  const handler = {
    get(_t, p) {
      if (p === '__esModule') return true;
      if (p === Symbol.toPrimitive) return () => 0;
      if (p === 'prototype') return {};
      return proxy;
    },
    apply() { return proxy; },
    construct() { return proxy; },
  };
  const proxy = new Proxy(function stub() {}, handler);
  return proxy;
}
const stubs = [];
const origResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) {
  try {
    return origResolve.call(this, request, parent, ...rest);
  } catch (_e) {
    const key = 'STUB:' + request;
    if (!require.cache[key]) {
      require.cache[key] = { id: key, filename: key, loaded: true, exports: makeStub() };
      stubs.push(request);
    }
    return key;
  }
};

const [outDir, scenariosPath] = process.argv.slice(2);
const req = (p) => require(path.join(outDir, p));
const { CityRenderer } = req('src/render/cities.js');
const { shouldForceCultureIconForOwner } = req('src/game/display-names.js');
const { ownerResourceStockAll } = req('src/game/building-stock-cost.js');
const { cityFortificationKind } = req('src/game/city-fortification.js');
const { civColorForOwner } = req('src/game/civ-visual.js');
const { ikonaIdToBronzeCiv } = req('src/render/bronzeCity.js');
const { oldestCityOfOwner } = req('src/game/capital-capture.js');
const { normalizeTreatyKind } = req('src/game/diplomacy-treaties.js');
const { isBarbarian } = req('src/game/barbarians.js');
const civsData = JSON.parse(fs.readFileSync(path.join(outDir, 'data/civs.json'), 'utf8'));

const proto = CityRenderer.prototype;
const fakeRenderer = { badgeLodLevel: 0 };

function runScenario(sc) {
  const data = { civs: civsData };
  const ME = () => sc.viewer;
  const meNow = () => sc.viewer; // main.ts:2935
  const isMeSafe = (o) => o === meNow(); // main.ts:2936
  const isMe = (o) => o === ME();
  const fogOn = sc.fogActive;
  const visible = new Set(sc.visibleHexes.map(([q, r]) => `${q},${r}`));
  const keyOf = (q, r) => `${q},${r}`;
  // Web City: id 'city' + N (cities.ts foundCity), surowce, startCityState, oblegane.
  const cities = sc.cities.map((c) => {
    const city = { id: `city${c.id}`, ownerId: c.ownerId, name: c.name, q: c.q, r: c.r, population: c.population };
    if (c.surowce !== null) city.surowce = { ...c.surowce };
    if (c.startCityState !== undefined) city.startCityState = c.startCityState;
    if (c.oblegane) city.oblegane = true;
    return city;
  });
  const byId = new Map(sc.cities.map((c) => [`city${c.id}`, c]));
  const cityBuilt = new Map(sc.cities.map((c) => [`city${c.id}`, c.built]));
  const cityProd = new Map(sc.cities.filter((c) => c.production !== null).map((c) => [`city${c.id}`, c.production]));
  const cityOrderState = new Map(sc.cities.map((c) => [`city${c.id}`, { bunt: c.orderBunt, revoltWarning: c.orderRevoltWarning }]));
  const units = sc.units.map((u) => ({ ownerId: u.ownerId, q: u.q, r: u.r }));
  // capitalCityIdByOwner: jawna stolica (Rust: pierwsze miasto z isCapital).
  const capitalCityIdByOwner = new Map();
  for (const c of sc.cities) {
    if (c.isCapital && !capitalCityIdByOwner.has(c.ownerId)) capitalCityIdByOwner.set(c.ownerId, `city${c.id}`);
  }
  const civByOwner = new Map(sc.players.map((p) => [p.id, p.civilization]));
  const diplomacyRelations = new Map(sc.relations.map((r) => [r.a < r.b ? `${r.a}_${r.b}` : `${r.b}_${r.a}`, { status: r.status }]));
  const activeDeals = sc.deals.map((d) => ({ rodzaj: d.rodzaj, strony: d.strony[0] < d.strony[1] ? [d.strony[0], d.strony[1]] : [d.strony[1], d.strony[0]] }));
  const simplifiedDiplomacyOwners = new Set(sc.simplifiedOwners);
  const typCityCopyOwners = new Set(sc.typCopyOwners);
  const clusterCapitalOwnerIds = new Set(sc.clusterCapitalOwnerIds);

  // main.ts:2402-2406, 2415-2422 (bez stanu epok per wlasciciel: czlowiek = epoka startu, AI = gameStartEra()).
  const ERA_ID_TO_NUM = { kamien: 1, braz: 2, zelazo: 3 };
  const gameStartEra = () => ERA_ID_TO_NUM[sc.epochId || 'kamien'] ?? 1;
  const empireEpochForOwner = (_o) => gameStartEra();
  // main.ts:4031-4047 (_menuCivIdByOwner / aiOwnerCivMap = jedna mapa wlasciciel -> civilization).
  function civTypeForOwner(ownerId) {
    const own = civByOwner.get(ownerId);
    if (own !== undefined) return own;
    throw new Error('owner spoza players: ' + ownerId);
  }
  const civColorFn = (o) => civColorForOwner(data.civs, o, civTypeForOwner); // main.ts:4049-4051
  const civRingHexFn = (o) => '#' + civColorFn(o).toString(16).padStart(6, '0'); // main.ts:4080-4082
  // main.ts:10312-10335 (para bez wpisu -> defaultNeutralRelation, status 'neutralni').
  function getDiploRelation(a, b) {
    const key = a < b ? `${a}_${b}` : `${b}_${a}`;
    return diplomacyRelations.get(key) ?? { status: 'neutralni' };
  }
  const ownerCityStateOpts = () => ({ simplifiedOwners: simplifiedDiplomacyOwners, typCopyOwners: typCityCopyOwners, cities }); // main.ts:10388-10394
  function portraitForceCultureIcon(ownerId) { // main.ts:10442-10449
    return shouldForceCultureIconForOwner(ownerId, {
      ...ownerCityStateOpts(),
      clusterCapitalOwnerIds,
      playerCivKey: civTypeForOwner(meNow()),
      ownerCivKey: civTypeForOwner(ownerId),
    });
  }
  function civDisplayNameForOwner(ownerId) { // main.ts:10451-10466
    const civKey = civTypeForOwner(ownerId);
    if (!civKey) return undefined;
    const row = data.civs.cywilizacje.find((c) => c.ikonaId === civKey || c.typCywilizacji === civKey);
    return row?.Cywilizacja != null ? String(row.Cywilizacja) : undefined;
  }
  function isAllianceDealKind(rodzaj) { // main.ts:22653-22656
    const k = normalizeTreatyKind(rodzaj);
    return k === 'sojusz_pelny' || k === 'sojusz_defensywny' || k === 'sojusz_wojskowy';
  }
  function dealInvolvesOwners(deal, a, b) { // main.ts:22679-22682
    const [p0, p1] = a < b ? [a, b] : [b, a];
    return deal.strony[0] === p0 && deal.strony[1] === p1;
  }
  function cityMapOutlineKindForOwner(ownerId) { // main.ts:22659-22672
    if (isMeSafe(ownerId)) return 'player';
    const rel = getDiploRelation(meNow(), ownerId);
    if (rel.status === 'wojna') return 'war';
    if (rel.status === 'sojusz') return 'ally';
    for (const d of activeDeals) {
      if (!isAllianceDealKind(d.rodzaj)) continue;
      if (dealInvolvesOwners(d, meNow(), ownerId)) return 'ally';
    }
    return 'neutral';
  }
  function capitalCityIdForOwner(ownerId) { // main.ts:34999-35003
    const explicit = capitalCityIdByOwner.get(ownerId);
    if (explicit && cities.some((c) => c.id === explicit && c.ownerId === ownerId)) return explicit;
    return oldestCityOfOwner(ownerId, cities)?.id ?? null;
  }
  function unitCountOnHex(q, r) { // main.ts:2901-2907
    let n = 0;
    for (const u of units) if (u.q === q && u.r === r) n++;
    return n;
  }
  const cityFogVisible = (city) => { // main.ts:13082-13086
    if (!fogOn) return true;
    if (city.ownerId === ME()) return true;
    return visible.has(keyOf(city.q, city.r));
  };
  const itemStockCost = (item) => ({ ...(sc.itemStockCost[`${item.kind}:${item.id}`] ?? {}) });
  // main.ts:2939-3004 `_cityRenderOpts` (bez hoverStatChipCityId / hideStatChips / isVisible panelu).
  const opts = {
    getEra: (o) => empireEpochForOwner(o),
    getCiv: (o) => ikonaIdToBronzeCiv(civTypeForOwner(o)),
    getLevel: (cityId) => {
      const c = cities.find((x) => x.id === cityId);
      return c ? Math.max(1, Math.min(10, c.population ?? 1)) : 1;
    },
    getWallKind: (cityId) => {
      const built = cityBuilt.get(cityId) ?? [];
      const fk = cityFortificationKind(built);
      return fk === 'mur' ? 'stone' : fk;
    },
    getRevolt: (cityId) => {
      const st = cityOrderState.get(cityId);
      return st?.bunt === true || st?.revoltWarning === true;
    },
    getUnitCountOnHex: (q, r) => unitCountOnHex(q, r),
    getMapOutlineKind: (o) => cityMapOutlineKindForOwner(o),
    ownerColorFn: civColorFn,
    getBuiltBuildingIds: (cityId) => cityBuilt.get(cityId) ?? [],
    getCivIconId: (o) => civTypeForOwner(o),
    getProduction: (cityId) => cityProd.get(cityId) ?? null,
    getOwnerResourceStock: (o) => ownerResourceStockAll(cities, o),
    getProductionItemStockCost: (item) => itemStockCost(item),
    hoverStatChipCityId: null,
    playerOwnerId: ME(),
    isCityStateOwner: portraitForceCultureIcon,
    getCapitalCityId: (o) => capitalCityIdForOwner(o),
    getCivDisplayName: (o) => civDisplayNameForOwner(o),
    getCityGrowth: (city) => byId.get(city.id).growth,
  };

  const owners = [...sc.players].sort((a, b) => a.id - b.id).map((p) => {
    const o = p.id;
    const color = civColorFn(o);
    const isCityState = portraitForceCultureIcon(o);
    const barb = isBarbarian(o);
    const cap = capitalCityIdForOwner(o);
    return {
      ownerId: o,
      color,
      civIconId: civTypeForOwner(o),
      bronzeCiv: opts.getCiv(o),
      era: opts.getEra(o),
      isCityState,
      isBarbarian: barb,
      ringHex: barb || isCityState ? null : civRingHexFn(o), // main.ts:10381-10383
      displayName: civDisplayNameForOwner(o) ?? null,
      mapOutlineKind: cityMapOutlineKindForOwner(o),
      capitalCityId: cap === null ? null : Number(/^city(\d+)$/.exec(cap)[1]),
      relationToViewer: isMe(o) ? 'self' : getDiploRelation(ME(), o).status, // main.ts:4065-4068
    };
  });

  const cityViews = cities.map((city) => {
    // render/cities.ts:944-946 (_syncStatChip)
    const isCapital = proto._isCapitalCity.call(fakeRenderer, city, opts);
    const cityName = proto._cityMapLabel.call(fakeRenderer, city, isCapital, opts);
    const badge = proto._buildBadgeInput.call(fakeRenderer, city, cityName, isCapital, opts);
    delete badge.hoverExpanded;
    delete badge.lodLevel;
    return {
      id: Number(/^city(\d+)$/.exec(city.id)[1]),
      ownerId: city.ownerId,
      hex: { q: city.q, r: city.r },
      population: city.population,
      level: opts.getLevel(city.id),
      wallKind: opts.getWallKind(city.id),
      revolt: opts.getRevolt(city.id),
      besieged: city.oblegane === true,
      fogVisible: cityFogVisible(city),
      unitCountOnHex: opts.getUnitCountOnHex(city.q, city.r),
      badge,
    };
  });
  return { name: sc.name, owners, cities: cityViews };
}

const scenarios = JSON.parse(fs.readFileSync(scenariosPath, 'utf8'));
const out = { pin: '07d2fbd72', stubs: [], scenarios: scenarios.map(runScenario) };
out.stubs = [...new Set(stubs)].sort();
process.stdout.write(JSON.stringify(out, null, 1) + '\n');
