#!/usr/bin/env node
/**
 * mutate-repin-ui2b.mjs — kontrola czułości `run-repin-ui2b.mjs` (R-RUSTPORT-REPIN-UI-2-B-Q1): wstrzykuje po jednej
 * mutacji do pliku portu (`src/ui/*`), uruchamia harness (tylko rodzaj scen dotknięty mutacją: `--kinds`) i oczekuje
 * EXIT=1; po każdej mutacji przywraca plik i sprawdza, że bajty są identyczne z oryginałem (asercja).
 * Mutacje obejmują każdą gałąź sterującą nowych hunków partii (siatka 3×5, licznik, „▼ jeszcze N”, Enter/autofokus,
 * montaż w <html>, roving focus, `blockedReason`, „Milicja odnawia się” + odmiana, brak „~”, ramka postępu AI).
 *
 * Użycie (z `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/mutate-repin-ui2b.mjs --web-dir <WEB_DIR> [--tmp-dir <dir>] [--from N] [--to M] [--list]
 *   → EXIT 0 ⇔ każda mutacja z zakresu [N, M) wykryta (zakres pozwala dzielić przebieg na wywołania < 10 min).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve, join } from 'node:path';

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const webDir = argOf('--web-dir');
const ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const AI = 'src/ui/aiOwnerProgressFrame.ts';
const MG = 'src/ui/armyMergePanel.ts';
const SP = 'src/ui/armySplitPanel.ts';
const RP = 'src/ui/unitReplacePicker.ts';
const SG = 'src/ui/siegeMapPanel.ts';
/** [nazwa, plik, rodzaj scen, przed, po] — „przed" musi wystąpić w pliku dokładnie raz. */
const MUTS = [
  ['A1 co 3. właściciel → co 4.', AI, 'ai', '(ownerIndex - startIndex) % 3 === 0', '(ownerIndex - startIndex) % 4 === 0'],
  ['A2 ostatni właściciel', AI, 'ai', '|| ownerIndex === ownerCount - 1', '|| ownerIndex === ownerCount'],
  // A3 (`startIndex >= ownerCount` → `>`) jest RÓWNOWAŻNA (dla startIndex = ownerCount i tak `ownerIndex >= ownerCount` → false) — zastąpiona:
  ['A3 ujemny startIndex', AI, 'ai', 'startIndex < 0 || startIndex', 'startIndex < -1 || startIndex'],
  ['M1 siatka 3 → 4 kolumny', MG, 'merge', '.civ-amp-units{position:relative;display:grid;grid-template-columns:repeat(3,', '.civ-amp-units{position:relative;display:grid;grid-template-columns:repeat(4,'],
  ['M2 lista 5 → 4 rzędy', MG, 'merge', '--amp-grid-full:calc(5*var(--amp-row) + 4*var(--amp-gap)', '--amp-grid-full:calc(4*var(--amp-row) + 3*var(--amp-gap)'],
  ['M3 licznik „Dołącza”', MG, 'merge', "'</b> · Dołącza: <b>' + arriveN", "'</b> · Dołączają: <b>' + arriveN"],
  ['M4 licznik Razem = pole', MG, 'merge', "'</b> · Razem: <b>' + total + '</b>'", "'</b> · Razem: <b>' + fieldN + '</b>'"],
  ['M5 „▼ jeszcze” tekst', MG, 'merge', "more.textContent = show ? '▼ jeszcze ' + formatJednostkiCount(below) : '';", "more.textContent = show ? 'jeszcze ' + formatJednostkiCount(below) : '';"],
  ['M6 liczenie „poniżej”', MG, 'merge', 'if (row.offsetTop + row.offsetHeight > limit) below++;', 'if (row.offsetTop > limit) below++;'],
  ['M7 klik „jeszcze” nie przewija', MG, 'merge', "grid.scrollTo({ top: grid.scrollHeight, behavior: 'auto' });", ''],
  ['M8 przewijanie nie odświeża wskaźnika', MG, 'merge', "grid.addEventListener('scroll', syncMore, { passive: true });", ''],
  ['M9 Enter na przycisku też w keyHandler', MG, 'merge', "(e.target as HTMLElement | null)?.tagName !== 'BUTTON'", "(e.target as HTMLElement | null)?.tagName !== 'BUTTONX'"],
  ['M10 Enter na liście nie łączy', MG, 'merge', "if (e.key === 'Enter' && ", "if (e.key === 'NumpadEnter' && "],
  ['M11 brak autofokusu „Połącz”', MG, 'merge', "box.querySelector<HTMLButtonElement>('[data-act=\"merge\"]')?.focus({ preventScroll: true });", ''],
  ['M12 montaż w <body>', MG, 'merge', 'document.documentElement.appendChild(root);', 'document.body.appendChild(root);'],
  ['M13 Escape = Zostaw osobno', MG, 'merge', "pushOverlay('army-merge', () => pick(opts.onMerge));", "pushOverlay('army-merge', () => pick(opts.onSeparate));"],
  ['M14 klik w tło = Zostaw osobno', MG, 'merge', 'if (e.target === root) pick(opts.onMerge);', 'if (e.target === root) pick(opts.onSeparate);'],
  ['S1 siatka 3 → 4 kolumny', SP, 'split', '.civ-asp-units{display:grid;grid-template-columns:repeat(3,', '.civ-asp-units{display:grid;grid-template-columns:repeat(4,'],
  ['S2 ArrowDown o 1 zamiast o kolumnę', SP, 'split', "else if (e.key === 'ArrowDown') to = idx + cols;", "else if (e.key === 'ArrowDown') to = idx + 1;"],
  ['S3 domyślnie pierwsza jednostka', SP, 'split', 'new Set<string>([opts.units[opts.units.length - 1]!.id])', 'new Set<string>([opts.units[0]!.id])'],
  ['S4 status „zostaje na heksie”', SP, 'split', "' · zostaje na heksie: ' + stay", "' · zostaje: ' + stay"],
  ['S5 można odłączyć wszystkie', SP, 'split', 'return selected.size > 0 && opts.units.length - selected.size >= 1;', 'return selected.size > 0 && opts.units.length - selected.size >= 0;'],
  ['S6 Home → druga', SP, 'split', "else if (e.key === 'Home') to = 0;", "else if (e.key === 'Home') to = 1;"],
  ['S7 roving tabindex wyłączony', SP, 'split', 'inp.tabIndex = inp === active ? 0 : -1;', 'inp.tabIndex = 0;'],
  ['P1 blockedReason nie blokuje', RP, 'picker', 'const affordable = o.affordable && !o.blockedReason;', 'const affordable = o.affordable;'],
  ['P2 brak title pozycji', RP, 'picker', '      item.title = o.blockedReason;\n', ''],
  ['P3 brak wiersza przyczyny', RP, 'picker', '      body.appendChild(why);\n', ''],
  ['P4 pusty powód traktowany jak ustawiony', RP, 'picker', '    if (o.blockedReason) {\n', '    if (o.blockedReason !== undefined) {\n'],
  ['P5 tytuł „Za mało” zawsze', RP, 'picker', '    } else if (!affordable) {\n', '    } else {\n'],
  ['G1 powrót „~”', SG, 'siege', "'<div class=\"full\">Milicja przy szturmie: <b>'", "'<div class=\"full\">Milicja przy szturmie: ~<b>'"],
  ['G2 odmiana 4 → tur', SG, 'siege', 'milicjaRegen % 10 <= 4', 'milicjaRegen % 10 < 4'],
  ['G3 wyjątek 12–14 → tylko <12', SG, 'siege', '(milicjaRegen % 100 < 12 || milicjaRegen % 100 > 14)', '(milicjaRegen % 100 < 12)'],
  ['G4 „turę” → „tura”', SG, 'siege', "(milicjaRegen === 1 ? 'turę'", "(milicjaRegen === 1 ? 'tura'"],
  ['G5 brak pola = 1', SG, 'siege', 'Math.max(0, activePanel.milicjaRegen ?? 0)', 'Math.max(0, activePanel.milicjaRegen ?? 1)'],
  ['G6 próg odnowy > 1', SG, 'siege', ': milicjaRegen > 0\n', ': milicjaRegen > 1\n'],
  ['G7 odnowa przed Milicją', SG, 'siege', '        (milicjaEst > 0\n', '        (milicjaEst > 0 && !(milicjaRegen > 0)\n'],
  ['G8 tekst „odnawia się”', SG, 'siege', "'<div class=\"full\">Milicja odnawia się: za <b>'", "'<div class=\"full\">Milicja odnowi się: za <b>'"],
];
if (args.includes("--check")) {
  let bad = 0;
  for (const [n, f, , b] of MUTS) {
    const c = readFileSync(join(ROOT, f), "utf8").split(b).length - 1;
    if (c !== 1) { bad++; console.error(`WZORZEC ${n}: ${c}×`); }
  }
  console.log(`mutate-repin-ui2b --check: mutacji=${MUTS.length} złych_wzorców=${bad}`);
  process.exit(bad ? 2 : 0);
}
if (args.includes('--list')) {
  MUTS.forEach(([n, f, k], i) => console.log(`${i} ${n} (${f}, --kinds ${k})`));
  process.exit(0);
}
if (!webDir) {
  console.error('Użycie: node tools/dom-harness/mutate-repin-ui2b.mjs --web-dir <WEB_DIR> [--tmp-dir <dir>] [--from N] [--to M] [--list]');
  process.exit(2);
}
const from = Number(argOf('--from') ?? 0);
const to = Number(argOf('--to') ?? MUTS.length);
let missed = 0;
let ran = 0;
// Przerwanie (SIGTERM/SIGINT, np. `timeout`) w trakcie mutacji: przywróć plik przed wyjściem (zmierzone r1: zabicie
// procesu przez `timeout` zostawiło zmutowany `unitReplacePicker.ts`).
let pending = null;
for (const sig of ['SIGTERM', 'SIGINT', 'SIGHUP']) {
  process.on(sig, () => {
    if (pending) writeFileSync(pending.file, pending.orig);
    console.error(`PRZERWANE (${sig}) — przywrócono ${pending ? pending.file : 'nic'}`);
    process.exit(2);
  });
}
for (const [idx, [name, rel, kind, before, after]] of MUTS.entries()) {
  if (idx < from || idx >= to) continue;
  const file = join(ROOT, rel);
  const orig = readFileSync(file);
  pending = { file, orig };
  const txt = orig.toString('utf8');
  const count = txt.split(before).length - 1;
  if (count !== 1) {
    console.error(`MUTACJA ${name}: wzorzec występuje ${count}× w ${rel} (wymagane 1)`);
    process.exit(2);
  }
  writeFileSync(file, txt.replace(before, after));
  let r;
  try {
    const hArgs = ['tools/dom-harness/run-repin-ui2b.mjs', '--web-dir', webDir, '--kinds', kind];
    if (argOf('--tmp-dir')) hArgs.push('--tmp-dir', argOf('--tmp-dir'));
    r = spawnSync(process.execPath, hArgs, { cwd: ROOT, encoding: 'utf8', timeout: 400000 });
  } finally {
    writeFileSync(file, orig);
  }
  if (Buffer.compare(readFileSync(file), orig) !== 0) {
    console.error(`PRZYWRÓCENIE ${rel} nieudane`);
    process.exit(2);
  }
  ran++;
  const ok = r.status === 1;
  if (!ok) missed++;
  const line = (r.stdout ?? '').split('\n').find((l) => l.startsWith('run-repin-ui2b:')) ?? '';
  console.log(`${ok ? 'WYKRYTA ' : 'PRZEŻYŁA'} #${idx} ${name} (EXIT=${r.status}) ${line.replace(/ webVectorsSha256=.*/, '').replace(/^run-repin-ui2b: /, '')}`);
}
console.log(`mutate-repin-ui2b: zakres=[${from},${Math.min(to, MUTS.length)}) z ${MUTS.length} mutacji=${ran} wykrytych=${ran - missed} przeżyło=${missed}`);
process.exitCode = missed === 0 ? 0 : 1;
