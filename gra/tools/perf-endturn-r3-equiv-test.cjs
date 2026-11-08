'use strict';
/**
 * perf-endturn-r3-equiv-test.cjs — R-WEB-PERF-ENDTURN-AI-PHASE-Q1 (R3).
 * Równoważność WARTOŚCIOWA (prawdziwe funkcje przez esbuild; wersja BAZOWA = `git show <BASE_REF>:<plik>`,
 * domyślnie BASE_REF=eeb668b72 (baza R3); NIE HEAD — po commicie kandydata HEAD == kandydat i test byłby pusty;
 * kandydat = drzewo robocze) dla zmian R3:
 *   (A) okolica.ts: Intl.Collator zamiast localeCompare w assignWorkedTiles (>= 200 losowych stanów, z remisami score);
 *   (B) okolica.ts: computeLostToNearerSiblingByCity — memo porównywane pole po polu zamiast napisu-sygnatury
 *       (>= 200 losowych sekwencji wywołań: trafienia, zmiana populacji/właściciela/kolejności);
 *   (C) units/setup.ts + city-siege-state.ts: blokada wejścia liczona z listy obleganych miast w zakresie (siegeScopeMemo)
 *       == pełna lista miast (computePath na >= 200 losowych stanach).
 * Mutacje: porównanie bez remisów (< zamiast collator), memo ignorujące ownerId, memo bez unieważnienia, blokada z listy
 * pominiętej -> test MUSI paść.
 * Uruchom z gra/:  node tools/perf-endturn-r3-equiv-test.cjs
 */
const fs = require('fs'); const os = require('os'); const path = require('path');
const { execFileSync } = require('child_process');
const root = path.resolve(__dirname, '..');
const esbuild = require(path.join(root, 'node_modules', 'esbuild'));
const SRC = path.join(root, 'src');

async function bundle({ base = false, mutate = {} } = {}) {
  const plugin = { name: 'ovr', setup(b) {
    b.onLoad({ filter: /(game[\\/](okolica|city-siege-state)|units[\\/]setup)\.ts$/ }, args => {
      const rel = path.relative(path.resolve(root, '..'), args.path).split(path.sep).join('/');
      let src = base ? execFileSync('git', ['show', (process.env.BASE_REF || 'eeb668b72') + ':' + rel], { cwd: root, encoding: 'utf8', maxBuffer: 1 << 26 }) : fs.readFileSync(args.path, 'utf8');
      for (const [file, f] of Object.entries(mutate)) {
        if (args.path.endsWith(file)) { const m = f(src); if (m === src) throw new Error('mutacja nie zadziałała: ' + file); src = m; }
      }
      return { contents: src, loader: 'ts', resolveDir: path.dirname(args.path) };
    });
  } };
  const out = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'r3-eq-')), 'b.cjs');
  await esbuild.build({
    stdin: { contents: `export * from './game/okolica'; export * from './units/setup'; export * from './game/city-siege-state'; export { Nakladka, TerenBazowy } from './types/hex';`, resolveDir: SRC, loader: 'ts' },
    bundle: true, platform: 'node', format: 'cjs', outfile: out, write: true, plugins: [plugin], loader: { '.json': 'json' }, logLevel: 'silent',
  });
  const m = require(out);
  fs.rmSync(path.dirname(out), { recursive: true, force: true });
  return m;
}

let seed = 4242;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const pick = a => a[Math.floor(rnd() * a.length)];
function makeMap(M, radius) {
  const hexes = {}; const terrain = [M.TerenBazowy.Laka, M.TerenBazowy.Rownina, M.TerenBazowy.Wzgorza];
  for (let q = -radius; q <= radius; q++) for (let r = -radius; r <= radius; r++) {
    hexes[`${q},${r}`] = { coords: { q, r }, terenBazowy: pick(terrain), nakladka: M.Nakladka.Brak };
  }
  return { szerokoscQ: 2 * radius + 1, wysokoscR: 2 * radius + 1, hexes };
}

