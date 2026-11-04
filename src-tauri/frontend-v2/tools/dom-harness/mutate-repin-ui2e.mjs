#!/usr/bin/env node
/**
 * mutate-repin-ui2e.mjs — kontrola czułości harnessów partii REPIN UI-2-E (`R-RUSTPORT-REPIN-UI-2-E-Q1`): wstrzykuje po
 * jednej mutacji do portu (`src/ui/*`), uruchamia NAJPIERW `run-repin-ui2e.mjs` (Chromium, ~5 s), a gdy ten nie wykryje
 * zmiany — `run-repin-ui2e-cycles.mjs --stop-on-diff --only <moduł>` (jsdom); mutacja WYKRYTA ⇔ któryś harness EXIT=1.
 * Po każdej mutacji plik wraca do oryginału (asercja bajtów). Mutacje obejmują każdą gałąź sterującą nowych hunków
 * webu `86d510c66` w 5 plikach partii (#18–#22).
 *
 * Użycie (z `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/mutate-repin-ui2e.mjs --web-dir <WEB_DIR> [--tmp-dir <dir>] [--from N] [--to M] [--list]
 * `--from/--to` (1-based, włącznie) dzielą przebieg na części mieszczące się w limicie czasu wywołania.
 * EXIT 0 ⇔ każda mutacja z zakresu wykryta; 1 ⇔ ≥1 przeżyła; 2 ⇔ błąd.
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
const LH = 'src/ui/diploListHud.ts';
const DP = 'src/ui/diplomacyPanel.ts';
const NM = 'src/ui/diplomacyNegotiationModal.ts';
const AU = 'src/ui/diplomacyAudience.ts';
const TB = 'src/ui/diplomacyTradeBasket.ts';
const MOD = { [LH]: 'diplomacyTradeBasket.ts', [DP]: 'diplomacyTradeBasket.ts', [NM]: 'diplomacyNegotiationModal.ts', [AU]: 'diplomacyAudience.ts', [TB]: 'diplomacyTradeBasket.ts' };
/** [nazwa, plik, przed, po] — „przed” musi wystąpić w pliku dokładnie raz. */
const MUTS = [
  // diplomacyPanel.ts (#21) — `agresorBadgeHtml` + użycie w wierszu
  ['DP1 NaN/Inf bez znacznika', DP, "if (pozostaleTury === undefined || !Number.isFinite(pozostaleTury)) return '';", "if (pozostaleTury === undefined) return '';"],
  ['DP2 próg n < 1', DP, "if (n < 1) return '';", "if (n < 0) return '';"],
  ['DP3 trunc → round', DP, 'const n = Math.trunc(pozostaleTury);', 'const n = Math.round(pozostaleTury);'],
  ['DP4 znacznik w wierszu', DP, '        agresorBadgeHtml(rel.agresorPozostaleTury) +\n', ''],
  ['DP5 tooltip', DP, "' tur';\n  return '<span class=\"cd-agresor\"", "' tury';\n  return '<span class=\"cd-agresor\""],
  ['DP6 aria-label', DP, "esc('Agresor, pozostało tur: ' + n)", "esc('Agresor')"],
  // diploListHud.ts (#18) — wiersze relacji
  ['LH1 pusta lista = „brak”', LH, 'if (total === 0) {', 'if (total < 0) {'],
  ['LH2 próg „+N” (> na >=)', LH, 'const more = total > DIPLO_LIST_RELATION_SHOW_MAX ?', 'const more = total >= DIPLO_LIST_RELATION_SHOW_MAX ?'],
  ['LH3 tooltip pełnej listy', LH, "line.title = relRow.label + ': ' + relRow.names.join(', ');", ''],
  ['LH4 SHOW_MAX 3 → 4', LH, 'export const DIPLO_LIST_RELATION_SHOW_MAX = 3;', 'export const DIPLO_LIST_RELATION_SHOW_MAX = 4;'],
  ['LH5 warunek relationRows (tylko wojny)', LH, 'relationRows: (rel.warPartnerNames !== undefined || rel.alliancePartnerNames !== undefined || rel.dealPartnerNames !== undefined)', 'relationRows: (rel.warPartnerNames !== undefined)'],
  ['LH6 render wierszy wyłączony', LH, 'if (e.relationRows?.length) {', 'if (false) {'],
  ['LH7 Handel ← sojusze', LH, "{ label: 'Handel', names: rel.dealPartnerNames ?? [] },", "{ label: 'Handel', names: rel.alliancePartnerNames ?? [] },"],
  ['LH8 styl dl-rel-row', LH, '.civ-diplo-list-hud .dl-rel-row{overflow-wrap:anywhere;}', '.civ-diplo-list-hud .dl-rel-row{}'],
  // diplomacyNegotiationModal.ts (#20)
  ['NM1 akcja 10 → handel/brak', NM, "  if (payload.actionId === '10') return payload.rodzaj === 'rozejm' ? 'rozejm' : 'pokoj';\n", ''],
  ['NM2 rozejm → pokój', NM, "payload.rodzaj === 'rozejm' ? 'rozejm' : 'pokoj'", "payload.rodzaj === 'rozejm' ? 'pokoj' : 'pokoj'"],
  // diplomacyAudience.ts (#19) — bonusy cywilizacji usunięte z kart
  ['AU1 bonus na karcie rywala', AU, "      personalityTagsHtml(st.personalityTags) +\n    '</div>'", "      personalityTagsHtml(st.personalityTags) +\n      '<ul class=\"da-bonus\"></ul>' +\n    '</div>'"],
  ['AU2 bonus na karcie gracza', AU, "        goodsCategoriesHtml(st.playerGoodsCats, 'player') +\n      '</div>' +\n    '</div>'", "        goodsCategoriesHtml(st.playerGoodsCats, 'player') +\n      '</div>' +\n      '<ul class=\"da-bonus\"></ul>' +\n    '</div>'"],
  // diplomacyTradeBasket.ts (#22)
  ['TB1 formatCompactQty → String', TB, 'return formatCompactNumber(Math.trunc(n));', 'return String(Math.trunc(n));'],
  ['TB2 rulesCtx bez basketActionId', TB, '    basketActionId: ctx.basketActionId,\n  };', '  };'],
  ['TB3 bramka miasta zawsze true', TB, '(staticCatalog().constants.miastoAkcjeDozwolone ?? []).includes(actionId)', 'true'],
  ['TB4 render pozycji miasto', TB, "if (item.typ !== 'miasto') return renderBasketItemValueBaseHtml(item, fmtCtx);", 'return renderBasketItemValueBaseHtml(item, fmtCtx);'],
  ['TB5 przycisk „Bezterminowo”', TB, '+ (thirdButton\n', '+ (false && thirdButton\n'],
  ['TB6 prefill peaceKind', TB, "peaceKind: initial?.peaceKind === 'rozejm' ? 'rozejm' : 'pokoj',", "peaceKind: 'pokoj',"],
  ['TB7 domyślne 10 tur rozejmu', TB, 'initial?.truceTurns === 5 || initial?.truceTurns === 15 ? initial.truceTurns : 10,', 'initial?.truceTurns === 5 || initial?.truceTurns === 15 ? initial.truceTurns : 5,'],
  ['TB8 chipy 5/10/15', TB, '[5, 10, 15].map(t =>\n          \'<button type="button" class="cdb-chip cdb-chip-truceturns', '[5, 10].map(t =>\n          \'<button type="button" class="cdb-chip cdb-chip-truceturns'],
  ['TB9 odczyt tur rozejmu', TB, 'if (t === 5 || t === 10 || t === 15) state.truceTurns = t;', 'if (t > 0) state.truceTurns = t;'],
  ['TB10 payload.rodzaj', TB, "        payload.rodzaj = 'rozejm';\n", ''],
  ['TB11 payload.turns rozejmu', TB, '        payload.turns = state.truceTurns;\n', ''],
  // Uwaga: `? 'pokoj'` byłoby mutacją RÓWNOWAŻNĄ (web `diplomacy-war-gates.ts:11`: 'pokoj' i 'rozejm' w `PEACE_CURRENCY_ACTION_IDS`,
  // `propActionId` czytany tylko przez tę bramkę) — mutujemy na id spoza zbioru.
  ['TB12 walidacja: rozejm → handel', TB, "actionId === '10' && treatyState?.peaceKind === 'rozejm'\n    ? 'rozejm'", "actionId === '10' && treatyState?.peaceKind === 'rozejm'\n    ? 'handel'"],
  ['TB13 maxTurns (traktat) 30 → 20', TB, "const needsTurns = hasResourceAccess || (hasQtyRes && resourceTradeMode === 'per_turn');\n    const maxTurns = hasResourceAccess ? 20 : 30;", "const needsTurns = hasResourceAccess || (hasQtyRes && resourceTradeMode === 'per_turn');\n    const maxTurns = hasResourceAccess ? 20 : 20;"],
  ['TB14 maxTurns (handel) 30 → 20', TB, "const needsTurns = mode === 'trade' && (hasResourceAccess || (hasQtyRes && resourceTradeMode === 'per_turn'));\n  const maxTurns = hasResourceAccess ? 20 : 30;", "const needsTurns = mode === 'trade' && (hasResourceAccess || (hasQtyRes && resourceTradeMode === 'per_turn'));\n  const maxTurns = hasResourceAccess ? 20 : 20;"],
  ['TB15 chipy czasu 30', TB, '(maxTurns > 20 ? [5, 10, 15, 20, 30] : [5, 10, 15, 20])', '[5, 10, 15, 20]'],
  ['TB16 cykl bez selektora trybu', TB, '&& (hasQtyRes || showResModeSelector);', '&& hasQtyRes;'],
  ['TB17 etykieta max 30', TB, "'Co ile tur trwa wymiana (tur, max 30)'", "'Co ile tur trwa wymiana (tur, max 20)'"],
  ['TB18 miasto po obu stronach', TB, "return side === 'give'\n          && mode !== 'gift'", "return mode !== 'gift'"],
  ['TB19 miasto przy pustej liście', TB, '&& (ctx.miastoOptions?.length ?? 0) > 0;', ';'],
  ['TB20 formularz: miasto z koszyka nie znika', TB, "existingItems.filter(it => it.typ === 'miasto' && it.id !== editMiastoId)", 'existingItems.filter(it => false)'],
  ['TB21 picker przy rozejmie', TB, "  if (!diplomacyMiastoAkcjaDozwolona(ctx.basketActionId ?? proposalActionIdFromUi(actionId, 'treaty'))) return '';\n", ''],
  ['TB22 picker: miasto z koszyka nie znika', TB, 'const opts = all.filter(m => !inBasket.has(m.id));', 'const opts = all;'],
  ['TB23 odczyt: wycena < 0 / NaN', TB, 'if (!opt || !(opt.pn >= 0)) return null;', 'if (!opt) return null;'],
  ['TB24 pole formularza miasto', TB, "surowiec_ilosc: 'resqty', miasto: 'miasto',", "surowiec_ilosc: 'resqty',"],
  ['TB25 picker wyłączony', TB, "const cityPickHtml = blocked ? '' : miastoPickerHtml(ctx, action.id, giveItems);", "const cityPickHtml = '';"],
  ['TB26 ctx.basketActionId przy otwarciu', TB, '  ctx = { ...ctx, basketActionId: proposalActionIdFromUi(action.id, mode) };\n', ''],
  ['TB27 basketActionId rozejmu w refresh', TB, "    if (action.id === '10') ctx = { ...ctx, basketActionId: treatyState.peaceKind === 'rozejm' ? 'rozejm' : 'pokoj' };\n", ''],
  ['TB28 klasa selected „Bezterminowo”', TB, "      indefiniteBtn.classList.toggle('selected', selected);\n", ''],
  ['TB29 tekst harmonogramu bezterminowo', TB, "        ? 'Wymiana co turę bezterminowo'", "        ? 'Wymiana co turę przez ' + dealTurns + ' tur'"],
  ['TB30 picker: wycena pozycji', TB, "{ typ: 'miasto', id, ilosc: 1, cityPn: opt.pn, cityLabel: opt.label },\n          'give',", "{ typ: 'miasto', id, ilosc: 1, cityPn: 0, cityLabel: opt.label },\n          'give',"],
  ['TB31 wybór chipa miasta', TB, "        selectChipInGroup(btn, 'cdb-chip-miasto', '.cdb-miasto');\n", ''],
  ['TB32 chip tur: klamra 30', TB, 'dealTurns = Math.max(1, Math.min(30, turns));\n        exchangeDurationTurns = dealTurns;', 'dealTurns = Math.max(1, Math.min(20, turns));\n        exchangeDurationTurns = dealTurns;'],
  ['TB33 krok tur zeruje „Bezterminowo”', TB, '          exchangeDurationTurns = next;\n', ''],
  ['TB34 klik „Bezterminowo”', TB, '      exchangeDurationTurns = null;\n      refresh();', '      refresh();'],
  ['TB35 pole tur nadpisuje exchange', TB, '      exchangeDurationTurns = inp ? Math.max(1, Math.min(30, parseInt(inp.value, 10) || 15)) : undefined;\n', ''],
  ['TB36 payload bezterminowo = null', TB, 'payload.exchangeDurationTurns = exchangeDurationTurns === null ? null : dealTurns;', 'payload.exchangeDurationTurns = dealTurns;'],
  ['TB37 payload exchange tylko per_turn', TB, "        && resourceTradeMode === 'per_turn'\n        && basketHasQuantityResource(giveItems, receiveItems)\n      ) {", "        && basketHasQuantityResource(giveItems, receiveItems)\n      ) {"],
  ['TB38 klik pokój/rozejm', TB, "if (inp) inp.value = btn.getAttribute('data-kind') === 'rozejm' ? 'rozejm' : 'pokoj';", "if (inp) inp.value = 'pokoj';"],
  ['TB39 klik tur rozejmu', TB, 'if (inp) inp.value = String(t === 5 || t === 15 ? t : 10);', 'if (inp) inp.value = String(10);'],
  ['TB40 etykieta typu miasto', TB, "miasto: 'Miasto (tylko pokój)',", "miasto: 'Miasto',"],
  ['TB41 klamra tur prefill 30', TB, 'let dealTurns = initial?.turns != null ? Math.max(1, Math.min(30, initial.turns)) : 15;', 'let dealTurns = initial?.turns != null ? Math.max(1, Math.min(20, initial.turns)) : 15;'],
  ['TB42 klamra tur z DOM 30', TB, 'if (inp) dealTurns = Math.max(1, Math.min(30, parseInt(inp.value, 10) || 15));', 'if (inp) dealTurns = Math.max(1, Math.min(20, parseInt(inp.value, 10) || 15));'],
  ['TB43 opis rozejmu', TB, "'<p class=\"cdb-sub\">Rozejm: po wygaśnięciu", "'<p class=\"cdb-sub\">Rozejm — po wygaśnięciu"],
  ['TB44 odczyt rodzaju z DOM', TB, "if (k === 'pokoj' || k === 'rozejm') state.peaceKind = k;", "if (k === 'rozejm') state.peaceKind = k;"],
  ['TB45 opcje czasu do ustawień', TB, '      durationMaxTurns,\n      durationOptions.allowIndefinite,', '      20,\n      false,'],
  ['TB46 aria-pressed „Bezterminowo”', TB, "      indefiniteBtn.setAttribute('aria-pressed', String(selected));\n", ''],
  ['TB47 exchange z chipa tur', TB, '        exchangeDurationTurns = dealTurns;\n        const inp = (durationRoot ?? box)', '        const inp = (durationRoot ?? box)'],
  ['TB48 traktat bez rozejmu (formularz)', TB, '          + (isTruce\n', '          + (false\n'],
  ['TB49 miasto w trybie daru', TB, "&& mode !== 'gift'\n          && diplomacyMiastoAkcjaDozwolona", "&& diplomacyMiastoAkcjaDozwolona"],
];

