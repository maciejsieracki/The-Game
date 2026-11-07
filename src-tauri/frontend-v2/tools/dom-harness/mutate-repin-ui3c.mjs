#!/usr/bin/env node
/**
 * mutate-repin-ui3c.mjs — kontrola czułości `run-repin-ui3c.mjs` (R-RUSTPORT-REPIN-WEB-UI-3-C-Q1, partia UI-3-C): wstrzykuje
 * po jednej mutacji do pliku portu (`src/ui/{hexContextTooltip,buildModeHud,empireDetailPanel}.ts`), uruchamia harness
 * (`--kinds` = grupy dotknięte mutacją) i oczekuje EXIT=1; po każdej mutacji przywraca plik i sprawdza bajtową identyczność.
 * Mutacje: każdy nowy fragment / gałąź hunków `86d510c66 → 9b019a7d8` w portach partii (pasek wyboru stosu, sortowanie,
 * etykiety, pole wyboru, CSS; filtr odblokowań, deduplikacja surowców; hak automatyzacji budowy, podpowiedź, tekst
 * „Budżet niewydany”, etykieta efektu; wypełnienie suwaków, „Brutto → netto”, `formatManpowerCompact`, mnożnik epoki).
 *
 * Użycie (z `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/mutate-repin-ui3c.mjs --web-dir <WEB86U3_DIR> [--tmp-dir <dir>] [--from N] [--to M] [--list]
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
const HX = 'src/ui/hexContextTooltip.ts';
const BM = 'src/ui/buildModeHud.ts';
const EP = 'src/ui/empireDetailPanel.ts';
/** [nazwa, plik, rodzaje, przed, po] — „przed” musi wystąpić w pliku dokładnie raz. */
const MUTS = [
  ['H1 licznik „Zaznaczono” → „Wybrano”', HX, 'unit', '? `Zaznaczono ${picked} z ${total}`', '? `Wybrano ${picked} z ${total}`'],
  ['H2 „Odznacz” zawsze aktywny', HX, 'unit', "data-act=\"pick-none\"${picked === 0 ? ' disabled' : ''}>Odznacz", 'data-act="pick-none">Odznacz'],
  ['H3 brak paska wyboru', HX, 'unit', "let html = buildUnitStackPickBarHtml(cards) + '<div class=\"sp-unit-stack\">';", "let html = '<div class=\"sp-unit-stack\">';"],
  ['H4 bez sortowania generałów', HX, 'unit', 'const ordered = sortArmyStackGeneralsFirst(cards);', 'const ordered = cards;'],
  ['H5 etykieta karty bez roli', HX, 'unit', 'const cardLabel = armyStackCardLabel(c);', 'const cardLabel = c.name;'],
  ['H6 brak klasy picked', HX, 'unit', "${c.picked ? ' picked' : ''}\" data-unit=", '" data-unit='],
  ['H7 aria-checked odwrócone', HX, 'unit', 'aria-checked="${c.picked ? \'true\' : \'false\'}"', 'aria-checked="${c.picked ? \'false\' : \'true\'}"'],
  ['H8 CSS pola wyboru (PNG/CSS)', HX, 'unit,pix', '.sp-unit-pick.on{background:var(--civ-gold-primary,#e8d88a);', '.sp-unit-pick.on{background:var(--civ-gold-primary,#e8d89a);'],
  ['H9 CSS karta bez position:relative', HX, 'unit,pix', '.sp-unit-stack-card{position:relative;}', '.sp-unit-stack-card{}'],
  ['X1 filtr odblokowań wyłączony', HX, 'hex', 'return unlocks.filter(u => u.trim().toLowerCase() !== prod);', 'return unlocks;'],
  ['X2 filtr odblokowań wrażliwy na wielkość liter', HX, 'hex', 'const prod = TERRITORY_RESOURCE_LABEL[row.resourceKey].trim().toLowerCase();', 'const prod = TERRITORY_RESOURCE_LABEL[row.resourceKey].trim();'],
  ['X3 wiersz postawionego bez filtra', HX, 'hex', '  const unlocks = unlockLabelsBeyondProduction(imp);\n', '  const unlocks = imp.unlockLabels;\n'],
  ['X4 wiersz możliwego bez filtra', HX, 'hex', '    const unlocks = unlockLabelsBeyondProduction(p);\n', '    const unlocks = p.unlockLabels;\n'],
  ['X5 dedup bez reguły Las (drewno)', HX, 'hex', "    if (k === 'las (drewno)' && seen.has('drewno')) return;\n", ''],
  ['X6 dedup bez reguły prefiksu', HX, 'hex', '    for (const s of seen) if (s.startsWith(`${k} `)) return;\n', ''],
  ['X7 dedup bez ł→l', HX, 'hex', ".replace(/ł/g, 'l');", ';'],
  ['X8 brak deduplikacji surowców', HX, 'hex', 'const resources = dedupResourceLabels(view.resourceLabels);', 'const resources = view.resourceLabels;'],
  ['B1 hak automatyzacji ignorowany', BM, 'bm', 'const autoBuildOn = config.isAutoBuildEnabled ? config.isAutoBuildEnabled() : true;', 'const autoBuildOn = true;'],
  ['B2 brak haka = wyłączona', BM, 'bm', 'const autoBuildOn = config.isAutoBuildEnabled ? config.isAutoBuildEnabled() : true;', 'const autoBuildOn = config.isAutoBuildEnabled ? config.isAutoBuildEnabled() : false;'],
  ['B3 tekst podpowiedzi', BM, 'bm', "const AUTO_BUILD_DISABLED_HINT = 'Włącz automatyzację budowy w Ustawieniach';", "const AUTO_BUILD_DISABLED_HINT = 'Włącz automatyzację budowy w ustawieniach';"],
  ['B4 brak znacznika locked', BM, 'bm', 'html += \'<div class="civ-build-auto" data-auto-build-locked="1">\';', 'html += \'<div class="civ-build-auto">\';'],
  ['B5 tekst „Budżet niewydany”', BM, 'bm', '(${unspent.waitingHexes} pól czeka na obywatela)', '(${unspent.waitingHexes} pól czeka)'],
  ['B6 etykieta efektu (własne/państwo)', BM, 'bm', "+ (effState.override ? ' (własne)' : ' (państwo)') + '</div>';", "+ (effState.override ? ' (państwo)' : ' (własne)') + '</div>';"],
  ['E1 szerokość uchwytu 14 → 16', EP, 'emp', 'const SLIDER_THUMB_PX = 14;', 'const SLIDER_THUMB_PX = 16;'],
  ['E2 środek uchwytu bez korekty', EP, 'emp', 'return `calc(${SLIDER_THUMB_PX / 2}px + (100% - ${SLIDER_THUMB_PX}px) * ${f})`;', 'return `${f * 100}%`;'],
  ['E3 sliderRangePct = surowa wartość', EP, 'emp', 'return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));', 'return Math.max(0, Math.min(100, value));'],
  ['E4 suwak Skarbca: zakres 0–100', EP, 'emp', 'sliderFillStyle(sliderRangePct(pct, 0, maxVal), row.from, row.to)', 'sliderFillStyle(sliderRangePct(pct, 0, 100), row.from, row.to)'],
  ['E5 aktualizacja sąsiednich suwaków po input', EP, 'emp', 'other.style.background = sliderFillGradient(sliderRangePct(pct, Number(other.min), Number(other.max)),', 'other.style.background = sliderFillStyle(sliderRangePct(pct, Number(other.min), Number(other.max)),'],
  ['E6 suwak Pracy bez środka uchwytu', EP, 'emp', 'const x = sliderThumbCenterCss(pctUlepszeniaTrack);', 'const x = `${pctUlepszeniaTrack}%`;'],
  ['E7 netto ujemne nie czerwone', EP, 'emp', "const cls = n < 0 ? 'neg' : 'pos';", "const cls = n <= 0 ? 'neg' : 'pos';"],
  ['E8 brak „Brutto → netto” Nauki', EP, 'emp', "+ grossNetSub(rate, rate, 'PN', ' (Nauka nie ma dziś kosztów — brutto = netto)');", ';'],
  ['E9 Spichlerz: brutto bez fallbacku', EP, 'emp', 'grossNetSub(economy.zywnoscWplywMiast ?? economy.zywnoscRate, economy.zywnoscRate,', 'grossNetSub(economy.zywnoscWplywMiast, economy.zywnoscRate,'],
  ['E10 Surowce: brutto/netto zamienione', EP, 'emp', 'sur += grossNetSub(economy.surowceBrutto, economy.surowceNetto,', 'sur += grossNetSub(economy.surowceNetto, economy.surowceBrutto,'],
  ['E11 Handel bez „Brutto → netto”', EP, 'emp', "    + grossNetSub(t.totalIncome, t.totalIncome, 'złota', ' (trasy nie mają kosztów; dochód jest już wliczony we wpływy Skarbca)')\n", ''],
  ['E12 formatManpowerCompact = surowa liczba', EP, 'emp', '  return formatCompactNumber(n);\n}', '  return String(n);\n}'],
  ['E13 mnożnik epoki z jedną cyfrą → 2', EP, 'emp', 'const eraMultTxt = formatLiczbaPl(citizenRate / CITIZEN_UPKEEP_RATE_PER_CITIZEN, 1);', 'const eraMultTxt = formatLiczbaPl(citizenRate / CITIZEN_UPKEEP_RATE_PER_CITIZEN, 2);'],
  ['E14 Spichlerz bez economy', EP, 'emp', 'const spichlerz = renderSpichlerzCentralnySection(snap.food, e)', 'const spichlerz = renderSpichlerzCentralnySection(snap.food)'],
  ['E15 Surowce bez economy', EP, 'emp', 'const sur = renderSurowceSection(snap.resources, e);', 'const sur = renderSurowceSection(snap.resources);'],
  ['E16 suwak racji: stary styl (cała deklaracja)', EP, 'emp', "inp.style.background = sliderFillGradient(pct, '#4e9a3f', '#78c95a');", "inp.style.background = sliderFillStyle(pct, '#4e9a3f', '#78c95a');"],
];
if (args.includes('--list')) {
  for (const [i, [n, f, k]] of MUTS.entries()) console.log(`#${i} ${n} (${f}, ${k})`);
  process.exit(0);
}
if (!webDir) {
  console.error('Użycie: node tools/dom-harness/mutate-repin-ui3c.mjs --web-dir <WEB86U3_DIR> [--tmp-dir <dir>] [--from N] [--to M]');
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
    const hArgs = ['tools/dom-harness/run-repin-ui3c.mjs', '--web-dir', webDir, '--kinds', kind];
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
  const line = (r.stdout ?? '').split('\n').find((l) => l.startsWith('run-repin-ui3c:')) ?? '';
  console.log(`${ok ? 'WYKRYTA ' : 'PRZEŻYŁA'} #${idx} ${name} (EXIT=${r.status}) ${line.replace(/ webVectorsSha256=.*/, '').replace(/^run-repin-ui3c: /, '')}`);
}
console.log(`mutate-repin-ui3c: zakres=[${from},${Math.min(to, MUTS.length)}) z ${MUTS.length} mutacji=${ran} wykrytych=${ran - missed} przeżyło=${missed}`);
process.exitCode = missed === 0 ? 0 : 1;
