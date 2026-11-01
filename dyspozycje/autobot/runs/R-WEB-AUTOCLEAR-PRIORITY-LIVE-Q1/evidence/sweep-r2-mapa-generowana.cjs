// r2 (decyzja ABC-B): sweep „trzoda przed otwarta farma”: PRZED = kod r1 (onRiverHex = riverPaths ∪ rzeka.obecna), PO = biezacy gra/src.
// Mapa: generujSwiat(778899,'standardowy','kontynenty') (nowa gra; zrzut z Chromium nieosiagalny w srodowisku Operatora).
// Uzycie: node sweep-r2-mapa-generowana.cjs <katalog-z-src-r1>   (np. kopia gra/src z onRiverHex w formie r1)
const fs = require('fs'), os = require('os'), path = require('path');
const GRA = path.resolve(__dirname, '../../../../../gra');
const esbuild = require(GRA + '/node_modules/esbuild');
const OLDSRC = process.argv[2];
function load(src) {
  const t = fs.mkdtempSync(path.join(os.tmpdir(), 'sw-')); const e = t + '/e.ts', b = t + '/b.cjs';
  fs.writeFileSync(e, `export { pickAutoImprovements } from ${JSON.stringify(src + '/game/auto-improvements')};export { generujSwiat } from ${JSON.stringify(GRA + '/src/map/generator')};`);
  esbuild.buildSync({ entryPoints: [e], bundle: true, platform: 'node', format: 'cjs', outfile: b, loader: { '.ts': 'ts', '.json': 'json' }, absWorkingDir: GRA, logLevel: 'error', nodePaths: [GRA + '/node_modules'] });
  return require(b);
}
const NEW = load(GRA + '/src'), OLD = load(OLDSRC);
const CACHE = process.env.SWEEP_MAP_CACHE;   // opcjonalnie: plik JSON z wygenerowana mapa (generacja ~7 min)
let map;
if (CACHE && fs.existsSync(CACHE)) map = JSON.parse(fs.readFileSync(CACHE, 'utf8'));
else { map = NEW.generujSwiat(778899, 'standardowy', 'kontynenty'); if (CACHE) fs.writeFileSync(CACHE, JSON.stringify(map)); }
if (process.env.SWEEP_ONLY_GEN) process.exit(0);
console.error('mapa', map.szerokoscQ, 'x', map.wysokoscR, 'rzeka.obecna', Object.values(map.hexes).filter(h => h.rzeka && h.rzeka.obecna).length);
const K = (q, r) => q + ',' + r;
const FULL = ['Rolnictwo', 'Oswojenie zwierząt', 'Gospodarka wodna', 'Irygacja', 'Łowiectwo', 'Obróbka drewna', 'Garncarstwo', 'Murarstwo'];
const nb = (q, r) => [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]].map(([a, b]) => [q + a, r + b]);
const rv = new Set(); for (const p of map.riverPaths || []) for (const h of p) rv.add(K(h.q, h.r));
const adjStrict = (q, r) => nb(q, r).some(([a, b]) => rv.has(K(a, b)));  // = definicja hasRiverAccess (sasiad w riverPaths)
const cls = (q, r) => {
  const h = map.hexes[K(q, r)]; if (!h) return '?';
  const own = h.rzeka?.obecna; const pth = rv.has(K(q, r));
  const adj = nb(q, r).some(([a, b]) => map.hexes[K(a, b)]?.rzeka?.obecna || rv.has(K(a, b)));
  return pth ? 'NA_riverPaths' : own ? 'NA_obecna_poza_paths' : adj ? 'TYLKO_sasiad' : 'daleko';
};
function run(P, site, focus, pop) {
  const placed = new Map(); let pool = 300; const log = [];
  const worked = new Set([K(site.q, site.r)]);
  const cand = [];
  for (let dq = -3; dq <= 3; dq++) for (let dr = -3; dr <= 3; dr++) {
    const q = site.q + dq, r = site.r + dr; const h = map.hexes[K(q, r)];
    if (!h || (dq === 0 && dr === 0)) continue; if (Math.abs(dq + dr) > 3) continue;
    if (['morze', 'plytkie_morze', 'gory'].includes(h.terenBazowy)) continue;
    cand.push([Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr), q, r]);
  }
  cand.sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]);
  for (const c of cand.slice(0, pop - 1)) worked.add(K(c[1], c[2]));
  const TN = [...worked].map(k => { const [q, r] = k.split(',').map(Number); return { q, r, ownerId: 0, cityId: 'c0', pop: 1, level: 1 }; });
  const city = { id: 'c0', ownerId: 0, q: site.q, r: site.r, name: 'X', population: pop, ulepszeniaFocus: focus };
  for (let t = 0; t < 12; t++) {
    const picks = P.pickAutoImprovements({
      cities: [city], ownerId: 0, map, territoryNodes: TN, placedImprovements: placed, pracaAvailable: pool,
      unlockedTechs: new Set(FULL), pracaSurplusThreshold: 30, skipWyrab: true, demandDriven: true, resourceDeficitKeys: [],
      getFocus: () => focus, getOnlyWorked: () => true, getWorkedHexKeys: () => worked, pracaBudgetPercent: 33,
      getPracaBudgetPercent: () => 33, civArchetype: 'rzymianie', playerEra: 1, foodImprovementStages: () => true, clearingHexKeys: new Set(),
    });
    for (const p of picks) {
      const hk = K(p.q, p.r);
      log.push({ t, key: p.key, hk, cls: cls(p.q, p.r), koszt: p.kosztPraca, poolPrzed: Math.round(pool) });
      pool -= p.kosztPraca; placed.set(hk, [...(placed.get(hk) || []), p.key]);
    }
    pool += 25;
  }
  return { log, worked: [...worked], placed };
}
const sites = [];
for (const h of Object.values(map.hexes)) {
  const { q, r } = h.coords; if (q < 8 || q > map.szerokoscQ - 8 || r < 6 || r > map.wysokoscR - 6) continue;
  if (!['laka', 'rownina'].includes(h.terenBazowy) || h.nakladka === 'las') continue;
  sites.push({ q, r });
}
const step = Math.max(1, Math.floor(sites.length / 200));
const sample = sites.filter((s, i) => i % step === 0).slice(0, 200);
const out = {};
for (const [name, P] of [['PRZED', OLD], ['PO', NEW]]) for (const pop of [2]) {
  let bydloFirst = 0, n = 0; const unf = {}; const firstKey = {};
  for (const s of sample) {
    const { log, worked } = run(P, s, 'zrownowazone', pop); n++;
    const fb = log.findIndex(e => e.key === 'bydlo');
    const farmedBefore = new Set(log.slice(0, Math.max(fb, 0)).filter(e => e.key === 'farma').map(e => e.hk));
    if (fb >= 0) {
      const open = worked.filter(hk => { const h = map.hexes[hk]; return h.nakladka !== 'las' && !farmedBefore.has(hk) && ['laka', 'rownina'].includes(h.terenBazowy); });
      if (open.length) { bydloFirst++; for (const hk of open) { const [q, r] = hk.split(',').map(Number); const acc = rv.has(K(q, r)) || map.hexes[K(q, r)].rzeka?.obecna || adjStrict(q, r); const c = cls(q, r) + (acc ? '+hasRiverAccess' : '+bez_hasRiverAccess'); unf[c] = (unf[c] || 0) + 1; } }
    }
    const k = log.slice(0, 3).map(e => e.key).join('>'); firstKey[k] = (firstKey[k] || 0) + 1;
  }
  out[name + '_pop' + pop] = { miejsc: n, trzodaPrzedOtwartaFarma: bydloFirst, klasaNiezafarmowanegoHeksu: unf, pierwszeTrzy: firstKey };
}
console.log(JSON.stringify(out, null, 1));
let shown = 0;
for (const s of sample) {
  const a = run(OLD, s, "zrownowazone", 2), b = run(NEW, s, "zrownowazone", 2);
  const f = e => e.key + '@' + e.hk + '[' + e.cls + ']';
  if (a.log.map(f).join() !== b.log.map(f).join() && shown < 2) {
    shown++;
    console.log('PRZYKLAD', JSON.stringify(s), 'centrum:', cls(s.q, s.r), 'worked', a.worked.map(k => k + '[' + cls(...k.split(',').map(Number)) + ']').join(' '));
    console.log(' PRZED:', a.log.slice(0, 5).map(e => `t${e.t} ${e.key}@${e.hk}[${e.cls}] koszt${e.koszt} pula${e.poolPrzed}`).join(' | '));
    console.log(' PO   :', b.log.slice(0, 5).map(e => `t${e.t} ${e.key}@${e.hk}[${e.cls}] koszt${e.koszt} pula${e.poolPrzed}`).join(' | '));
  }
}
