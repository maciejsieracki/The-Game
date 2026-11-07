#!/usr/bin/env node
/**
 * repin-ui3e-tool-ranges.mjs — R-RUSTPORT-REPIN-WEB-UI-3-E-Q1: przeniesienie zakresów linii `cityPanel.ts` zaszytych
 * w narzędziach partii K (weryfikatory, `k0*-subs.mjs`) z webu `86d510c66` na web `9b019a7d8` (FALA 509–532).
 *
 * Mapa linii = różnica Myersa `gra/src/ui/cityPanel.ts` 86d510c66 → 9b019a7d8 (`rangeMapper`, jak `repin-ui3e-kblocks.mjs`);
 * granica w hunku → brzeg hunku po stronie 9b019a7d8. Bloki z dryfem przepięte ręcznie (MANUAL) — jawna tabela.
 * Przepisywane wzorce (tylko pary, w których OBIE liczby leżą w zakresie pliku 86d i a ≤ b):
 *   `a: N, b: M`  ·  `N-M` (w literałach napisów/kluczach)  ·  `cityPanel.ts:N-M`.
 * Pojedyncze liczby (np. `const A = 5183;`) NIE są ruszane — raport `--list-single` wskazuje je do ręcznej decyzji.
 *
 * Użycie (z `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/repin-ui3e-tool-ranges.mjs --web86-dir <WEB86> --web3-dir <WEB3> --files a.mjs,b.mjs [--write]
 * EXIT 0 = OK; 2 = błąd użycia.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { rangeMapper } from './repin-ui2g-rev.mjs';

const args = process.argv.slice(2);
const argOf = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
const W86 = argOf('--web86-dir'), W3 = argOf('--web3-dir');
const FILES = (argOf('--files') ?? '').split(',').filter(Boolean);
const WRITE = args.includes('--write');
const SINGLE = args.includes('--single');
if (!W86 || !W3 || !FILES.length) { console.error('Użycie: --web86-dir <WEB86> --web3-dir <WEB3> --files a,b [--write]'); process.exit(2); }
const REL = 'gra/src/ui/cityPanel.ts';
const A = readFileSync(join(W86, REL), 'utf8').split(/\r?\n/);
const B = readFileSync(join(W3, REL), 'utf8').split(/\r?\n/);
const { mapRange, mapLine } = rangeMapper(A, B);
export const MANUAL_86_TO_3 = { '1498-1503': '1523-1532', '6901-7000': '6930-7038', '8232-8282': '8281-8336', '12096-12182': '12191-12289' };
const map = (a, b) => {
  const k = `${a}-${b}`;
  if (MANUAL_86_TO_3[k]) return MANUAL_86_TO_3[k].split('-').map(Number);
  return mapRange(a, b);
};
const ok = (a, b) => a >= 1 && b >= a && b <= A.length && b - a < 4000;
let total = 0;
for (const f of FILES) {
  const p = resolve(f);
  let s = readFileSync(p, 'utf8');
  let n = 0;
  s = s.replace(/\ba: (\d+), b: (\d+)\b/g, (m, x, y) => {
    const a = +x, b = +y;
    if (!ok(a, b)) return m;
    const [a2, b2] = map(a, b); n++;
    return `a: ${a2}, b: ${b2}`;
  });
  // JSON: `"a": N,\n  "b": M` (np. K09A_UNITS w k09a-subs.mjs).
  s = s.replace(/"a": (\d+),(\s*)"b": (\d+)/g, (m, x, ws, y) => {
    const a = +x, b = +y;
    if (!ok(a, b)) return m;
    const [a2, b2] = map(a, b); n++;
    return `"a": ${a2},${ws}"b": ${b2}`;
  });
  // `['nazwa', N, M]` (tablice jednostek weryfikatorów) oraz `x.a === N && x.b === M`.
  // `--single`: kotwice jednej linii `[N, '…']` i `cityPanel.ts:N ` (bez zakresu) — linia w hunku = bez zmiany + ostrzeżenie.
  if (SINGLE) {
    const one = (m, pre, x, post) => {
      const L = +x;
      if (L < 1 || L > A.length) return m;
      const L2 = mapLine(L);
      if (L2 === null) { console.log(`  UWAGA ${f}: linia ${L} w hunku 86d→9b0 — bez zmiany`); return m; }
      n++;
      return `${pre}${L2}${post}`;
    };
    s = s.replace(/(\[)(\d{3,5})(, ['"])/g, one);
    s = s.replace(/(cityPanel\.ts:)(\d{3,5})([^\d-])/g, one);
  }
  s = s.replace(/(['"][\w$]+['"],\s*)(\d+), (\d+)(?=[,\]])/g, (m, pre, x, y) => {
    const a = +x, b = +y;
    if (!ok(a, b)) return m;
    const [a2, b2] = map(a, b); n++;
    return `${pre}${a2}, ${b2}`;
  });
  s = s.replace(/\.a === (\d+) && (\w+)\.b === (\d+)/g, (m, x, v, y) => {
    const a = +x, b = +y;
    if (!ok(a, b)) return m;
    const [a2, b2] = map(a, b); n++;
    return `.a === ${a2} && ${v}.b === ${b2}`;
  });
  s = s.replace(/(?<![\d.\w])(\d{2,5})-(\d{2,5})(?![\d\w])/g, (m, x, y) => {
    const a = +x, b = +y;
    if (!ok(a, b)) return m;
    const [a2, b2] = map(a, b); n++;
    return `${a2}-${b2}`;
  });
  total += n;
  console.log(`${f}: przepisanych zakresów=${n}`);
  if (WRITE) writeFileSync(p, s);
}
console.log(`repin-ui3e-tool-ranges: razem=${total}${WRITE ? ' (zapisano)' : ' (bez zapisu)'}`);
