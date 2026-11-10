// Polowanie na rzadkie galezie (niepokryte w pierwszych nagraniach): uruchamia PRAWDZIWE web
// computeClusters / buildClusterSpawnPlan na wielu wejsciach i sprawdza PO KAZDYM wywolaniu licznik
// pokrycia V8 (inspector Profiler.takePreciseCoverage) wskazanych linii. Wypisuje wejscia, ktore
// trafily w dana linie - te wejscia trafiaja potem do wektorow (generator ma liste HUNTED).
//
// Uzycie:
//   node --experimental-transform-types --no-warnings --import ./m12-loader-register.mjs \
//     hunt-rare-branches.mjs <WEB_ROOT> <VECTORS_JSON_Z_MAPAMI> <WYJSCIE_JSON> [liczba_prob_na_mape]
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve as presolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { stripTypeScriptTypes } from 'node:module';
import inspector from 'node:inspector';

const [, , webRootArg, vecArg, outArg, triesArg] = process.argv;
const webRoot = presolve(webRootArg);
const tries = Number(triesArg ?? 6);
const srcPath = (p) => join(webRoot, 'gra/src', p);
const src = (p) => pathToFileURL(srcPath(p)).href;
const C = await import(src('map/clusters.ts'));
const S = await import(src('map/cluster-spawn.ts'));
const GH = await import(src('map/gen-helpers.ts'));
const { mulberry32 } = GH;
const civs = JSON.parse(readFileSync(join(webRoot, 'gra/data/civs.json'), 'utf8'));
const vec = JSON.parse(readFileSync(vecArg, 'utf8'));
const C2T = { m: 'morze', p: 'plytkie_morze', l: 'laka', r: 'rownina', w: 'wzgorza', g: 'gory', u: 'pustynia', o: 'polarny' };
function webMapFromRep(rep) {
  const hexes = {};
  for (let r = 0; r < rep.h; r++) for (let q = 0; q < rep.w; q++) {
    hexes[`${q},${r}`] = { coords: { q, r }, terenBazowy: C2T[rep.terrain[r * rep.w + q]], rzeka: { obecna: rep.river[r * rep.w + q] === '1' } };
  }
  return { szerokoscQ: rep.w, wysokoscR: rep.h, hexes };
}

// --- odwzorowanie linii oryginalu na przedzialy offsetow tekstu po transformacji ---
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function decodeVlqLine(seg) {
  const out = [];
  let i = 0;
  while (i < seg.length) {
    const vals = [];
    while (i < seg.length && seg[i] !== ',') {
      let shift = 0, value = 0, cont = true;
      while (cont) { const d = B64.indexOf(seg[i++]); cont = (d & 32) !== 0; value += (d & 31) << shift; shift += 5; }
      vals.push(value & 1 ? -(value >> 1) : value >> 1);
    }
    i++;
    out.push(vals);
  }
  return out;
}
function targetOffsets(rel, lines) {
  const orig = readFileSync(join(webRoot, rel), 'utf8');
  const withMap = stripTypeScriptTypes(orig, { mode: 'transform', sourceMap: true });
  const m = /\/\/# sourceMappingURL=data:application\/json;base64,(\S+)\s*$/.exec(withMap);
  const map = JSON.parse(Buffer.from(m[1], 'base64').toString('utf8'));
  const text = withMap.slice(0, m.index);
  const genLines = text.split('\n');
  const segsPerLine = map.mappings.split(';').map((l) => decodeVlqLine(l));
  const lineStart = [0];
  for (let k = 0; k < text.length; k++) if (text[k] === '\n') lineStart.push(k + 1);
  let srcLine = 0;
  const want = new Set(lines);
  const offs = [];
  for (let gl = 0; gl < genLines.length; gl++) {
    let genCol = 0;
    const marks = [];
    for (const s of segsPerLine[gl] ?? []) {
      genCol += s[0];
      if (s.length >= 4) { srcLine += s[2]; marks.push([genCol, srcLine + 1]); }
    }
    for (let k = 0; k < marks.length; k++) {
      if (!want.has(marks[k][1])) continue;
      const c1 = k + 1 < marks.length ? marks[k + 1][0] : genLines[gl].length;
      for (let c = marks[k][0]; c < c1; c++) if (!/\s/.test(genLines[gl][c] ?? ' ')) offs.push(lineStart[gl] + c);
    }
  }
  return offs;
}
const targets = [
  { name: 'sanity:player-pushed', rel: 'gra/src/map/clusters.ts', lines: [3791] },
  { name: 'clusters:forced', rel: 'gra/src/map/clusters.ts', lines: [3669, 3670, 3671] },
  { name: 'clusters:fixed-relocated', rel: 'gra/src/map/clusters.ts', lines: [3739, 3765, 3773] },
  { name: 'clusters:foreign-skipped-no-layout', rel: 'gra/src/map/clusters.ts', lines: [3927] },
  { name: 'clusters:foreign-skipped-sea', rel: 'gra/src/map/clusters.ts', lines: [3945] },
  { name: 'clusters:foreign-skipped-sep', rel: 'gra/src/map/clusters.ts', lines: [3958] },
  { name: 'clusters:player-sep-resolve', rel: 'gra/src/map/clusters.ts', lines: [3788] },
  { name: 'spawn:retry-player-cap', rel: 'gra/src/map/cluster-spawn.ts', lines: [315] },
  { name: 'spawn:foreign-skipped-sep', rel: 'gra/src/map/cluster-spawn.ts', lines: [356] },
  { name: 'spawn:hard-drop', rel: 'gra/src/map/cluster-spawn.ts', lines: [391, 397] },
].map((t) => ({ ...t, offs: new Set(targetOffsets(t.rel, t.lines)), url: pathToFileURL(join(webRoot, t.rel)).href }));

