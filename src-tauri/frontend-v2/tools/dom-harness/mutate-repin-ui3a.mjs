#!/usr/bin/env node
/**
 * mutate-repin-ui3a.mjs — kontrola czułości `run-repin-ui3a.mjs` (R-RUSTPORT-REPIN-WEB-UI-3-Q1, partia UI-3-A): wstrzykuje
 * po jednej mutacji do pliku portu (`src/ui/*`), uruchamia harness (`--kinds` = rodzaj scen dotknięty mutacją) i oczekuje
 * EXIT=1; po każdej mutacji przywraca plik i sprawdza bajtową identyczność z oryginałem.
 * Mutacje: każda gałąź sterująca / nowy fragment hunków `86d510c66 → 9b019a7d8` w plikach partii (etykieta i kolejność
 * dowódców, klasy `cmd`, przełącznik automatyzacji, chip `shortage`/`net`/`netHint`/`formatGrossNet`, reguły zakładek,
 * filtry, panel boczny, panel rekrutacji cywilizacji, mapa ikony `emporion`).
 *
 * Użycie (z `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/mutate-repin-ui3a.mjs --web-dir <WEB3_DIR> [--tmp-dir <dir>] [--from N] [--to M] [--list]
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
const LB = 'src/ui/armyStackLabel.ts';
const MG = 'src/ui/armyMergePanel.ts';
const PK = 'src/ui/armyMergePickPanel.ts';
const SP = 'src/ui/armySplitPanel.ts';
const PM = 'src/ui/gamePauseMenu.ts';
const CH = 'src/ui/hudChip6c.ts';
const TB = 'src/ui/sidePanelEventTabs.ts';
const FL = 'src/ui/sidePanelEventFilter.ts';
const SH = 'src/ui/sidePanelHud.ts';
const ER = 'src/ui/empireRecruitPanel.ts';
const IM = 'src/ui/icons/brand/building-icon-map.json';
/** [nazwa, plik, rodzaje scen, przed, po] — „przed” musi wystąpić w pliku dokładnie raz. */
const MUTS = [
  ['L1 etykieta „Rola — typ” → „Rola: typ”', LB, 'label', '`${card.commanderTitle} — ${card.name}`', '`${card.commanderTitle}: ${card.name}`'],
  ['L2 Robotnik nie jest cywilem (adapter)', LB, 'label', "new Set(['Zwiadowca', 'Osadnik', 'Robotnik'])", "new Set(['Zwiadowca', 'Osadnik'])"],
  ['L3 sortNonCombatLast bez sortowania (adapter)', LB, 'label', '[...items.filter(x => !isNonCombat(x)), ...items.filter(isNonCombat)]', '[...items]'],
  ['L4 tylko Wódz na początku', LB, 'label', '...cards.filter(c => c.commanderTitle !== undefined),', "...cards.filter(c => c.commanderTitle === 'Wódz'),"],
  ['L5 dowódca-zwiadowca na koniec', LB, 'label', 'c => c.commanderTitle === undefined && c.name !== undefined && isNonCombatTypeName(c.name)', 'c => c.name !== undefined && isNonCombatTypeName(c.name)'],
  ['M1 merge bez klasy cmd', MG, 'merge', "(u.commanderTitle ? ' cmd' : '') + '\" role=\"listitem\">'", "'\" role=\"listitem\">'"],
  ['M2 merge etykieta bez roli', MG, 'merge', 'const label = armyStackCardLabel(u);', 'const label = u.name;'],
  ['M3 merge bez sortowania', MG, 'merge', 'sortArmyStackGeneralsFirst(opts.existing).map', 'opts.existing.map'],
  ['M4 merge kolor nazwy dowódcy (PNG)', MG, 'merge', '.civ-amp-row.cmd .civ-amp-row-name{color:#ffe27a;', '.civ-amp-row.cmd .civ-amp-row-name{color:#ffe28a;'],
  ['P1 pick bez sortowania', PK, 'pick', 'for (const u of sortArmyStackGeneralsFirst(opts.sourceUnits))', 'for (const u of opts.sourceUnits)'],
  ['P2 pick bez title', PK, 'pick', "(u.commanderTitle ? ' cmd' : '') + '\" title=\"' + esc(label) + '\">'", "(u.commanderTitle ? ' cmd' : '') + '\">'"],
  ['P3 pick aria-label = nazwa', PK, 'pick', "data-uid=\"' + esc(u.id) + '\" aria-label=\"' + esc(label) + '\">'", "data-uid=\"' + esc(u.id) + '\" aria-label=\"' + esc(u.name) + '\">'"],
  ['P4 pick kolor dowódcy (PNG)', PK, 'pick', '.civ-ampk-u.cmd .civ-ampk-u-name{color:#ffe27a;', '.civ-ampk-u.cmd .civ-ampk-u-name{color:#ffe28a;'],
  ['S1 split bez sortowania', SP, 'split', 'for (const u of sortArmyStackGeneralsFirst(opts.units))', 'for (const u of opts.units)'],
  ['S2 split bez klasy cmd', SP, 'split', "const cmdCls = u.commanderTitle ? ' cmd' : '';", "const cmdCls = '';"],
  ['S3 split etykieta bez roli', SP, 'split', 'armyStackCardLabel({ name: u.name, commanderTitle: u.commanderTitle })', 'armyStackCardLabel({ name: u.name })'],
  ['S4 split ramka dowódcy (PNG)', SP, 'split', '.civ-asp-u.cmd{border-color:rgba(232,216,138,0.55);}', '.civ-asp-u.cmd{border-color:rgba(232,216,138,0.25);}'],
  ['G1 automatyzacja domyślnie WŁ.', PM, 'pause', 'const autoBuildNow = cfg.getAutoBuildEnabled?.() ?? false;', 'const autoBuildNow = cfg.getAutoBuildEnabled?.() ?? true;'],
  ['G2 przełącznik zawsze widoczny', PM, 'pause', '    (cfg.onAutoBuildToggle\n', '    (true\n'],
  ['G3 klik nie przełącza', PM, 'pause', "const next = autoBuildToggleBtn.getAttribute('aria-pressed') !== 'true';", "const next = autoBuildToggleBtn.getAttribute('aria-pressed') === 'true';"],
  ['G4 aria-pressed odwrócone', PM, 'pause', "'aria-pressed=\"' + (autoBuildNow ? 'true' : 'false') + '\" aria-label=\"Automatyzacja", "'aria-pressed=\"' + (autoBuildNow ? 'false' : 'true') + '\" aria-label=\"Automatyzacja"],
  ['C1 brak klasy niedoboru', CH, 'chip', "+ (opts.shortage ? ' civ-hud-chip-short' : '')", "+ ''"],
  ['C2 brak netHint w tooltipie', CH, 'chip', "+ (opts.netHint ? ' · ' + opts.netHint : '');", ';'],
  ['C3 domyślny ton netto', CH, 'chip', "const netT = opts.netTone ?? 'zero';", "const netT = opts.netTone ?? 'pos';"],
  ['C4 separator brutto/netto', CH, 'chip', 'aria-hidden="true">/</span>`', 'aria-hidden="true">|</span>`'],
  ['C5 formatGrossNet strzałka', CH, 'chip', '\\u2192 NETTO', '-> NETTO'],
  ['C6 komórka bez figs przy braku rate', CH, 'chip', ': `<span class="civ-hud-chip-figs"><span class="civ-hud-chip-net ${netT}">${opts.net}</span></span>`;', ": '';"],
  ['T1 karta blokująca nie = Ważne', TB, 'tabs,side', "if (ev.blocking === true || ev.kind === 'enemy') return 'wazne';", "if (ev.kind === 'enemy') return 'wazne';"],
  ['T2 brak granicy początku wyrazu', TB, 'tabs', "const W = '(?<![a-z0-9])';", "const W = '';"],
  ['T3 ł bez normalizacji', TB, 'tabs', ".replace(/ł/g, 'l')", ".replace(/ł/g, 'ł')"],
  ['T4 domyślna zakładka Ważne od 2', TB, 'tabs,side', "if (counts.wazne > 0) return 'wazne';", "if (counts.wazne > 1) return 'wazne';"],
  ['T5 „deficyt” nie jest brakiem', TB, 'tabs', "'brakuj', 'niedobor', 'deficyt',", "'brakuj', 'niedobor',"],
  ['T6 „armiy” poza regułą', TB, 'tabs', "'armi[aeiy]'", "'armi[aei]'"],
  ['T7 tytuł „Dyplomacja…” nie = dyplomacja', TB, 'tabs', "|| ev.title.startsWith('Dyplomacja')) {", ') {'],
  ['F1 AI↔AI nigdy ukryte', FL, 'tabs,side', "return ev.origin === 'other-civs' && activeTab !== 'dyplomacja';", 'return false;'],
  ['F2 liczniki zawsze z AI↔AI', FL, 'tabs,side', "if (!includeAiAi && ev.origin === 'other-civs') continue;", ''],
  ['F3 filtr zakładki przepuszcza wszystko', FL, 'tabs,side', 'return events.filter(ev => eventTabOf(ev) === tab);', 'return events.slice();'],
  ['H1 domyślna zakładka liczy AI↔AI', SH, 'side', 'if (!activeTabPicked) activeTab = defaultSidePanelTab(tabCountsOf(allInfoEvents, false));', 'if (!activeTabPicked) activeTab = defaultSidePanelTab(tabCountsOf(allInfoEvents, true));'],
  ['H2 wybór zakładki nie zapamiętany', SH, 'side', 'activeTabPicked = true;', ''],
  ['H3 „Zamknij wszystkie” tylko bieżąca zakładka', SH, 'side', 'for (const ev of relevantInfo) config.onEventDismiss?.(ev.id);', 'for (const ev of infoEvents) config.onEventDismiss?.(ev.id);'],
  ['H4 licznik zakładki = Ważne', SH, 'side', "'<span class=\"sp-tab-count\">' + tabCounts[tab]", "'<span class=\"sp-tab-count\">' + tabCounts.wazne"],
  ['H5 liczniki zakładek bez AI↔AI', SH, 'side', 'const tabCounts = tabCountsOf(allInfoEvents, true);', 'const tabCounts = tabCountsOf(allInfoEvents, false);'],
  ['H6 zakładki bez rozciągania (PNG/rect)', SH, 'side', '.civ-side-panel .sp-tab{flex:1 1 auto;', '.civ-side-panel .sp-tab{flex:0 0 auto;'],
  ['H7 nagłówek liczy tylko bieżącą zakładkę', SH, 'side', "counterParts.push(relevantInfo.length + ' ' + pluralPl(relevantInfo.length", "counterParts.push(infoEvents.length + ' ' + pluralPl(relevantInfo.length"],
  ['R1 limit 999 → 9999', ER, 'recruit', 'const MAX_QTY = 999;', 'const MAX_QTY = 9999;'],
  ['R2 „−” zwiększa', ER, 'recruit', "(act === 'inc' ? 1 : -1)", "(act === 'inc' ? 1 : 1)"],
  ['R3 brak blokady przy 0 miast', ER, 'recruit', 'const blocked = r.capableCities <= 0;', 'const blocked = r.capableCities < 0;'],
  ['R4 brak komunikatu po zamówieniu', ER, 'recruit', 'lastMessage = res.message;', "lastMessage = '';"],
  ['R5 toggle nie zamyka', ER, 'recruit', 'if (isEmpireRecruitPanelOpen()) { closeEmpireRecruitPanel(); return; }', 'if (false) { closeEmpireRecruitPanel(); return; }'],
  ['R6 „w kolejkach” = 0', ER, 'recruit', '<b data-erp-queued>${r.queued}</b>', '<b data-erp-queued>0</b>'],
  ['I1 emporion → ikona targowiska', IM, 'icon', '"emporion": "bld-emporion",', '"emporion": "bld-targowisko",'],
  ['W1 z-index warstwy świata 250 → 299', 'src/ui/worldOverlayLayer.ts', 'icon', 'export const WORLD_OVERLAY_Z_INDEX = 250;', 'export const WORLD_OVERLAY_Z_INDEX = 299;'],
];
if (args.includes('--list')) {
  MUTS.forEach(([n, f, k], i) => console.log(`${i} ${n} (${f}, --kinds ${k})`));
  process.exit(0);
}
if (!webDir) {
  console.error('Użycie: node tools/dom-harness/mutate-repin-ui3a.mjs --web-dir <WEB3_DIR> [--tmp-dir <dir>] [--from N] [--to M] [--list]');
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
    const hArgs = ['tools/dom-harness/run-repin-ui3a.mjs', '--web-dir', webDir, '--kinds', kind];
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
  const line = (r.stdout ?? '').split('\n').find((l) => l.startsWith('run-repin-ui3a:')) ?? '';
  console.log(`${ok ? 'WYKRYTA ' : 'PRZEŻYŁA'} #${idx} ${name} (EXIT=${r.status}) ${line.replace(/ webVectorsSha256=.*/, '').replace(/^run-repin-ui3a: /, '')}`);
}
console.log(`mutate-repin-ui3a: zakres=[${from},${Math.min(to, MUTS.length)}) z ${MUTS.length} mutacji=${ran} wykrytych=${ran - missed} przeżyło=${missed}`);
process.exitCode = missed === 0 ? 0 : 1;
