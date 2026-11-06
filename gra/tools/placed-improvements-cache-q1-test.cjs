'use strict';
/**
 * R-WEB-PERF-PLACED-IMPROVEMENTS-CACHE-Q1: test ZACHOWANIA cache'u `createOwnerImprovementsCache` + `VersionedMap`.
 * KONTRAKT:
 *  (1) >= 200 losowych stanow: wynik cache == referencyjny skan (kopia dawnego `placedImprovementsForOwner`), lacznie z
 *      KOLEJNOSCIA kluczy; dla kazdego wlasciciela;
 *  (2) inwalidacja: sekwencja mutacji (set/delete/clear ulepszen; zmiana wlasciciela/populacji/pozycji miasta; dodanie
 *      fortu/posterunku; `order` fortu) -- po KAZDEJ mutacji wynik == referencja; zwrocona wczesniej mapa NIE jest mutowana;
 *  (3) trafienia: wielokrotne odczyty tego samego stanu = 1 skan na wlasciciela (hits rosna, misses nie);
 *  (4) MUTACJE: wylaczenie inwalidacji po wersji / po wezlach terytorium LAMIE test (test nie jest pusty);
 *  (5) kontrakt zrodlowy main.ts: placedImprovements to VersionedMap, placedImprovementsForOwner idzie przez cache.
 *      UZUPELNIENIE, nie dowod zachowania: sprawdza tekst zrodla; dowodem zachowania sa (1)-(4).
 *  (4b) mutant "memo-heksow-nie-czyszczony" lamie inwalidacje po zmianie wezlow (wykrywany przez (2)).
 * Run z gra/:  node tools/placed-improvements-cache-q1-test.cjs
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = process.env.CACHE_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const TR = path.join(SRC, 'game', 'trade-routes.ts');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'placed-impr-cache-'));

async function load(tag, mutate) {
  const entry = path.join(temp, `entry-${tag}.ts`);
  const bundle = path.join(temp, `bundle-${tag}.cjs`);
  fs.writeFileSync(entry,
    `export { createOwnerImprovementsCache, VersionedMap } from ${JSON.stringify(TR)};\n` +
    `export { territoryOwnerAt } from ${JSON.stringify(path.join(SRC, 'map', 'territory'))};\n`);
  const plugin = {
    name: 'mutate',
    setup(b) {
      if (!mutate) return;
      b.onLoad({ filter: /trade-routes\.ts$/ }, (args) => {
        const src = fs.readFileSync(args.path, 'utf8');
        const out = mutate(src);
        if (out === src) throw new Error('mutacja nie zmienila zrodla: ' + tag);
        return { contents: out, loader: 'ts', resolveDir: path.dirname(args.path) };
      });
    },
  };
  await esbuild.build({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: bundle,
    loader: { '.ts': 'ts', '.json': 'json' }, absWorkingDir: GRA_ROOT, logLevel: 'error', nodePaths: [path.resolve(GRA_ROOT, 'node_modules')], plugins: [plugin] });
  return require(bundle);
}

let passed = 0, failed = 0;
const ok = (c, m) => { if (c) { passed++; console.log('  PASS', m); } else { failed++; console.log('  FAIL', m); } };

let seed = 987654;
const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const ri = (n) => Math.floor(rnd() * n);

/** Referencja = dokladna kopia dawnego algorytmu z main.ts (skan wszystkich ulepszen, nodes raz). */
function reference(ownerAt, placed, nodes, ownerId) {
  const out = new Map();
  for (const [hexKey, layers] of placed) {
    const [qStr, rStr] = hexKey.split(',');
    if (ownerAt(Number(qStr), Number(rStr), nodes) === ownerId) out.set(hexKey, layers);
  }
  return out;
}
const same = (a, b) => a.size === b.size && JSON.stringify([...a]) === JSON.stringify([...b]);