const session = new inspector.Session();
session.connect();
const post = (m, p) => new Promise((res, rej) => session.post(m, p ?? {}, (e, r) => (e ? rej(e) : res(r))));
await post('Profiler.enable');
await post('Profiler.startPreciseCoverage', { callCount: true, detailed: true });
await post('Profiler.takePreciseCoverage'); // wyzeruj

async function hits() {
  const { result } = await post('Profiler.takePreciseCoverage');
  const found = [];
  for (const t of targets) {
    const res = result.find((r) => r.url === t.url);
    if (!res) continue;
    const counts = new Map();
    const all = [];
    for (const fn of res.functions) for (const r of fn.ranges) all.push(r);
    all.sort((a, b) => b.endOffset - b.startOffset - (a.endOffset - a.startOffset));
    for (const off of t.offs) {
      let c = -1;
      for (const r of all) if (off >= r.startOffset && off < r.endOffset) c = r.count;
      if (c > 0) { found.push(t.name); break; }
    }
  }
  return found;
}

const quiet = (fn) => {
  const w = console.warn, l = console.log;
  console.warn = () => {}; console.log = () => {};
  try { return fn(); } finally { console.warn = w; console.log = l; }
};
const gr = mulberry32(777);
const pick = (a) => a[Math.floor(gr() * a.length)];
const SEEDS = [1, 2, 3, 5, 7, 11, 13, 17, 21, 42, 77, 99, 123, 256, 1000, 4242, 31337, 65535, 99991, 1234567];
const ROSTER = ['grecy', 'rzymianie', 'chinczycy', 'inkowie', 'zulusi', 'egipt', 'sumer', 'celtowie', 'germanie', 'harappa', 'hetyci', 'slowianie', 'babilonia', 'asyria', 'fenicjanie'];
const found = [];
const ids = (process.env.HUNT_IDS ? process.env.HUNT_IDS.split(',') : Object.keys(vec.maps)).filter((id) => !id.startsWith('e_empty'));
for (const id of ids) {
  const rep = vec.maps[id];
  const web = webMapFromRep(rep);
  for (let t = 0; t < tries; t++) {
    const spec = { seed: pick(SEEDS) + t * 1013, playerTyp: pick(ROSTER), rywale: pick([0, 1, 2, 4, 9]), aktywneTypy: pick([5, 8, 10, 12, 15]) };
    try {
      quiet(() => S.buildClusterSpawnPlan({ map: web, civs, seed: spec.seed, playerTyp: spec.playerTyp, rywaleNaKlaster: spec.rywale, aktywneTypy: spec.aktywneTypy }));
    } catch {
      // web rzuca w dzienniku - bez znaczenia dla polowania
    }
    const h = await hits();
    if (h.length) { found.push({ map: id, spec, kind: 'spawn', hits: h }); console.error('TRAFIENIE', id, JSON.stringify(spec), h.join(',')); }
  }
}
writeFileSync(outArg, JSON.stringify(found, null, 1));
console.error('koniec: trafien', found.length);
