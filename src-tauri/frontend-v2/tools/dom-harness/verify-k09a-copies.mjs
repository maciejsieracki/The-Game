#!/usr/bin/env node
/**
 * verify-k09a-copies.mjs — bramka wierności KOPII tekstowych K09A (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K09A-Q1, runda 1).
 *
 * Każdy blok jednostki w `src/ui/cityPanel/k09a-*.ts` jest poprzedzony markerem `// pin edb8fb56 gra/src/ui/cityPanel.ts:A-B`
 * i zamknięty linią `// pin-end`. Po normalizacji (usunięty prefiks `export `, obcięte spacje na końcu linii, puste
 * linie końcowe) blok jest porównywany z liniami A..B pinu algorytmem LCS. Różnice (hunki: linie pinu → linie portu)
 * muszą być DOKŁADNIE zapisane w `k09a-subs.mjs` (`K09A_HUNKS`) dla tego bloku — każda nieopisana zmiana = FAIL.
 * `k09a-subs.mjs` generuje się tym samym skryptem (`--gen`), a zmiany w nim są jawnym zapisem ZAŁOŻEŃ portu.
 *
 * Bramka (EXIT 0 <=> wszystkie poniższe):
 *   TEXT    każdy blok: hunki LCS = `K09A_HUNKS[klucz]` (klucz `plik:A-B`); brak wpisu = FAIL;
 *   ORPHAN  każdy marker ma `// pin-end`, zakres A-B wskazuje na istniejące linie pinu, żaden marker nie jest osierocony;
 *   COVER   każda z 9 jednostek K09A (`K09A_UNITS`) ma dokładnie jeden blok; bloki nie nachodzą na siebie;
 *   LOCAL   eksporty najwyższego poziomu w `k09a-*.ts` poza blokami są na liście `K09A_LOCAL_EXPORTS`.
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/verify-k09a-copies.mjs [--pin-file <plik>] [--port-dir <katalog>]
 *   node tools/dom-harness/verify-k09a-copies.mjs --gen [--pin-file <plik>]   (wypisuje k09a-subs.mjs na stdout)
 * Domyślny pin: `git show edb8fb56:gra/src/ui/cityPanel.ts` (uruchamiany w katalogu repo).
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { K09A_HUNKS, K09A_UNITS, K09A_LOCAL_EXPORTS } from './k09a-subs.mjs';

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const HERE = dirname(fileURLToPath(import.meta.url));
const FRONT = resolve(HERE, '../..');
const PIN = 'edb8fb56';
const PIN_PATH = 'gra/src/ui/cityPanel.ts';
const pinFile = argOf('--pin-file');
const portDir = resolve(argOf('--port-dir') ?? join(FRONT, 'src/ui/cityPanel'));
const GEN = args.includes('--gen');

const pinText = pinFile
  ? readFileSync(resolve(pinFile), 'utf8')
  : execFileSync('git', ['show', `${PIN}:${PIN_PATH}`], { cwd: FRONT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const pinLines = pinText.split('\n');

/** Normalizacja linii: bez `export `, bez spacji na końcu. */
const norm = (line) => line.replace(/^export /, '').replace(/\s+$/, '');
/** Normalizacja bloku: usuń puste linie końcowe. */
const normBlock = (lines) => {
  const out = lines.map(norm);
  while (out.length > 0 && out[out.length - 1] === '') out.pop();
  return out;
};

/** LCS-hunki między `a` (pin) i `b` (port): lista {pin:[…], port:[…]} w kolejności. */
export function lcsHunks(a, b) {
  const n = a.length, m = b.length;
  const dp = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const hunks = [];
  let i = 0, j = 0, cur = null;
  while (i < n || j < m) {
    if (i < n && j < m && a[i] === b[j]) {
      if (cur) { hunks.push(cur); cur = null; }
      i++; j++;
    } else {
      if (!cur) cur = { pin: [], port: [] };
      if (j >= m || (i < n && dp[i + 1][j] >= dp[i][j + 1])) {
        cur.pin.push(a[i++]);
      } else {
        cur.port.push(b[j++]);
      }
    }
  }
  if (cur) hunks.push(cur);
  return hunks;
}

// ─── Skan bloków w portach ────────────────────────────────────────────────────────────────────────────────────────
const portFiles = readdirSync(portDir).filter(f => /^k09a-.*\.ts$/.test(f)).sort();
const blocks = [];
const problems = [];
const markerRe = /^\/\/ pin edb8fb56 gra\/src\/ui\/cityPanel\.ts:(\d+)-(\d+)\s*$/;

