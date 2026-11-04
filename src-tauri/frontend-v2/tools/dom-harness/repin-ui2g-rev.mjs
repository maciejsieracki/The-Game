/**
 * repin-ui2g-rev.mjs — wspólna reguła rewizji markerów bloków K (R-RUSTPORT-REPIN-UI-2-G-Q1).
 *
 * Marker bloku kopii może wskazywać pin P5 `edb8fb56` albo web `86d510c66` (repin UI-2-G, P5-REPIN-UI-2 §6).
 * Partia (zbiór plików jednego weryfikatora) ma JEDNĄ rewizję: mieszanie = błąd. `--pin-dir` weryfikatora/harnessu
 * partii to katalog `git archive <ta rewizja> gra/src gra/data` (dla przepiętych partii: web `86d510c66`).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

export const K_REV_PIN = 'edb8fb56';
export const K_REV_WEB = '86d510c66';
/** Fragment wyrażenia regularnego: dozwolone rewizje markera. */
export const K_REV_RX = '(?:edb8fb56|86d510c66)';

/**
 * R-RUSTPORT-REPIN-UI-2-G-Q1 r2 (zarzut Z6): etykieta rewizji FAKTYCZNEGO wejścia harnessu — z treści
 * `<pinDir>/gra/src/ui/cityPanel.ts` (sha1 obiektu git blob), a nie z tekstu wpisanego w kod.
 * Znane bloby: edb8fb56 → 0eacab6a…, 86d510c66 → 1d78ffe6…; inna treść = `nieznana (blob …)`.
 */
export const K_CITYPANEL_BLOBS = {
  '0eacab6a20d2d05c3f21eab8a05abadf200a6484': K_REV_PIN,
  '1d78ffe6721d57c0537c4f404de7b6953344ccc1': K_REV_WEB,
};
export function pinDirRevLabel(pinDir, rel = 'gra/src/ui/cityPanel.ts') {
  const buf = readFileSync(join(pinDir, rel));
  const blob = createHash('sha1').update(`blob ${buf.length}\0`).update(buf).digest('hex');
  return K_CITYPANEL_BLOBS[blob] ?? `nieznana (blob ${blob.slice(0, 12)})`;
}
/**
 * R-RUSTPORT-REPIN-UI-2-G-Q1 r2: zakres jednostki zapisany w zamrożonych danych (pin edb8fb56) → zakres w rewizji
 * `--pin-dir`. Dla webu 86d510c66 przez zamrożoną mapę `repin-ui2g-rangemap.json` (zakres bez wpisu = wyjątek, nie zgadywanie).
 */
let RANGE_MAP_CACHE = null;
export function rangeForPinDir(pinDir, a, b) {
  const rev = pinDirRevLabel(pinDir);
  if (rev === K_REV_PIN) return { a, b };
  if (rev !== K_REV_WEB) throw new Error(`--pin-dir: nieznana rewizja cityPanel.ts (${rev})`);
  RANGE_MAP_CACHE ??= JSON.parse(readFileSync(new URL('./repin-ui2g-rangemap.json', import.meta.url), 'utf8')).map;
  const w = RANGE_MAP_CACHE[`${a}-${b}`];
  if (!w) throw new Error(`repin-ui2g-rangemap.json: brak zakresu pinu ${a}-${b}`);
  const [wa, wb] = w.split('-').map(Number);
  return { a: wa, b: wb };
}
/** `gra/src/ui/cityPanel.ts (<rewizja wejścia>)` — pole `pinFile` raportów JSON harnessów partii K. */
export function pinFileLabel(pinDir) {
  return `gra/src/ui/cityPanel.ts (${pinDirRevLabel(pinDir)})`;
}

const ANY_MARK = /^\/\/ (?:kopia typu \([^)]*\) )?pin(?:-adapter)? (\S+) gra\//;

/** Zbiór rewizji markerów w podanych tekstach plików portu. */
export function markerRevs(texts) {
  const revs = new Set();
  for (const t of texts) for (const l of t.split('\n')) {
    const m = ANY_MARK.exec(l);
    if (m) revs.add(m[1]);
  }
  return revs;
}

