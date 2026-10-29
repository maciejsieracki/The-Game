#!/usr/bin/env node
/**
 * mutate-k07b-units.mjs — mutacje K07B (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K07B-Q1, runda 3).
 *
 * Dwie klasy mutantów (osobno od bramki kopii `verify-k07b-copies.mjs`):
 *   - `pole`: mutacje mapowania pól DTO i wiringu (`controller/k07bWiring.ts`, `ui/cityPanel/k07b-deps.ts`, chip W3);
 *   - `zachowanie`: mutacje ciał jednostek portu (`k07b-p1.ts` / `k07b-p2.ts`) na progach i dziedzinach brzegowych.
 * Każdy mutant: kopia `src/` w katalogu tymczasowym, jedna podmiana (dokładnie jedno wystąpienie `from`), uruchomienie
 * `run-k07b-units.mjs` na tej kopii. EXIT 1 = ZABITY (różnica/asercja), EXIT 2 = ZABITY (błąd harnessu, zaraportowany),
 * EXIT 0 = PRZEŻYŁ (luka w harnessie). Mutant niezastosowalny (`from` nie występuje dokładnie raz) = NIEZASTOSOWANY.
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/mutate-k07b-units.mjs --pin-dir <PIN_DIR> [--from N] [--to M] [--scratch <dir>]
 * EXIT 0 <=> wszystkie zastosowane mutanty zabite; 1 <=> >=1 przeżył; 2 <=> błąd użycia.
 */
