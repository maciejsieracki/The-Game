#!/usr/bin/env node
/**
 * mutate-repin-ui2e.mjs — kontrola czułości harnessów partii REPIN UI-2-E (`R-RUSTPORT-REPIN-UI-2-E-Q1`): wstrzykuje po
 * jednej mutacji do portu (`src/ui/*`), uruchamia NAJPIERW `run-repin-ui2e.mjs` (Chromium, ~5 s), a gdy ten nie wykryje
 * zmiany — `run-repin-ui2e-cycles.mjs --stop-on-diff --only <moduł>` (jsdom).
 * r2 (Z1) — klasyfikacja ŚCISŁA (każdy wynik spoza 0/1 to nie „wykrycie”):
 *   WYKRYTA  ⇔ harness EXIT=1 ORAZ jego własny dowód różnicy na stdout (Chromium: linia `run-repin-ui2e: … różnic=N`,
 *            N ≥ 1; jsdom: `STOP_ON_DIFF pierwsza różnica` albo `run-repin-ui2e-cycles: … różnic=N`, N ≥ 1);
 *   PRZEŻYŁA ⇔ Chromium EXIT=0 z `różnic=0` i jsdom EXIT=0;
 *   TIMEOUT  ⇔ harness przekroczył limit czasu (`spawnSync` ETIMEDOUT / sygnał) — osobny status, nie „przeżyła”;
 *   BŁĄD     ⇔ każdy inny wynik (EXIT 2 = błąd harnessu, EXIT 1 bez dowodu różnicy, inny kod/sygnał).
 * PRZED serią: przypadek KONTROLNY bez mutacji — Chromium oraz jsdom (`--only` modułów zakresu) muszą dać EXIT 0
 * z `różnic=0`; inaczej EXIT 2 bez uruchamiania mutacji (`--list` nie uruchamia harnessów).
 * `--control-stamp-dir <dir>` — zielona kontrola zapisywana jako znacznik kluczowany sha256 TREŚCI wejść (całe `src/` portu,
 * pliki harnessów, całe `gra/src` + `gra/data` webu); kolejna część serii z identycznymi wejściami użyje znacznika zamiast
 * powtarzać kontrolę (każda zmiana bajtu wejścia = nowy klucz = kontrola od nowa). Bez opcji kontrola zawsze się wykonuje.
 * Po każdej mutacji plik wraca do oryginału (asercja bajtów). Mutacje obejmują każdą gałąź sterującą nowych hunków
 * webu `86d510c66` w 5 plikach partii (#18–#22).
 *
 * Użycie (z `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/mutate-repin-ui2e.mjs --web-dir <WEB_DIR> [--tmp-dir <dir>] [--from N] [--to M] [--list]
 * `--from/--to` (1-based, włącznie) dzielą przebieg na części mieszczące się w limicie czasu wywołania.
 * EXIT 0 ⇔ kontrola zielona i każda mutacja z zakresu WYKRYTA; 1 ⇔ ≥1 PRZEŻYŁA (bez TIMEOUT/BŁĄD);
 * 2 ⇔ kontrola nie przeszła albo ≥1 TIMEOUT/BŁĄD (wynik nierozstrzygnięty).
 */
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
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
/** Moduł `run-repin-ui2e-cycles.mjs --only` dla mutacji pliku (LH/DP nie mają własnego modułu jsdom — koszyk je ładuje). */
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
const tmpArgs = argOf('--tmp-dir') ? ['--tmp-dir', argOf('--tmp-dir')] : [];
const T_CHROMIUM = 240000;
const T_JSDOM = 540000;
/** `--timeout-chromium-ms` / `--timeout-jsdom-ms` — limity dla przebiegów Z MUTACJĄ (kontrola zawsze z domyślnymi); hak do
 * sprawdzenia, że przekroczenie limitu daje status TIMEOUT, a nie PRZEŻYŁA/WYKRYTA. */
