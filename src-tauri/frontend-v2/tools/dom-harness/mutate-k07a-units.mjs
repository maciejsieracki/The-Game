#!/usr/bin/env node
/**
 * mutate-k07a-units.mjs — mutacje portu K07A (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K07A-Q1, runda 2).
 * Każda mutacja = jedna podmiana tekstu w `src/ui/cityPanel/k07a-fundament.ts` (plik tymczasowy obok portu, bo importy
 * są względne), potem `run-k07a-units.mjs --v2 <mutant>`.
 * Zabita = harness EXIT 1; przeżyta = EXIT 0; EXIT 2 / wzorzec niejednoznaczny = NIE_ZMIERZONO.
 * Przeżyta mutacja wymaga uzasadnienia (równoważność) w `P5-8-K07A.md` albo wektora w harnessie.
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/mutate-k07a-units.mjs --pin-dir <PIN_DIR> [--part K/N] [--out <plik.json>]
 * `--part K/N` uruchamia tylko mutanty o indeksie i ≡ K (mod N) — podział na wywołania poniżej limitu czasu.
 */
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const PIN_DIR = argOf('--pin-dir');
if (!PIN_DIR) {
  console.error('Użycie: node tools/dom-harness/mutate-k07a-units.mjs --pin-dir <PIN_DIR> [--part K/N] [--out <plik>]');
  process.exit(2);
}
const PART = argOf('--part');
const [PK, PN] = PART ? PART.split('/').map(Number) : [0, 1];
const OUT = argOf('--out');
const V2_ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const PORT = join(V2_ROOT, 'src/ui/cityPanel/k07a-fundament.ts');
const MUT = join(V2_ROOT, 'src/ui/cityPanel/k07a-mutant-tmp.ts');
const HARNESS = join(V2_ROOT, 'tools/dom-harness/run-k07a-units.mjs');
const src = readFileSync(PORT, 'utf8');

