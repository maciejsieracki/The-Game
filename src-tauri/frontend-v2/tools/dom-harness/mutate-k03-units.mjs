#!/usr/bin/env node
/**
 * mutate-k03-units.mjs — kontrola czulosci harnessu `run-k03-units.mjs` (P5-8 K03, runda 3): wstrzykuje
 * pojedyncze mutacje do zrodla v2 (`k03-cards.ts` / `k03-model.ts`, w tym pola DTO `panelInputs`), uruchamia
 * harness i oczekuje EXIT 1 (wykryta roznica). Zrodla sa przywracane po kazdej mutacji (finally).
 *
 * Uzycie (z katalogu `src-tauri/frontend-v2/`): node tools/dom-harness/mutate-k03-units.mjs --pin-dir <PIN_DIR>
 * EXIT 0 <=> wszystkie mutacje wykryte; 1 <=> >=1 mutacja niewykryta; 2 <=> blad (np. tekst mutacji nie jest unikalny).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const pinIdx = args.indexOf('--pin-dir');
const pinDir = pinIdx >= 0 ? args[pinIdx + 1] : undefined;
if (!pinDir) {
  console.error('Uzycie: node tools/dom-harness/mutate-k03-units.mjs --pin-dir <PIN_DIR>');
  process.exit(2);
}
const ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const CARDS = join(ROOT, 'src/ui/cityPanel/k03-cards.ts');
const MODEL = join(ROOT, 'src/ui/cityPanel/k03-model.ts');

/** [plik, tekst oryginalny (musi wystapic dokladnie raz), tekst zmutowany, opis] */
const MUTATIONS = [
  [CARDS, "'Brak modyfikatorów zdrowotnych w tym mieście.'", "'Brak modyfikatorow.'", 'zdrowie: tekst pustej listy'],
  [CARDS, 'if (gainSlots > 0) {', 'if (gainSlots >= 0) {', 'wzrost: warunek wiersza Tempo'],
  [CARDS, '    const val = row.note ? `${row.pct}% · ${row.note}` : `${row.pct}%`;', '    const val = row.note ? `${row.pct}%· ${row.note}` : `${row.pct}%`;', 'kompozycja: separator'],
  [CARDS, 'opts.poziom <= 1 ?', 'opts.poziom < 1 ?', 'zamoznosc: W1 bez bonusu'],
  [CARDS, 'for (const p of prereqs[trimmed] ?? []) visit(p);', 'for (const p of [...(prereqs[trimmed] ?? [])].reverse()) visit(p);', 'techPrereq: kolejnosc poprzednikow'],
  [CARDS, 'formatManpowerK(mp.manpowerBiezacy)', 'formatManpowerK(mp.manpowerMax)', 'rekruci: pole DTO manpowerBiezacy'],
  [CARDS, "' tys.';", "' tys';", 'formatManpowerK: sufiks'],
  [CARDS, 'setProd(cityId, reorderRecruitQueueItem(getProd(cityId), dragFromIndex, toIndex));', 'setProd(cityId, reorderRecruitQueueItem(getProd(cityId), dragFromIndex, dragFromIndex));', 'drag: zapis kolejki'],
  [CARDS, '  if (view) {\n    gridDetailRow(g1, \'Uwaga\'', '  if (!view) {\n    gridDetailRow(g1, \'Uwaga\'', 'handel: warunek wiersza Uwaga'],
  [CARDS, "(maTargowisko ? ' × (1 + bonus Targowiska)' : '')", "(!maTargowisko ? ' × (1 + bonus Targowiska)' : '')", 'handel: formula Targowiska'],
  [MODEL, 'mennicaSpiZBrakuZlota: m?.spiZBrakuZlota ?? false,', 'mennicaSpiZBrakuZlota: m?.budynek ?? false,', 'DTO mennica.spiZBrakuZlota -> budynek'],
  [MODEL, 'aktywneTrasyCount: h?.aktywneTrasy ?? dto.trade.activeRoutes,', 'aktywneTrasyCount: (h?.aktywneTrasy ?? dto.trade.activeRoutes) + 1,', 'DTO handel.aktywneTrasy +1'],
  [MODEL, 'szBonus: p?.szBonus ?? 0,', 'szBonus: 0,', 'DTO wealth.szBonus ignorowane'],
  [MODEL, 'const h = dto.sliders.handelDefault;', 'const h = dto.sliders.handel;', 'DTO sliders.handelDefault -> handel'],
  [MODEL, 'return dto.panelInputs?.territoryNodes;', 'return dto.panelInputs?.territoryNodes?.slice(1);', 'DTO territoryNodes'],
  [MODEL, 'return dto.panelInputs?.ownerHasMennica ?? false;', 'return dto.panelInputs?.ownerHasMennica ?? true;', 'DTO ownerHasMennica (domyslna)'],
];

const results = [];
let setupError = false;
for (const [file, from, to, opis] of MUTATIONS) {
  const original = readFileSync(file, 'utf8');
  const n = original.split(from).length - 1;
  if (n !== 1) {
    console.error(`mutate-k03-units: tekst nieunikalny (${n}) dla: ${opis}`);
    setupError = true;
    continue;
  }
  try {
    writeFileSync(file, original.replace(from, to));
    const r = spawnSync(process.execPath, [join(ROOT, 'tools/dom-harness/run-k03-units.mjs'), '--pin-dir', pinDir], { cwd: ROOT, encoding: 'utf8' });
    const detected = r.status === 1;
    results.push({ opis, detected, status: r.status });
  } finally {
    writeFileSync(file, original);
  }
}
for (const r of results) console.log(`  ${r.detected ? 'WYKRYTA' : 'NIEWYKRYTA'} (exit ${r.status}): ${r.opis}`);
const missed = results.filter((r) => !r.detected).length;
console.log(`mutate-k03-units: mutacji=${results.length} wykrytych=${results.length - missed} niewykrytych=${missed}`);
process.exit(setupError ? 2 : missed > 0 ? 1 : 0);
