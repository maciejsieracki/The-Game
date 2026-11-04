#!/usr/bin/env node
/**
 * measure-repin-ui2g-k02k04-drift.mjs — pomiar dryfu jednostek K02–K04 (`src/ui/cityPanel/k02-*.ts`, `k03-*.ts`,
 * `k04*.ts`) PO NAZWIE (R-RUSTPORT-REPIN-UI-2-G-Q1; P5-REPIN-UI-2 §3 „K02–K04 bez markerów :A-B”).
 *
 * K02–K04 to porty DOM/DTO (nie kopie z markerem), więc dryf mierzy się po stronie ŹRÓDŁA webu: dla każdej deklaracji
 * najwyższego poziomu portu (function/const/let/type/interface/class/enum) szukana jest deklaracja o tej samej nazwie
 * w `gra/src/ui/cityPanel.ts` pinu (`--pin-dir`) i webu (`--cur-dir`); zakres = od deklaracji do domknięcia klamer
 * (albo `;` dla jednoliniowych) z dołączonym bezpośrednio poprzedzającym komentarzem JSDoc.
 *   SAME       tekst pin == tekst web (port nie wymaga zmian z tytułu dryfu webu);
 *   DRIFT(n)   oba istnieją, różnica n linii (LCS) — port do przejrzenia/przepięcia;
 *   GONE       jest w pinie, brak w webie;
 *   PORT_ONLY  brak w pinie (pomocnik/typ DTO portu) — nie podlega dryfowi webu.
 * Drugi pomiar (REF): odwołania do linii pinu w komentarzach portu (`:A-B`, `:N`, `<plik>.ts:A-B`) — dla każdego
 * sprawdzane, czy hunk różnicy pin→web (Myers) dotyka zakresu; odwołanie bez nazwy pliku = `gra/src/ui/cityPanel.ts`
 * (ZAŁOŻENIE G-Z3: tak jest w nagłówkach K02–K04; odwołanie z nazwą innego pliku liczone w tym pliku).
 *   REF_SAME  zakres nietknięty (obraz w webie podany);  REF_DRIFT  ≥1 hunk w zakresie.
 *
 * Użycie (z `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/measure-repin-ui2g-k02k04-drift.mjs --pin-dir <PIN edb8fb56> --cur-dir <WEB 86d510c66> [--json <plik>]
 * EXIT 0 ⇔ pomiar wykonany (wynik nie jest bramką); 2 ⇔ błąd.
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { rangeMapper } from './repin-ui2g-rev.mjs';

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const PIN_DIR = argOf('--pin-dir');
const CUR_DIR = argOf('--cur-dir');
if (!PIN_DIR || !CUR_DIR) {
  console.error('Użycie: node tools/dom-harness/measure-repin-ui2g-k02k04-drift.mjs --pin-dir <PIN> --cur-dir <CUR> [--json <plik>]');
  process.exit(2);
}
const CITY = resolve(fileURLToPath(new URL('../../src/ui/cityPanel', import.meta.url)));
const load = (d) => readFileSync(join(resolve(d), 'gra/src/ui/cityPanel.ts'), 'utf8').split(/\r?\n/).map((l) => l.replace(/\s+$/, ''));
const PIN = load(PIN_DIR);
const CUR = load(CUR_DIR);

const DECL = /^(?:export\s+)?(?:declare\s+)?(?:async\s+)?(?:function\s*\*?\s*|const\s+|let\s+|var\s+|interface\s+|type\s+|class\s+|enum\s+)([A-Za-z_$][\w$]*)/;
function lcsDist(a, b) {
  const n = a.length, m = b.length;
  const dp = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  return n + m - 2 * dp[0][0];
}
/** Zakres deklaracji `name` w liniach (1-based włącznie) z poprzedzającym JSDoc; null gdy brak. */
function declRange(lines, name) {
  const rx = new RegExp(`^(?:export\\s+)?(?:declare\\s+)?(?:async\\s+)?(?:function\\s*\\*?\\s*|const\\s+|let\\s+|var\\s+|interface\\s+|type\\s+|class\\s+|enum\\s+)${name.replace(/\$/g, '\\$')}\\b`);
  const s = lines.findIndex((l) => rx.test(l));
  if (s < 0) return null;
  let depth = 0, seen = false, e = s;
  for (let i = s; i < lines.length; i++) {
    for (const ch of lines[i]) {
      if (ch === '{' || ch === '(' || ch === '[') { depth++; seen = true; } else if (ch === '}' || ch === ')' || ch === ']') depth--;
    }
    e = i;
    if (seen && depth <= 0 && /[};,)\]]\s*$/.test(lines[i])) break;
    if (!seen && /;\s*$/.test(lines[i])) break;
  }
  let d0 = s;
  if (s > 0 && /\*\/\s*$/.test(lines[s - 1])) {
    d0 = s - 1;
    while (d0 > 0 && !/^\s*\/\*\*?/.test(lines[d0])) d0--;
  }
  return { a: d0 + 1, b: e + 1, text: lines.slice(d0, e + 1) };
}

