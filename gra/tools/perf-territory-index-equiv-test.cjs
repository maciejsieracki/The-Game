'use strict';
/**
 * R-WEB-PERF-LATE-GAME-LAG-HUD-Q2 (R6): test BEHAWIORALNY rownowaznosci przyspieszen geometrii (uruchamia realny kod z src/ przez esbuild bundle):
 *  - territoryOwnerLookup(nodes)(q,r) === territoryOwnerAt(q,r,nodes) dla losowego zestawu miast/fortow/posterunkow (z `order`), na calej siatce;
 *  - makeTerritoryWorkableFilter == stara definicja (isTerritoryHexOwnedBy + baza);
 *  - hexKeysWithinRadius / okolicaTiles z pamiecia == wynik "od zera" (liczony niezaleznie w tescie), w tym po dodaniu filtra;
 *  - zmiana populacji / pozycji / wlasciciela wezla daje inny wynik indeksu (brak nieaktualnych wpisow);
 *  - zwrocona tablica jest swieza (mutacja nie psuje pamieci); tablica kluczy jest zamrozona.
 * Bramka: node tools/perf-territory-index-equiv-test.cjs
 */
const path = require('node:path');
const assert = require('node:assert/strict');
const os = require('node:os');
const fs = require('node:fs');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const entry = `
export { territoryOwnerAt, territoryOwnerLookup, axialDistance } from ${JSON.stringify(path.resolve(__dirname, '../src/map/territory.ts'))};
export { makeTerritoryWorkableFilter, isTerritoryHexOwnedBy } from ${JSON.stringify(path.resolve(__dirname, '../src/map/territory-work.ts'))};
export { hexKeysWithinRadius, okolicaTiles } from ${JSON.stringify(path.resolve(__dirname, '../src/game/okolica.ts'))};
`;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'terr-idx-'));
const out = path.join(tmp, 'bundle.cjs');
esbuild.buildSync({ stdin: { contents: entry, resolveDir: path.resolve(__dirname, '..'), loader: 'ts' }, bundle: true, platform: 'node', format: 'cjs', outfile: out, logLevel: 'silent', loader: { '.json': 'json' } });
const M = require(out);

let seed = 1234567;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));

let pass = 0;
const t = (name, fn) => { fn(); pass++; console.log('PASS:', name); };

function randomNodes(n) {
  const nodes = [];
  for (let i = 0; i < n; i++) {
    const kind = rnd();
    const node = { q: ri(-20, 20), r: ri(-20, 20), pop: ri(1, 18), level: 1, ownerId: ri(0, 5) };
    if (kind > 0.85) { node.isFort = true; if (rnd() > 0.4) node.order = { turn: ri(1, 5), seq: ri(0, 3) }; }
    else if (kind > 0.7) { node.isOutpost = true; if (rnd() > 0.4) node.order = { turn: ri(1, 5), seq: ri(0, 3) }; }
    nodes.push(node);
  }
  return nodes;
}

t('territoryOwnerLookup == territoryOwnerAt (5 zestawow x cala siatka, miasta+forty+posterunki+order)', () => {
  for (const n of [12, 30, 60, 137, 200]) {
    const nodes = randomNodes(n);
    const look = M.territoryOwnerLookup(nodes);
    let bad = 0, owned = 0;
    for (let q = -45; q <= 45; q++) for (let r = -45; r <= 45; r++) {
      const a = M.territoryOwnerAt(q, r, nodes), b = look(q, r);
      if (a !== b) bad++;
      if (a !== null) owned++;
    }
    assert.equal(bad, 0, `n=${n}: ${bad} rozbieznosci`);
    assert.ok(owned > 100, 'zestaw musi pokrywac realne heksy');
  }
});

t('maly zestaw (<12 wezlow) i brak wezlow: identycznie jak oryginal', () => {
  const nodes = randomNodes(5);
  const look = M.territoryOwnerLookup(nodes);
  for (let q = -30; q <= 30; q++) for (let r = -30; r <= 30; r++) assert.equal(look(q, r), M.territoryOwnerAt(q, r, nodes));
  const f = M.makeTerritoryWorkableFilter([], 0, () => true);
  assert.equal(f(0, 0), false);
});