function randomWorld(VersionedMap) {
  const placed = new VersionedMap();
  const nImpr = 20 + ri(120);
  for (let i = 0; i < nImpr; i++) placed.set(`${ri(40) - 10},${ri(40) - 10}`, ['kopalnia_miedzi', 'farma'].slice(0, 1 + ri(2)));
  const nodes = [];
  const nCities = 2 + ri(8);
  for (let i = 0; i < nCities; i++) nodes.push({ q: ri(40) - 10, r: ri(40) - 10, pop: 1 + ri(12), level: 1, ownerId: ri(3) });
  const nForts = ri(4);
  for (let i = 0; i < nForts; i++) {
    const n = { q: ri(40) - 10, r: ri(40) - 10, pop: 1, level: 1, ownerId: ri(3), isFort: rnd() < 0.5, isOutpost: false };
    if (!n.isFort) n.isOutpost = true;
    if (rnd() < 0.5) n.order = { turn: ri(20), seq: ri(5) };
    nodes.push(n);
  }
  return { placed, nodes };
}
const clone = (nodes) => nodes.map(n => ({ ...n, order: n.order ? { ...n.order } : undefined }));

function runSuite(mod, label, expectPass) {
  const { createOwnerImprovementsCache, VersionedMap, territoryOwnerAt } = mod;
  const res = { equal: true, invalid: true, mapUntouched: true };

  // (1) 250 losowych stanow x 3 wlascicieli
  for (let i = 0; i < 250; i++) {
    const { placed, nodes } = randomWorld(VersionedMap);
    const cache = createOwnerImprovementsCache(territoryOwnerAt);
    for (let o = 0; o < 3; o++) {
      const got = cache.get(o, placed, clone(nodes));
      if (!same(got, reference(territoryOwnerAt, placed, nodes, o))) res.equal = false;
    }
  }

  // (2) inwalidacja: 120 sekwencji x 12 mutacji, sprawdzenie po KAZDEJ
  for (let i = 0; i < 120; i++) {
    const { placed, nodes } = randomWorld(VersionedMap);
    const cache = createOwnerImprovementsCache(territoryOwnerAt);
    for (let step = 0; step < 12; step++) {
      for (let o = 0; o < 3; o++) cache.get(o, placed, clone(nodes)); // rozgrzej cache
      const before = cache.get(1, placed, clone(nodes));
      const beforeSnapshot = JSON.stringify([...before]);
      const kind = ri(8);
      if (kind === 0) placed.set(`${ri(40) - 10},${ri(40) - 10}`, ['farma']);
      else if (kind === 1) { const ks = [...placed.keys()]; if (ks.length) placed.delete(ks[ri(ks.length)]); else placed.set('0,0', ['farma']); }
      else if (kind === 2) { nodes[ri(nodes.length)].ownerId = (nodes[0].ownerId + 1 + ri(2)) % 3; }
      else if (kind === 3) { const n = nodes[ri(nodes.length)]; n.pop = 1 + ri(15); }
      else if (kind === 4) { const n = nodes[ri(nodes.length)]; n.q += 1 + ri(3); n.r -= ri(3); }
      else if (kind === 5) nodes.push({ q: ri(40) - 10, r: ri(40) - 10, pop: 1, level: 1, ownerId: ri(3), isFort: true, order: { turn: ri(20), seq: ri(5) } });
      else if (kind === 6) { nodes.pop(); if (nodes.length === 0) nodes.push({ q: 0, r: 0, pop: 5, level: 1, ownerId: 0 }); }
      else { placed.clear(); for (let k = 0; k < 30; k++) placed.set(`${ri(40) - 10},${ri(40) - 10}`, ['farma']); }
      for (let o = 0; o < 3; o++) {
        const got = cache.get(o, placed, clone(nodes));
        if (!same(got, reference(territoryOwnerAt, placed, nodes, o))) res.invalid = false;
      }
      if (JSON.stringify([...before]) !== beforeSnapshot) res.mapUntouched = false;
    }
  }
  if (expectPass) {
    ok(res.equal, `${label}(1) wynik cache == referencyjny skan (250 stanow x 3 wlascicieli, z kolejnoscia kluczy)`);
    ok(res.invalid, `${label}(2) po kazdej z 1440 mutacji (ulepszenia/miasta/forty/wlasciciel) wynik == referencja`);
    ok(res.mapUntouched, `${label}(2b) zwrocona wczesniej mapa nie jest mutowana (snapshoty stabilne)`);
  }
  return res;
}

