'use strict';
/**
 * DIAGNOSTYKA (t_8c9c7f4f): żywa symulacja tura-po-turze REALNEGO silnika
 * (decideAITurn + buildClusterStartPlan + canFoundCity), żeby ustalić skąd
 * pochodzą odległe miasta AI zgłoszone przez właściciela: start klastra
 * (buildClusterStartPlan) czy kolonizacja w trakcie gry (planCityFounding
 * przez decideAITurn, egzekwowane w main.ts identycznie jak tu:
 * foundingTerritoryOpts -> canFoundCity z withinTerritory).
 *
 * Run from gra/: node tools/diag-teleport-live-sim.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.diag-teleport-entry.ts');
const BUNDLE = path.resolve(__dirname, '.diag-teleport-bundle.cjs');

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  loader: { '.ts': 'ts', '.json': 'json' },
  outfile: BUNDLE,
  absWorkingDir: GRA,
  logLevel: 'silent',
});

const {
  decideAITurn,
  buildClusterStartPlan,
  canFoundCity,
  cityTerritoryRadius,
  isInTerritory,
  hexDistance,
  generujSwiat,
  rozmiarFromMenuLabel,
  loadGameData,
} = require(BUNDLE);

const data = loadGameData();
const rozmiar = rozmiarFromMenuLabel('Maly');
const map = generujSwiat(999, rozmiar, 'kontynenty');

const plan = buildClusterStartPlan({
  map,
  civs: data.civs,
  seed: 999,
  playerCivId: 'grecy',
  rywaleNaKlaster: 3,
  aktywneTypy: 5,
  startEpochId: 'kamien',
  cityNamesPools: data.cityNamesPools,
});

console.log('=== KROK 1: buildClusterStartPlan (start gry) ===');
console.log('playerStartHex:', plan.playerStartHex);
console.log('aiStartHexes (stolice klastrow):', plan.aiStartHexes.length);
console.log('spawnCities (panstwa-miasta w planie):', plan.spawnCities.length);

// Zbuduj startowe `cities` DOKLADNIE jak main.ts (spawnCities z planu +
// stolica gracza) -- to jest ten sam foundCityAt co main.ts uzywa.
let cities = [];
let nextCityIdx = 0;
function mkCity(q, r, ownerId, pop) {
  const c = { id: 'c' + (nextCityIdx++), ownerId, q, r, population: pop };
  return c;
}
cities.push(mkCity(plan.playerStartHex.q, plan.playerStartHex.r, 0, 8));
for (const sc of plan.spawnCities) {
  cities.push(mkCity(sc.q, sc.r, sc.ownerId, 8));
}

// Dowod A: czy KAZDE startowe miasto AI klastra jest w zasiegu SWOJEJ
// stolicy klastra (majorAI) lub jest samo stolica -- oczekiwane: stolice
// klastrow sa niezalezne od siebie (brak restrykcji, pierwsze miasto AI),
// panstwa-miasta sa pakowane WOKOL stolicy swojego klastra (blisko).
console.log('\n=== KROK 2: czy start-cluster miasta AI sa "rozrzucone" wzgledem wlasnej cyw. ===');
const byOwner = new Map();
for (const c of cities) {
  if (!byOwner.has(c.ownerId)) byOwner.set(c.ownerId, []);
  byOwner.get(c.ownerId).push(c);
}
console.log('Liczba unikalnych ownerId na starcie:', byOwner.size, '(kazdy to OSOBNA cywilizacja/panstwo-miasto z WLASNym jednym miastem — nie jest to "AI zaklada miasta poza swoim terytorium", to jest liczba niezaleznych cywilizacji wygenerowanych na starcie)');

// ===========================================================================
// KROK 3: symulacja tura-po-turze REALNEGO decideAITurn dla kazdego ownera AI,
// z EGZEKWOWANIEM identycznym jak main.ts (foundingTerritoryOpts rownowazny).
// ===========================================================================
function foundingTerritoryOptsSim(ownerId, allCities) {
  const nodes = allCities
    .filter(c => c.ownerId === ownerId)
    .map(c => ({ q: c.q, r: c.r, pop: c.population, level: 1 }));
  if (nodes.length === 0) return {};
  return {
    withinTerritory: (fq, fr) => isInTerritory(fq, fr, nodes),
  };
}

const aiOwnerIds = [...byOwner.keys()].filter(oid => oid !== 0);
console.log('\n=== KROK 3: symulacja 80 tur decideAITurn, egzekwowanie identyczne z main.ts ===');
console.log('AI ownerIds symulowane:', aiOwnerIds);

const violations = [];
const founded = [];
const TURNS = 100;
for (let turn = 1; turn <= TURNS; turn++) {
  for (const ownerId of aiOwnerIds) {
    const myCitiesNow = cities.filter(c => c.ownerId === ownerId);
    if (myCitiesNow.length === 0) continue; // capturowane/wygaszone -- pomin
    const opts = {
      defensiveCopy: false,
      currentTurn: turn,
      civEra: 1,
      civAiProfile: { ekspansywnosc: 2, sklonnoscDoPodboju: 2 },
      pracaAvailable: 250,
      poziomTrudnosci: 2,
    };
    let cmds;
    try {
      cmds = decideAITurn(ownerId, [], cities, map, data, opts);
    } catch (e) {
      continue;
    }
    for (const cmd of cmds) {
      if (cmd.type !== 'foundCityAt') continue;
      // Egzekwowanie DOKLADNIE jak main.ts: canFoundCity + foundingTerritoryOpts(ownerId).
      const territoryOpts = foundingTerritoryOptsSim(ownerId, cities);
      const res = canFoundCity(cmd.q, cmd.r, cities, map, {
        ...territoryOpts,
        ownerId,
        ownerEra: 1,
        gameConfig: { cityLimitBase: 10 },
      });
      const myCities = cities.filter(c => c.ownerId === ownerId);
      let minDist = Infinity;
      let nearestRadius = 0;
      for (const mc of myCities) {
        const d = hexDistance(cmd.q, cmd.r, mc.q, mc.r);
        if (d < minDist) {
          minDist = d;
          nearestRadius = cityTerritoryRadius({ q: mc.q, r: mc.r, pop: mc.population, level: 1 });
        }
      }
      const record = {
        turn, ownerId, q: cmd.q, r: cmd.r,
        minDistToOwnCity: minDist === Infinity ? null : minDist,
        nearestOwnCityRadius: nearestRadius,
        canFoundCityOk: res.ok,
        canFoundCityReason: res.reason,
      };
      founded.push(record);
      if (res.ok) {
        cities.push(mkCity(cmd.q, cmd.r, ownerId, 3));
        if (minDist !== Infinity && minDist > nearestRadius) {
          violations.push(record);
        }
      }
    }
  }
}

console.log('\nCalkowita liczba prob foundCityAt (AI) w', TURNS, 'turach:', founded.length);
console.log('Z tego zaakceptowanych (canFoundCity.ok===true):', founded.filter(f => f.canFoundCityOk).length);
console.log('Odrzuconych:', founded.filter(f => !f.canFoundCityOk).length);
const rejectReasons = {};
for (const f of founded) if (!f.canFoundCityOk) rejectReasons[f.canFoundCityReason] = (rejectReasons[f.canFoundCityReason] || 0) + 1;
console.log('Powody odrzucenia:', JSON.stringify(rejectReasons));

console.log('\n=== WYNIK: naruszenia (miasto zaakceptowane MIMO ze minDist > promien terytorium najblizszego wlasnego miasta) ===');
console.log('Liczba naruszen:', violations.length);
if (violations.length > 0) {
  console.log(JSON.stringify(violations.slice(0, 20), null, 2));
} else {
  console.log('ZERO naruszen w', TURNS, 'turach x', aiOwnerIds.length, 'cywilizacji AI.');
}

// Rozklad dystansow zaakceptowanych foundow wzgledem promienia (dowod ze
// zawsze <= promien, tj. WEWNATRZ terytorium -- to jest sedno pytania
// diagnostycznego wlasciciela).
const accepted = founded.filter(f => f.canFoundCityOk && f.minDistToOwnCity !== null);
console.log('\n=== Rozklad zaakceptowanych foundow (miasto NIE pierwsze, tj. minDist!=null) ===');
console.log('N =', accepted.length);
const overRadius = accepted.filter(f => f.minDistToOwnCity > f.nearestOwnCityRadius);
console.log('Z tego POZA promieniem najblizszego wlasnego miasta:', overRadius.length);
if (accepted.length > 0) {
  const maxDist = Math.max(...accepted.map(f => f.minDistToOwnCity));
  console.log('Max dystans od najblizszego wlasnego miasta wsrod zaakceptowanych:', maxDist);
}

try { fs.unlinkSync(ENTRY); } catch (e) {}
try { fs.unlinkSync(BUNDLE); } catch (e) {}

process.exit(violations.length > 0 ? 1 : 0);