// ---- (A)
function runA(M, count) {
  seed = 4242; let n = 0; const out = [];
  for (let s = 0; s < count; s++) {
    const map = makeMap(M, 9);
    const cq = Math.floor(rnd() * 5) - 2, cr = Math.floor(rnd() * 5) - 2;
    const levels = 1 + Math.floor(rnd() * 3); // mało poziomów score => dużo remisów => tie-break po kluczu
    const yields = {};
    const yieldOf = (q, r) => { const k = `${q},${r}`; return yields[k] ?? (yields[k] = { zywnosc: Math.floor(rnd() * levels), praca: Math.floor(rnd() * levels), handel: Math.floor(rnd() * levels) }); };
    const focus = pick(['zywnosc', 'produkcja', 'podatki', 'zrownowazone']);
    const pop = 1 + Math.floor(rnd() * 12);
    const res = M.assignWorkedTiles(cq, cr, pop, map, yieldOf, { radius: 1 + Math.floor(rnd() * 4), wagi: M.wagiForFocus(focus), focus, potentialOf: (q, r) => (Math.abs(q * 7 + r * 3) % 3) });
    out.push(res.map(t => t.key).join(';')); n++;
  }
  return { n, out };
}
// ---- (B)
function runB(M, count) {
  seed = 99; const out = []; let n = 0;
  for (let s = 0; s < count; s++) {
    const map = makeMap(M, 10);
    const nC = 4 + Math.floor(rnd() * 8);
    let cities = [];
    for (let i = 0; i < nC; i++) cities.push({ id: 'c' + i, q: Math.floor(rnd() * 11) - 5, r: Math.floor(rnd() * 11) - 5, population: 1 + Math.floor(rnd() * 12), ownerId: Math.floor(rnd() * 2) });
    for (let step = 0; step < 6; step++) {
      const res = M.computeLostToNearerSiblingByCity(cities, map);
      out.push(JSON.stringify([...res].map(([k, v]) => [k, [...v].sort()]).sort())); n++;
      const op = step % 3;
      cities = cities.map(c => ({ ...c }));
      if (op === 0) { /* te same dane -> trafienie memo */ } else if (op === 1) { pick(cities).population += 1 + Math.floor(rnd() * 4); } else { const c = pick(cities); c.ownerId = 1 - c.ownerId; }
      if (step === 4) cities.reverse();
    }
  }
  return { n, out };
}
// ---- (C)
function runC(M, count) {
  seed = 31337; const out = []; let n = 0;
  for (let s = 0; s < count; s++) {
    const map = makeMap(M, 7);
    const cities = [];
    for (let i = 0; i < 12; i++) cities.push({ id: 'c' + i, q: Math.floor(rnd() * 11) - 5, r: Math.floor(rnd() * 11) - 5, ownerId: Math.floor(rnd() * 3), oblegane: rnd() < 0.4 });
    const war = (a, b) => (a + b) % 2 === 1;
    M.setSiegeEntryBlocker(null);
    // blokada jak w main.ts: kandydat używa siegeScopeMemo + filter, baza — pełna lista
    const useMemo = typeof M.siegeScopeMemo === 'function';
    M.setSiegeEntryBlocker((unit, q, r) => {
      const besieged = useMemo ? M.siegeScopeMemo(() => cities.filter(c => c.oblegane === true)) : null;
      return M.isSiegeEntryBlocked(besieged ?? cities, unit, q, r, war);
    });
    for (let k = 0; k < 4; k++) {
      const u = { id: 'u' + k, ownerId: Math.floor(rnd() * 3), typeId: 'wojownik', category: 'piechota', q: Math.floor(rnd() * 9) - 4, r: Math.floor(rnd() * 9) - 4, ruch: 60, ruchLeft: 60 };
      const dq = Math.floor(rnd() * 9) - 4, dr = Math.floor(rnd() * 9) - 4;
      const p = M.computePath(u, map, dq, dr, new Set(), () => 1);
      const r2 = M.computeReachable(u, map, new Set(), () => 1);
      out.push(JSON.stringify([p, [...r2].sort()])); n++;
    }
    M.setSiegeEntryBlocker(null);
  }
  return { n, out };
}

