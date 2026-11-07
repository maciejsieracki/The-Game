#!/usr/bin/env node
/**
 * mutate-repin-ui3d.mjs — kontrola czułości `run-repin-ui3d.mjs` (R-RUSTPORT-REPIN-WEB-UI-3-D-Q1, partia UI-3-D): wstrzykuje
 * po jednej mutacji do pliku portu (`src/ui/minimapHud.ts`, `src/ui/hud.ts`), uruchamia harness (`--kinds` = rodzaj scen
 * dotknięty mutacją) i oczekuje EXIT=1; po każdej mutacji przywraca plik i sprawdza bajtową identyczność z oryginałem.
 * Mutacje: nowe gałęzie hunków `86d510c66 → 9b019a7d8` (warstwa bazowa + `updateViewport`, `sameMinimapViewport`, adapter
 * `createStateFrame`, migawka `getState`, baner 3+3 brutto/netto, niedobory, przycisk „Rekrutacja”, rekruci k/M, CSS).
 *
 * Użycie (z `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/mutate-repin-ui3d.mjs --web-dir <WEB3_DIR> [--tmp-dir <dir>] [--from N] [--to M] [--list]
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
const MM = 'src/ui/minimapHud.ts';
const HU = 'src/ui/hud.ts';
/** [nazwa, plik, rodzaje scen, przed, po] — „przed” musi wystąpić w pliku dokładnie raz. */
const MUTS = [
  ['M1 updateViewport bez sprawdzenia „ta sama ramka”', MM, 'mini', '    if (sameMinimapViewport(shownViewport, viewport)) return;\n', ''],
  ['M2 sameMinimapViewport pomija wysokość', MM, 'vec', 'return a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h;', 'return a.x === b.x && a.y === b.y && a.w === b.w;'],
  ['M3 sameMinimapViewport: undefined == cokolwiek', MM, 'vec', 'if (a === undefined || b === undefined) return a === b;', 'if (a === undefined || b === undefined) return true;'],
  ['M4 ramka rysowana także bez heksów', MM, 'mini', 'if (viewport !== undefined && frame.hasHexes) {', 'if (viewport !== undefined) {'],
  ['M5 updateViewport nie zapamiętuje ramki', MM, 'mini', '    shownViewport = viewport;\n    drawMinimapFrame(canvas, frame, viewport);', '    drawMinimapFrame(canvas, frame, viewport);'],
  ['M6 update() nie zapamiętuje ramki danych', MM, 'mini', '      shownViewport = data.viewport;\n', ''],
  ['M7 jasność mgły explored (adapter katalogu)', MM, 'mini', 'ctx.globalAlpha = staticCatalog().constants.fogExploredBrightness;', 'ctx.globalAlpha = 0.3;'],
  ['M8 grubość ramki widoku', MM, 'mini', '    ctx.lineWidth = 1.5;', '    ctx.lineWidth = 2;'],
  ['M9 kolor ramki widoku', MM, 'mini', "    ctx.strokeStyle = 'rgba(255,255,255,0.80)';", "    ctx.strokeStyle = 'rgba(255,255,255,0.70)';"],
  ['M10 znacznik jednostki mniejszy', MM, 'mini', '? Math.max(2.5, drawR * 0.22)', '? Math.max(2, drawR * 0.22)'],
  ['H1 migawka getState wyłączona', HU, 'hud', 'function hudStateSnapshot(): HudState { return hudFrame.snapshot(); }', 'function hudStateSnapshot(): HudState { return cfg!.getState(); }'],
  ['H2 adapter: migawka nie zapamiętana', HU, 'hud', 'if (!has) { frame = getState(); has = true; }', 'if (!has) { frame = getState(); }'],
  ['H3 adapter: odwrócony zakres', HU, 'hud', 'if (!active) return getState();', 'if (active) return getState();'],
  ['H4 przycisk Rekrutacja bez akcji', HU, 'hud', "  else if (act === 'empire-recruit') cfg.onOpenEmpireRecruit?.();\n", ''],
  ['H5 netTone bez „zero”', HU, 'vec', "return r < 0 ? 'neg' : r > 0 ? 'pos' : 'zero';", "return r < 0 ? 'neg' : 'pos';"],
  ['H6 okno zapasu < zamiast <=', HU, 'vec', 'return stock <= 0 || stock / -rate <= HUD_SHORTAGE_RUNWAY_TURNS;', 'return stock <= 0 || stock / -rate < HUD_SHORTAGE_RUNWAY_TURNS;'],
  ['H7 próg niedoboru 5 → 4 tury', HU, 'vec', 'export const HUD_SHORTAGE_RUNWAY_TURNS = 5;', 'export const HUD_SHORTAGE_RUNWAY_TURNS = 4;'],
  ['H8 niedobór surowców od 2 etykiet', HU, 'vec', 'return (s.surowceNiedoborLabels?.length ?? 0) > 0;', 'return (s.surowceNiedoborLabels?.length ?? 0) > 1;'],
  ['H9 najgorszy bilans = najmniej ujemny', HU, 'hud', '(!worst || r.netto < worst.netto)', '(!worst || r.netto > worst.netto)'],
  ['H10 Praca brutto bez utrzymania', HU, 'vec', 's.pracaPrognoza !== undefined ? s.pracaPrognoza + (s.pracaUpkeep ?? 0) : pracaWplywBrutto(s);', 's.pracaPrognoza !== undefined ? s.pracaPrognoza : pracaWplywBrutto(s);'],
  ['H11 baner: rzędy zamienione', HU, 'vec', "'<div class=\"hud-chip-grid\">' + row1.join('') + row2.join('') + '</div>'", "'<div class=\"hud-chip-grid\">' + row2.join('') + row1.join('') + '</div>'"],
  ['H12 CSS szerokość banera', HU, 'hud', '.civ-hud .civ-hud-banner-left{width:calc(50vw - 150px);max-width:calc(50vw - 150px);}', '.civ-hud .civ-hud-banner-left{width:calc(50vw - 200px);max-width:calc(50vw - 200px);}'],
  ['H13 rekruci: title bez pełnej liczby', HU, 'hud', 'const rekrFull = recruitNum !== undefined ? formatFullNumber(recruitNum) : rekrLabel;', 'const rekrFull = rekrLabel;'],
  ['H14 updateMinimapViewport = pełne update()', HU, 'hud', '  minimapApi?.updateViewport(viewport);', '  minimapApi?.update();'],
  ['H15 CSS kolor niedoboru', HU, 'hud', "const shortCss = '.civ-hud{--civ-hud-shortage:#ee6c6c;}\\n'", "const shortCss = '.civ-hud{--civ-hud-shortage:#ee6c00;}\\n'"],
  ['H16 CSS medalion Mocy ≤700 px', HU, 'hud', '  .civ-hud .power-center .p-val-num{font-size:16px;}}', '  .civ-hud .power-center .p-val-num{font-size:18px;}}'],
  ['H17 Armia: pula rekrutów bez skrótu', HU, 'vec', "? formatCompactNumber(s.rekruci) : (s.rekruciLabel ?? '—')}`", "? String(s.rekruci) : (s.rekruciLabel ?? '—')}`"],
  ['H18 Spichlerz: deficyty miast', HU, 'vec', '${signed(-Math.max(0, wplyw - koszt - netto))}', '${signed(-Math.max(1, wplyw - koszt - netto))}'],
  ['H19 Surowce: chip bez shortage', HU, 'vec', '      shortage: hudResourceShortage(s),\n', '      shortage: false,\n'],
  ['H20 Skarbiec: tytuł bez ostrzeżenia', HU, 'vec', "const short = hudGoldShortage(s) ? ' · ⚠ Zaczyna brakować pieniędzy (czerwony)' : '';", "const short = '';"],
  ['H21 Handel: netto ≠ brutto', HU, 'vec', '      net: formatCompactSigned(handelBrutto),', '      net: formatCompactSigned(-handelBrutto),'],
  ['H22 przycisk Rekrutacja zawsze', HU, 'hud', 'const recruitBtn = (!mapChromeSuppressed && cfg?.onOpenEmpireRecruit)', 'const recruitBtn = (!mapChromeSuppressed)'],
];
if (args.includes('--list')) {
  MUTS.forEach((m, i) => console.log(`#${i} ${m[0]} (${m[1]}, ${m[2]})`));
  process.exit(0);
}
if (!webDir) {
  console.error('Użycie: node tools/dom-harness/mutate-repin-ui3d.mjs --web-dir <WEB3_DIR> [--tmp-dir <dir>] [--from N] [--to M] [--list]');
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
    const hArgs = ['tools/dom-harness/run-repin-ui3d.mjs', '--web-dir', webDir, '--kinds', kind];
    if (argOf('--tmp-dir')) hArgs.push('--tmp-dir', argOf('--tmp-dir'));
    r = spawnSync(process.execPath, hArgs, { cwd: ROOT, encoding: 'utf8', timeout: 400000 });
  } finally {
    writeFileSync(file, orig);
    pending = null;
  }
  if (Buffer.compare(readFileSync(file), orig) !== 0) {
    console.error(`PRZYWRÓCENIE ${rel} nieudane`);
    process.exit(2);
  }
  ran++;
  const ok = r.status === 1;
  if (!ok) missed++;
  const line = (r.stdout ?? '').split('\n').find((l) => l.startsWith('run-repin-ui3d:')) ?? '';
  console.log(`${ok ? 'WYKRYTA ' : 'PRZEŻYŁA'} #${idx} ${name} (EXIT=${r.status}) ${line.replace(/ webVectorsSha256=.*/, '').replace(/^run-repin-ui3d: /, '')}`);
}
console.log(`mutate-repin-ui3d: zakres=[${from},${Math.min(to, MUTS.length)}) z ${MUTS.length} mutacji=${ran} wykrytych=${ran - missed} przeżyło=${missed}`);
process.exitCode = missed === 0 ? 0 : 1;