const TM_CHROMIUM = Number(argOf('--timeout-chromium-ms') ?? T_CHROMIUM);
const TM_JSDOM = Number(argOf('--timeout-jsdom-ms') ?? T_JSDOM);
/** Liczba `różnic=N` z linii podsumowania harnessu (`prefix: … różnic=N`) albo null, gdy linii brak. */
const diffsOf = (out, prefix) => {
  const line = (out ?? '').split('\n').find((l) => l.startsWith(prefix + ':'));
  const m = line?.match(/ różnic=(\d+)/);
  return m ? Number(m[1]) : null;
};
const timedOut = (r) => r.error?.code === 'ETIMEDOUT' || (r.status === null && r.signal != null);
const tail = (r) => ((r.stderr ?? '').trim().split('\n')[0] || (r.stdout ?? '').trim().split('\n').pop() || '').slice(0, 240);
const runChromium = (t = T_CHROMIUM) => spawnSync(process.execPath, ['tools/dom-harness/run-repin-ui2e.mjs', '--web-dir', webDir, ...tmpArgs], { cwd: ROOT, encoding: 'utf8', timeout: t });
const runJsdom = (only, t = T_JSDOM) => spawnSync(process.execPath, ['tools/dom-harness/run-repin-ui2e-cycles.mjs', '--web-dir', webDir, '--stop-on-diff', '--only', only, ...tmpArgs], { cwd: ROOT, encoding: 'utf8', timeout: t });
/** Wynik jednego harnessu: 'diff' | 'clean' | 'timeout' | 'error' (+ opis). */
function classify(r, kind) {
  if (timedOut(r)) return { k: 'timeout', how: `${kind} TIMEOUT (signal=${r.signal ?? '-'})` };
  if (kind === 'chromium') {
    const d = diffsOf(r.stdout, 'run-repin-ui2e');
    if (r.status === 1 && d !== null && d > 0) return { k: 'diff', how: `chromium różnic=${d}` };
    if (r.status === 0 && d === 0) return { k: 'clean', how: 'chromium różnic=0' };
    return { k: 'error', how: `chromium EXIT=${r.status} różnic=${d} ${tail(r)}` };
  }
  const stop = (r.stdout ?? '').split('\n').find((l) => l.includes('STOP_ON_DIFF pierwsza różnica'));
  const d = diffsOf(r.stdout, 'run-repin-ui2e-cycles');
  if (r.status === 1 && (stop || (d !== null && d > 0))) return { k: 'diff', how: 'jsdom ' + (stop ? stop.replace(/^.*pierwsza różnica: /, '') : `różnic=${d}`) };
  if (r.status === 0 && d === 0) return { k: 'clean', how: 'jsdom różnic=0' };
  return { k: 'error', how: `jsdom EXIT=${r.status} różnic=${d} ${tail(r)}` };
}

