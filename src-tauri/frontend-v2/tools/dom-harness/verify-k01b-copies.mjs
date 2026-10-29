#!/usr/bin/env node
/**
 * verify-k01b-copies.mjs — bramka wierności KOPII tekstowych K01B (R-RUSTPORT-P5-8-CITYPANEL-K01B-Q1, runda 2).
 *
 * Porównuje każdy blok `// pin edb8fb56 gra/src/<plik>:A-B` w `src/ui/cityPanel/k01b-*.ts` z liniami A..B pinu.
 * Przed porównaniem normalizuje WYŁĄCZNIE udokumentowane zamiany K01B (lista REN poniżej):
 *   - `export ` na początku linii (K01B-Z4: eksport zamiast stanu w ctx),
 *   - `Nazwa K` → `Nazwa` dla typów DTO `*K` (K01B-Z1),
 *   - `reguly().X` / `rules.X` → `X` (K01B-Z3: wywołanie portu zamiast funkcji pinu),
 *   - linie-adnotacje markera (`// pin edb8fb56 …`, bezpośrednio po markerze) są pomijane.
 * Wszystko inne jest różnicą. Różnica dozwolona ⇔ wpis w ALLOWED (plik, tekst, powód). Brak wpisu = FAIL.
 *
 * Bramka (EXIT 0 ⇔ każdy z 57 odroczonych ma blok z deklaracją w pinie ∧ brak różnic poza ALLOWED ∧ brak
 * nieznanych markerów):
 *   COVER  każda nazwa z `odroczone.json` jest deklarowana w zakresie A..B jakiegoś bloku pinu w v2.
 *   TEXT   różnice po normalizacji = 0 (poza ALLOWED).
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`): node tools/dom-harness/verify-k01b-copies.mjs --pin-dir <PIN_DIR> [--json <plik>]
 */
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const HERE = dirname(fileURLToPath(import.meta.url));
const FRONT = resolve(HERE, '../..');
const PIN_DIR = argOf('--pin-dir');
const JSON_OUT = argOf('--json');
const V2_DIR = resolve(FRONT, 'src/ui/cityPanel');
const ODR = resolve(argOf('--odroczone') ?? join(FRONT, '../../dyspozycje/autobot/runs/R-RUSTPORT-P5-8-CITYPANEL-K01A-Q1/r3-logi/odroczone.json'));
if (!PIN_DIR || !existsSync(join(PIN_DIR, 'gra/src'))) {
  console.error('Użycie: node tools/dom-harness/verify-k01b-copies.mjs --pin-dir <PIN_DIR> [--json <plik>]');
  process.exit(2);
}

/** Udokumentowane zamiany K01B (v2 → pin). Każda reguła ma powód. */
const REN = [
  [/\b([A-Za-z]\w*)K\b/g, '$1', 'typy DTO *K (K01B-Z1): ten sam kształt pola, inna nazwa typu'],
  [/\breguly\(\)\.(\w+)/g, '$1', 'port reguł zamiast funkcji pinu (K01B-Z3)'],
  [/\brules\.(\w+)/g, '$1', 'lokalny alias portu `const rules = reguly()` (K01B-Z3)'],
];
/**
 * Dozwolone różnice po normalizacji: { file, text (znormalizowana linia v2 lub pinu, po trim), why }.
 * Pusta lista = każda różnica to błąd. Wpis tu wymaga uzasadnienia i ma być zgłoszony w P5-8-K01B.md.
 */