(async () => {
  const good = await load('good', null);
  runSuite(good, '', true);

  // (3) trafienia
  {
    const { createOwnerImprovementsCache, VersionedMap, territoryOwnerAt } = good;
    const placed = new VersionedMap(); placed.set('1,1', ['farma']); placed.set('2,2', ['farma']);
    const nodes = [{ q: 1, r: 1, pop: 5, level: 1, ownerId: 0 }];
    const c = createOwnerImprovementsCache(territoryOwnerAt);
    for (let i = 0; i < 500; i++) c.get(0, placed, clone(nodes));
    ok(c.stats.misses === 1 && c.stats.hits === 499, `(3) 500 odczytow tego samego stanu = 1 skan (misses=${c.stats.misses}, hits=${c.stats.hits})`);
    placed.set('3,3', ['farma']);
    c.get(0, placed, clone(nodes));
    ok(c.stats.misses === 2 && c.stats.invalidations === 1, '(3b) zapis do mapy = dokladnie 1 dodatkowy skan i 1 inwalidacja');
    const m = new VersionedMap(); const v0 = m.version; m.set('a', 1); m.set('a', 2); m.delete('a'); m.clear();
    ok(m.version === v0 + 4 && m.size === 0, '(3c) VersionedMap: set/set/delete/clear = +4 do wersji i zachowuje sie jak Map');
  }

  // (4) mutacje: test MUSI wykryc zepsucie inwalidacji
  const mutants = [
    ['bez-wersji', (s) => s.replace('|| srcVersion !== source.version;', ';')],
    ['bez-wezlow', (s) => s.replace('const nodesChanged = !sameTerritoryNodes(snapshot, nodes);', 'const nodesChanged = false;')],
    ['memo-heksow-nie-czyszczony', (s) => s.replace('hexOwner = new Map();', '')],
    ['bez-wlasciciela-wezla', (s) => s.replace('x.pop !== y.pop || x.ownerId !== y.ownerId', 'x.pop !== y.pop')],
    ['bez-pop', (s) => s.replace('x.pop !== y.pop || x.ownerId', 'x.ownerId')],
    ['licznik-nie-rosnie-w-set', (s) => s.replace('override set(key: K, value: V): this { this.version++; ', 'override set(key: K, value: V): this { ')],
  ];
  for (const [name, fn] of mutants) {
    const mod = await load('mut-' + name, fn);
    const r = runSuite(mod, '', false);
    ok(!(r.equal && r.invalid), `(4) mutant "${name}" WYKRYTY (test pada: equal=${r.equal}, invalid=${r.invalid})`);
  }

  // (5) kontrakt zrodlowy
  const main = fs.readFileSync(path.join(SRC, 'main.ts'), 'utf8');
  ok(/const placedImprovements = new VersionedMap<string, PlacedLayers>\(\)/.test(main), '(5) main.ts: placedImprovements = VersionedMap');
  ok(/function placedImprovementsForOwner\([^)]*\)[^{]*\{\s*return placedImprovementsOwnerCache\.get\(ownerId, placedImprovements, buildAllTerritoryNodes\(\)\);/.test(main), '(5b) main.ts: placedImprovementsForOwner idzie przez cache z zywymi wezlami');
  ok(!/placedImprovements = new Map/.test(main) && !/\blet placedImprovements\b/.test(main), '(5c) main.ts: brak ponownego przypisania placedImprovements zwyklą Map');

  fs.rmSync(temp, { recursive: true, force: true });
  console.log(`\nWYNIK: ${passed} PASS, ${failed} FAIL`);
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