const files = readdirSync(CITY).filter((f) => /^(k02-|k03-|k04).*\.ts$/.test(f)).sort();
const rows = [];
for (const f of files) {
  const src = readFileSync(join(CITY, f), 'utf8').split('\n');
  const names = [...new Set(src.map((l) => l.match(DECL)?.[1]).filter(Boolean))];
  for (const name of names) {
    const p = declRange(PIN, name);
    const c = declRange(CUR, name);
    let status;
    if (!p) status = 'PORT_ONLY';
    else if (!c) status = 'GONE';
    else {
      const d = lcsDist(p.text, c.text);
      status = d === 0 ? 'SAME' : `DRIFT(${d})`;
    }
    rows.push({ k: f.match(/^(k0\d[a-z]?)/)[1], file: f, name, status, pin: p ? `${p.a}-${p.b}` : '', cur: c ? `${c.a}-${c.b}` : '' });
  }
}
for (const r of rows.filter((x) => x.status.startsWith('DRIFT') || x.status === 'GONE')) {
  console.log(`${r.status.padEnd(10)} ${r.file.padEnd(22)} ${r.name.padEnd(40)} pin=${r.pin.padEnd(12)} cur=${r.cur}`);
}
const byK = new Map();
for (const r of rows) {
  const e = byK.get(r.k) ?? { k: r.k, names: 0, same: 0, drift: 0, driftLines: 0, gone: 0, portOnly: 0 };
  e.names++;
  if (r.status === 'SAME') e.same++;
  else if (r.status.startsWith('DRIFT')) { e.drift++; e.driftLines += +r.status.slice(6, -1); } else if (r.status === 'GONE') e.gone++;
  else e.portOnly++;
  byK.set(r.k, e);
}
console.log('');
for (const e of [...byK.values()].sort((x, y) => x.k.localeCompare(y.k))) {
  console.log(`${e.k.padEnd(5)} nazw=${String(e.names).padStart(3)} SAME=${String(e.same).padStart(3)} DRIFT=${String(e.drift).padStart(2)} (linie ±${e.driftLines}) GONE=${e.gone} PORT_ONLY=${e.portOnly}`);
}
const n = (s) => rows.filter((r) => (s === 'DRIFT' ? r.status.startsWith('DRIFT') : r.status === s)).length;
console.log(`measure-repin-ui2g-k02k04-drift: plików=${files.length} nazw=${rows.length} SAME=${n('SAME')} DRIFT=${n('DRIFT')} GONE=${n('GONE')} PORT_ONLY=${n('PORT_ONLY')}`);
// ─── REF: odwołania do linii pinu w komentarzach ─────────────────────────────
const mappers = {};
const mapperFor = (rel) => (mappers[rel] ??= (() => {
  try {
    const a = readFileSync(join(resolve(PIN_DIR), rel), 'utf8').split(/\r?\n/);
    const b = readFileSync(join(resolve(CUR_DIR), rel), 'utf8').split(/\r?\n/);
    return rangeMapper(a, b);
  } catch { return null; }
})());
const RESOLVE = { 'cities.ts': 'gra/src/game/cities.ts', 'production.ts': 'gra/src/game/production.ts', 'manpower.ts': 'gra/src/game/manpower.ts' };
const refs = [];
for (const f of files) {
  const src = readFileSync(join(CITY, f), 'utf8').split('\n');
  src.forEach((line, i) => {
    for (const m of line.matchAll(/(?:([A-Za-z_/.-]*[A-Za-z_-]+\.ts))?:(\d{3,5})(?:-(\d{3,5}))?\b/g)) {
      const file = m[1] ? (m[1].startsWith('gra/') ? m[1] : RESOLVE[m[1].split('/').pop()] ?? (m[1].endsWith('cityPanel.ts') ? 'gra/src/ui/cityPanel.ts' : null)) : 'gra/src/ui/cityPanel.ts';
      if (!file) continue;
      const a = +m[2], b = m[3] ? +m[3] : a;
      const mp = mapperFor(file);
      if (!mp || b < a) continue;
      const touched = mp.hunks.some((h) => (h.a1 > a - 1 && h.a0 < b) || (h.a0 === h.a1 && h.a0 > a - 1 && h.a0 < b));
      const [wa, wb] = mp.mapRange(a, b);
      refs.push({ file: f, line: i + 1, ref: `${file}:${a}-${b}`, web: `${wa}-${wb}`, status: touched ? 'REF_DRIFT' : 'REF_SAME' });
    }
  });
}
for (const r of refs.filter((x) => x.status === 'REF_DRIFT')) console.log(`REF_DRIFT  ${r.file}:${r.line} ${r.ref} -> web ${r.web}`);
console.log(`measure-repin-ui2g-k02k04-drift REF: odwołań=${refs.length} REF_SAME=${refs.filter((r) => r.status === 'REF_SAME').length} REF_DRIFT=${refs.filter((r) => r.status === 'REF_DRIFT').length}`);
if (argOf('--json')) writeFileSync(resolve(argOf('--json')), JSON.stringify({ names: rows, refs }, null, 1) + '\n');