const ALLOWED = [
  // Z1 — typy: DTO `*K` i wąskie typy warstwy K01B (kształt pola ten sam; nazwa/zakres typu inny).
  { file: 'k01b-dom.ts', range: 'gra/src/ui/cityPanel.ts:3808-3811', text: 'function renderImperiumZywnosc(mount: HTMLElement, _city: City): void {', why: 'Z1 CityRef' },
  { file: 'k01b-dom.ts', range: 'gra/src/ui/cityPanel.ts:3808-3811', text: 'function renderImperiumZywnosc(mount: HTMLElement, _city: CityRef): void {', why: 'Z1 CityRef' },
  { file: 'k01b-r.ts', range: 'gra/src/ui/cityPanel.ts:1444-1449', text: 'function wyzwienieSummaryLabel(level: PoziomRacji, params: ReturnType<typeof buildRationParams>): string {', why: 'Z1 PoziomRacji=number; params z kontrolera (Z3, buildRationParams poza portem)' },
  { file: 'k01b-r.ts', range: 'gra/src/ui/cityPanel.ts:1444-1449', text: 'function wyzwienieSummaryLabel(level: number, params: RationParams): string {', why: 'Z1 / Z3' },
  { file: 'k01b-r.ts', range: 'gra/src/ui/cityPanel.ts:4357-4367', text: 'function orderBandEffectShort(band: ReturnType<typeof porPctBand>): string {', why: 'Z7 pasmo jako wartość DTO' },
  { file: 'k01b-r.ts', range: 'gra/src/ui/cityPanel.ts:4357-4367', text: 'function orderBandEffectShort(band: OrderBand | string): string {', why: 'Z7' },
  { file: 'k01b-t.ts', range: 'gra/src/ui/cityPanel.ts:994-1000', text: 'type CityWithSliders = City & {', why: 'Z1 typ w k01b-dto.ts (CityWithSlidersK)' },
  { file: 'k01b-t.ts', range: 'gra/src/ui/cityPanel.ts:994-1000', text: 'podzialHandlu?: PodzialHandluSplit;', why: 'Z1 typ w k01b-dto.ts (CityWithSlidersK)' },
  { file: 'k01b-t.ts', range: 'gra/src/ui/cityPanel.ts:994-1000', text: 'podziałHandlu?: PodzialHandluSplit;', why: 'Z1 typ w k01b-dto.ts (CityWithSlidersK)' },
  { file: 'k01b-t.ts', range: 'gra/src/ui/cityPanel.ts:994-1000', text: 'podzialPracy?: PodzialPracySplit;', why: 'Z1 typ w k01b-dto.ts (CityWithSlidersK)' },
  { file: 'k01b-t.ts', range: 'gra/src/ui/cityPanel.ts:994-1000', text: 'podziałPracy?: PodzialPracySplit;', why: 'Z1 typ w k01b-dto.ts (CityWithSlidersK)' },
  { file: 'k01b-t.ts', range: 'gra/src/ui/cityPanel.ts:994-1000', text: '};', why: 'Z1 typ w k01b-dto.ts (CityWithSlidersK)' },
  { file: 'k01b-t.ts', range: 'gra/src/ui/cityPanel.ts:994-1000', text: 'type CityWithSliders = CityWithSliders;', why: 'Z1 alias typu (export type CityWithSliders = CityWithSlidersK)' },
  { file: 'k01b-t.ts', range: 'gra/src/ui/cityPanel.ts:1039-1072', text: 'citizenUpkeep: CitizenUpkeepCoverage;', why: 'Z1 CitizenUpkeepCoverageDto (viewmodel/types.ts) jako CitizenUpkeepK' },
  { file: 'k01b-t.ts', range: 'gra/src/ui/cityPanel.ts:1039-1072', text: 'citizenUpkeep: CitizenUpkeep;', why: 'Z1' },
  { file: 'k01b-t.ts', range: 'gra/src/ui/cityPanel.ts:1335-1337', text: 'function daninaLabelForCity(_city: City): DaninaLabel {', why: 'Z1 CityRefK' },
  { file: 'k01b-t.ts', range: 'gra/src/ui/cityPanel.ts:1335-1337', text: 'function daninaLabelForCity(_city: CityRef): DaninaLabel {', why: 'Z1 CityRefK' },
  { file: 'k01b-t.ts', range: 'gra/src/ui/cityPanel.ts:6461-6469', text: "const YIELD_BRAND: { key: keyof BuildingDef['baza']; brandId: string; label: string }[] = [", why: 'Z1 YieldKeyK (klucze jako typ DTO)' },
  { file: 'k01b-t.ts', range: 'gra/src/ui/cityPanel.ts:6461-6469', text: "const YIELD_BRAND: { key: YieldKey; brandId: string; label: string }[] = [", why: 'Z1' },
  // Z2 — stała zamiast funkcji pinu (wartość 'Podatek' = danina-nazwa.ts:15; zgodność wartości sprawdza harness F).
  { file: 'k01b-t.ts', range: 'gra/src/ui/cityPanel.ts:1335-1337', text: 'return daninaLabel();', why: 'Z2 stała Podatek (K01B-Z2)' },
  { file: 'k01b-t.ts', range: 'gra/src/ui/cityPanel.ts:1335-1337', text: "return 'Podatek';", why: 'Z2' },
  // Z3 — port reguł: cast typu pinowego usunięty (BuildingDefK jest już typem wejścia portu).
  { file: 'k01b-r.ts', range: 'gra/src/ui/cityPanel.ts:6650-6658', text: 'gold: buildingUpkeep(def as unknown as BuildingRecord, level),', why: 'Z3 cast usunięty (typ DTO)' },
  { file: 'k01b-r.ts', range: 'gra/src/ui/cityPanel.ts:6650-6658', text: 'gold: buildingUpkeep(def, level),', why: 'Z3' },
  // Z6 — parametr `epoch` (pin: nieużywany) — `void epoch;` tylko dla lintera.
  { file: 'k01b-r.ts', range: 'gra/src/ui/cityPanel.ts:1563-1595', text: 'void epoch;', why: 'Z6 void epoch (lint)' },
];

const norm = (s) => s.replace(/^\s*export\s+/, '').replace(/\s+/g, ' ').trim();
const normV2 = (s) => {
  let t = s;
  for (const [rx, to] of REN) t = t.replace(rx, to);
  return norm(t);
};
const MARK = /^\/\/ pin edb8fb56 (gra\/src\/[^\s:]+):(\d+)-(\d+)/;
const DECL = /^(?:export\s+)?(?:declare\s+)?(?:async\s+)?(?:const|let|var|function|class|interface|type|enum)\s+([A-Za-z_$][\w$]*)/;

