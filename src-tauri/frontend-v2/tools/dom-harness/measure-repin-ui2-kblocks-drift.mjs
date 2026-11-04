#!/usr/bin/env node
/**
 * measure-repin-ui2-kblocks-drift.mjs — pomiar DRYFU wszystkich bloków kopii K01–K09 (`src/ui/cityPanel/*.ts`)
 * względem aktualnego weba (R-RUSTPORT-REPIN-UI-2-A-Q1, krok 3). Uzupełnia `measure-k08d/k08e/k09a-drift.mjs`
 * (te mierzą tylko swoje jednostki) o pozostałe partie K01–K07, tą samą metodą dla każdego bloku.
 *
 * Dla każdego markera `// pin edb8fb56 gra/src/ui/cityPanel.ts:A-B` w porcie:
 *   blok = linie A..B pinu (`--pin-dir`, obcięte spacje końcowe);
 *   SAME     identyczny ciąg linii występuje w `--cur-dir` (podawany jest nowy zakres);
 *   DRIFT(n) brak dokładnego wystąpienia, ale deklaracja o tej samej nazwie (pierwsza deklaracja w bloku:
 *            function/const/let/interface/type/class) istnieje w `--cur-dir`; n = linie +/− wg LCS względem
 *            tej samej liczby linii od deklaracji w cur (zakres wyznaczany dopasowaniem nawiasów klamrowych);
 *   GONE     nazwa nie występuje w cur;  ANON  blok bez deklaracji (fragment) i bez dokładnego wystąpienia.
 * Skrypt nie wywołuje git: katalogi podaje wywołujący (`git archive <rev> gra/src` poza repo).
 *
 * Użycie (z `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/measure-repin-ui2-kblocks-drift.mjs --pin-dir <PIN_edb8fb56> --cur-dir <WEB_main> [--json <plik>]
 * EXIT 0 <=> pomiar wykonany (wynik dryfu nie jest bramką); 2 <=> błąd narzędzia.
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const PIN_DIR = argOf('--pin-dir');
const CUR_DIR = argOf('--cur-dir');
if (!PIN_DIR || !CUR_DIR) {
  console.error('Użycie: node tools/dom-harness/measure-repin-ui2-kblocks-drift.mjs --pin-dir <PIN> --cur-dir <CUR> [--json <plik>]');
  process.exit(2);
}
const V2 = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const CITY = join(V2, 'src/ui/cityPanel');
const load = (d) => readFileSync(join(resolve(d), 'gra/src/ui/cityPanel.ts'), 'utf8').split(/\r?\n/).map((l) => l.replace(/\s+$/, ''));
const PIN = load(PIN_DIR);
const CUR = load(CUR_DIR);
const CUR_JOINED = '\n' + CUR.join('\n') + '\n';

const DECL = /^(?:export\s+)?(?:async\s+)?(?:function\s*\*?\s*|const\s+|let\s+|var\s+|interface\s+|type\s+|class\s+|enum\s+)([A-Za-z_$][\w$]*)/;
function lcsDist(a, b) {
  const n = a.length, m = b.length;
  const dp = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  return n + m - 2 * dp[0][0];
}
/** Koniec deklaracji od linii `s` (0-based): dopasowanie klamer; dla deklaracji jednoliniowych — ta linia. */
function declEnd(lines, s) {
  let depth = 0, seen = false;
  for (let i = s; i < lines.length; i++) {
    for (const ch of lines[i]) {
      if (ch === '{') { depth++; seen = true; } else if (ch === '}') depth--;
    }
    if (seen && depth <= 0) return i;
    if (!seen && /;\s*$/.test(lines[i])) return i;
  }
  return lines.length - 1;
}
function lineOf(idx) {
  return CUR_JOINED.slice(0, idx).split('\n').length - 1;
}

const rows = [];
for (const f of readdirSync(CITY).filter((x) => x.endsWith('.ts')).sort()) {
  const txt = readFileSync(join(CITY, f), 'utf8').split('\n');
  for (const line of txt) {
    const m = line.match(/^\s*\/\/ pin edb8fb56 gra\/src\/ui\/cityPanel\.ts:(\d+)-(\d+)\s*$/);
    if (!m) continue;
    const a = +m[1], b = +m[2];
    const block = PIN.slice(a - 1, b);
    const k = f.match(/^(k\d\d[a-z]?)/)?.[1] ?? f;
    const decl = block.map((l) => l.match(DECL)?.[1]).find(Boolean) ?? null;
    const needle = '\n' + block.join('\n') + '\n';
    const at = CUR_JOINED.indexOf(needle);
    let status, cur = '';
    if (at >= 0) {
      const s = lineOf(at) + 1;
      status = 'SAME';
      cur = `${s}-${s + block.length - 1}`;
    } else if (decl) {
      const rx = new RegExp(`^(?:export\\s+)?(?:async\\s+)?(?:function\\s*\\*?\\s*|const\\s+|let\\s+|var\\s+|interface\\s+|type\\s+|class\\s+|enum\\s+)${decl.replace(/\$/g, '\\$')}\\b`);
      const si = CUR.findIndex((l) => rx.test(l));
      if (si < 0) status = 'GONE';
      else {
        const pinDeclAt = block.findIndex((l) => rx.test(l));
        const start = Math.max(0, si - pinDeclAt);
        const end = Math.max(declEnd(CUR, si), start + block.length - 1);
        const curBlock = CUR.slice(start, end + 1);
        status = `DRIFT(${lcsDist(block, curBlock)})`;
        cur = `${start + 1}-${end + 1}`;
      }
    } else status = 'ANON';
    rows.push({ k, file: f, pin: `${a}-${b}`, loc: block.length, decl, status, cur });
  }
}
const byK = new Map();
for (const r of rows) {
  const e = byK.get(r.k) ?? { k: r.k, blocks: 0, same: 0, drift: 0, gone: 0, anon: 0, driftLines: 0 };
  e.blocks++;
  if (r.status === 'SAME') e.same++;
  else if (r.status.startsWith('DRIFT')) { e.drift++; e.driftLines += +r.status.slice(6, -1); } else if (r.status === 'GONE') e.gone++;
  else e.anon++;
  byK.set(r.k, e);
}
for (const r of rows.filter((x) => x.status !== 'SAME')) console.log(`${r.status.padEnd(10)} ${r.file.padEnd(24)} pin=${r.pin.padEnd(12)} cur=${r.cur.padEnd(12)} ${r.decl ?? '(fragment)'}`);
console.log('');
for (const e of [...byK.values()].sort((x, y) => x.k.localeCompare(y.k))) {
  console.log(`${e.k.padEnd(5)} bloków=${String(e.blocks).padStart(3)} SAME=${String(e.same).padStart(3)} DRIFT=${String(e.drift).padStart(2)} (linie ±${e.driftLines}) GONE=${e.gone} ANON=${e.anon}`);
}
const tot = rows.length, same = rows.filter((r) => r.status === 'SAME').length;
console.log(`measure-repin-ui2-kblocks-drift: bloków=${tot} SAME=${same} inne=${tot - same}`);
if (argOf('--json')) writeFileSync(argOf('--json'), JSON.stringify(rows, null, 1) + '\n');
