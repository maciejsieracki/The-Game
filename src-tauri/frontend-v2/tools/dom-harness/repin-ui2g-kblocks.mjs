#!/usr/bin/env node
/**
 * repin-ui2g-kblocks.mjs — przepięcie markerów bloków kopii K (`src/ui/cityPanel/k0*.ts`) z pinu `edb8fb56`
 * na web `86d510c66` (R-RUSTPORT-REPIN-UI-2-G-Q1, P5-REPIN-UI-2 §3/§6).
 *
 * Dla każdego markera `// pin[-adapter] edb8fb56 <plik gra/src>:A-B` w podanych plikach portu:
 *   mapa linii pin→web liczona różnicą Myersa (O(ND)) całych plików `<plik>` z `--pin-dir` i `--web-dir`
 *   (bez wywołań git; katalogi = `git archive <rev> gra/src` poza repo);
 *   MOVED  żaden hunk różnicy nie dotyka A..B → nowy marker `86d510c66 <plik>:A'-B'` (treść bloku bez zmian);
 *   DRIFT  ≥1 hunk w A..B → A'/B' = obraz granic (granica w hunku → brzeg hunku po stronie web), a każdy hunk
 *          jest nakładany na treść bloku portu: usunięte linie pinu (porównanie bez `export ` na początku) muszą
 *          wystąpić w bloku portu DOKŁADNIE raz jako ciąg kolejnych linii → zastąpione liniami webu; czysty dopisek
 *          wstawiany po linii-kotwicy (poprzednia linia pinu, też dokładnie raz). Inaczej MANUAL (bez zapisu bloku,
 *          raport podaje hunk) — wtedy blok przepina się ręcznie, a weryfikator partii to sprawdza.
 * Wynik nie jest bramką: bramką są `verify-k0*-copies.mjs --pin-dir <WEB>` i harnessy partii na `<WEB>`.
 *
 * Użycie (z `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/repin-ui2g-kblocks.mjs --pin-dir <PIN> --web-dir <WEB> --files k05a-fundament.ts,… [--write] [--json <plik>]
 * EXIT 0 ⇔ brak MANUAL; 1 ⇔ ≥1 MANUAL; 2 ⇔ błąd narzędzia.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { myersHunks, K_REV_PIN, K_REV_WEB } from './repin-ui2g-rev.mjs';

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const HERE = dirname(fileURLToPath(import.meta.url));
const CITY = resolve(HERE, '../../src/ui/cityPanel');
const PIN_DIR = argOf('--pin-dir');
const WEB_DIR = argOf('--web-dir');
const FILES = (argOf('--files') ?? '').split(',').filter(Boolean);
const WRITE = args.includes('--write');
const REV_TO = K_REV_WEB;
void K_REV_PIN;
if (!PIN_DIR || !WEB_DIR || !FILES.length) {
  console.error('Użycie: node tools/dom-harness/repin-ui2g-kblocks.mjs --pin-dir <PIN> --web-dir <WEB> --files a.ts,b.ts [--write] [--json <plik>]');
  process.exit(2);
}

const norm = (l) => l.replace(/\s+$/, '');
const stripExport = (l) => l.replace(/^export /, '');
const cache = {};
function fileDiff(rel) {
  if (cache[rel]) return cache[rel];
  const P = readFileSync(join(PIN_DIR, rel), 'utf8').split(/\r?\n/).map(norm);
  const W = readFileSync(join(WEB_DIR, rel), 'utf8').split(/\r?\n/).map(norm);
  const hunks = myersHunks(P, W);
  cache[rel] = { P, W, hunks };
  return cache[rel];
}
/** Obraz linii pinu `L` (1-based) poza hunkami; dla linii w hunku — null. */
function mapLine(d, L) {
  let delta = 0;
  for (const h of d.hunks) {
    if (L - 1 < h.a0) break;
    if (L - 1 < h.a1) return null;
    delta += (h.b1 - h.b0) - (h.a1 - h.a0);
  }
  return L + delta;
}
const hunkOf = (d, L) => d.hunks.find((h) => L - 1 >= h.a0 && L - 1 < h.a1);