for (const file of portFiles) {
  const lines = readFileSync(join(portDir, file), 'utf8').split('\n');
  let open = null;
  lines.forEach((line, idx) => {
    const m = markerRe.exec(line.trimEnd());
    if (m) {
      if (open) problems.push(`ORPHAN ${file}:${idx + 1} marker przed zamknięciem poprzedniego bloku (${open.key})`);
      open = { file, key: `${file}:${m[1]}-${m[2]}`, a: Number(m[1]), b: Number(m[2]), start: idx + 1, body: [] };
      return;
    }
    if (line.trimEnd() === '// pin-end') {
      if (!open) problems.push(`ORPHAN ${file}:${idx + 1} pin-end bez markera`);
      else { blocks.push(open); open = null; }
      return;
    }
    if (open) open.body.push(line);
  });
  if (open) problems.push(`ORPHAN ${file} blok bez pin-end (${open.key})`);
}

// ─── Porównanie LCS: pin A..B ↔ blok ─────────────────────────────────────────────────────────────────────────────
const computed = {};
for (const blk of blocks) {
  if (blk.b > pinLines.length || blk.a < 1 || blk.a > blk.b) {
    problems.push(`ORPHAN ${blk.key} zakres poza pinem (${pinLines.length} linii)`);
    continue;
  }
  const pinSlice = normBlock(pinLines.slice(blk.a - 1, blk.b));
  const portSlice = normBlock(blk.body);
  const hunks = lcsHunks(pinSlice, portSlice);
  computed[blk.key] = hunks;
  const want = K09A_HUNKS[blk.key];
  if (GEN) continue;
  if (want === undefined) {
    problems.push(`TEXT ${blk.key} brak wpisu w K09A_HUNKS (zmiany względem pinu: ${hunks.length})`);
  } else if (JSON.stringify(want) !== JSON.stringify(hunks)) {
    problems.push(`TEXT ${blk.key} hunki różnią się od zapisanych (zapisane ${want.length}, obliczone ${hunks.length})`);
  }
}

// ─── COVER: jednostki i nachodzenie ──────────────────────────────────────────────────────────────────────────────
const byUnit = {};
for (const blk of blocks) {
  const unit = K09A_UNITS.find(u => u.a === blk.a && u.b === blk.b);
  if (!unit) { problems.push(`COVER ${blk.key} zakres nie jest jednostką K09A`); continue; }
  (byUnit[unit.name] ??= []).push(blk.key);
}
for (const unit of K09A_UNITS) {
  const keys = byUnit[unit.name] ?? [];
  if (keys.length !== 1) problems.push(`COVER jednostka ${unit.name} (${unit.a}-${unit.b}) ma ${keys.length} bloków (oczekiwano 1)`);
}
for (const x of blocks) for (const y of blocks) {
  if (x !== y && x.file === y.file && x.a <= y.b && y.a <= x.b && x.start < y.start) problems.push(`COVER nachodzenie ${x.key} ↔ ${y.key}`);
}

// ─── LOCAL: eksporty poza blokami ────────────────────────────────────────────────────────────────────────────────
const exportRe = /^export (?:function|const|let|type|interface|class) ([A-Za-z0-9_]+)/;
const localExports = [];
for (const file of portFiles) {
  const lines = readFileSync(join(portDir, file), 'utf8').split('\n');
  let inBlock = false;
  lines.forEach((line) => {
    if (markerRe.test(line.trimEnd())) inBlock = true;
    else if (line.trimEnd() === '// pin-end') inBlock = false;
    else if (!inBlock) {
      const m = exportRe.exec(line);
      if (m) localExports.push({ file, name: m[1] });
    }
  });
}
for (const e of localExports) {
  if (!K09A_LOCAL_EXPORTS.includes(e.name)) problems.push(`LOCAL ${e.file}: eksport ${e.name} poza blokami i poza K09A_LOCAL_EXPORTS`);
}

// ─── Wynik ───────────────────────────────────────────────────────────────────────────────────────────────────────
if (GEN) {
  const out = [];
  out.push('// Wygenerowano przez: node tools/dom-harness/verify-k09a-copies.mjs --gen  (rewizja ręczna = FAIL bramki TEXT)');
  out.push('// Hunki = różnice LCS między pinem edb8fb56 (A..B) a blokiem portu; każda zmiana względem pinu jest tu zapisana.');
  out.push('export const K09A_HUNKS = ' + JSON.stringify(computed, null, 1) + ';');
  out.push('export const K09A_UNITS = ' + JSON.stringify(K09A_UNITS, null, 1) + ';');
  out.push('export const K09A_LOCAL_EXPORTS = ' + JSON.stringify(K09A_LOCAL_EXPORTS, null, 1) + ';');
  process.stdout.write(out.join('\n') + '\n');
  process.exitCode = 0;
} else {
  for (const p of problems) console.error(p);
  const hunkCount = Object.values(computed).reduce((s, h) => s + h.length, 0);
  console.log(`verify-k09a-copies: pin=${PIN} bloków=${blocks.length} jednostek=${K09A_UNITS.length} hunków=${hunkCount} problemów=${problems.length}`);
  process.exitCode = problems.length === 0 ? 0 : 1;
}