/** LCS-diff dwóch list tekstów: zwraca {onlyPin, onlyV2} (w kolejności). */
function diffLists(a, b) {
  const n = a.length;
  const m = b.length;
  const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const onlyPin = [];
  const onlyV2 = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) onlyPin.push(a[i++]);
    else onlyV2.push(b[j++]);
  }
  while (i < n) onlyPin.push(a[i++]);
  while (j < m) onlyV2.push(b[j++]);
  return { onlyPin, onlyV2 };
}

const pinCache = new Map();
const pinLinesOf = (rel) => {
  if (!pinCache.has(rel)) pinCache.set(rel, readFileSync(join(PIN_DIR, rel), 'utf8').split(/\r?\n/));
  return pinCache.get(rel);
};

const files = readdirSync(V2_DIR).filter((f) => /^k01b-.*\.ts$/.test(f));
const blocks = [];
const unknown = [];
for (const f of files) {
  const lines = readFileSync(join(V2_DIR, f), 'utf8').split(/\r?\n/);
  lines.forEach((l, idx) => {
    const m = MARK.exec(l);
    if (!m) {
      if (/^\/\/ pin /.test(l)) unknown.push(`${f}:${idx + 1}`);
      return;
    }
    // Linie-adnotacje markera: kontynuacje komentarza zaczynające się tuż po markerze.
    let j = idx + 1;
    while (j < lines.length && /^\/\/ /.test(lines[j]) && !MARK.test(lines[j])) j++;
    const annotation = lines.slice(idx, j);
    let k = j;
    while (k < lines.length && !MARK.test(lines[k]) && !/^\/\/ pin /.test(lines[k])) k++;
    blocks.push({ file: f, line: idx + 1, rel: m[1], a: +m[2], b: +m[3], body: lines.slice(j, k), annotation });
  });
}

const report = { blocks: blocks.length, pinLines: 0, residual: [], cover: {}, unknownMarkers: unknown };
for (const blk of blocks) {
  const pin = pinLinesOf(blk.rel).slice(blk.a - 1, blk.b).map(norm).filter((x) => x !== '');
  const v2 = blk.body.map(normV2).filter((x) => x !== '');
  report.pinLines += pin.length;
  const { onlyPin, onlyV2 } = diffLists(pin, v2);
  for (const t of onlyPin) report.residual.push({ side: 'pin', file: blk.file, pinRange: `${blk.rel}:${blk.a}-${blk.b}`, text: t });
  for (const t of onlyV2) report.residual.push({ side: 'v2', file: blk.file, pinRange: `${blk.rel}:${blk.a}-${blk.b}`, text: t });
}

// COVER: każda nazwa odroczona ma deklarację w zakresie jakiegoś bloku (pin).
const odr = JSON.parse(readFileSync(ODR, 'utf8'));
const notCovered = [];
for (const u of odr) {
  const hit = blocks.some((blk) => {
    const pin = pinLinesOf(blk.rel);
    for (let i = blk.a - 1; i < blk.b && i < pin.length; i++) {
      const d = DECL.exec(pin[i]);
      if (d && d[1] === u.name) return true;
    }
    return false;
  });
  if (!hit) notCovered.push(u.name);
}
report.cover = { units: odr.length, notCovered };

const allowedKey = (r) => `${r.file}|${r.pinRange}|${norm(r.text)}`;
const allowedSet = new Set(ALLOWED.map((a) => `${a.file}|gra/src/ui/cityPanel.ts:${a.range.split(':')[1]}|${norm(a.text)}`));
const disallowed = report.residual.filter((r) => !allowedSet.has(allowedKey(r)));
const gateCover = notCovered.length === 0 && odr.length === 57;
const gateText = disallowed.length === 0;
const gateMark = unknown.length === 0;
const ok = gateCover && gateText && gateMark;
console.log(`verify-k01b-copies: bloki ${blocks.length}, linie pinu (niepuste) ${report.pinLines}, roznice po normalizacji ${report.residual.length} (dozwolone ${report.residual.length - disallowed.length}, niedozwolone ${disallowed.length})`);
console.log(`COVER jednostki z deklaracja w bloku: ${gateCover ? 'OK' : 'FAIL'} (odroczone ${odr.length}, bez bloku ${notCovered.length}: ${notCovered.join(',')})`);
console.log(`TEXT roznice poza ALLOWED: ${gateText ? 'OK' : 'FAIL'} (${disallowed.length})`);
for (const r of disallowed.slice(0, 80)) console.log(`  ${r.side} ${r.file} [${r.pinRange}] ${r.text.slice(0, 160)}`);
console.log(`MARK nieznane markery: ${gateMark ? 'OK' : 'FAIL'} (${unknown.join(',') || 'brak'})`);
console.log(`WYNIK: ${ok ? 'ZIELONE (COVER,TEXT,MARK)' : 'CZERWONE'}`);
if (JSON_OUT) writeFileSync(JSON_OUT, JSON.stringify({ ...report, disallowed, ok }, null, 2));
process.exitCode = ok ? 0 : 1;
