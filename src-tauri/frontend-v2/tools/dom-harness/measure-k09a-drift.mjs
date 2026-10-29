#!/usr/bin/env node
/**
 * measure-k09a-drift.mjs — pomiar DRYFU 9 jednostek K09A (P5-8 §7; R-RUSTPORT-P5-8-CITYPANEL-K09A-Q1, runda 1, Operator-pomiary).
 *
 * Dla każdej z 9 jednostek (`K09A_UNITS` z `k09a-subs.mjs`):
 *   (a) PIN: blok pinu `edb8fb56` A..B (surowy tekst, bez podstawień) vs ta sama funkcja (po nazwie)
 *       w `--head-pin-dir` (gra/src/ui/cityPanel.ts na bazie integracji): SAME albo DRIFT(n linii) i zakres linii.
 *       `n` = liczba linii dodanych + usuniętych wg LCS (dokładny diff linia-po-linii, znormalizowany: obcięte
 *       spacje na końcach). Dryf NIE jest przepinowaniem (P5-8 §7).
 *   (b) KOPIA: blok `// pin edb8fb56 …` w porcie vs pin z `K09A_HUNKS` już weryfikuje `verify-k09a-copies.mjs`
 *       (tu tylko zgłaszana liczba hunków dla jednostki, bez ponownej bramki).
 *
 * Pin `--head-pin-dir` podaje wywołujący (np. `git archive <rev> gra/src` do katalogu poza repo); skrypt nie wywołuje git.
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/measure-k09a-drift.mjs --pin-dir <PIN_edb8fb56> [--head-pin-dir <PIN_head>] [--json <plik>]
 * EXIT 0 <=> pomiar wykonany dla wszystkich 9 jednostek (wynik dryfu nie wpływa na kod); 2 <=> błąd narzędzia.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { K09A_HUNKS, K09A_UNITS } from './k09a-subs.mjs';

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const HERE = dirname(fileURLToPath(import.meta.url));
const V2_ROOT = resolve(HERE, '../..');
const PIN_DIR = argOf('--pin-dir');
const HEAD_DIR = argOf('--head-pin-dir');
if (!PIN_DIR) {
  console.error('Użycie: node tools/dom-harness/measure-k09a-drift.mjs --pin-dir <PIN_DIR> [--head-pin-dir <PIN_HEAD>] [--json <plik>]');
  process.exit(2);
}
const CP = 'gra/src/ui/cityPanel.ts';
const pinLines = (dir) => readFileSync(join(resolve(dir), CP), 'utf8').split(/\r?\n/).map((l) => l.replace(/\s+$/, ''));
const PIN = pinLines(PIN_DIR);
const HEAD = HEAD_DIR ? pinLines(HEAD_DIR) : null;

/** LCS-diff linii: zwraca liczbę linii dodanych + usuniętych. */
const lcsChanges = (x, y) => {
  const n = x.length;
  const m = y.length;
  const prev = new Array(m + 1).fill(0);
  for (let i = 1; i <= n; i += 1) {
    const cur = new Array(m + 1).fill(0);
    for (let j = 1; j <= m; j += 1) {
      cur[j] = x[i - 1] === y[j - 1] ? prev[j - 1] + 1 : Math.max(prev[j], cur[j - 1]);
    }
    prev.splice(0, m + 1, ...cur);
  }
  const lcs = prev[m];
  return (n - lcs) + (m - lcs);
};

/** Zakres funkcji w pinie: start = linia z deklaracją, koniec = pierwsza linia `}` w kolumnie 0 po niej. */
const fnRange = (lines, name) => {
  const a = lines.findIndex((l) => l.includes(`function ${name}(`));
  if (a < 0) return null;
  let b = a;
  while (b < lines.length && lines[b] !== '}') b += 1;
  return { a: a + 1, b: b + 1 };
};

const rows = [];
for (const u of K09A_UNITS) {
  const pinBody = PIN.slice(u.a - 1, u.b);
  const hunks = Object.entries(K09A_HUNKS)
    .filter(([k]) => k.endsWith(`:${u.a}-${u.b}`))
    .reduce((s, [, hs]) => s + hs.length, 0);
  let pinDrift = 'NIE_ZMIERZONO (brak --head-pin-dir)';
  let headRange = '-';
  if (HEAD) {
    const r = fnRange(HEAD, u.name);
    if (!r) {
      pinDrift = 'USUNIETA_Z_PINU_HEAD';
    } else {
      const headBody = HEAD.slice(r.a - 1, r.b);
      const d = lcsChanges(pinBody, headBody);
      pinDrift = d === 0 ? 'SAME' : `DRIFT(${d})`;
      headRange = `${r.a}-${r.b}`;
    }
  }
  rows.push({ unit: u.name, pinRange: `${u.a}-${u.b}`, pinLoc: u.b - u.a + 1, copyHunks: hunks, head: headRange, pinHead: pinDrift });
}

for (const r of rows) {
  console.log(`${r.unit.padEnd(26)} pin=${r.pinRange.padEnd(12)} loc=${String(r.pinLoc).padEnd(4)} hunki_kopii=${String(r.copyHunks).padEnd(3)} head=${r.head.padEnd(12)} pin_head=${r.pinHead}`);
}
const jsonPath = argOf('--json');
if (jsonPath) writeFileSync(jsonPath, JSON.stringify({ pinDir: PIN_DIR, headPinDir: HEAD_DIR ?? null, rows }, null, 2));
console.log(`\nmeasure-k09a-drift: jednostek=${rows.length}, hunki_kopii=${rows.reduce((s, r) => s + r.copyHunks, 0)}`);
process.exit(0);