t('zmiana populacji / pozycji / wlasciciela wezla zmienia wynik indeksu (brak nieaktualnych wpisow)', () => {
  const nodes = randomNodes(40);
  const before = [];
  const sample = [];
  for (let i = 0; i < 400; i++) sample.push([ri(-30, 30), ri(-30, 30)]);
  const l1 = M.territoryOwnerLookup(nodes);
  for (const [q, r] of sample) before.push(l1(q, r));
  const mutate = (fn) => {
    const copy = nodes.map(n => ({ ...n }));
    fn(copy);
    const l = M.territoryOwnerLookup(copy);
    for (const [q, r] of sample) assert.equal(l(q, r), M.territoryOwnerAt(q, r, copy));
    return sample.map(([q, r]) => l(q, r));
  };
  const a = mutate(c => { c[0].pop = c[0].pop + 6; c[1].q += 3; c[2].ownerId = (c[2].ownerId + 1) % 6; });
  assert.notDeepEqual(a, before, 'mutacja musi zmienic przynajmniej jeden heks z probki');
  // powrot do stanu pierwotnego daje wynik pierwotny
  const l3 = M.territoryOwnerLookup(nodes);
  assert.deepEqual(sample.map(([q, r]) => l3(q, r)), before);
});

t('makeTerritoryWorkableFilter == stara definicja (baza && isTerritoryHexOwnedBy)', () => {
  const nodes = randomNodes(80);
  const base = (q, r) => ((q * 7 + r * 13) % 5) !== 0;
  for (const owner of [0, 1, 3]) {
    const f = M.makeTerritoryWorkableFilter(nodes, owner, base);
    const g = M.makeTerritoryWorkableFilter(nodes, owner);
    for (let q = -35; q <= 35; q++) for (let r = -35; r <= 35; r++) {
      const old = (base(q, r)) && M.isTerritoryHexOwnedBy(q, r, owner, nodes);
      assert.equal(f(q, r), old);
      assert.equal(g(q, r), M.isTerritoryHexOwnedBy(q, r, owner, nodes));
    }
  }
});

function makeMap(w, h, holes) {
  const hexes = {};
  for (let q = -w; q <= w; q++) for (let r = -h; r <= h; r++) {
    if (holes && ((q * 31 + r * 17) % 11 === 0)) continue;
    hexes[`${q},${r}`] = { coords: { q, r }, terenBazowy: 'Rownina' };
  }
  return { hexes };
}
const refKeys = (cq, cr, rad, map) => {
  const out = [];
  for (const key of Object.keys(map.hexes)) {
    const [q, r] = key.split(',').map(Number);
    if (M.axialDistance(cq, cr, q, r) <= rad) out.push(key);
  }
  return out.sort();
};

t('hexKeysWithinRadius z pamiecia == niezalezne liczenie, powtorne wywolania zwracaja ten sam wynik, tablica zamrozona', () => {
  const map = makeMap(25, 25, true);
  for (let i = 0; i < 60; i++) {
    const cq = ri(-30, 30), cr = ri(-30, 30), rad = ri(0, 9);
    const a = M.hexKeysWithinRadius(cq, cr, rad, map);
    const b = M.hexKeysWithinRadius(cq, cr, rad, map);
    assert.deepEqual([...a].sort(), refKeys(cq, cr, rad, map));
    assert.deepEqual(a, b);
    assert.ok(Object.isFrozen(a));
  }
  // druga mapa (inny obiekt hexes) nie dzieli pamieci
  const map2 = makeMap(25, 25, false);
  const x = M.hexKeysWithinRadius(0, 0, 5, map), y = M.hexKeysWithinRadius(0, 0, 5, map2);
  assert.equal(y.length, 91); assert.ok(x.length < 91);
});

t('okolicaTiles z pamiecia == definicja (bez centrum, dist<=rad, filtr), swieza tablica przy kazdym wywolaniu', () => {
  const map = makeMap(25, 25, true);
  for (let i = 0; i < 40; i++) {
    const cq = ri(-20, 20), cr = ri(-20, 20), rad = ri(1, 8);
    const w = (q, r) => ((q + r) % 3) !== 0;
    const exp = refKeys(cq, cr, rad, map).filter(k => k !== `${cq},${cr}`);
    const t1 = M.okolicaTiles(cq, cr, rad, map);
    assert.deepEqual(t1.map(t => t.key).sort(), exp);
    for (const tile of t1) assert.equal(tile.dist, M.axialDistance(cq, cr, tile.q, tile.r));
    const t2 = M.okolicaTiles(cq, cr, rad, map, w);
    assert.deepEqual(t2.map(t => t.key).sort(), exp.filter(k => { const [q, r] = k.split(',').map(Number); return w(q, r); }));
    t1.length = 0; t1.push({ q: 0, r: 0, key: 'x', dist: 0 }); // mutacja wyniku nie psuje pamieci
    const t3 = M.okolicaTiles(cq, cr, rad, map);
    assert.deepEqual(t3.map(t => t.key).sort(), exp);
    assert.notEqual(t3, t1);
  }
});

console.log(`\nWYNIK: ${pass} PASS, 0 FAIL`);
fs.rmSync(tmp, { recursive: true, force: true });
