'use strict';
/**
 * fortifications-upgrade-chain-ai-test.cjs
 *
 * R-WEB-FORTIFICATIONS-UPGRADE-CHAIN-IMPL-Q1 (2026-11-11), GOAL (e): parytet AI z graczem w lancuchu
 * Palisada -> Mury kamienne -> Mury ceglane. Test BEHAWIORALNY na REALNYM chooseCityProduction (ai.ts) z gate'em
 * isProductionAllowed zbudowanym z REALNEGO availableProduction (production.ts) i realnym buildings.json.
 *
 *  A1 palisada stoi (kopia obronna pod zagrozeniem) -> kandydat = Mury kamienne (awans), NIGDY palisada.
 *  A2 mury kamienne stoja -> kandydat = Mury ceglane (awans; dawniej martwa galaz ternary), NIGDY nizsze.
 *  A3 etap lancucha w kolejce miasta -> AI nie dokłada zadnego drugiego etapu (blokada kolejki wspolna z graczem).
 *  A4 symulacja wielu decyzji (wybor -> kolejka -> ukonczenie): w miescie nigdy wiecej niz jedna fortyfikacja
 *     lancucha, a AI nie placi za etap, ktory nie jest awansem (kazdy zaplacony etap jest wyzszy od poprzedniego).
 *
 * Usage (z gra/): node tools/fortifications-upgrade-chain-ai-test.cjs
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const G = GRA.replace(/\\/g, '/');
let pass = 0; let fail = 0;
function assert(c, m) { if (c) { pass++; console.log('  [OK]', m); } else { fail++; console.error('  [FAIL]', m); } }

const RUN = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
const OUT = path.join(os.tmpdir(), `fort-ai-${RUN}`);
fs.mkdirSync(OUT, { recursive: true });
process.on('exit', () => { try { fs.rmSync(OUT, { recursive: true, force: true }); } catch { /* best-effort */ } });

const entry = path.join(OUT, 'entry.ts');
fs.writeFileSync(entry, `
export { chooseCityProduction, loadDifficultyParams } from '${G}/src/game/ai';
export { availableProduction, applyCompletedBuildingIds, buildingProductionItem } from '${G}/src/game/production';
`);
const outfile = path.join(OUT, 'bundle.cjs');
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', outfile, logLevel: 'silent', loader: { '.json': 'json' } });
const M = require(outfile);

const bRaw = JSON.parse(fs.readFileSync(path.join(GRA, 'data/buildings.json'), 'utf8'));
const buildings = Array.isArray(bRaw) ? bRaw : (bRaw.budynki || bRaw.buildings || bRaw);
const CHAIN = ['palisada', 'mury_kamienne', 'mury'];
const TECHS = ['Obróbka drewna', 'Murarstwo', 'Budownictwo'];
const data = {
  buildings,
  units: [],
  terrainYields: { terrain_types: [{ Teren: 'Równina', Zywnosc: 2, Praca: 1 }] },
  aiParams: {},
};
const map = (() => {
  const hexes = {};
  for (let q = 0; q < 10; q++) for (let r = 0; r < 10; r++) {
    hexes[`${q},${r}`] = { q, r, terenBazowy: 'Równina', nakladka: 0, rzeka: { obecna: false }, droga: { obecna: false } };
  }
  return { width: 10, height: 10, hexes };
})();
const diff = M.loadDifficultyParams(data, 2);
const ZERO = { wojsko: 0, nauka: 0, ekonomia: 0, obrona: 0 };
const mk = (id, ownerId, q, r) => ({ id, ownerId, q, r, name: id, population: 3 });
const cityObj = { id: 'cA', name: 'cA' };