if (args.includes('--list')) {
  let bad = 0;
  MUTS.forEach(([n, f, b], i) => {
    const c = readFileSync(join(ROOT, f), 'utf8').split(b).length - 1;
    if (c !== 1) bad++;
    console.log(`${i + 1}. ${n} (${f}) wystąpień=${c}`);
  });
  process.exit(bad === 0 ? 0 : 2);
}
if (!webDir) {
  console.error('Użycie: node tools/dom-harness/mutate-repin-ui2e.mjs --web-dir <WEB_DIR> [--tmp-dir <dir>] [--from N] [--to M]');
  process.exit(2);
}
const from = Number(argOf('--from') ?? 1);
const to = Number(argOf('--to') ?? MUTS.length);
let missed = 0;
let n = 0;
/** Przerwanie (SIGTERM/SIGINT, np. limit czasu wywołania) w trakcie mutacji — przywróć plik przed wyjściem. */
let pending = null;
for (const sig of ['SIGTERM', 'SIGINT', 'SIGHUP']) {
  process.on(sig, () => {
    if (pending) writeFileSync(pending.file, pending.orig);
    console.error(`mutate-repin-ui2e: przerwano (${sig}); plik przywrócony: ${pending ? pending.file : 'brak'}`);
    process.exit(2);
  });
}
for (const [i, [name, rel, before, after]] of MUTS.entries()) {
  if (i + 1 < from || i + 1 > to) continue;
  n++;
  const file = join(ROOT, rel);
  const orig = readFileSync(file);
  const txt = orig.toString('utf8');
  const count = txt.split(before).length - 1;
  if (count !== 1) {
    console.error(`MUTACJA ${name}: wzorzec występuje ${count}× w ${rel} (wymagane 1)`);
    process.exit(2);
  }
  pending = { file, orig };
  writeFileSync(file, txt.replace(before, after));
  let how = '';
  let ok = false;
  try {
    const tmpArgs = argOf('--tmp-dir') ? ['--tmp-dir', argOf('--tmp-dir')] : [];
    const r1 = spawnSync(process.execPath, ['tools/dom-harness/run-repin-ui2e.mjs', '--web-dir', webDir, ...tmpArgs], { cwd: ROOT, encoding: 'utf8', timeout: 240000 });
    if (r1.status === 1) {
      ok = true;
      how = 'chromium';
    } else if (r1.status === 0) {
      const r2 = spawnSync(process.execPath, ['tools/dom-harness/run-repin-ui2e-cycles.mjs', '--web-dir', webDir, '--stop-on-diff', '--only', MOD[rel]], { cwd: ROOT, encoding: 'utf8', timeout: 540000 });
      ok = r2.status === 1;
      how = `jsdom EXIT=${r2.status}` + (ok ? ' ' + ((r2.stdout ?? '').split('\n').find((l) => l.includes('STOP_ON_DIFF')) ?? '').replace(/^.*pierwsza różnica: /, '') : '');
    } else {
      how = `chromium EXIT=${r1.status} ${(r1.stderr ?? '').slice(0, 200)}`;
    }
  } finally {
    writeFileSync(file, orig);
    pending = null;
  }
  if (Buffer.compare(readFileSync(file), orig) !== 0) {
    console.error(`PRZYWRÓCENIE ${rel} nieudane`);
    process.exit(2);
  }
  if (!ok) missed++;
  console.log(`${ok ? 'WYKRYTA ' : 'PRZEŻYŁA'} ${i + 1}. ${name} [${how}]`);
}
console.log(`mutate-repin-ui2e: zakres=${from}..${Math.min(to, MUTS.length)} mutacji=${n} wykrytych=${n - missed} przeżyło=${missed} (łącznie zdefiniowanych ${MUTS.length})`);
process.exitCode = missed === 0 ? 0 : 1;