/** Mutacje: [id, grupa, opis, tekst do zastąpienia (dokładnie raz), zamiennik]. */
const MUTANTS = [
  // Pola DTO / tekst kafelka W3 (w3CityChip).
  ['w3-stat-zloto', 'pole', 'klucz zloto → skarbiec zamieniony na zloto', "  zloto: 'skarbiec',", "  zloto: 'zloto',"],
  ['w3-stat-praca', 'pole', 'klucz praca → zywnosc', "  praca: 'praca',", "  praca: 'zywnosc',"],
  ['w3-title-quote', 'tekst', 'escape cudzysłowu w title pominięty', 'title="${hint.replace(/"/g, \'&quot;\')}"', 'title="${hint}"'],
  ['w3-aria-quote', 'tekst', 'escape cudzysłowu w aria-label pominięty', 'aria-label="${hint.replace(/"/g, \'&quot;\')}"', 'aria-label="${hint}"'],
  ['w3-aria-label', 'tekst', 'aria-label = etykieta zamiast podpowiedzi', 'aria-label="${hint.replace(/"/g, \'&quot;\')}"', 'aria-label="${label}"'],
  ['w3-res-scope', 'pole', 'klasa zakresu surowca pominięta', "const resScope = resKey ? ` ${resourceScopeClass(resKey)}` : '';", "const resScope = '';"],
  ['w3-res-key-default', 'pole', 'nieznany statId dostaje klucz praca', 'const resKey = W3_STAT_RES_KEY_K07[statId];', "const resKey = W3_STAT_RES_KEY_K07[statId] ?? 'praca';"],
  ['w3-interactive', 'pole', 'klasa civ-v-res-interactive pominięta', 'civ-v-res-interactive" data-res-stat', 'data-res-stat'],
  ['w3-data-stat', 'pole', 'data-res-stat = etykieta', 'data-res-stat="${statId}"', 'data-res-stat="${label}"'],
  ['w3-val-cls', 'tekst', 'klasa wartości pominięta', '<span class="civ-v-w3-chip-val ${cls}">', '<span class="civ-v-w3-chip-val">'],
  ['w3-delta-omit', 'pole', 'fragment tempo/zapas pominięty', '    requireK07aDeps().chipDeltaStockHtml(civRate, civStock) +', "    '' +"],
  ['w3-delta-swap', 'pole', 'argumenty tempo/zapas zamienione', '    requireK07aDeps().chipDeltaStockHtml(civRate, civStock) +', '    requireK07aDeps().chipDeltaStockHtml(civStock, civRate) +'],
  ['w3-delta-undef', 'brzeg', 'brak tempa (undefined) zamieniony na 0', '    requireK07aDeps().chipDeltaStockHtml(civRate, civStock) +', '    requireK07aDeps().chipDeltaStockHtml(civRate ?? 0, civStock) +'],
  ['w3-delta-nonfinite', 'brzeg', 'Infinity/NaN tempa zamienione na undefined', '    requireK07aDeps().chipDeltaStockHtml(civRate, civStock) +', '    requireK07aDeps().chipDeltaStockHtml(Number.isFinite(civRate as number) ? civRate : undefined, civStock) +'],
  ['w3-stock-nonfinite', 'brzeg', 'NaN/Infinity zapasu zamienione na undefined', '    requireK07aDeps().chipDeltaStockHtml(civRate, civStock) +', '    requireK07aDeps().chipDeltaStockHtml(civRate, Number.isNaN(civStock as number) ? undefined : civStock) +'],
  ['w3-delta-require', 'pole', 'brak wyjątku bez deps (cicha utrata tempa)', '  if (deps === null) throw new Error(', '  if (deps === null) return { chipDeltaStockHtml: () => \'\' } as never; if (false) throw new Error('],
  // skeleton (K07A szkielet panelu; adaptery cfg/ext).
  ['sk-epoch', 'pole', 'epoka domyślna 1 → 0', 'const epoch = cfg.getEpoch?.(city.ownerId) ?? 1;', 'const epoch = cfg.getEpoch?.(city.ownerId) ?? 0;'],
  ['sk-owner-label', 'pole', 'etykieta właściciela odwrócona', "const owner = isMeCity(city.ownerId) ? 'Gracz' : 'AI';", "const owner = isMeCity(city.ownerId) ? 'AI' : 'Gracz';"],
  ['sk-multi', 'pole', 'nawigacja odwrócona', "const navDis = multi ? '' : 'disabled';", "const navDis = multi ? 'disabled' : '';"],
  ['sk-multi-len', 'brzeg', 'nawigacja przy 1 mieście (próg >1 → >0)', 'const multi = ownerCities(city).length > 1;', 'const multi = ownerCities(city).length > 0;'],
  ['sk-scale-active', 'pole', 'aktywna skala odwrócona', "s.px === scalePx ? 'active' : ''", "s.px !== scalePx ? 'active' : ''"],
  ['sk-tab-hidden', 'pole', 'ukrywanie zakładek odwrócone', "activeDrawerTab === id ? '' : ' hidden'", "activeDrawerTab !== id ? '' : ' hidden'"],
  ['sk-footer-ph', 'tekst', 'stopka bez znacznika podglądu', '${PH()}', "''"],
  ['sk-prev-nav', 'tekst', 'przycisk poprzedni bez blokady', 'id="cs-prev" ${navDis}', 'id="cs-prev"'],
  ['sk-drawer-title', 'pole', 'tytuł zamiast tabów z wejścia drawerTabButtons', "${drawerTabButtons()}", "${cityPanelTitle(city)}"],
  // buildCityOnlyW3FlankChips (pola DTO: praca/żywność/skarbiec/nauka/kultura/religia).
  ['ow-praca-big', 'pole', 'tempo miasta (big) pracy z puli zamiast całości', 'big: pracaSplit.total,', 'big: pracaSplit.doPuli,'],
  ['ow-praca-stock', 'pole', 'zapas pracy z pracaRate zamiast pracaPool', 'stock: empire.pracaPool ?? 0', 'stock: empire.pracaRate ?? 0'],
  ['ow-zloto-stock', 'pole', 'zapas skarbca z kultury', 'stock: empire.zloto ?? 0', 'stock: empire.kultura ?? 0'],
  ['ow-civ-swap', 'pole', 'tempo cywilizacji żywności z pracy', 'small: civ.zywnosc,', 'small: civ.praca,'],
  ['ow-civ-zloto', 'pole', 'civ.zloto wejściowe zerowane (wejście adaptera DTO)', 'zloto: view.pieniadz,', 'zloto: 0,'],
  ['ow-religion-cls', 'pole', 'klasa religii dla dodatniego tempa', "const relCls = chip.religia.big < 0 ? 'red' : '';", "const relCls = chip.religia.big > 0 ? 'red' : '';"],
  ['ow-food-zero', 'brzeg', 'klasa żywności: zero zielone', "const foodCls = chip.zywnosc.big > 0 ? 'green'", "const foodCls = chip.zywnosc.big >= 0 ? 'green'"],
  ['ow-food-racje', 'pole', 'podpowiedź żywności: racje → produkcja', 'racje ${foodSplit.racje} =', 'racje ${foodSplit.produkcja} ='],
  ['ow-skarb-handel', 'pole', 'podpowiedź skarbca: skarb → zamożność', 'skarb ${signed(skarbHandel)}', 'skarb ${signed(wealthHandel)}'],
  // buildCityResourceStatItems.
  ['rs-pool', 'pole', 'pula pracy: kolejność fallbacków', 'const pracaPool = empire.pracaPool ?? empire.pracaRate ?? 0;', 'const pracaPool = empire.pracaRate ?? empire.pracaPool ?? 0;'],
  ['rs-zloto-src', 'pole', 'skarbiec: pierwszeństwo cfg.getTreasury', 'String(Math.round(empire.zloto ?? cfg.getTreasury?.(city.ownerId) ?? 0)),', 'String(Math.round(cfg.getTreasury?.(city.ownerId) ?? empire.zloto ?? 0)),'],
  ['rs-nauka-branch', 'pole', 'gałąź nauki imperium odwrócona', 'if (empire.nauka != null) {', 'if (empire.nauka == null) {'],
  ['rs-w3-flag', 'pole', 'tryb w3 odwrócony', '  if (w3) {', '  if (!w3) {'],
  ['rs-manpower-order', 'pole', 'rekruci: bieżący/maks zamienione', '${formatManpower(mpSnap.manpowerBiezacy)}/${formatManpower(mpSnap.manpowerMax)}', '${formatManpower(mpSnap.manpowerMax)}/${formatManpower(mpSnap.manpowerBiezacy)}'],
  ['rs-order-threshold', 'brzeg', 'porządek: próg 60 → >60', "porPct >= 60 ? 'green' : 'gold'", "porPct > 60 ? 'green' : 'gold'"],
  ['rs-food-zero', 'brzeg', 'żywność netto: zero zielone', "view.zywnoscNetto > 0 ? 'green' : view.zywnoscNetto < 0 ? 'red' : 'gold'", "view.zywnoscNetto >= 0 ? 'green' : view.zywnoscNetto < 0 ? 'red' : 'gold'"],
  // Adaptery K07A-Z3/Z4 (wejścia DTO i akcesory).
  ['ad-ismeCity-neg', 'pole', 'adapter isMeCity zanegowany', 'return requireK07aExt().isMeCity(ownerId);', 'return !requireK07aExt().isMeCity(ownerId);'],
  ['ad-owner-cities', 'pole', 'adapter ownerCities pominięty (zawsze jedno miasto)', 'return requireK07aExt().ownerCities(city);', 'return [city];'],
  ['ad-civwide-zloto', 'pole', 'adapter civWide dostaje zerowe zloto', 'return requireK07aExt().civWideSixStatsFromEmpireSnap(empire, six);', 'return requireK07aExt().civWideSixStatsFromEmpireSnap(empire, { ...six, zloto: 0 });'],
  ['ad-format-mp', 'pole', 'adapter formatManpower pominięty', 'return requireK07aExt().formatManpower(n);', 'return String(n);'],
  ['ad-drawer-setter', 'pole', 'zakładka nie zapisywana', '  activeDrawerTab = tab;', '  void tab;'],
  ['ad-scale-setter', 'pole', 'skala nie zapisywana', '  scalePx = px;', '  void px;'],
  ['ad-ext-setter', 'pole', 'adaptery nie zapisywane', '  ext = next;', '  void next;'],
  // resolveActiveCity (odświeżenie z listy miast).
  ['res-id-owner', 'pole', 'odświeżenie po ownerId zamiast id', 'const fresh = deps?.getCities().find(c => c.id === activeCity!.id);', 'const fresh = deps?.getCities().find(c => c.ownerId === activeCity!.ownerId);'],
  ['res-no-assign', 'pole', 'odświeżony obiekt nie zapisywany', 'if (fresh) activeCity = fresh;', 'if (fresh) void fresh;'],
  ['res-always-replace', 'brzeg', 'brak miasta w liście czyści stan', 'if (fresh) activeCity = fresh;', 'activeCity = fresh ?? null;'],
  ['res-null-branch', 'pole', 'gałąź null zwraca pusty obiekt', 'if (activeCity === null) return null;', 'if (activeCity === null) return {} as never;'],
  // capitalBadgeOrButtonHtml (stolica, oblężenie, uprawnienia).
  ['cap-equal', 'pole', 'warunek stolicy odwrócony', 'if (capitalId != null && capitalId === city.id) {', 'if (capitalId != null && capitalId !== city.id) {'],
  ['cap-besieged', 'pole', 'oblężenie ignorowane', 'const besieged = !!capitalCity?.oblegane;', 'const besieged = false;'],
  ['cap-besieged-name', 'tekst', 'nazwa w tytule: nazwa zamiast id stolicy', "(${capitalCity?.name ?? '?'})", '(${capitalId ?? \'?\'})'],
  ['cap-perm-isme', 'pole', 'brak sprawdzenia isMe', 'if (!deps || !deps.isMe(city.ownerId) || !deps.canSetCapital) return \'\';', "if (!deps || !deps.canSetCapital) return '';"],
  ['cap-perm-canset', 'pole', 'brak sprawdzenia canSetCapital', 'if (!deps || !deps.isMe(city.ownerId) || !deps.canSetCapital) return \'\';', "if (!deps || !deps.isMe(city.ownerId)) return '';"],
  ['cap-perm-invert', 'pole', 'isMe odwrócone', 'if (!deps || !deps.isMe(city.ownerId) || !deps.canSetCapital) return \'\';', "if (!deps || deps.isMe(city.ownerId) || !deps.canSetCapital) return '';"],
  ['cap-find-id', 'pole', 'wyszukiwanie stolicy po id miasta', 'allCitiesForCapital.find(c => c.id === capitalId)', 'allCitiesForCapital.find(c => c.id === city.id)'],
  ['cap-btn-id', 'tekst', 'id przycisku zmienione', 'id="civ-v-set-capital"', 'id="civ-v-set-capitol"'],
  ['cap-btn-title', 'tekst', 'tytuł przycisku zmieniony', '(za darmo)', '(odplatnie)'],
  ['cap-owner-cities', 'pole', 'lista miast zawsze pusta (brak stanu oblężenia)', 'const allCitiesForCapital = deps?.getCities() ?? [];', 'const allCitiesForCapital = [] as readonly CityK07[];'],
  // Stan modułu (akcesory K07A-Z3).
  ['ux-setter', 'pole', 'rejestracja odświeżania ignorowana', 'uxSectionRefresh = refresh;', 'void refresh;'],
  ['ux-getter', 'pole', 'odczyt rejestracji zawsze null', 'return uxSectionRefresh;', 'return null;'],
  ['deps-setter', 'pole', 'zależności nie zapisywane', '  deps = next;', '  void next;'],
  ['active-setter', 'pole', 'activeCity nie zapisywane', '  activeCity = city;', '  void city;'],
  // Równoważne (oczekiwane przeżycie — dowód równoważności w P5-8-K07A.md).
  ['eq-null-return', 'równoważna', 'null zwrócony przez activeCity zamiast literału null (ta sama wartość)', 'if (activeCity === null) return null;', 'if (activeCity === null) return activeCity;'],
];