const sel = MUTS.map((m, i) => [i, m]).filter(([i]) => i + 1 >= from && i + 1 <= to);
// ─── przypadek kontrolny (bez mutacji) ───────────────────────────────────────
function inputsKey() {
  const h = createHash('sha256');
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.isFile()) h.update(p.slice(dir.length) + '\0').update(readFileSync(p)).update('\0');
    }
  };
  for (const d of [join(ROOT, 'src'), join(resolve(webDir), 'gra/src'), join(resolve(webDir), 'gra/data')]) { h.update('#' + d.split('/').slice(-2).join('/')); walk(d); }
  for (const f of ['run-repin-ui2e.mjs', 'run-repin-ui2e-cycles.mjs', 'repin-ui2e-scenes.mjs', 'repin-ui2e-rust.mjs', 'build.mjs']) h.update(f).update(readFileSync(join(ROOT, 'tools/dom-harness', f)));
  return h.digest('hex');
}
{
  const stampDir = argOf('--control-stamp-dir');
  const key = inputsKey();
  const stampFile = stampDir ? join(stampDir, `mutate-repin-ui2e-control-${key}.json`) : null;
  const stamp = stampFile && existsSync(stampFile) ? JSON.parse(readFileSync(stampFile, 'utf8')) : { chromium: null, jsdom: {} };
  const need = [...new Set(sel.map(([, [, rel]]) => MOD[rel]))];
  const msgs = [];
  let ok = true;
  if (stamp.chromium !== 'clean') {
    const c1 = classify(runChromium(), 'chromium');
    msgs.push(c1.how);
    if (c1.k === 'clean') stamp.chromium = 'clean';
    else ok = false;
  } else msgs.push('chromium różnic=0 (znacznik)');
  const todo = need.filter((m) => stamp.jsdom[m] !== 'clean');
  if (ok && todo.length) {
    const c2 = classify(runJsdom(todo.join(',')), 'jsdom');
    msgs.push(`${c2.how} --only ${todo.join(',')}`);
    if (c2.k === 'clean') for (const m of todo) stamp.jsdom[m] = 'clean';
    else ok = false;
  }
  const cached = need.filter((m) => !todo.includes(m));
  if (cached.length) msgs.push(`jsdom różnic=0 (znacznik) ${cached.join(',')}`);
  console.log(`KONTROLA bez mutacji (wejścia sha256 ${key.slice(0, 16)}): [${msgs.join('] [')}]`);
  if (!ok) {
    console.error('mutate-repin-ui2e: KONTROLA NIEZALICZONA — harness bez mutacji nie daje EXIT 0/różnic=0; seria nie uruchomiona');
    process.exit(2);
  }
  if (stampFile) writeFileSync(stampFile, JSON.stringify(stamp) + '\n');
}
const counts = { WYKRYTA: 0, 'PRZEŻYŁA': 0, TIMEOUT: 0, 'BŁĄD': 0 };
/** Przerwanie (SIGTERM/SIGINT, np. limit czasu wywołania) w trakcie mutacji — przywróć plik przed wyjściem. */
let pending = null;
for (const sig of ['SIGTERM', 'SIGINT', 'SIGHUP']) {
  process.on(sig, () => {
    if (pending) writeFileSync(pending.file, pending.orig);
    console.error(`mutate-repin-ui2e: przerwano (${sig}); plik przywrócony: ${pending ? pending.file : 'brak'}`);
    process.exit(2);
  });
}
for (const [i, [name, rel, before, after]] of sel) {
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
  let status = 'BŁĄD';
  let how = '';
  try {
    const c1 = classify(runChromium(TM_CHROMIUM), 'chromium');
    if (c1.k === 'diff') {
      status = 'WYKRYTA';
      how = c1.how;
    } else if (c1.k === 'clean') {
      const c2 = classify(runJsdom(MOD[rel], TM_JSDOM), 'jsdom');
      status = { diff: 'WYKRYTA', clean: 'PRZEŻYŁA', timeout: 'TIMEOUT', error: 'BŁĄD' }[c2.k];
      how = `${c1.how}; ${c2.how}`;
    } else {
      status = c1.k === 'timeout' ? 'TIMEOUT' : 'BŁĄD';
      how = c1.how;
    }
  } finally {
    writeFileSync(file, orig);
    pending = null;
  }
  if (Buffer.compare(readFileSync(file), orig) !== 0) {
    console.error(`PRZYWRÓCENIE ${rel} nieudane`);
    process.exit(2);
  }
  counts[status]++;
  console.log(`${status.padEnd(8)} ${i + 1}. ${name} [${how}]`);
}
console.log(`mutate-repin-ui2e: zakres=${from}..${Math.min(to, MUTS.length)} mutacji=${sel.length} wykrytych=${counts.WYKRYTA} przeżyło=${counts['PRZEŻYŁA']} timeout=${counts.TIMEOUT} błąd=${counts['BŁĄD']} (łącznie zdefiniowanych ${MUTS.length})`);
process.exitCode = counts.TIMEOUT + counts['BŁĄD'] > 0 ? 2 : counts['PRZEŻYŁA'] > 0 ? 1 : 0;