import { mkdtempSync, cpSync, readFileSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const PIN_DIR = argOf('--pin-dir');
if (!PIN_DIR) {
  console.error('Użycie: node tools/dom-harness/mutate-k07b-units.mjs --pin-dir <PIN_DIR> [--from N] [--to M] [--scratch <dir>]');
  process.exit(2);
}
const V2_ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const HARNESS = join(V2_ROOT, 'tools/dom-harness/run-k07b-units.mjs');
const SRC = join(V2_ROOT, 'src');
const SCRATCH = resolve(argOf('--scratch') ?? tmpdir());
mkdirSync(SCRATCH, { recursive: true });

const W = 'controller/k07bWiring.ts';
const P1 = 'ui/cityPanel/k07b-p1.ts';
const P2 = 'ui/cityPanel/k07b-p2.ts';

/** Mutanty: `from` → `to` w pliku względem `src/`. */
const MUTANTS = [
  // ── pole: mapowanie DTO i wiring ──────────────────────────────────────────────────────────────────────────────────
  { id: 'M01-dto-id-z-owner', kind: 'pole', file: W, from: 'return { id: String(c.id), ownerId: c.owner,', to: 'return { id: String(c.owner), ownerId: c.owner,' },
  { id: 'M02-dto-owner-z-id', kind: 'pole', file: W, from: 'ownerId: c.owner, name: c.name', to: 'ownerId: c.id, name: c.name' },
  { id: 'M03-dto-population-off1', kind: 'pole', file: W, from: 'population: c.population };', to: 'population: c.population + 1 };' },
  { id: 'M04-dto-name-z-maplabel', kind: 'pole', file: W, from: 'name: c.name, population', to: 'name: c.mapLabel, population' },
  { id: 'M05-chip-stock-floor', kind: 'pole', file: W, from: 'Math.round(civStock)})</span>', to: 'Math.floor(civStock)})</span>' },
  { id: 'M06-chip-rate-kolor', kind: 'pole', file: W, from: "const cls = n > 0 ? 'green' : 'red';", to: "const cls = n > 0 ? 'gold' : 'red';" },
  { id: 'M07-chip-rate-znak-minus', kind: 'pole', file: W, from: 'String(n);', to: 'String(Math.abs(n));' },
  { id: 'M08-isme-fallback', kind: 'pole', file: W, from: 'ownerId === 0),', to: 'ownerId === 1),' },
  { id: 'M09-capital-null', kind: 'pole', file: W, from: 'data.getCapitalCityId(ownerId) ?? null', to: "data.getCapitalCityId(ownerId) ?? ''" },
  { id: 'M10-canSetCapital-odwrocony', kind: 'pole', file: W, from: 'canSetCapital: data.canSetCapital,', to: 'canSetCapital: !data.canSetCapital,' },
  { id: 'M11-precedencja-uslug', kind: 'pole', file: W, from: '    ...V2_REAL,\n    ...services,', to: '    ...services,\n    ...V2_REAL,' },
  { id: 'M12-cfg-mock-nadpisuje', kind: 'pole', file: W, from: 'const cfg = { ...MOCK_K07B_CFG, ...data.cfg };', to: 'const cfg = { ...data.cfg, ...MOCK_K07B_CFG };' },
  { id: 'M13-por-labels-pusto', kind: 'pole', file: W, from: 'POR_BAND_LABELS: porBandLabels,', to: 'POR_BAND_LABELS: {},' },
  { id: 'M14-gamedata-null', kind: 'pole', file: W, from: 'gameData: () => data.gameData(),', to: 'gameData: () => null,' },
  { id: 'M15-activemap-null', kind: 'pole', file: W, from: 'activeMap: () => data.activeMap(),', to: 'activeMap: () => null,' },
  { id: 'M16-v2-tury-przesuniete', kind: 'pole', file: W, from: 'tury: (n: number) => tury(n),', to: 'tury: (n: number) => tury(n + 1),' },
  { id: 'M17-atrapa-order-state-undefined', kind: 'pole', file: W, from: 'MOCK_K07B_FNS.resolveOrderState = () => ({ state: {}, fromEngine: false });', to: 'MOCK_K07B_FNS.resolveOrderState = () => undefined;' },
  { id: 'M18-atrapa-getprod-undefined', kind: 'pole', file: W, from: 'MOCK_K07B_FNS.getProd = () => ({ kolejka: [], wstrzymana: false });', to: 'MOCK_K07B_FNS.getProd = () => undefined;' },
  // ── zachowanie: ciała jednostek portu (progi i dziedziny brzegowe) ────────────────────────────────────────────────
  { id: 'Z01-porzadek-prog-70', kind: 'zachowanie', file: P1, from: "const porCls = por >= 70 ? 'green'", to: "const porCls = por > 70 ? 'green'" },
  { id: 'Z02-garnizon-prog-3', kind: 'zachowanie', file: P1, from: "cls: gCount >= 3 ? 'green'", to: "cls: gCount > 3 ? 'green'" },
  { id: 'Z03-zdrowie-prog-5', kind: 'zachowanie', file: P1, from: "cls: total >= 5 ? 'green'", to: "cls: total > 5 ? 'green'" },
  { id: 'Z04-kultura-pelna-zgodnosc-100', kind: 'zachowanie', file: P1, from: "(m.pct >= 100 ? 'pełna zgodność'", to: "(m.pct > 100 ? 'pełna zgodność'" },
  { id: 'Z05-kultura-przyrost-zero-szary', kind: 'zachowanie', file: P1, from: "cls: kultPerTurn > 0 ? 'gold'", to: "cls: kultPerTurn >= 0 ? 'gold'" },
  { id: 'Z06-kultura-eta-przyrost-zero', kind: 'zachowanie', file: P1, from: 'if (next !== undefined && cultState.przyrost > 0) {', to: 'if (next !== undefined && cultState.przyrost >= 0) {' },
  { id: 'Z07-zdrowie-minusy-zero', kind: 'zachowanie', file: P1, from: "cls: negSum < 0 ? 'red'", to: "cls: negSum <= 0 ? 'red'" },
  { id: 'Z08-limit-populacji-odwrocony', kind: 'zachowanie', file: P1, from: "const etaTxt = view.atPopCap ? 'limit'", to: "const etaTxt = !view.atPopCap ? 'limit'" },
  { id: 'Z09-wyzywienie-max-5', kind: 'zachowanie', file: P1, from: 'cfg.getMaxSafePoziomRacji?.(city.id) ?? WYZYWIENIE_MAX', to: 'cfg.getMaxSafePoziomRacji?.(city.id) ?? 5' },
  { id: 'Z10-szczescie-max-null', kind: 'zachowanie', file: P1, from: 'state.szMax != null ?', to: 'state.szMax !== undefined ?' },
  { id: 'Z11-strona-lewa-prawa', kind: 'zachowanie', file: P2, from: "if (mount.closest('.civ-ux-left')) return 'left';", to: "if (mount.closest('.civ-ux-left')) return 'right';" },
  { id: 'Z13-activemap-funkcja-zamiast-mapy', kind: 'zachowanie', file: P1, from: 'resolveEmpireSnap(city, activeMapK07(), data)', to: 'resolveEmpireSnap(city, activeMapK07, data)' },
  { id: 'Z12-panel-id-pusty', kind: 'zachowanie', file: P2, from: 'if (id) p.id = id;', to: "p.id = id ?? '';" },
];

const range = (() => {
  const from = Number(argOf('--from') ?? 1);
  const to = Number(argOf('--to') ?? MUTANTS.length);
  return { from, to };
})();

const rows = [];
for (let i = range.from - 1; i < Math.min(range.to, MUTANTS.length); i++) {
  const m = MUTANTS[i];
  const tmp = mkdtempSync(join(SCRATCH, 'p58k07b-mut-'));
  try {
    cpSync(SRC, join(tmp, 'src'), { recursive: true });
    const path = join(tmp, 'src', m.file);
    const text = readFileSync(path, 'utf8');
    const count = text.split(m.from).length - 1;
    if (count !== 1) {
      rows.push({ ...m, status: 'NIEZASTOSOWANY', detail: `wystąpień=${count}` });
      continue;
    }
    writeFileSync(path, text.split(m.from).join(m.to));
    const r = spawnSync(process.execPath, [HARNESS, '--pin-dir', resolve(PIN_DIR), '--v2-dir', join(tmp, 'src/ui/cityPanel')], {
      cwd: V2_ROOT,
      encoding: 'utf8',
      timeout: 300000,
      env: { ...process.env, TMPDIR: SCRATCH },
    });
    if (r.status === 1) rows.push({ ...m, status: 'ZABITY', detail: 'różnica/asercja' });
    else if (r.status === 2) rows.push({ ...m, status: 'ZABITY-BLAD', detail: String(r.stderr || r.stdout).split('\n').find((l) => l.includes('BLAD') || l.includes('Error')) ?? 'błąd harnessu' });
    else if (r.status === 0) rows.push({ ...m, status: 'PRZEZYL', detail: 'harness zielony' });
    else rows.push({ ...m, status: 'BLAD-URUCHOMIENIA', detail: `status=${r.status} ${r.error ?? ''}` });
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

const count = (s) => rows.filter((r) => r.status === s).length;
const zabite = count('ZABITY') + count('ZABITY-BLAD');
const przezyte = rows.filter((r) => r.status === 'PRZEZYL');
console.log(JSON.stringify({
  zakres: `${range.from}..${Math.min(range.to, MUTANTS.length)} z ${MUTANTS.length}`,
  zastosowane: rows.length - count('NIEZASTOSOWANY'),
  zabite,
  zabiteBlad: count('ZABITY-BLAD'),
  przezyte: przezyte.length,
  niezastosowane: count('NIEZASTOSOWANY'),
  bledyUruchomienia: count('BLAD-URUCHOMIENIA'),
  wyniki: rows.map((r) => `${r.id}: ${r.status}${r.status === 'ZABITY' ? '' : ` (${r.detail})`}`),
}, null, 1));
process.exit(przezyte.length > 0 || count('NIEZASTOSOWANY') > 0 || count('BLAD-URUCHOMIENIA') > 0 ? 1 : 0);