/** Błąd (string) gdy partia miesza rewizje lub używa nieznanej; null gdy OK. */
export function revProblem(texts) {
  const revs = [...markerRevs(texts)];
  const bad = revs.filter((r) => r !== K_REV_PIN && r !== K_REV_WEB);
  if (bad.length) return `nieznana rewizja markera: ${bad.join(',')}`;
  if (revs.length > 1) return `partia miesza rewizje markerów: ${revs.join(',')} (wymagana jedna)`;
  return null;
}

/** Rewizja partii (pierwsza znaleziona albo pin). */
export function partitionRev(texts) {
  return [...markerRevs(texts)][0] ?? K_REV_PIN;
}

/** Myers O(ND): lista hunków {a0,a1,b0,b1} (0-based, półotwarte) różnicy linii a→b. */
export function myersHunks(a, b) {
  const n = a.length, m = b.length, max = n + m, off = max + 1;
  const v = new Int32Array(2 * max + 3);
  const trace = [];
  let found = false;
  for (let d = 0; d <= max && !found; d++) {
    trace.push(v.slice());
    for (let k = -d; k <= d; k += 2) {
      let x = k === -d || (k !== d && v[off + k - 1] < v[off + k + 1]) ? v[off + k + 1] : v[off + k - 1] + 1;
      let y = x - k;
      while (x < n && y < m && a[x] === b[y]) { x++; y++; }
      v[off + k] = x;
      if (x >= n && y >= m) { found = true; break; }
    }
  }
  // Odtworzenie ścieżki (od końca).
  const ops = []; // [x,y] punkty diagonali
  let x = n, y = m;
  for (let d = trace.length - 1; d >= 0; d--) {
    const vv = trace[d];
    const k = x - y;
    const prevK = k === -d || (k !== d && vv[off + k - 1] < vv[off + k + 1]) ? k + 1 : k - 1;
    const px = d === 0 ? 0 : vv[off + prevK];
    const py = px - prevK;
    while (x > px && y > py && x > 0 && y > 0 && a[x - 1] === b[y - 1]) { ops.push(['=', x - 1, y - 1]); x--; y--; }
    if (d === 0) break;
    if (x === px) { ops.push(['+', x, y - 1]); y--; } else { ops.push(['-', x - 1, y]); x--; }
  }
  while (x > 0 && y > 0) { ops.push(['=', x - 1, y - 1]); x--; y--; }
  ops.reverse();
  const hunks = [];
  let cur = null;
  let ai = 0, bi = 0;
  for (const [op] of ops) {
    if (op === '=') {
      if (cur) { hunks.push(cur); cur = null; }
      ai++; bi++;
    } else {
      if (!cur) cur = { a0: ai, a1: ai, b0: bi, b1: bi };
      if (op === '-') { ai++; cur.a1 = ai; } else { bi++; cur.b1 = bi; }
    }
  }
  if (cur) hunks.push(cur);
  return hunks;
}

/**
 * Mapa zakresów linii pliku A (pin) → B (web) z hunków Myersa. `mapRange(a, b)` (1-based, włącznie):
 * granica poza hunkiem → obraz dokładny; granica w hunku → brzeg hunku po stronie B (początek dla a, koniec dla b).
 */
export function rangeMapper(linesA, linesB) {
  const norm = (l) => l.replace(/\s+$/, '');
  const hunks = myersHunks(linesA.map(norm), linesB.map(norm));
  const mapLine = (L) => {
    let delta = 0;
    for (const h of hunks) {
      if (L - 1 < h.a0) break;
      if (L - 1 < h.a1) return null;
      delta += (h.b1 - h.b0) - (h.a1 - h.a0);
    }
    return L + delta;
  };
  const hunkOf = (L) => hunks.find((h) => L - 1 >= h.a0 && L - 1 < h.a1);
  const mapRange = (a, b) => [mapLine(a) ?? hunkOf(a).b0 + 1, mapLine(b) ?? hunkOf(b).b1];
  return { hunks, mapLine, mapRange };
}