const results = [];
try {
  const selected = MUTANTS.filter((_m, i) => i % PN === PK);
  for (const [id, grupa, desc, from, to] of selected) {
    const count = src.split(from).length - 1;
    if (count !== 1) {
      results.push({ id, grupa, desc, status: 'NIE_ZMIERZONO', reason: `wzorzec wystąpił ${count} razy` });
      continue;
    }
    writeFileSync(MUT, src.replace(from, to));
    let status;
    try {
      execFileSync(process.execPath, [HARNESS, '--pin-dir', PIN_DIR, '--v2', MUT], { stdio: 'pipe', timeout: 200000 });
      status = 'PRZEZYLA';
    } catch (err) {
      status = err.status === 1 ? 'ZABITA' : 'NIE_ZMIERZONO';
    }
    results.push({ id, grupa, desc, status });
  }
} finally {
  rmSync(MUT, { force: true });
}
const count = (s) => results.filter((r) => r.status === s).length;
const summary = {
  part: PART ?? 'all',
  mutantow: results.length,
  zabite: count('ZABITA'),
  przezyte: count('PRZEZYLA'),
  nieZmierzone: count('NIE_ZMIERZONO'),
  results,
};
if (OUT) writeFileSync(resolve(OUT), JSON.stringify(summary, null, 1) + '\n');
console.log(JSON.stringify(summary, null, 1));
process.exit(count('NIE_ZMIERZONO') === 0 ? 0 : 1);
