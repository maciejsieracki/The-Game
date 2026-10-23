'use strict';
/**
 * web-turn-slowdown-profile-summary.cjs — R-WEB-TURN-SLOWDOWN-Q2 (B): streszczenie
 * profilu CPU (.cpuprofile z CDP Profiler) — top funkcji wg self-time i total-time.
 *
 * Runda 2 (zarzuty 3 i 6 Evaluatora):
 *  - procenty liczone od CZASU JS (próbki bez „(program)” i „(idle)”), a nie od wszystkich
 *    próbek — „(program)” to w headless swiftshader natywny narzut renderowania CPU,
 *    który rozmywał udziały funkcji gry (kolumna „%JS”; „%all” zostaje dla porządku),
 *  - każda funkcja ma kolumnę `źródło` = plik:linia w `gra/src/**`: bundle budowany
 *    z `--minify false` zachowuje nazwy, więc deklarację szukamy po nazwie
 *    (`function X`, `const/let X = (…`/`function`, `X: (…) =>`, metoda `X(…) {` w klasie);
 *    sufiks kolizji nazw bundlera (`render2`, `keyOf$1`) jest zdejmowany przy drugiej próbie.
 *    Wiele trafień → pierwsze 2 + liczba; brak trafienia → `[poza gra/src]`
 *    (three.js, natywne API przeglądarki, pseudo-węzły V8). Linia bundla (`@L…`) zostaje
 *    jako druga współrzędna.
 *
 * Użycie: node tools/web-turn-slowdown-profile-summary.cjs <plik.cpuprofile> [top=25]
 */
const fs = require('fs');
const path = require('path');

const file = process.argv[2];
const TOP = Number(process.argv[3] || 25);
const SRC = path.resolve(__dirname, '..', 'src');
const prof = JSON.parse(fs.readFileSync(file, 'utf8'));

// --- indeks deklaracji w gra/src ---
function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx|js|mjs)$/.test(e.name) && !/\.test\.|\.d\.ts$/.test(e.name)) out.push(p);
  }
  return out;
}
const decl = new Map();
const PATS = [
  /\bfunction\s*\*?\s*([A-Za-z_$][\w$]*)\s*[<(]/g,
  /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::[^=\n]+)?=\s*(?:async\s*)?(?:\(|function\b|[A-Za-z_$][\w$]*\s*=>)/g,
  /^\s*([A-Za-z_$][\w$]*)\s*:\s*(?:async\s*)?\([^)\n]*\)\s*(?::[^=\n]+)?=>/gm,
  /^\s+(?:public\s+|private\s+|protected\s+|static\s+|async\s+)*([A-Za-z_$][\w$]*)\s*\([^)\n]*\)\s*(?::\s*[^{\n]+)?\{\s*$/gm,
];
const KEYWORDS = new Set(['if', 'for', 'while', 'switch', 'catch', 'function', 'return', 'constructor']);
for (const f of walk(SRC, [])) {
  const txt = fs.readFileSync(f, 'utf8');
  const lineStarts = [0];
  for (let i = 0; i < txt.length; i++) if (txt.charCodeAt(i) === 10) lineStarts.push(i + 1);
  const lineOf = (idx) => { let lo = 0, hi = lineStarts.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (lineStarts[m] <= idx) lo = m; else hi = m - 1; } return lo + 1; };
  const rel = path.relative(path.resolve(SRC, '..', '..'), f).split(path.sep).join('/');
  for (const re of PATS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(txt))) {
      const name = m[1];
      if (KEYWORDS.has(name)) continue;
      const loc = `${rel}:${lineOf(m.index + m[0].indexOf(name))}`;
      if (!decl.has(name)) decl.set(name, []);
      if (!decl.get(name).includes(loc)) decl.get(name).push(loc);
    }
  }
}
function srcOf(fn) {
  if (!fn || fn.startsWith('(')) return '[pseudo-węzeł V8]';
  let hits = decl.get(fn);
  if (!hits && /\$?\d+$/.test(fn)) hits = decl.get(fn.replace(/\$?\d+$/, ''));
  if (!hits) return '[poza gra/src]';
  return hits.length === 1 ? hits[0] : `${hits.slice(0, 2).join(' | ')}${hits.length > 2 ? ` (+${hits.length - 2})` : ''} [niejednoznaczne ${hits.length}]`;
}

// --- streszczenie ---
const byId = new Map(prof.nodes.map((n) => [n.id, n]));
const parent = new Map();
for (const n of prof.nodes) for (const c of n.children || []) parent.set(c, n.id);
const dt = new Map();
for (let i = 0; i < prof.samples.length; i++) {
  const id = prof.samples[i];
  dt.set(id, (dt.get(id) || 0) + (prof.timeDeltas[i] || 0));
}
const key = (n) => `${n.callFrame.functionName || '(anon)'} @L${n.callFrame.lineNumber + 1}`;
const self = new Map();
const total = new Map();
let all = 0, prog = 0, idle = 0;
for (const [id, us] of dt) {
  all += us;
  const n = byId.get(id);
  if (n.callFrame.functionName === '(program)') prog += us;
  if (n.callFrame.functionName === '(idle)') idle += us;
  self.set(key(n), (self.get(key(n)) || 0) + us);
  const seen = new Set();
  let cur = id;
  while (cur !== undefined) {
    const k = key(byId.get(cur));
    if (!seen.has(k)) { seen.add(k); total.set(k, (total.get(k) || 0) + us); }
    cur = parent.get(cur);
  }
}
const js = all - prog - idle;
const SKIP = new Set(['(root) @L0', '(program) @L0', '(idle) @L0']);
const fmt = (m) => [...m.entries()].filter(([k]) => !SKIP.has(k)).sort((a, b) => b[1] - a[1]).slice(0, TOP)
  .map(([k, us]) => {
    const fn = k.replace(/ @L\d+$/, '');
    return `${(us / 1000).toFixed(1).padStart(9)} ms ${(100 * us / js).toFixed(1).padStart(5)}%JS ${(100 * us / all).toFixed(1).padStart(5)}%all  ${k.padEnd(52)} ${srcOf(fn === '(anon)' ? '' : fn)}`;
  }).join('\n');
console.log(`PROFIL ${path.basename(file)}: próbki ${(all / 1000).toFixed(1)} ms; (program) ${(prog / 1000).toFixed(1)} ms; (idle) ${(idle / 1000).toFixed(1)} ms; CZAS JS (mianownik %JS) ${(js / 1000).toFixed(1)} ms`);
console.log('--- TOP self-time (bez (program)/(idle)) ---');
console.log(fmt(self));
console.log('--- TOP total-time (inclusive, bez (root)/(program)/(idle)) ---');
console.log(fmt(total));