// Prefiks K01A-Z5 (`// kopia typu (…) pin …`) i adnotacja po zakresie (`:A-B (…)`, K01B) są zachowywane.
const MARK = /^(\/\/ (?:kopia typu \([^)]*\) )?)pin(-adapter)? edb8fb56 (gra\/src\/[^:\s]+):(\d+)-(\d+)(\s.*)?$/;
const rows = [];
let manual = 0;
for (const f of FILES) {
  const path = join(CITY, f);
  if (!existsSync(path)) { console.error(`brak pliku portu ${f}`); process.exit(2); }
  const lines = readFileSync(path, 'utf8').split('\n');
  // Bloki: marker → do następnego markera / `// pin-end` / końca pliku.
  const marks = [];
  lines.forEach((t, i) => { if (MARK.test(t) || /^\/\/ (?:kopia typu \([^)]*\) )?pin(-adapter)? \S+ gra\//.test(t) || /^\/\/ pin-end$/.test(t)) marks.push(i); });
  const out = [...lines];
  // Przetwarzanie od końca, żeby wstawienia nie przesuwały indeksów wcześniejszych bloków.
  for (let mi = marks.length - 1; mi >= 0; mi--) {
    const i = marks[mi];
    const m = MARK.exec(lines[i]);
    if (!m) continue;
    const [, prefix, adapter = '', rel] = m;
    const A = +m[4], B = +m[5];
    const suffix = m[6] ?? '';
    const d = fileDiff(rel);
    const bodyStart = i + 1, bodyEnd = mi + 1 < marks.length ? marks[mi + 1] : lines.length; // [bodyStart, bodyEnd)
    const touching = d.hunks.filter((h) => h.a1 > A - 1 && h.a0 < B || (h.a0 === h.a1 && h.a0 > A - 1 && h.a0 < B));
    let A2 = mapLine(d, A), B2 = mapLine(d, B);
    if (A2 === null) A2 = hunkOf(d, A).b0 + 1;
    if (B2 === null) B2 = hunkOf(d, B).b1;
    const row = { file: f, marker: i + 1, rel, pin: `${A}-${B}`, web: `${A2}-${B2}`, hunks: touching.length, status: touching.length ? 'DRIFT' : 'MOVED', notes: [] };
    if (adapter && touching.length) { row.status = 'MANUAL'; row.notes.push('blok adaptera (pin-adapter) z dryfem — tylko sygnatura, decyzja ręczna'); }
    let body = lines.slice(bodyStart, bodyEnd);
    if (touching.length && !adapter) {
      for (const h of [...touching].reverse()) {
        const oldL = d.P.slice(Math.max(h.a0, A - 1), Math.min(h.a1, B));
        const newL = d.W.slice(h.b0, h.b1);
        const cmp = (x) => norm(stripExport(x));
        if (oldL.length) {
          const hits = [];
          for (let s = 0; s + oldL.length <= body.length; s++) if (oldL.every((l, k) => cmp(body[s + k]) === stripExport(l))) hits.push(s);
          if (hits.length !== 1) { row.status = 'MANUAL'; row.notes.push(`hunk pin ${h.a0 + 1}-${h.a1} (${oldL.length} linii) w bloku portu ${hits.length}×`); continue; }
          const s = hits[0];
          const keepExport = /^export /.test(body[s]) && !/^export /.test(newL[0] ?? '') && /^(function|const|let|type|interface|class|enum|async)\b/.test(newL[0] ?? '');
          const repl = newL.map((l, k) => (k === 0 && keepExport ? 'export ' + l : l));
          // Hunk szerszy niż blok (granica): tylko część webu odpowiadająca blokowi.
          body.splice(s, oldL.length, ...(h.a0 < A - 1 || h.a1 > B ? repl.slice(0, Math.max(0, Math.min(repl.length, B2 - h.b0))) : repl));
        } else {
          const anchor = d.P[h.a0 - 1];
          const hits = [];
          body.forEach((l, s) => { if (cmp(l) === stripExport(anchor)) hits.push(s); });
          if (hits.length !== 1) { row.status = 'MANUAL'; row.notes.push(`dopisek po pin ${h.a0} — kotwica w bloku portu ${hits.length}×`); continue; }
          body.splice(hits[0] + 1, 0, ...newL);
        }
      }
    }
    if (row.status === 'MANUAL') manual++;
    rows.push(row);
    if (WRITE && row.status !== 'MANUAL') {
      out.splice(bodyStart, bodyEnd - bodyStart, ...body);
      out[i] = `${prefix}pin${adapter} ${REV_TO} ${rel}:${A2}-${B2}${suffix}`;
    }
  }
  if (WRITE) writeFileSync(path, out.join('\n'));
}
for (const r of rows.filter((x) => x.status !== 'MOVED')) console.log(`${r.status.padEnd(6)} ${r.file}:${r.marker} ${r.rel} pin=${r.pin} web=${r.web} hunki=${r.hunks} ${r.notes.join('; ')}`);
const cnt = (s) => rows.filter((r) => r.status === s).length;
console.log(`repin-ui2g-kblocks: bloków=${rows.length} MOVED=${cnt('MOVED')} DRIFT=${cnt('DRIFT')} MANUAL=${cnt('MANUAL')}${WRITE ? ' (zapisano)' : ' (bez zapisu)'}`);
if (argOf('--json')) writeFileSync(resolve(argOf('--json')), JSON.stringify(rows, null, 1) + '\n');
process.exit(manual ? 1 : 0);
