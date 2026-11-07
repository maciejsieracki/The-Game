#!/usr/bin/env node
/**
 * mutate-repin-ui3b.mjs — kontrola czułości bramek partii REPIN UI-3-B (R-RUSTPORT-REPIN-WEB-UI-3-B-Q1): wstrzykuje po jednej
 * mutacji do pliku portu (`src/ui/*`), uruchamia `run-repin-ui3b.mjs` (`--kinds` = rodzaj scen dotknięty mutacją) i oczekuje
 * EXIT=1; rodzaj `gate` = mutacje bez wpływu na DOM (typy, komentarze) — uruchamia `verify-repin-ui3-copies.mjs` i oczekuje
 * EXIT=1 Z RAPORTEM `DELTA` (nie wystarczy sama zmiana sha256). Po każdej mutacji plik przywracany i sprawdzany bajtowo.
 *
 * Użycie (z `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/mutate-repin-ui3b.mjs --web-dir <WEB3_DIR> [--tmp-dir <dir>] [--from N] [--to M] [--list]
 *   → EXIT 0 ⇔ każda mutacja z zakresu [N, M) wykryta.
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
const SG = 'src/ui/siegeMapPanel.ts';
const RC = 'src/ui/unitRecruitCard.ts';
const NG = 'src/ui/newGameFlow.ts';
const ED = 'src/ui/empireDetailTypes.ts';
const AS = 'src/ui/armyStackHud.ts';
/** [nazwa, plik, rodzaje scen | 'gate', przed, po] — „przed” musi wystąpić w pliku dokładnie raz. */
const MUTS = [
  ['Z1 głód dopiero przy zapasach < 0', SG, 'siege', 'const hungerStage = food <= 0;', 'const hungerStage = food < 0;'],
  ['Z2 procent obcięty zamiast zaokrąglony', SG, 'siege', "'−' + Math.round(starveFrac * 100) + '% HP/turę (głód)'", "'−' + Math.floor(starveFrac * 100) + '% HP/turę (głód)'"],
  ['Z3 znak minus ASCII', SG, 'siege', "'−' + Math.round(starveFrac * 100)", "'-' + Math.round(starveFrac * 100)"],
  ['Z4 etykieta zapasów', SG, 'siege', ": 'brak (zapasy)';", ": 'brak';"],
  ['Z5 etykieta bez garnizonu', SG, 'siege', ": 'brak garnizonu')", ": 'brak')"],
  ['Z6 stary sufiks „/turę”', SG, 'siege', "'<div>Atrycja: <b>' + atrycjaLabel + '</b></div>'", "'<div>Atrycja: <b>' + atrycjaLabel + '</b>/turę</div>'"],
  ['Z7 ułamek z DTO ignorowany', SG, 'siege', '? (activePanel.starveFrac ?? 0) : 0;', '? 0 : 0;'],
  ['Z8 ułamek ujemny traktowany jak dodatni', SG, 'siege', 'garnizon > 0 && starveFrac > 0 ?', 'garnizon > 0 && starveFrac !== 0 ?'],
  ['R1 initialQuantity ignorowane', RC, 'recruit', 'let quantity = Number.isFinite(opts.initialQuantity)', 'let quantity = false'],
  ['R2 brak sufitu dla initialQuantity', RC, 'recruit', 'Math.min(maxQuantity, Math.max(1, Math.round(opts.initialQuantity as number)))', 'Math.max(1, Math.round(opts.initialQuantity as number))'],
  ['R3 initialQuantity obcięte', RC, 'recruit', 'Math.round(opts.initialQuantity as number)', 'Math.floor(opts.initialQuantity as number)'],
  ['R4 pole nie pokazuje initialQuantity', RC, 'recruit', '  quantityInput.value = String(quantity);\n  const syncQuantityControls', '  const syncQuantityControls'],
  ['R5 brak onQuantityChange', RC, 'recruit', '    opts.onQuantityChange?.(quantity);\n', ''],
  ['R6 reset licznika po Rekrutuj', RC, 'recruit', 'onRecruit(quantity); // licznik', 'onRecruit(quantity); setQuantity(1); // licznik'],
  ['R7 stare zachowanie: reset po akceptacji', RC, 'recruit', 'onRecruit(quantity); // licznik', 'if (onRecruit(quantity) !== false) setQuantity(1); // licznik'],
  ['N1 parametr odwrócony', NG, 'ng', "autoBuildEnabled: settingValue('auto_build_enabled') === 'Włączona',", "autoBuildEnabled: settingValue('auto_build_enabled') === 'Wyłączona',"],
  ['N2 wiersz poza siatką', NG, 'ng', "    'auto_build_enabled',\n  ]);", '  ]);'],
  ['N3 glif ustawienia', NG, 'ng', "auto_build_enabled: 'Au',", "auto_build_enabled: 'Ab',"],
  ['N4 brak parametru', NG, 'ng', "    autoBuildEnabled: settingValue('auto_build_enabled') === 'Włączona',\n", ''],
  ['E1 „Spichlerze II” w liczniku', ED, 'edt', 'Aktywne Spichlerze Królewskie płacące Sól', 'Aktywne Spichlerze II płacące Sól'],
  ['E2 „Spichlerza II” w opisie', ED, 'edt', 'jednego Spichlerza Królewskiego z dostępem', 'jednego Spichlerza II z dostępem'],
  ['E3 źródło „Spichlerz II”', ED, 'edt', "zrodlo: 'Spichlerz Królewski · Sól',", "zrodlo: 'Spichlerz II · Sól',"],
  ['G1 brak pola picked', AS, 'gate', '  /** Zaznaczona do zbiorowego rozwiązania (wielokrotne zaznaczanie w panelu armii). */\n  picked?: boolean;\n', ''],
  ['G2 typ roli bez adaptera', AS, 'gate', '  commanderTitle?: ArmyCommanderTitle;', "  commanderTitle?: 'Wódz' | 'Generał';"],
  ['G3 stary komentarz capBonusPerMagazyn', ED, 'gate', '/** Bonus capu za KAŻDY Magazyn = baza × magazyn_bonus_surowce_proc_na_budynek (0,2 → +20%) × mnożnik epoki. */',
    '/** Bonus capu za KAŻDY Magazyn (econ-params.json magazyn_bonus_surowce_na_budynek). */'],
  ['G4 brak komentarza weba (oblężenie)', SG, 'gate', '  // R-WEB-SIEGE-STARVATION-SURRENDER-Q1: atrycja HP garnizonu dziala WYLACZNIE w etapie glodu (zapasy = 0).\n', ''],
  ['G5 opis pola NewGameParams', NG, 'gate', '   * / EN: player build automation (default OFF). */', '   * / EN: player build automation. */'],
];
if (args.includes('--list')) {
  MUTS.forEach(([n, f, k], i) => console.log(`${i} ${n} (${f}, --kinds ${k})`));
  process.exit(0);
}
if (!webDir) {
  console.error('Użycie: node tools/dom-harness/mutate-repin-ui3b.mjs --web-dir <WEB3_DIR> [--tmp-dir <dir>] [--from N] [--to M] [--list]');
  process.exit(2);
}
const from = Number(argOf('--from') ?? 0);
const to = Number(argOf('--to') ?? MUTS.length);
let missed = 0;
let ran = 0;
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
  writeFileSync(file, txt.replace(before, () => after));
  let r;
  try {
    if (kind === 'gate') {
      r = spawnSync(process.execPath, ['tools/verify-repin-ui3-copies.mjs', '--web-dir', webDir], { cwd: ROOT, encoding: 'utf8', timeout: 120000 });
    } else {
      const hArgs = ['tools/dom-harness/run-repin-ui3b.mjs', '--web-dir', webDir, '--kinds', kind];
      if (argOf('--tmp-dir')) hArgs.push('--tmp-dir', argOf('--tmp-dir'));
      r = spawnSync(process.execPath, hArgs, { cwd: ROOT, encoding: 'utf8', timeout: 400000 });
    }
  } finally {
    writeFileSync(file, orig);
    pending = null;
  }
  if (Buffer.compare(readFileSync(file), orig) !== 0) {
    console.error(`PRZYWRÓCENIE ${rel} nieudane`);
    process.exit(2);
  }
  ran++;
  const out = (r.stdout ?? '') + (r.stderr ?? '');
  const ok = r.status === 1 && (kind !== 'gate' || out.includes(`DELTA ${rel}`));
  if (!ok) missed++;
  const line = kind === 'gate'
    ? (out.split('\n').find((l) => l.startsWith('DELTA ')) ?? '')
    : ((r.stdout ?? '').split('\n').find((l) => l.startsWith('run-repin-ui3b:')) ?? '').replace(/ webVectorsSha256=.*/, '').replace(/^run-repin-ui3b: /, '');
  console.log(`${ok ? 'WYKRYTA ' : 'PRZEŻYŁA'} #${idx} ${name} (EXIT=${r.status}) ${line}`);
}
console.log(`mutate-repin-ui3b: zakres=[${from},${Math.min(to, MUTS.length)}) z ${MUTS.length} mutacji=${ran} wykrytych=${ran - missed} przeżyło=${missed}`);
process.exitCode = missed === 0 ? 0 : 1;
