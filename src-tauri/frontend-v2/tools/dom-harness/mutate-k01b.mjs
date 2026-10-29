#!/usr/bin/env node
/**
 * mutate-k01b.mjs — mutacje kontrolne dla harnessu K01B (`run-k01b.mjs`), R-RUSTPORT-P5-8-CITYPANEL-K01B-Q1 (runda 2).
 *
 * Każda mutacja zamienia DOKŁADNIE jedno wystąpienie tekstu w `src/ui/cityPanel/k01b-*.ts`, uruchamia `run-k01b.mjs`
 * i zapisuje wynik: WYKRYTA ⇔ harness zwraca kod ≠ 0. Plik jest przywracany zawsze (finally), a na końcu sprawdzane,
 * czy drzewo wróciło do stanu wyjściowego (bajt w bajt).
 *
 * Bramka (EXIT 0 ⇔ bazowy harness zielony ∧ wszystkie mutacje behawioralne (kind !== 'DTO-pole') WYKRYTE ∧ przywrócenie OK).
 * Mutacje `DTO-pole` są typowe (tsc); harness ich nie wykrywa, bo pole nie jest czytane przez K01B — raportowane
 * jako NIEWYKRYTA z uzasadnieniem, nie liczone do bramki.
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`): node tools/dom-harness/mutate-k01b.mjs --pin-dir <PIN_DIR>
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const V2_DIR = resolve(HERE, '../../src/ui/cityPanel');
const RUN = join(HERE, 'run-k01b.mjs');
const pinIdx = process.argv.indexOf('--pin-dir');
const PIN_DIR = pinIdx >= 0 ? process.argv[pinIdx + 1] : undefined;
if (!PIN_DIR) {
  console.error('Użycie: node tools/dom-harness/mutate-k01b.mjs --pin-dir <PIN_DIR>');
  process.exit(2);
}

const MUTANTS = [
  { id: 'B1', kind: 'R-wartosc', file: 'k01b-r.ts', from: 'const growTxt = grow > 0 ?', to: 'const growTxt = grow >= 0 ?', why: 'wyzwienie: znak wzrostu dla wartosci 0' },
  { id: 'B2', kind: 'T-kolejka', file: 'k01b-t.ts', from: 'export function moveQueueItem(prod: CityProductionK, index: number, dir: -1 | 1): CityProductionK {\n  const j = index + dir;', to: 'export function moveQueueItem(prod: CityProductionK, index: number, dir: -1 | 1): CityProductionK {\n  const j = index - dir;', why: 'przesuwanie pozycji kolejki w odwrotna strone' },
  { id: 'B3', kind: 'DOM-styl', file: 'k01b-dom.ts', from: "  note.style.fontStyle = 'normal';\n", to: '', why: 'usuniety styl notatki (DOM)' },
  { id: 'B4', kind: 'DOM-kolejnosc', file: 'k01b-dom.ts', from: '  grid.appendChild(vEl);', to: '  grid.insertBefore(vEl, lEl);', why: 'kolejnosc dzieci siatki (DOM)' },
  { id: 'B5', kind: 'R-fallback', file: 'k01b-reguly.ts', from: "throw new Error('k01b: port reguł nie został wstrzyknięty (ustawRegulyKontrolera)');", to: 'return {} as CityPanelRulesPort;', why: 'cichy fallback zamiast jawnego bledu (zakazany, Z3)' },
  { id: 'B6', kind: 'stala-tekst', file: 'k01b-dto.ts', from: 'budżet ulepszeń', to: 'budzet ulepszen', why: 'tekst PODZIAL_PRACY_PULA_TIP' },
  { id: 'B7', kind: 'stala-zbior', file: 'k01b-dto.ts', from: "'Złoto'", to: "'Zloto'", why: 'zbior CITY_PANEL_RANGE_DEPOSIT_LABELS' },
  { id: 'B8', kind: 'R-pasmo', file: 'k01b-r.ts', from: "case 'bunt': return 'Migracja, bunt';", to: "case 'bunt': return 'Migracja';", why: 'tekst pasma porzadku' },
  { id: 'B9', kind: 'DTO-odczyt', file: 'k01b-r.ts', from: 'const frac = view.wzrostUlamkowy;', to: 'const frac = view.wzrostProcent;', why: 'odczyt pola DTO CityView.wzrostUlamkowy zamieniony na inne pole (czytane: wykrywalne behawioralnie)' },
  { id: 'D1', kind: 'DTO-pole', file: 'k01b-dto.ts', from: 'podzialPracy?: { procentBudynki: number };', to: 'podzialPracy?: { procentBudynkiX: number };', why: 'pole DTO CityWithSlidersK (nieczytane w K01B: wykrywa tylko tsc)' },
];

const runHarness = () =>
  spawnSync(process.execPath, [RUN, '--pin-dir', PIN_DIR], { encoding: 'utf8', timeout: 900000, maxBuffer: 64 * 1024 * 1024 });
const verdictLine = (out) => (out.split('\n').find((l) => l.startsWith('WYNIK:')) ?? '(brak linii WYNIK)').trim();

const base = runHarness();
const baseOk = base.status === 0;
const results = [];
const originals = new Map();
for (const m of MUTANTS) {
  const path = join(V2_DIR, m.file);
  const orig = originals.get(path) ?? readFileSync(path, 'utf8');
  originals.set(path, orig);
  const n = orig.split(m.from).length - 1;
  if (n !== 1) {
    results.push({ ...m, status: 'NIE_ZASTOSOWANO', occurrences: n });
    continue;
  }
  try {
    writeFileSync(path, orig.replace(m.from, m.to));
    const r = runHarness();
    const out = `${r.stdout ?? ''}${r.stderr ?? ''}`;
    const status = r.status === null ? 'TIMEOUT' : r.status !== 0 ? 'WYKRYTA' : 'NIEWYKRYTA';
    results.push({ ...m, status, exit: r.status, verdict: verdictLine(out) });
  } finally {
    writeFileSync(path, orig);
  }
}
let restored = true;
for (const [path, orig] of originals) if (readFileSync(path, 'utf8') !== orig) restored = false;

console.log(`baza (bez mutacji): ${baseOk ? 'ZIELONA' : 'CZERWONA'} — ${verdictLine(`${base.stdout ?? ''}`)}`);
for (const r of results) {
  console.log(`${r.id} [${r.kind}] ${r.file}: ${r.status}${r.exit !== undefined ? ` (exit ${r.exit})` : ''}${r.occurrences !== undefined ? ` (wystapien ${r.occurrences})` : ''} — ${r.why}`);
}
const behavioral = results.filter((r) => r.kind !== 'DTO-pole');
const allDetected = behavioral.length > 0 && behavioral.every((r) => r.status === 'WYKRYTA');
console.log(`przywrocenie plikow k01b: ${restored ? 'OK' : 'BLAD'}`);
console.log(`WYNIK MUTACJI: ${baseOk && allDetected && restored ? 'ZIELONE (wszystkie behawioralne wykryte)' : 'CZERWONE'} — wykryte ${results.filter((r) => r.status === 'WYKRYTA').length}/${results.length}`);
process.exitCode = baseOk && allDetected && restored ? 0 : 1;
