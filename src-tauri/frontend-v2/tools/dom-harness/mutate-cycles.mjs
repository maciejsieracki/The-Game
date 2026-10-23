#!/usr/bin/env node
/**
 * mutate-cycles.mjs — kontrola czułości harnessu P5.6 (`run-cycles.mjs`): wstrzykuje po jednej mutacji do modułu v2,
 * uruchamia harness dla tego modułu (`--only <moduł> --stop-on-diff`) i oczekuje EXIT=1; przywraca plik bajtowo (asercja).
 *
 * Użycie: node tools/dom-harness/mutate-cycles.mjs --pin-dir <PIN_DIR> [--only C1,C2]   → EXIT 0 ⇔ każda mutacja wykryta.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
const pinDir = args[args.indexOf('--pin-dir') + 1];
if (!pinDir || args.indexOf('--pin-dir') < 0) {
  console.error('Użycie: node tools/dom-harness/mutate-cycles.mjs --pin-dir <PIN_DIR>');
  process.exit(2);
}
const onlyIds = args.includes('--only') ? args[args.indexOf('--only') + 1].split(',') : null;
const ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));

/** [nazwa, plik, przed, po, moduł harnessu] — „przed” musi wystąpić w pliku dokładnie raz. */
const H = 'hexContextTooltip.ts';
const B = 'preBattle.ts';
const N = 'diplomacyNegotiationModal.ts';
const T = 'diplomacyTradeBasket.ts';
const A = 'diplomacyAudience.ts';
const MUTS = [
  // hexContextTooltip.ts — każdy odczyt pola DTO + reguły GRANICZNE + kopia stałych palety.
  ['H1 hex: etykiety zasobów z DTO bez pierwszej', 'src/ui/hexContextTooltip.ts', `const resources = view.resourceLabels;`, `const resources = view.resourceLabels.slice(1);`, H],
  ['H2 hex: postawione ulepszenia z DTO bez pierwszego', 'src/ui/hexContextTooltip.ts', `const built = view.built;`, `const built = view.built.slice(1);`, H],
  ['H3 hex: możliwe ulepszenia z DTO bez pierwszego', 'src/ui/hexContextTooltip.ts', `view.possible.map(formatPossibleImprovementLine)`, `view.possible.slice(1).map(formatPossibleImprovementLine)`, H],
  ['H4 hex: suma plonów miasta z bazy zamiast `yieldFull`', 'src/ui/hexContextTooltip.ts', `formatCityYieldLine(cityYieldOnly(view.yieldFull), '0')`, `formatCityYieldLine(cityYieldOnly(view.yieldParts[0]?.delta ?? view.yieldFull), '0')`, H],
  ['H5 hex: rozbicie plonów tylko z terenu bazowego', 'src/ui/hexContextTooltip.ts', `const parts = view.yieldParts;`, `const parts = view.yieldParts.slice(0, 1);`, H],
  ['H6 hex: magazyn ulepszenia z DTO ignorowany (opis)', 'src/ui/hexContextTooltip.ts', `  const unlocks = imp.unlockLabels;`, `  const unlocks = imp.unlockLabels.slice(1);`, H],
  ['H7 hex: nazwa miasta bez `display_name` z Rust', 'src/ui/hexContextTooltip.ts', `const label = input.cityDisplayLabel ?? cityName;`, `const label = cityName;`, H],
  ['H8 hex: Moc pola z DTO zniekształcona', 'src/ui/hexContextTooltip.ts', `const power = u.fieldPower;`, `const power = { ...u.fieldPower, total: u.fieldPower.attack };`, H],
  ['H9 hex: odznaki z DTO ignorowane', 'src/ui/hexContextTooltip.ts', `    badges: u.badges,`, `    badges: { ...u.badges, armorPath: 0 },`, H],
  ['H10 hex: klucz etykiety terenu stały', 'src/ui/hexContextTooltip.ts', `TEREN_LABEL[view.terrainBase as TerenBazowy]`, `TEREN_LABEL['laka' as TerenBazowy]`, H],
  ['H11 hex: magazyn z ulepszenia pominięty w podsumowaniu', 'src/ui/hexContextTooltip.ts', `    lines.push(\`\${esc(imp.name)}: \${mag} · automatycznie\`);`, `    lines.push(\`\${esc(imp.key)}: \${mag} · automatycznie\`);`, H],
  ['H12 hex GRANICZNY: Podatek bez `pieniadz` w bonusie', 'src/ui/hexContextTooltip.ts', `handel: (b.handel ?? 0) + (b.pieniadz ?? 0),`, `handel: (b.handel ?? 0),`, H],
  ['H13 kopia: unitVitalsPalette — kolor paska HP', 'src/ui/unitVitalsPalette.ts', `export const VITALS_HP_DARK_CSS = '#1a6020';`, `export const VITALS_HP_DARK_CSS = '#1a6021';`, H],
  // C5 — kopie bajtowe.
  ['S1 kopia: sidePanelHud — nagłówek wydarzeń', 'src/ui/sidePanelHud.ts', `: 'Wydarzenia') + '</div>';`, `: 'Zdarzenia') + '</div>';`, 'sidePanelHud.ts'],
  ['S2 kopia: sidePanelEventFilter — filtr „Inne cyw.”', 'src/ui/sidePanelEventFilter.ts', `return events.filter(ev => ev.origin !== 'other-civs');`, `return events.filter(ev => ev.origin === 'other-civs');`, 'sidePanelEventFilter.ts'],
  // preBattle.ts
  ['B1 preBattle: chipy bonusów z DTO bez pierwszego', 'src/ui/preBattle.ts', `const chipTexts = side.bonusChips;`, `const chipTexts = side.bonusChips.slice(1);`, B],
  ['B2 preBattle: ikona jednostki konnej (PB_SVG z kopii)', 'src/ui/preBattle.ts', `if (kind === 'mounted') return PB_SVG.unitMounted;`, `if (kind === 'mounted') return PB_SVG.unitMelee;`, B],
  ['B3 preBattle: most ukrycia rosteru — zła wartość', 'src/ui/preBattle.ts', `  setArmyStackHudSuppressed(true);`, `  setArmyStackHudSuppressed(false);`, B],
  ['B4 preBattle GRANICZNY: próg werdyktu domyślnego', 'src/ui/preBattle.ts', `if (atkPct >= 65) return 'Przewaga atakującego';`, `if (atkPct >= 66) return 'Przewaga atakującego';`, B],
  ['B5 kopia: preBattle — przycisk Auto', 'src/ui/preBattle.ts', `PB_SVG.auto + 'Auto</button>'`, `PB_SVG.auto + 'Automat</button>'`, B],
  // diplomacyNegotiationModal.ts
  ['N1 modal: etykieta traktatu handlowego z katalogu ignorowana', 'src/ui/diplomacyNegotiationModal.ts', `const TRAKTAT_HANDLOWY_LABEL = staticCatalog().labels.traktatHandlowyLabel;`, `const TRAKTAT_HANDLOWY_LABEL = 'Traktat';`, N],
  ['N2 modal: mapowanie id propozycji', 'src/ui/diplomacyNegotiationModal.ts', `'2': 'nap', '4': 'granice'`, `'2': 'napx', '4': 'granice'`, N],
  ['N3 kopia: modal — przycisk', 'src/ui/diplomacyNegotiationModal.ts', `cdn-submit">Zaproponuj</button>'`, `cdn-submit">Proponuj</button>'`, N],
  // diplomacyTradeBasket.ts — odczyty wyników zapytań / katalogu.
  ['T1 koszyk: wycena zawsze jako strona „give”', 'src/ui/diplomacyTradeBasket.ts', `return diplomacyQueries().basketSumPn({ items, side, resourceTradeMode, dealTurns, ctx: rulesCtx(ctx) });`, `return diplomacyQueries().basketSumPn({ items, side: 'give', resourceTradeMode, dealTurns, ctx: rulesCtx(ctx) });`, T],
  ['T2 koszyk: kontekst zapytań bez Relacji', 'src/ui/diplomacyTradeBasket.ts', `    relacjaTotal: ctx.relacjaTotal,`, `    relacjaTotal: 100,`, T],
  ['T3 koszyk: fair min podsumowania = fair min panelu', 'src/ui/diplomacyTradeBasket.ts', `const fairMin = s.summaryFairMinPn;`, `const fairMin = s.fairMinPn;`, T],
  ['T4 koszyk: zaufanie z nadwyżki bez limitu', 'src/ui/diplomacyTradeBasket.ts', `deltaZaufanie: s.trust.delta,`, `deltaZaufanie: s.trust.deltaRaw,`, T],
  ['T5 koszyk: dobra wola — zamienione pola', 'src/ui/diplomacyTradeBasket.ts', `{ active: true, zaufaniePerTura: s.dobraWola.perTurn, tur: s.dobraWola.turns }`, `{ active: true, zaufaniePerTura: s.dobraWola.turns, tur: s.dobraWola.perTurn }`, T],
  ['T6 koszyk: skrót „Oddajemy” z drugiej strony', 'src/ui/diplomacyTradeBasket.ts', `if (giveItems.length > 0) oneShot.push('Oddajemy: ' + s.brief.give);`, `if (giveItems.length > 0) oneShot.push('Oddajemy: ' + s.brief.receive);`, T],
  ['T7 koszyk: zaufanie z daru bez limitu', 'src/ui/diplomacyTradeBasket.ts', `deltaZaufanie: s.giftTrust?.delta ?? 0,`, `deltaZaufanie: s.giftTrust?.deltaRaw ?? 0,`, T],
  ['T8 koszyk: limit Zaufania/turę z innego pola', 'src/ui/diplomacyTradeBasket.ts', `const maxTrust = s.trust.cap;`, `const maxTrust = s.trust.gained;`, T],
  ['T9 koszyk: panel traktatu pominięty', 'src/ui/diplomacyTradeBasket.ts', `    if (sides.treatyPreview) {`, `    if (sides.treatyPreview && false) {`, T],
  ['T10 koszyk: panel koszyka traktatu — inna etykieta', 'src/ui/diplomacyTradeBasket.ts', `renderPnBalancePanelFromBasket(sides.basketPreview, action.label)`, `renderPnBalancePanelFromBasket(sides.basketPreview, 'Traktat')`, T],
  ['T11 koszyk: walidacja stron zawsze OK', 'src/ui/diplomacyTradeBasket.ts', `  diplomacyQueries().validateTradeBasketSides(mode, give, receive);`, `  ({ valid: true });`, T],
  ['T12 koszyk: bramka waluty w wojnie wyłączona', 'src/ui/diplomacyTradeBasket.ts', `  diplomacyQueries().currencyForbiddenDuringWar(proposalActionId, payload, atWar);`, `  false;`, T],
  ['T13 koszyk: wycofany dostęp nie usuwany', 'src/ui/diplomacyTradeBasket.ts', `  diplomacyQueries().stripWithdrawnResourceAccessItems(items);`, `  [...items];`, T],
  ['T14 koszyk: krok surowca zawsze 1', 'src/ui/diplomacyTradeBasket.ts', `=> diplomacyQueries().handelSurowiecKrok(surowiecKey);`, `=> 1;`, T],
  ['T15 koszyk: normalizacja ilości bez reguły kroku', 'src/ui/diplomacyTradeBasket.ts', `  diplomacyQueries().normalizeSurowiecIlosc(surowiecKey, rawQty, max);`, `  Math.floor(rawQty);`, T],
  ['T16 koszyk: szybka umowa bez naszych surowców', 'src/ui/diplomacyTradeBasket.ts', `    ourQuantityResourceOptions: ctx.giveQuantityResourceOptions ?? defaultQuantityResourceOptions(),`, `    ourQuantityResourceOptions: [],`, T],
  ['T17 koszyk: wyrównanie z podwojonym PW', 'src/ui/diplomacyTradeBasket.ts', `        giveItems,\n        receivePn,\n`, `        giveItems,\n        receivePn: receivePn * 2,\n`, T],
  ['T18 koszyk: nazwy surowców bez katalogu', 'src/ui/diplomacyTradeBasket.ts', `return staticCatalog().labels.resourceKeyLabels[k] ??`, `return undefined ??`, T],
  ['T19 koszyk: stała żywność/PW +1', 'src/ui/diplomacyTradeBasket.ts', `=> staticCatalog().constants.zywnoscNaPn;`, `=> staticCatalog().constants.zywnoscNaPn + 1;`, T],
  ['T20 koszyk: próg daru z katalogu +1', 'src/ui/diplomacyTradeBasket.ts', `=> staticCatalog().constants.progDarRelacja;`, `=> staticCatalog().constants.progDarRelacja + 1;`, T],
  // T21 (`handelZaufaniePerTura`) — gałąź `diplomacyTradeBasket.ts:1961-1963` pinu nieosiągalna (pozycje dostępu usuwane przy
  // otwarciu `:2371-2372`, formularz ich nie dodaje `:1449`) — bez mutacji, NIE_ZMIERZONO w `P5-6-PORT-CYKLE.md` §6.
  ['T22 koszyk: zastępcza lista surowców bez pierwszego', 'src/ui/diplomacyTradeBasket.ts', `return staticCatalog().constants.handelSurowceKeys.map(id => ({`, `return staticCatalog().constants.handelSurowceKeys.slice(1).map(id => ({`, T],
  ['T23 koszyk: zastępcza lista technologii bez pierwszej', 'src/ui/diplomacyTradeBasket.ts', `.technologie ?? [])`, `.technologie?.slice(1) ?? [])`, T],
  ['T24 koszyk: etykieta pozycji = id', 'src/ui/diplomacyTradeBasket.ts', `return { ...item, label: resourceDisplayLabel(item.id) };`, `return { ...item, label: item.id };`, T],
  ['T25 koszyk GRANICZNY: zakres czasu paktu', 'src/ui/diplomacyTradeBasket.ts', `if (state.turns < 10 || state.turns > 20) {`, `if (state.turns < 11 || state.turns > 20) {`, T],
  ['T26 kopia: koszyk — przycisk dodawania', 'src/ui/diplomacyTradeBasket.ts', `: '+ Dodaj propozycję';`, `: '+ Dodaj';`, T],
  // diplomacyAudience.ts
  ['A1 audiencja: etykieta nastawienia z DTO ignorowana', 'src/ui/diplomacyAudience.ts', `const label = st.nastawienie.label;\n  const hostile`, `const label = 'Neutralny';\n  const hostile`, A],
  ['A2 audiencja: podpowiedź nastawienia z DTO ignorowana', 'src/ui/diplomacyAudience.ts', `esc(st.nastawienie.hint)`, `esc('')`, A],
  ['A3 audiencja: wyniki nastawienia bez podłogi wojny', 'src/ui/diplomacyAudience.ts', `const relScores = st.nastawienie.scores;\n  return (\n    '<div class="da-card them">'`, `const relScores = { zaufanie: st.zaufanie, respekt: st.respekt };\n  return (\n    '<div class="da-card them">'`, A],
  ['A4 audiencja: pasmo Wiarygodności (pasek) z DTO ignorowane', 'src/ui/diplomacyAudience.ts', `  const band = view?.band ?? '';\n  const tipBody = view?.tooltip ?? '';\n  const tone`, `  const band = '';\n  const tipBody = view?.tooltip ?? '';\n  const tone`, A],
  ['A5 audiencja: tooltip Wiarygodności (pasek) z DTO ignorowany', 'src/ui/diplomacyAudience.ts', `  // P5.6: pasmo (\`wiarygodnoscLabelPl(w)\`) i tooltip (z rozbiciem / bez) z Rust — \`WiarygodnoscViewDto\`.\n  const band = view?.band ?? '';\n  const tipBody = view?.tooltip ?? '';`, `  const band = view?.band ?? '';\n  const tipBody = '';`, A],
  ['A6 audiencja: panel PW stołu z DTO ignorowany', 'src/ui/diplomacyAudience.ts', `return renderPnBalancePanelHtml(st.negotiationTablePanel);`, `return renderPnBalancePanelHtml(null);`, A],
  ['A7 audiencja: liczba wierszy do decyzji +1', 'src/ui/diplomacyAudience.ts', `const actionableCount = st.actionableNegotiationCount;`, `const actionableCount = st.actionableNegotiationCount + 1;`, A],
  ['A8 audiencja: strony oferty z DTO ignorowane', 'src/ui/diplomacyAudience.ts', `    r.dealSides ?? null,\n    focus,`, `    null,\n    focus,`, A],
  ['A9 audiencja: PW traktatu „My” z pola „Oni”', 'src/ui/diplomacyAudience.ts', `      ? r.treatyPwWe\n`, `      ? r.treatyPwThey\n`, A],
  ['A10 audiencja: wycofany dostęp z DTO ignorowany', 'src/ui/diplomacyAudience.ts', `r.dealPayload != null && r.resourceAccessWithdrawn === true;`, `false;`, A],
  ['A11 audiencja: wiele własnych wpisów — katalog ignorowany', 'src/ui/diplomacyAudience.ts', `return staticCatalog().constants.audienceMultiOwnActionIds.includes(actionId);`, `return false;`, A],
  ['A12 audiencja: notatka „na stole” (kopia formatera)', 'src/ui/diplomacyAudience.ts', `if (onTable) return 'na stole — Przyjmij w PN';`, `if (onTable) return 'na stole';`, A],
  ['A13 audiencja: notatka blokady paska (kopia formatera)', 'src/ui/diplomacyAudience.ts', `  if (!action || action.enabled) return '';\n  return action.lockNote || action.tooltip || 'Niedostępne';`, `  if (!action || action.enabled) return '';\n  return action.tooltip || action.lockNote || 'Niedostępne';`, A],
  ['A14 audiencja: etykieta traktatu handlowego z katalogu ignorowana', 'src/ui/diplomacyAudience.ts', `const TRAKTAT_HANDLOWY_LABEL = staticCatalog().labels.traktatHandlowyLabel;`, `const TRAKTAT_HANDLOWY_LABEL = 'Traktat';`, A],
  ['A15 audiencja: powód wycofanego dostępu z katalogu ignorowany', 'src/ui/diplomacyAudience.ts', `const RESOURCE_ACCESS_TRADE_WITHDRAWN_REASON = staticCatalog().labels.resourceAccessTradeWithdrawnReason;`, `const RESOURCE_ACCESS_TRADE_WITHDRAWN_REASON = 'Wycofane';`, A],
  ['A16 audiencja: markup badge Wiarygodności', 'src/ui/diplomacyAudience.ts', `+ 'W ' + escWiarygodnoscHtml(signed)`, `+ 'W' + escWiarygodnoscHtml(signed)`, A],
  ['A17 audiencja GRANICZNY: suma Relacji zastępcza', 'src/ui/diplomacyAudience.ts', `const relTotal = st.relacjaTotal ?? (st.zaufanie + st.respekt);`, `const relTotal = st.relacjaTotal ?? (st.zaufanie + st.respekt + 1);`, A],
  ['A18 kopia: audiencja — nagłówek kolumny', 'src/ui/diplomacyAudience.ts', `'<h3>Możliwe umowy<span class="cnt">'`, `'<h3>Umowy<span class="cnt">'`, A],
];