// Kandydaci AI = pick + fallbackIds (cala lista afordowalnych, posortowana po score).
function aiCandidates(built, queue, extra = {}) {
  const myCities = [mk('cA', 7, 3, 3)];
  const enemy = [{ id: 'e1', ownerId: 1, q: 4, r: 3, hp: 10, typ: 'x', Jednostka: 'Wojownik' }];
  const opts = {
    cityBuildings: { cA: built },
    canAfford: () => true,
    defensiveCopy: true,
    isProductionAllowed: (_cid, itemId) => {
      const items = M.availableProduction(cityObj, data, TECHS, { epoch: 3, builtBuildingIds: built, productionQueue: queue });
      if (!buildings.some(b => b.id === itemId)) return true; // jednostki poza zakresem testu
      return items.some(i => i.id === itemId);
    },
    ...extra,
  };
  const pick = M.chooseCityProduction('cA', myCities, enemy, 7, data, ZERO, opts, map, diff);
  const all = [pick, ...(opts.lastProductionFallbackIds || [])].filter(Boolean);
  return { pick, all, chain: all.filter(id => CHAIN.includes(id)) };
}

console.log('\n=== A1: palisada stoi, kopia obronna pod zagrozeniem ===');
{
  const r = aiCandidates(['palisada'], []);
  console.log('  kandydaci:', r.all.join(', '), '| lancuch:', r.chain.join(', ') || '-');
  assert(!r.chain.includes('palisada'), 'A1a AI nie proponuje palisady, gdy juz stoi');
  assert(r.chain.includes('mury_kamienne'), 'A1b AI proponuje awans na Mury kamienne');
}

console.log('\n=== A2: mury kamienne stoja ===');
{
  const r = aiCandidates(['mury_kamienne'], []);
  console.log('  kandydaci:', r.all.join(', '), '| lancuch:', r.chain.join(', ') || '-');
  assert(r.chain.includes('mury'), 'A2a AI proponuje awans na Mury ceglane (dawniej martwa galaz: nigdy)');
  assert(!r.chain.includes('mury_kamienne') && !r.chain.includes('palisada'), 'A2b AI nie proponuje nizszych etapow');
}

console.log('\n=== A3: etap lancucha w kolejce -> AI nie dokłada drugiego ===');
{
  const q = id => [M.buildingProductionItem(id, data, 1)];
  for (const queued of CHAIN) {
    const r = aiCandidates([], q(queued));
    console.log(`  w kolejce ${queued}: lancuch w kandydatach = [${r.chain.join(', ')}]`);
    assert(r.chain.length === 0, `A3 ${queued} w kolejce -> AI nie proponuje zadnego etapu lancucha`);
  }
  const r2 = aiCandidates(['palisada'], q('mury_kamienne'));
  assert(r2.chain.length === 0, 'A3b palisada stoi + awans w kolejce -> AI nie proponuje kolejnego etapu');
}

console.log('\n=== A4: symulacja decyzji AI (wybor -> kolejka -> ukonczenie) ===');
{
  let built = []; let queue = [];
  const paid = [];
  let maxStanding = 0;
  for (let step = 0; step < 8; step++) {
    const r = aiCandidates(built, queue);
    const chainPick = r.pick && CHAIN.includes(r.pick) ? r.pick : (r.chain[0] || null);
    if (chainPick && queue.length === 0) {
      paid.push(chainPick);
      queue = [M.buildingProductionItem(chainPick, data, 1)];
      // w trakcie budowy AI nie moze zamowic drugiego etapu
      const during = aiCandidates(built, queue);
      assert(during.chain.length === 0, `A4 krok ${step}: w trakcie budowy ${chainPick} AI nie proponuje kolejnego etapu`);
      built = M.applyCompletedBuildingIds(built, chainPick, buildings);
      queue = [];
    }
    maxStanding = Math.max(maxStanding, built.filter(id => CHAIN.includes(id)).length);
  }
  console.log('  zaplacone etapy w kolejnosci:', paid.join(' -> ') || '-');
  const rank = id => CHAIN.indexOf(id);
  assert(maxStanding <= 1, 'A4a w miescie nigdy wiecej niz jedna fortyfikacja lancucha');
  assert(paid.every((id, i) => i === 0 || rank(id) > rank(paid[i - 1])), 'A4b kazdy kolejny zaplacony etap jest WYZSZY od poprzedniego (awans, brak doplat za ten sam/nizszy)');
}

console.log(`\nWYNIK: ${pass} OK, ${fail} FAIL`);
process.exit(fail === 0 ? 0 : 1);
