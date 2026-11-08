const esbuild = require('esbuild');
esbuild.buildSync({
  entryPoints: ['tools/.diag-full-entry.ts'],
  bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  loader: { '.ts': 'ts', '.json': 'json' },
  outfile: 'tools/.diag-full-bundle.cjs',
  absWorkingDir: process.cwd(), logLevel: 'silent',
});
const M = require(require('path').resolve(process.cwd(), 'tools/.diag-full-bundle.cjs'));

const data = M.loadGameData();
const rozmiar = M.rozmiarFromMenuLabel('Maly');

function runScenario(map, plan, seedLabel) {
  console.log('--- SEED', seedLabel, 'spawnCities:', plan.spawnCities.length, '---');

  // Replikuj DOKLADNA kolejnosc main.ts:spawnPendingForeignClusters --
  // kazde miasto klastra foundCityAt po kolei w kolejnosci planu, a stolice
  // major AI dostaja NATYCHMIAST grantDifficultyStartBonusesForMajorCapital.
  const cities = [];
  const playerCity = M.foundCityAt(plan.playerStartHex.q, plan.playerStartHex.r, 0, cities, map, 'Gracz');
  if (playerCity) cities.push(playerCity);

  const capitalOwnerIdsSeen = new Set();
  const params = M.loadDifficultyParams(data, 3); // poziom 3 = Trudny

  let founded = 0, rejected = 0;
  const violations = [];
  for (const sc of plan.spawnCities) {
    const c = M.foundCityAt(sc.q, sc.r, sc.ownerId, cities, map, sc.name || ('Miasto' + sc.ownerId));
    if (!c) { rejected++; continue; }
    cities.push(c);
    founded++;
    const isCapital = !capitalOwnerIdsSeen.has(sc.ownerId);
    if (isCapital) {
      capitalOwnerIdsSeen.add(sc.ownerId);
      const qualifies = M.qualifiesForMajorAiDifficultyBonus(sc.ownerId, false);
      const bonusPlan = M.planMajorAiDifficultyStartBonuses(sc.q, sc.r, params, map, cities, qualifies);
      for (const bc of bonusPlan.cities) {
        const bcity = M.foundCityAt(bc.q, bc.r, sc.ownerId, cities, map, (sc.name || 'Miasto') + bc.nameSuffix);
        if (bcity) {
          cities.push(bcity);
          founded++;
          const dist = M.hexDistance(sc.q, sc.r, bc.q, bc.r);
          const radius = M.cityTerritoryRadius({ q: sc.q, r: sc.r, pop: 1, level: 1 });
          const violated = dist > radius;
          if (violated) {
            console.log('[BONUS CITY VIOLATION] seed=' + seedLabel + ' owner=' + sc.ownerId +
              ' capital=(' + sc.q + ',' + sc.r + ') bonus=(' + bc.q + ',' + bc.r + ') dist=' + dist +
              ' promienTerytoriumStolicy=' + radius);
            violations.push({ seed: seedLabel, ownerId: sc.ownerId, capital: { q: sc.q, r: sc.r }, bonus: { q: bc.q, r: bc.r }, dist, radius });
          }
        } else {
          rejected++;
        }
      }
    }
  }
  console.log('  founded total:', founded, 'rejected:', rejected, 'violations:', violations.length);
  return violations;
}

const seedBase = 4242;
let allViolations = [];
for (let s = 0; s < 8; s++) {
  const seed2 = seedBase + s * 1000;
  const map2 = M.generujSwiat(seed2, rozmiar, 'kontynenty');
  const plan2 = M.buildClusterStartPlan({
    map: map2, civs: data.civs, seed: seed2, playerCivId: 'grecy',
    rywaleNaKlaster: 4, aktywneTypy: 10, startEpochId: 'kamien', cityNamesPools: data.cityNamesPools,
  });
  allViolations = allViolations.concat(runScenario(map2, plan2, seed2));
}
console.log('=== SUMA NARUSZEN TERYTORIUM (kolonia bonusowa POZA promieniem wlasnej stolicy) ===');
console.log('Liczba:', allViolations.length);
console.log(JSON.stringify(allViolations, null, 2));