let missed = 0;
let run = 0;
for (const [name, rel, a, b, mod] of MUTS) {
  if (onlyIds && !onlyIds.includes(name.split(' ')[0])) continue;
  run++;
  const p = resolve(ROOT, rel);
  const orig = readFileSync(p, 'utf8');
  const count = orig.split(a).length - 1;
  if (count !== 1) {
    console.log(`${name}: BŁĄD wzorzec występuje ${count}× EXIT=n/d NIEWYKRYTA`);
    missed++;
    continue;
  }
  try {
    writeFileSync(p, orig.replace(a, b));
    const r = spawnSync('node', ['tools/dom-harness/run-cycles.mjs', '--pin-dir', pinDir, '--only', mod, '--stop-on-diff'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    // EXIT=2 = błąd harnessu (nie wykrycie) — liczony jako NIEWYKRYTA; do logu trafia pierwsza linia błędu.
    const summary = r.stdout.split('\n').find((l) => l.startsWith('dom-harness-cycles:'))
      ?? (r.stderr.split('\n').find((l) => /BŁĄD|Error/.test(l)) ?? r.stderr.slice(-300));
    const detected = r.status === 1;
    if (!detected) missed++;
    console.log(`${name}: EXIT=${r.status} ${detected ? 'WYKRYTA' : 'NIEWYKRYTA'} [${mod}] ${summary}`);
  } finally {
    writeFileSync(p, orig);
  }
  if (readFileSync(p, 'utf8') !== orig) throw new Error(`nie przywrócono ${rel}`);
}
console.log(`mutate-cycles: mutacji=${run} niewykrytych=${missed} (pliki przywrócone bajtowo)`);
process.exit(missed === 0 ? 0 : 1);