let fails = 0;
const cmp = (name, a, b, minN) => {
  const diff = a.out.reduce((s, x, i) => s + (x === b.out[i] ? 0 : 1), 0);
  const ok = diff === 0 && a.n >= minN;
  console.log(`[equiv ${name}] przypadków=${a.n}, różnic=${diff} -> ${ok ? 'OK' : 'FAIL'}`);
  if (!ok) fails++;
  return diff;
};
const mustDiffer = (name, a, b) => {
  const diff = a.out.reduce((s, x, i) => s + (x === b.out[i] ? 0 : 1), 0);
  console.log(`[mutacja ${name}] różnic=${diff} -> ${diff > 0 ? 'WYKRYTA (OK)' : 'NIEWYKRYTA (FAIL)'}`);
  if (diff === 0) fails++;
};

async function main() {
  const base = await bundle({ base: true });
  const cand = await bundle();
  // (0) Collator == localeCompare na realistycznych kluczach
  { const ks = []; for (let i = 0; i < 4000; i++) ks.push(`${Math.floor(rnd() * 80) - 40},${Math.floor(rnd() * 80) - 40}`); const col = new Intl.Collator(); let d = 0;
    for (let i = 0; i < ks.length - 1; i++) for (let j = 0; j < 6; j++) { const b = ks[(i * 7 + j * 13 + 1) % ks.length]; if (Math.sign(ks[i].localeCompare(b)) !== Math.sign(col.compare(ks[i], b))) d++; }
    console.log(`[equiv collator-vs-localeCompare] par=${(ks.length - 1) * 6}, różnic=${d} -> ${d === 0 ? 'OK' : 'FAIL'}`); if (d) fails++; }
  const aB = runA(base, 220), aC = runA(cand, 220); cmp('A assignWorkedTiles', aC, aB, 200);
  const bB = runB(base, 220), bC = runB(cand, 220); cmp('B computeLostToNearerSibling (memo)', bC, bB, 200);
  const cB = runC(base, 60), cC = runC(cand, 60); cmp('C computePath/computeReachable (siege memo)', cC, cB, 200);
  // mutacje
  const mutA = await bundle({ mutate: { 'okolica.ts': s => s.replace('OKOLICA_KEY_COLLATOR.compare(a.t.key, b.t.key)', 'OKOLICA_KEY_COLLATOR.compare(b.t.key, a.t.key)') } });
  mustDiffer('A: odwrócony tie-break po kluczu', runA(mutA, 220), aB);
  const mutB1 = await bundle({ mutate: { 'okolica.ts': s => s.replace(' || row.ownerId !== c.ownerId', '') } });
  mustDiffer('B: memo ignoruje ownerId', runB(mutB1, 220), bB);
  const mutB2 = await bundle({ mutate: { 'okolica.ts': s => s.replace('if (row.range !== siblingRange(c)) return false;', '') } });
  mustDiffer('B: memo ignoruje promień (populację)', runB(mutB2, 220), bB);
  const mutC = await bundle({ mutate: { 'setup.ts': s => s.replace("if (siegeScopeAux === undefined) siegeScopeAux = build();", "if (siegeScopeAux === undefined) siegeScopeAux = [];") } });
  mustDiffer('C: lista obleganych pusta (zły zakres)', runC(mutC, 60), cB);
  // siegeScopeMemo poza zakresem = null
  console.log(`[siegeScopeMemo poza zakresem] ${cand.siegeScopeMemo(() => 1) === null ? 'OK (null)' : 'FAIL'}`); if (cand.siegeScopeMemo(() => 1) !== null) fails++;
  console.log(fails ? `FAIL (${fails})` : 'PASS');
  process.exit(fails ? 1 : 0);
}
main().catch(e => { console.error(e); process.exit(2); });
